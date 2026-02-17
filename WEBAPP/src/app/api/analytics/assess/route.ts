import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { scoreAssessment, ASSESSMENT_QUESTIONS, ANSWER_OPTIONS } from '@/lib/mentalHealthAnalytics';

/**
 * GET /api/analytics/assess - Get assessment questions
 */
export async function GET() {
  return NextResponse.json({
    questions: ASSESSMENT_QUESTIONS,
    answerOptions: ANSWER_OPTIONS,
    totalQuestions: ASSESSMENT_QUESTIONS.length,
    maxScore: ASSESSMENT_QUESTIONS.length * 3,
  });
}

/**
 * POST /api/analytics/assess - Submit assessment answers and get results
 * 
 * Body: {
 *   answers: [{ questionId: 1, score: 2 }, { questionId: 2, score: 1 }, ...]
 * }
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

    const body = await request.json();
    const { answers } = body;

    // Validate answers
    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Answers array is required' }, { status: 400 });
    }

    if (answers.length !== ASSESSMENT_QUESTIONS.length) {
      return NextResponse.json({
        error: `Expected ${ASSESSMENT_QUESTIONS.length} answers, got ${answers.length}`,
      }, { status: 400 });
    }

    // Validate each answer
    for (const answer of answers) {
      if (typeof answer.questionId !== 'number' || typeof answer.score !== 'number') {
        return NextResponse.json({ error: 'Each answer must have questionId and score' }, { status: 400 });
      }
      if (answer.score < 0 || answer.score > 3) {
        return NextResponse.json({ error: 'Score must be between 0 and 3' }, { status: 400 });
      }
    }

    // Score the assessment
    const result = scoreAssessment(answers);

    // Build detailed answers with question text
    const detailedAnswers = answers.map((a: { questionId: number; score: number }) => {
      const question = ASSESSMENT_QUESTIONS.find(q => q.id === a.questionId);
      const answerOption = ANSWER_OPTIONS.find(opt => opt.score === a.score);
      return {
        questionId: a.questionId,
        question: question?.question || '',
        category: question?.category || '',
        answer: answerOption?.label || '',
        score: a.score,
      };
    });

    // Save to database
    const assessmentSession = await (prisma as any).assessmentSession.create({
      data: {
        userId: user.id,
        totalScore: result.totalScore,
        maxScore: result.maxScore,
        mentalHealthLevel: result.mentalHealthLevel,
        levelLabel: result.levelLabel,
        answers: detailedAnswers,
      },
    });

    // Also create an analytics entry for the timeline
    await (prisma as any).mentalHealthAnalytics.create({
      data: {
        userId: user.id,
        date: new Date(),
        mentalHealthLevel: result.mentalHealthLevel,
        levelLabel: result.levelLabel,
        keywordCounts: result.categoryScores,
        totalMessages: 0,
        positiveCount: 0,
        negativeCount: 0,
        source: 'assessment',
      },
    });

    return NextResponse.json({
      success: true,
      assessmentId: assessmentSession.id,
      totalScore: result.totalScore,
      maxScore: result.maxScore,
      mentalHealthLevel: result.mentalHealthLevel,
      levelLabel: result.levelLabel,
      categoryScores: result.categoryScores,
      detailedAnswers,
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting assessment:', error);
    return NextResponse.json({ error: 'Failed to submit assessment' }, { status: 500 });
  }
}
