import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { analyzeMessages, computeTrend, MENTAL_HEALTH_LEVELS } from '@/lib/mentalHealthAnalytics';

/**
 * GET /api/analytics - Fetch user's mental health analytics
 * 
 * Query params:
 *   - days: number of days of history (default: 30)
 *   - refresh: "true" to re-analyze chat messages
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const refresh = searchParams.get('refresh') === 'true';

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // If refresh requested, re-analyze chat messages
    if (refresh) {
      await analyzeUserChats(user.id);
    }

    // Fetch analytics history
    const analyticsHistory: any[] = await (prisma as any).mentalHealthAnalytics.findMany({
      where: {
        userId: user.id,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    // Fetch assessment history
    const assessments: any[] = await (prisma as any).assessmentSession.findMany({
      where: {
        userId: user.id,
        completedAt: { gte: startDate },
      },
      orderBy: { completedAt: 'desc' },
    });

    // Compute current level (latest analytics or assessment)
    const latestAnalytics = analyticsHistory.length > 0
      ? analyticsHistory[analyticsHistory.length - 1]
      : null;
    const latestAssessment = assessments.length > 0 ? assessments[0] : null;

    // Use the most recent of chat analysis or assessment
    let currentLevel = 1;
    let currentLevelLabel = 'Minimal';
    let currentSource = 'none';

    if (latestAnalytics && latestAssessment) {
      const analyticsDate = new Date(latestAnalytics.date);
      const assessmentDate = new Date(latestAssessment.completedAt);
      if (assessmentDate > analyticsDate) {
        currentLevel = latestAssessment.mentalHealthLevel;
        currentLevelLabel = latestAssessment.levelLabel;
        currentSource = 'assessment';
      } else {
        currentLevel = latestAnalytics.mentalHealthLevel;
        currentLevelLabel = latestAnalytics.levelLabel;
        currentSource = 'chat';
      }
    } else if (latestAnalytics) {
      currentLevel = latestAnalytics.mentalHealthLevel;
      currentLevelLabel = latestAnalytics.levelLabel;
      currentSource = 'chat';
    } else if (latestAssessment) {
      currentLevel = latestAssessment.mentalHealthLevel;
      currentLevelLabel = latestAssessment.levelLabel;
      currentSource = 'assessment';
    }

    // Compute trend
    const allLevels = [
      ...analyticsHistory.map(a => a.mentalHealthLevel),
      ...assessments.map(a => a.mentalHealthLevel),
    ];
    const trend = computeTrend(allLevels);

    // Aggregate keyword data from latest analysis
    const latestKeywords = latestAnalytics?.keywordCounts as Record<string, number> | null;
    const latestRiskFlags = latestAnalytics?.riskFlags as string[] | null;

    // Build timeline data for charts
    const timeline = analyticsHistory.map(a => ({
      date: a.date,
      level: a.mentalHealthLevel,
      label: a.levelLabel,
      source: a.source,
      positiveCount: a.positiveCount,
      negativeCount: a.negativeCount,
    }));

    // Add assessment points to timeline
    for (const assessment of assessments) {
      timeline.push({
        date: assessment.completedAt,
        level: assessment.mentalHealthLevel,
        label: assessment.levelLabel,
        source: 'assessment',
        positiveCount: 0,
        negativeCount: 0,
      });
    }

    // Sort timeline by date
    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Level info
    const levelInfo = MENTAL_HEALTH_LEVELS.find(l => l.level === currentLevel)!;

    return NextResponse.json({
      currentLevel,
      currentLevelLabel,
      currentSource,
      levelInfo,
      trend,
      keywordCounts: latestKeywords || {},
      riskFlags: latestRiskFlags || [],
      timeline,
      assessmentCount: assessments.length,
      chatAnalysisCount: analyticsHistory.filter(a => a.source === 'chat').length,
      totalAnalyticsEntries: analyticsHistory.length + assessments.length,
      latestAnalysis: latestAnalytics ? {
        date: latestAnalytics.date,
        keywordsDetected: latestAnalytics.keywordsDetected,
        keywordCounts: latestAnalytics.keywordCounts,
        totalMessages: latestAnalytics.totalMessages,
        positiveCount: latestAnalytics.positiveCount,
        negativeCount: latestAnalytics.negativeCount,
      } : null,
      latestAssessment: latestAssessment ? {
        date: latestAssessment.completedAt,
        totalScore: latestAssessment.totalScore,
        maxScore: latestAssessment.maxScore,
        level: latestAssessment.mentalHealthLevel,
        label: latestAssessment.levelLabel,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

/**
 * POST /api/analytics - Trigger a fresh analysis of the user's chat messages
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const result = await analyzeUserChats(user.id);

    return NextResponse.json({
      success: true,
      analysis: result,
    });
  } catch (error) {
    console.error('Error running analysis:', error);
    return NextResponse.json({ error: 'Failed to run analysis' }, { status: 500 });
  }
}

/**
 * Analyze user's recent chat messages and save analytics
 */
async function analyzeUserChats(userId: string) {
  // Fetch user messages from the last 7 days for current analysis
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const messages = await prisma.chatMessage.findMany({
    where: {
      userId,
      role: 'user', // Only analyze user messages
      timestamp: { gte: sevenDaysAgo },
    },
    orderBy: { timestamp: 'asc' },
  });

  if (messages.length === 0) {
    return {
      mentalHealthLevel: 1,
      levelLabel: 'Minimal',
      totalMessages: 0,
      message: 'No recent messages to analyze',
    };
  }

  // Extract message content
  const messageTexts = messages.map(m => m.content);

  // Run analysis
  const analysis = analyzeMessages(messageTexts);

  // Save to database
  const analyticsEntry = await (prisma as any).mentalHealthAnalytics.create({
    data: {
      userId,
      date: new Date(),
      mentalHealthLevel: analysis.mentalHealthLevel,
      levelLabel: analysis.levelLabel,
      keywordsDetected: analysis.keywordsDetected,
      keywordCounts: analysis.keywordCounts,
      totalMessages: analysis.totalMessages,
      positiveCount: analysis.positiveCount,
      negativeCount: analysis.negativeCount,
      riskFlags: analysis.riskFlags,
      source: 'chat',
    },
  });

  return {
    id: analyticsEntry.id,
    mentalHealthLevel: analysis.mentalHealthLevel,
    levelLabel: analysis.levelLabel,
    totalMessages: analysis.totalMessages,
    positiveCount: analysis.positiveCount,
    negativeCount: analysis.negativeCount,
    keywordCounts: analysis.keywordCounts,
    riskFlags: analysis.riskFlags,
    categoryBreakdown: analysis.categoryBreakdown,
  };
}
