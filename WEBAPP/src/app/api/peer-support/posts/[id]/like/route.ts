import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { increment } = body;
    
    if (typeof increment !== 'boolean') {
      return NextResponse.json({ error: 'Increment must be a boolean' }, { status: 400 });
    }
    
    // Check if post exists
    const postExists = await prisma.peerSupportPost.findUnique({ 
      where: { id, isActive: true } 
    });
    
    if (!postExists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const updateQuery = increment
      ? { likes: { increment: 1 } }
      : { likes: { decrement: 1 } };

    const updatedPost = await prisma.peerSupportPost.update({
      where: { id },
      data: {
        ...updateQuery,
        updatedAt: new Date()
      },
      include: {
        replies: true
      }
    });

    // Ensure likes don't go below 0
    if (updatedPost.likes < 0) {
      const fixedPost = await prisma.peerSupportPost.update({
        where: { id },
        data: { likes: 0, updatedAt: new Date() },
        include: {
          replies: true
        }
      });
      return NextResponse.json({ post: fixedPost });
    }

    return NextResponse.json({ post: updatedPost });
  } catch (error) {
    console.error('Error updating likes:', error);
    return NextResponse.json({ error: 'Failed to update likes' }, { status: 500 });
  }
}