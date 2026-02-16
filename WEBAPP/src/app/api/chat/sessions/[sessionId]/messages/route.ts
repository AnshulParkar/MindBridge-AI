import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';

// GET - Fetch messages for a specific session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { sessionId } = await params;

    // Verify the session belongs to the user
    const chatSession = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: user.id,
        isActive: true
      }
    });

    if (!chatSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching session messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST - Add a message to a session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { sessionId } = await params;
    const body = await request.json();
    const { content, role, metadata } = body;

    // Verify the session belongs to the user
    const chatSession = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: user.id,
        isActive: true
      }
    });

    if (!chatSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Content is required' 
      }, { status: 400 });
    }

    // Create the message
    const message = await prisma.chatMessage.create({
      data: {
        userId: user.id,
        sessionId,
        role: role || 'user',
        content: content.trim(),
        metadata: metadata || null,
      }
    });

    // Count messages in this session
    const messageCount = await prisma.chatMessage.count({
      where: { sessionId }
    });

    // Auto-title on first user message: use first ~40 chars of the message
    if (messageCount === 1 && (role || 'user') === 'user') {
      const autoTitle = content.trim().length > 40 
        ? content.trim().substring(0, 40) + '...' 
        : content.trim();
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { 
          title: autoTitle,
          updatedAt: new Date() 
        }
      });
    } else {
      // Update session's updatedAt timestamp
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() }
      });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
  }
}
