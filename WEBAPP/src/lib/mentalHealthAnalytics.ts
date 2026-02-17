/**
 * Mental Health Analytics Engine
 * 
 * Analyzes chat messages to extract mental health keywords,
 * predict severity levels, and provide assessment scoring.
 */

// ============================================================
// KEYWORD DICTIONARIES - Categorized mental health indicators
// ============================================================

export const KEYWORD_CATEGORIES = {
  stress: {
    label: 'Stress',
    color: '#f59e0b',
    keywords: [
      'stressed', 'stress', 'overwhelmed', 'pressure', 'deadline', 'tension',
      'burned out', 'burnout', 'exhausted', 'overworked', 'too much',
      'can\'t handle', 'breaking point', 'falling apart', 'drowning',
      'burden', 'overloaded', 'stretched thin', 'frazzled', 'strained',
    ],
    weight: 1.5,
  },
  anxiety: {
    label: 'Anxiety',
    color: '#8b5cf6',
    keywords: [
      'anxious', 'anxiety', 'worried', 'worry', 'panic', 'nervous',
      'restless', 'can\'t relax', 'racing thoughts', 'overthinking',
      'fear', 'scared', 'terrified', 'uneasy', 'dread', 'apprehensive',
      'on edge', 'tense', 'jittery', 'hyperventilating', 'panic attack',
      'social anxiety', 'phobia', 'obsessive', 'compulsive',
    ],
    weight: 2.0,
  },
  depression: {
    label: 'Depression',
    color: '#3b82f6',
    keywords: [
      'depressed', 'depression', 'sad', 'hopeless', 'empty', 'worthless',
      'no motivation', 'can\'t sleep', 'insomnia', 'tired all the time',
      'lonely', 'isolated', 'numb', 'crying', 'tearful', 'miserable',
      'no energy', 'fatigue', 'guilt', 'ashamed', 'loss of interest',
      'no pleasure', 'no joy', 'meaningless', 'pointless', 'giving up',
      'withdraw', 'withdrawn', 'apathetic', 'don\'t care anymore',
    ],
    weight: 2.5,
  },
  anger: {
    label: 'Anger',
    color: '#ef4444',
    keywords: [
      'angry', 'anger', 'frustrated', 'irritated', 'furious', 'resentful',
      'rage', 'mad', 'annoyed', 'hostile', 'aggressive', 'bitter',
      'hateful', 'livid', 'outraged', 'infuriated', 'snapping',
    ],
    weight: 1.0,
  },
  self_harm: {
    label: 'Self-Harm Risk',
    color: '#dc2626',
    keywords: [
      'self-harm', 'self harm', 'hurt myself', 'suicide', 'suicidal',
      'end it', 'end it all', 'don\'t want to live', 'kill myself',
      'cutting', 'no reason to live', 'better off dead', 'wish i was dead',
      'not worth living', 'want to die', 'overdose', 'jump off',
    ],
    weight: 5.0, // Highest weight - critical
  },
  loneliness: {
    label: 'Loneliness',
    color: '#6366f1',
    keywords: [
      'lonely', 'alone', 'no friends', 'nobody cares', 'isolated',
      'abandoned', 'rejected', 'left out', 'no one understands',
      'disconnected', 'invisible', 'unwanted', 'unloved',
    ],
    weight: 1.5,
  },
  positive: {
    label: 'Positive',
    color: '#22c55e',
    keywords: [
      'happy', 'grateful', 'better', 'improving', 'hopeful', 'relaxed',
      'calm', 'good day', 'great', 'wonderful', 'amazing', 'thankful',
      'confident', 'motivated', 'energetic', 'peaceful', 'content',
      'joyful', 'optimistic', 'proud', 'accomplished', 'loved',
      'supported', 'connected', 'healing', 'progress', 'breakthrough',
    ],
    weight: -1.0, // Negative weight = reduces severity
  },
} as const;

export type KeywordCategory = keyof typeof KEYWORD_CATEGORIES;

// ============================================================
// MENTAL HEALTH LEVELS
// ============================================================

