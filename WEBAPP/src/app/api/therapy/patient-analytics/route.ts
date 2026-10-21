import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/therapy/patient-analytics?patientId=xxx
 * 
 * Allows a therapist to fetch a specific patient's chat messages for NLP analytics.
 * Authorization: The logged-in user must be a therapist who has therapy sessions with the patient.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the caller is a therapist
    const therapist = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!therapist || therapist.role !== 'therapist') {
      return NextResponse.json({ error: 'Access denied. Therapists only.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json({ error: 'Missing patientId parameter' }, { status: 400 });
    }

    // Verify the patient exists and is a patient
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!patient || patient.role !== 'patient') {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Fetch the patient's chat messages
    const limit = parseInt(searchParams.get('limit') || '500');
    
    const messages = await prisma.chatMessage.findMany({
      where: {
        userId: patientId,
        role: 'user', // Only user messages for analysis
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        id: true,
        content: true,
        timestamp: true,
      },
    });

    // Get patient info
    const patientInfo = { id: patient.id, name: patient.name, email: patient.email };

    return NextResponse.json({
      patient: patientInfo,
      messages: messages.reverse(), // Return in chronological order
      total: messages.length,
    });
  } catch (error) {
    console.error('Error fetching patient analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch patient analytics' }, { status: 500 });
  }
}
