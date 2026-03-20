import { NextRequest, NextResponse } from 'next/server';
import { generateTherapyResponse } from '@/lib/ai/therapy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body?.message === 'string' ? body.message : '';
    const emotion = typeof body?.emotion === 'string' ? body.emotion : 'neutral';

    if (!message.trim()) {
      return NextResponse.json(
        { error: 'Message is required', status: 'error' },
        { status: 400 }
      );
    }

    const response = await generateTherapyResponse(message, emotion);

    return NextResponse.json({
      response,
      status: 'success',
    });
  } catch (error) {
    console.error('AI chat route error:', error);

    return NextResponse.json(
      {
        response:
          "I am sorry, I am having trouble responding right now. Please try again in a moment.",
        status: 'success',
      },
      { status: 200 }
    );
  }
}