export const MENTAL_HEALTH_LEVELS = [
  { level: 1, label: 'Minimal', color: '#22c55e', bgColor: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-700 dark:text-green-400', description: 'No significant concerns detected' },
  { level: 2, label: 'Mild', color: '#f59e0b', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', textColor: 'text-yellow-700 dark:text-yellow-400', description: 'Some mild stressors or concerns' },
  { level: 3, label: 'Moderate', color: '#f97316', bgColor: 'bg-orange-100 dark:bg-orange-900/30', textColor: 'text-orange-700 dark:text-orange-400', description: 'Moderate mental health concerns' },
  { level: 4, label: 'Moderately Severe', color: '#ef4444', bgColor: 'bg-red-100 dark:bg-red-900/30', textColor: 'text-red-700 dark:text-red-400', description: 'Significant distress indicators' },
  { level: 5, label: 'Severe', color: '#dc2626', bgColor: 'bg-red-200 dark:bg-red-900/50', textColor: 'text-red-800 dark:text-red-300', description: 'Immediate attention recommended' },
] as const;

// ============================================================
// ASSESSMENT QUESTIONS (PHQ-9 / GAD-7 inspired)
// ============================================================

export const ASSESSMENT_QUESTIONS = [
  {
    id: 1,
    question: 'Over the past 2 weeks, how often have you felt down, depressed, or hopeless?',
    category: 'depression',
  },
  {
    id: 2,
    question: 'How often have you had trouble falling asleep, staying asleep, or sleeping too much?',
    category: 'depression',
  },
  {
    id: 3,
    question: 'How often have you felt nervous, anxious, or on edge?',
    category: 'anxiety',
  },
  {
    id: 4,
    question: 'How often have you felt tired or had little energy?',
    category: 'depression',
  },
  {
    id: 5,
    question: 'How often have you had poor appetite or been overeating?',
    category: 'stress',
  },
  {
    id: 6,
    question: 'How often have you felt bad about yourself, or that you are a failure?',
    category: 'depression',
  },
  {
    id: 7,
    question: 'How often have you had trouble concentrating on things like reading or watching TV?',
    category: 'anxiety',
  },
  {
    id: 8,
    question: 'How often have you felt restless or unable to sit still?',
    category: 'anxiety',
  },
  {
    id: 9,
    question: 'How often have you been worrying too much about different things?',
    category: 'anxiety',
  },
  {
    id: 10,
    question: 'How often have you had thoughts that you would be better off dead or of hurting yourself?',
    category: 'self_harm',
  },
] as const;

export const ANSWER_OPTIONS = [
  { label: 'Not at all', score: 0 },
  { label: 'Several days', score: 1 },
  { label: 'More than half the days', score: 2 },
  { label: 'Nearly every day', score: 3 },
] as const;

// ============================================================
// ANALYSIS FUNCTIONS
// ============================================================

export interface KeywordAnalysisResult {
  mentalHealthLevel: number;
  levelLabel: string;
  keywordsDetected: Record<string, string[]>;
  keywordCounts: Record<string, number>;
  totalMessages: number;
  positiveCount: number;
  negativeCount: number;
  riskFlags: string[];
  overallScore: number;
  categoryBreakdown: {
    category: string;
    label: string;
    color: string;
    count: number;
    keywords: string[];
    percentage: number;
  }[];
}

/**
 * Analyze an array of chat messages and extract mental health indicators
 */
export function analyzeMessages(messages: string[]): KeywordAnalysisResult {
  const keywordsDetected: Record<string, string[]> = {};
  const keywordCounts: Record<string, number> = {};
  const riskFlags: string[] = [];
  let positiveCount = 0;
  let negativeCount = 0;
  let weightedScore = 0;

  // Initialize counts
  for (const category of Object.keys(KEYWORD_CATEGORIES)) {
    keywordsDetected[category] = [];
    keywordCounts[category] = 0;
  }

  // Analyze each message
  for (const message of messages) {
    const lowerMessage = message.toLowerCase();
    let messageIsPositive = false;
    let messageIsNegative = false;

    for (const [category, config] of Object.entries(KEYWORD_CATEGORIES)) {
      for (const keyword of config.keywords) {
        // Use word boundary matching for more accuracy
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(lowerMessage)) {
          if (!keywordsDetected[category].includes(keyword)) {
            keywordsDetected[category].push(keyword);
          }
          keywordCounts[category]++;
          weightedScore += config.weight;

          if (category === 'positive') {
            messageIsPositive = true;
          } else {
            messageIsNegative = true;
          }

          // Flag critical keywords
          if (category === 'self_harm') {
            if (!riskFlags.includes('self_harm_mention')) {
              riskFlags.push('self_harm_mention');
            }
          }
        }
      }
    }

    if (messageIsPositive) positiveCount++;
    if (messageIsNegative) negativeCount++;
  }

  // Check for crisis patterns
  if (keywordCounts.self_harm > 0) {
    riskFlags.push('crisis_language');
  }
  if (keywordCounts.depression > 5 && keywordCounts.anxiety > 3) {
    riskFlags.push('comorbid_indicators');
  }

  // Compute level from weighted score
  const normalizedScore = messages.length > 0 ? weightedScore / messages.length : 0;
  const mentalHealthLevel = computeLevel(normalizedScore, riskFlags);
  const levelInfo = MENTAL_HEALTH_LEVELS.find(l => l.level === mentalHealthLevel)!;

  // Build category breakdown
  const totalKeywords = Object.values(keywordCounts).reduce((a, b) => a + b, 0) || 1;
  const categoryBreakdown = Object.entries(KEYWORD_CATEGORIES)
    .filter(([cat]) => cat !== 'positive')
    .map(([category, config]) => ({
      category,
      label: config.label,
      color: config.color,
      count: keywordCounts[category],
      keywords: keywordsDetected[category],
      percentage: Math.round((keywordCounts[category] / totalKeywords) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    mentalHealthLevel,
    levelLabel: levelInfo.label,
    keywordsDetected,
    keywordCounts,
    totalMessages: messages.length,
    positiveCount,
    negativeCount,
    riskFlags,
    overallScore: Math.round(normalizedScore * 100) / 100,
    categoryBreakdown,
  };
}

/**
 * Compute mental health level from weighted score and risk flags
 */
function computeLevel(normalizedScore: number, riskFlags: string[]): number {
  // Self-harm always escalates to level 5
  if (riskFlags.includes('self_harm_mention')) return 5;

  if (normalizedScore <= 0.5) return 1;  // Minimal
  if (normalizedScore <= 1.5) return 2;  // Mild
  if (normalizedScore <= 3.0) return 3;  // Moderate
  if (normalizedScore <= 5.0) return 4;  // Moderately Severe
  return 5;                              // Severe
}

/**
 * Score an assessment and compute mental health level
 */
export function scoreAssessment(answers: { questionId: number; score: number }[]): {
  totalScore: number;
  maxScore: number;
  mentalHealthLevel: number;
  levelLabel: string;
  categoryScores: Record<string, number>;
} {
  const totalScore = answers.reduce((sum, a) => sum + a.score, 0);
  const maxScore = ASSESSMENT_QUESTIONS.length * 3; // max 3 per question

  // Category-wise scoring
  const categoryScores: Record<string, number> = {};
  for (const answer of answers) {
    const question = ASSESSMENT_QUESTIONS.find(q => q.id === answer.questionId);
    if (question) {
      categoryScores[question.category] = (categoryScores[question.category] || 0) + answer.score;
    }
  }

  // Compute level from total score (0-30 scale)
  let mentalHealthLevel: number;
  if (totalScore <= 4) mentalHealthLevel = 1;       // Minimal
  else if (totalScore <= 9) mentalHealthLevel = 2;   // Mild
  else if (totalScore <= 14) mentalHealthLevel = 3;  // Moderate
  else if (totalScore <= 19) mentalHealthLevel = 4;  // Moderately Severe
  else mentalHealthLevel = 5;                        // Severe

  // Self-harm question (id=10) with high score always escalates
  const selfHarmAnswer = answers.find(a => a.questionId === 10);
  if (selfHarmAnswer && selfHarmAnswer.score >= 2) {
    mentalHealthLevel = Math.max(mentalHealthLevel, 4);
  }

  const levelInfo = MENTAL_HEALTH_LEVELS.find(l => l.level === mentalHealthLevel)!;

  return {
    totalScore,
    maxScore,
    mentalHealthLevel,
    levelLabel: levelInfo.label,
    categoryScores,
  };
}

/**
 * Get trend direction from analytics history
 */
export function computeTrend(levels: number[]): 'improving' | 'worsening' | 'stable' {
  if (levels.length < 2) return 'stable';

  const recent = levels.slice(-3);
  const older = levels.slice(-6, -3);

  if (older.length === 0) return 'stable';

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

  const diff = recentAvg - olderAvg;
  if (diff < -0.5) return 'improving';
  if (diff > 0.5) return 'worsening';
  return 'stable';
}

// ============================================================
// CONFUSION / VAGUE-MESSAGE DETECTION
// ============================================================

/** Words and patterns that indicate the user is confused or not sharing context */
const VAGUE_PATTERNS = [
  /^(hi|hello|hey|yo|sup|hii+|helo+)[\s!?.]*$/i,
  /^(ok|okay|k|fine|hmm+|hm+|umm+|um+|uh+|ahh*|mhm+|idk|dunno)[\s!?.]*$/i,
  /^(yes|no|yeah|yep|nah|nope|maybe|sure)[\s!?.]*$/i,
  /^(nothing|nm|nvm|never\s*mind|don'?t\s*know|not\s*sure|no\s*idea)[\s!?.]*$/i,
  /^(i\s*don'?t\s*know|i'?m\s*not\s*sure|no\s*clue|beats\s*me)[\s!?.]*$/i,
  /^(lol|lmao|haha+|hehe+|bruh|bro|dude)[\s!?.]*$/i,
  /^[.…?!]+$/,             // just punctuation
  /^[\s]*$/,                // blank
  /^.{0,5}$/,              // very short (≤5 chars)
];

/**
 * Returns true if a message is vague / provides no mental health context.
 */
export function isVagueMessage(message: string): boolean {
  const trimmed = message.trim();
  if (trimmed.length === 0) return true;
  return VAGUE_PATTERNS.some(p => p.test(trimmed));
}

/**
 * Given the recent conversation history (user messages only),
 * returns true if the bot should suggest the in-chat assessment.
 *
 * Trigger: 3+ consecutive vague user messages with no mental-health keywords.
 */
export function shouldSuggestAssessment(
  recentUserMessages: string[],
  consecutiveVagueThreshold = 3,
): boolean {
  if (recentUserMessages.length < consecutiveVagueThreshold) return false;

  // Check the last N messages
  const tail = recentUserMessages.slice(-consecutiveVagueThreshold);
  const allVague = tail.every(m => isVagueMessage(m));

  if (!allVague) return false;

  // Also make sure there are no mental-health keywords in these messages
  const combined = tail.join(' ').toLowerCase();
  const allKeywords = Object.values(KEYWORD_CATEGORIES).flatMap(c => c.keywords);
  const hasKeyword = allKeywords.some(kw => {
    const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(combined);
  });

  return !hasKeyword;
}

