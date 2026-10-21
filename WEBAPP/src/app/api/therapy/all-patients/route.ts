import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';

/**
 * GET /api/therapy/all-patients?search=xxx
 * 
 * Returns all patients in the system for therapist use.
 * Supports optional search query to filter by name or email.
 * Only accessible by therapists.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
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
    const search = searchParams.get('search')?.trim() || '';

    // Build where clause
    const whereClause: any = { role: 'patient' };

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const patients = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        patientProfile: {
          select: {
            totalSessions: true,
            dominantEmotion: true,
            improvementTrend: true,
          },
        },
        _count: {
          select: {
            chatMessages: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      take: 100,
    });

    const result = patients.map((p) => ({
      id: p.id,
      name: p.name || 'Unknown',
      email: p.email,
      totalSessions: p.patientProfile?.totalSessions || 0,
      dominantEmotion: p.patientProfile?.dominantEmotion || 'neutral',
      improvementTrend: p.patientProfile?.improvementTrend || 'stable',
      messageCount: p._count.chatMessages,
      joinedAt: p.createdAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching all patients:', error);
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 });
  }
}
