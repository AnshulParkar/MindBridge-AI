import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import crypto from 'crypto';

// Generate anonymous ID
function generateAnonymousId(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';

  const letterPart = letters.charAt(Math.floor(Math.random() * letters.length));
  const numberPart = Array.from({length: 3}, () => numbers.charAt(Math.floor(Math.random() * numbers.length))).join('');

  return `Student_${letterPart}${numberPart}`;
}

// Hash IP for spam prevention
function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip + (process.env.NEXTAUTH_SECRET || 'fallback')).digest('hex');
}

// GET - Fetch all posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;

    const where: {
      isActive: boolean;
      category?: string;
      OR?: Array<{ content: { contains: string } } | { replies: { some: { content: { contains: string } } } }>;
    } = { isActive: true };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { content: { contains: search } },
        { replies: { some: { content: { contains: search } } } }
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.peerSupportPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          replies: {
            orderBy: { timestamp: 'asc' }
          }
        }
      }),
      prisma.peerSupportPost.count({ where })
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}



// POST - Create new post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, category } = body;

    // Validation
    const validation = validatePostData({ content, category });
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Get IP for spam prevention
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    const ipHash = hashIP(ip);

    // Rate limiting check (5 posts per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentPosts = await prisma.peerSupportPost.count({
      where: {
        ipHash,
        createdAt: { gte: oneHourAgo }
      }
    });

    if (recentPosts >= 5) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please wait before posting again.' }, { status: 429 });
    }

    const post = await prisma.peerSupportPost.create({
      data: {
        content: content.trim(),
        category,
        likes: 0,
        anonymousId: generateAnonymousId(),
        ipHash,
        isActive: true,
      },
      include: {
        replies: true
      }
    });

    return NextResponse.json({ post }, { status: 201 });

  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}


function validatePostData({ content, category }: { content: any; category: any; }): { isValid: boolean; error?: string } {
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return { isValid: false, error: 'Content is required and must be a non-empty string' };
  }

  if (content.trim().length > 1000) {
    return { isValid: false, error: 'Content must be less than 1000 characters' };
  }

  if (!category || typeof category !== 'string') {
    return { isValid: false, error: 'Category is required and must be a string' };
  }

  const validCategories = [
    'general',
    'academic-stress',
    'social-emotional',
    'time-management',
    'career-anxiety',
    'relationships',
    'health-wellness'
  ];
  if (!validCategories.includes(category)) {
    return { isValid: false, error: 'Invalid category' };
  }

  return { isValid: true };
}

