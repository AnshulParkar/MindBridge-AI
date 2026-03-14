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

// ============================================================
// ADVANCED NLP UTILITIES
// ============================================================

/**
 * AFINN-inspired sentiment lexicon (subset for browser-side usage).
 * Scores range from -5 (most negative) to +5 (most positive).
 */
const SENTIMENT_LEXICON: Record<string, number> = {
  // Negative
  'abandon': -2, 'abandoned': -2, 'abuse': -3, 'abused': -3,
  'afraid': -2, 'agony': -3, 'alone': -2, 'angry': -2,
  'anguish': -3, 'anxiety': -2, 'anxious': -2, 'awful': -3,
  'bad': -2, 'betrayed': -3, 'bitter': -2, 'blame': -2,
  'broken': -2, 'burden': -2, 'catastrophe': -4,
  'collapse': -3, 'confused': -1, 'cry': -2, 'crying': -2,
  'damage': -2, 'dead': -3, 'death': -3, 'defeat': -2,
  'depressed': -3, 'depression': -3, 'despair': -4, 'destroy': -3,
  'devastating': -3, 'die': -3, 'difficult': -1, 'disappoint': -2,
  'disaster': -3, 'distress': -2, 'doom': -3, 'dread': -2,
  'dull': -1, 'empty': -2, 'enemy': -2, 'evil': -3,
  'exhausted': -2, 'fail': -2, 'failure': -2, 'fear': -2,
  'fool': -2, 'frustrated': -2, 'grief': -3, 'guilt': -2,
  'hate': -3, 'heartbroken': -3, 'helpless': -2, 'hopeless': -3,
  'horrible': -3, 'hostile': -2, 'hurt': -2, 'inadequate': -2,
  'inferior': -2, 'insecure': -2, 'irritated': -2, 'isolated': -2,
  'jealous': -2, 'kill': -3, 'lie': -2, 'lonely': -2,
  'lose': -2, 'lost': -2, 'loser': -3, 'mad': -2,
  'meaningless': -3, 'miserable': -3, 'moody': -1, 'numb': -2,
  'overwhelmed': -2, 'pain': -2, 'panic': -3, 'pathetic': -2,
  'pessimistic': -2, 'pitiful': -2, 'pointless': -3, 'poor': -1,
  'problem': -1, 'rage': -3, 'regret': -2, 'reject': -2,
  'resentful': -2, 'ruin': -2, 'sad': -2, 'scared': -2,
  'shame': -2, 'sick': -2, 'sorrow': -2, 'stressed': -2,
  'struggle': -1, 'stupid': -2, 'suffer': -2, 'suicide': -5,
  'terrible': -3, 'terrified': -3, 'threat': -2, 'tired': -1,
  'torment': -3, 'toxic': -2, 'tragic': -3, 'trapped': -2,
  'trauma': -3, 'trouble': -1, 'ugly': -2, 'unhappy': -2,
  'upset': -2, 'useless': -2, 'victim': -2, 'violence': -3,
  'void': -2, 'weak': -1, 'weary': -1, 'wicked': -2,
  'worried': -2, 'worse': -2, 'worst': -3, 'worthless': -3,
  'wrong': -1,
  // Positive
  'accomplish': 2, 'accomplished': 2, 'achieve': 2, 'admire': 2,
  'amazing': 3, 'beautiful': 2, 'believe': 1, 'best': 3,
  'better': 1, 'blessed': 2, 'bliss': 3, 'brave': 2,
  'bright': 1, 'brilliant': 3, 'calm': 2, 'care': 1,
  'cheerful': 2, 'comfort': 2, 'confident': 2, 'content': 2,
  'courage': 2, 'creative': 2, 'delight': 3, 'dream': 1,
  'eager': 1, 'easy': 1, 'empowered': 2, 'encourage': 2,
  'energetic': 2, 'enjoy': 2, 'excellent': 3, 'excited': 2,
  'fantastic': 3, 'free': 1, 'friend': 1, 'fun': 2,
  'generous': 2, 'gentle': 1, 'glad': 2, 'good': 1,
  'grace': 2, 'grateful': 2, 'great': 2, 'happy': 2,
  'harmony': 2, 'heal': 2, 'healing': 2, 'healthy': 2,
  'heart': 1, 'helpful': 1, 'hope': 2, 'hopeful': 2,
  'hug': 2, 'improve': 1, 'improving': 1, 'inspire': 2,
  'joy': 3, 'joyful': 3, 'kind': 2, 'laugh': 2,
  'love': 3, 'loved': 3, 'lucky': 2, 'meaningful': 2,
  'merry': 2, 'motivated': 2, 'nice': 1, 'optimistic': 2,
  'outstanding': 3, 'passion': 2, 'peace': 2, 'peaceful': 2,
  'perfect': 2, 'pleasant': 2, 'pleased': 2, 'positive': 2,
  'powerful': 2, 'pride': 2, 'progress': 1, 'proud': 2,
  'pure': 1, 'ready': 1, 'recover': 2, 'relax': 2,
  'relaxed': 2, 'relief': 2, 'resilient': 2, 'safe': 2,
  'satisfy': 2, 'secure': 1, 'serene': 2, 'smile': 2,
  'strong': 2, 'succeed': 2, 'success': 2, 'sunshine': 1,
  'support': 1, 'supported': 2, 'sweet': 1, 'thankful': 2,
  'thrive': 2, 'triumph': 3, 'trust': 2, 'valued': 2,
  'victory': 3, 'warm': 1, 'welcome': 1, 'well': 1,
  'win': 2, 'wonderful': 3, 'worthy': 2,
};

/**
 * Negation words that flip sentiment of following word
 */
const NEGATION_WORDS = new Set([
  'not', 'no', "don't", "doesn't", "didn't", "won't", "wouldn't",
  "can't", "cannot", "couldn't", "shouldn't", "isn't", "aren't",
  "wasn't", "weren't", "never", "neither", "hardly", "barely",
  "scarcely", "seldom", "nor",
]);

/**
 * Intensifier words that amplify the next word's score
 */
const INTENSIFIERS: Record<string, number> = {
  'very': 1.5, 'really': 1.5, 'extremely': 2.0, 'absolutely': 2.0,
  'totally': 1.5, 'so': 1.3, 'incredibly': 2.0, 'deeply': 1.5,
  'terribly': 1.5, 'awfully': 1.5, 'super': 1.5, 'quite': 1.2,
};

// ============================================================
// SENTIMENT ANALYSIS (VADER-like)
// ============================================================

export interface SentimentResult {
  score: number;        // -1.0 to +1.0
  comparative: number;  // score / word count
  positive: string[];
  negative: string[];
  tokens: number;
  label: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
}

/**
 * Compute sentiment score for a single message with negation & intensifier handling
 */
export function analyzeSentiment(message: string): SentimentResult {
  const words = message.toLowerCase().replace(/[^\w\s'-]/g, '').split(/\s+/).filter(Boolean);
  let totalScore = 0;
  const positive: string[] = [];
  const negative: string[] = [];
  let negationActive = false;
  let intensifierMultiplier = 1.0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Check if this word is a negation
    if (NEGATION_WORDS.has(word)) {
      negationActive = true;
      continue;
    }

    // Check if this word is an intensifier
    if (INTENSIFIERS[word]) {
      intensifierMultiplier = INTENSIFIERS[word];
      continue;
    }

    // Look up in lexicon
    if (SENTIMENT_LEXICON[word] !== undefined) {
      let wordScore = SENTIMENT_LEXICON[word] * intensifierMultiplier;

      // Apply negation (flip the sign)
      if (negationActive) {
        wordScore *= -0.75; // Not full reversal — negation dampens
        negationActive = false;
      }

      totalScore += wordScore;

      if (wordScore > 0) positive.push(word);
      else if (wordScore < 0) negative.push(word);
    } else {
      // Reset negation after a non-lexicon word (window of 1-2 words)
      negationActive = false;
    }

    intensifierMultiplier = 1.0; // Reset intensifier
  }

  const comparative = words.length > 0 ? totalScore / words.length : 0;

  // Normalize to -1..+1 range
  const maxPossible = Math.max(words.length * 3, 1);
  const normalizedScore = Math.max(-1, Math.min(1, totalScore / maxPossible));

  let label: SentimentResult['label'];
  if (normalizedScore <= -0.3) label = 'very_negative';
  else if (normalizedScore <= -0.05) label = 'negative';
  else if (normalizedScore <= 0.05) label = 'neutral';
  else if (normalizedScore <= 0.3) label = 'positive';
  else label = 'very_positive';

  return { score: Math.round(normalizedScore * 1000) / 1000, comparative, positive, negative, tokens: words.length, label };
}

/**
 * Analyze sentiment trend over an array of messages (time-ordered)
 */
export function analyzeSentimentTrend(messages: string[]): {
  scores: number[];
  movingAverage: number[];
  overallSentiment: SentimentResult['label'];
  volatility: number;
} {
  const scores = messages.map(m => analyzeSentiment(m).score);

  // 3-message moving average
  const movingAverage: number[] = [];
  for (let i = 0; i < scores.length; i++) {
    const windowStart = Math.max(0, i - 2);
    const window = scores.slice(windowStart, i + 1);
    movingAverage.push(Math.round((window.reduce((a, b) => a + b, 0) / window.length) * 1000) / 1000);
  }

  const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  // Volatility = standard deviation
  const variance = scores.length > 1
    ? scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length
    : 0;
  const volatility = Math.round(Math.sqrt(variance) * 1000) / 1000;

  let overallSentiment: SentimentResult['label'];
  if (avg <= -0.3) overallSentiment = 'very_negative';
  else if (avg <= -0.05) overallSentiment = 'negative';
  else if (avg <= 0.05) overallSentiment = 'neutral';
  else if (avg <= 0.3) overallSentiment = 'positive';
  else overallSentiment = 'very_positive';

  return { scores, movingAverage, overallSentiment, volatility };
}

// ============================================================
// N-GRAM ANALYSIS
// ============================================================

/**
 * Extract n-grams from a message
 */
export function extractNgrams(message: string, n: number): string[] {
  const words = message.toLowerCase().replace(/[^\w\s'-]/g, '').split(/\s+/).filter(Boolean);
  const ngrams: string[] = [];
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '));
  }
  return ngrams;
}

/**
 * Find the most common bigrams and trigrams across messages
 */
export function analyzeNgrams(messages: string[]): {
  bigrams: { phrase: string; count: number }[];
  trigrams: { phrase: string; count: number }[];
} {
  const bigramCounts: Record<string, number> = {};
  const trigramCounts: Record<string, number> = {};

  for (const msg of messages) {
    for (const bg of extractNgrams(msg, 2)) {
      bigramCounts[bg] = (bigramCounts[bg] || 0) + 1;
    }
    for (const tg of extractNgrams(msg, 3)) {
      trigramCounts[tg] = (trigramCounts[tg] || 0) + 1;
    }
  }

  const bigrams = Object.entries(bigramCounts)
    .map(([phrase, count]) => ({ phrase, count }))
    .filter(b => b.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const trigrams = Object.entries(trigramCounts)
    .map(([phrase, count]) => ({ phrase, count }))
    .filter(t => t.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return { bigrams, trigrams };
}

// ============================================================
// LEXICAL DIVERSITY (rumination indicator)
// ============================================================

export interface LexicalDiversityResult {
  uniqueWords: number;
  totalWords: number;
  ttr: number;                    // Type-Token Ratio
  label: 'low' | 'moderate' | 'high';
  ruminationRisk: boolean;       // Low diversity → possible rumination
}

export function analyzeLexicalDiversity(messages: string[]): LexicalDiversityResult {
  const allWords: string[] = [];
  const uniqueSet = new Set<string>();

  for (const msg of messages) {
    const words = msg.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    for (const w of words) {
      allWords.push(w);
      uniqueSet.add(w);
    }
  }

  const totalWords = allWords.length;
  const uniqueWords = uniqueSet.size;
  const ttr = totalWords > 0 ? Math.round((uniqueWords / totalWords) * 1000) / 1000 : 0;

  let label: LexicalDiversityResult['label'];
  if (ttr < 0.3) label = 'low';
  else if (ttr < 0.6) label = 'moderate';
  else label = 'high';

  return {
    uniqueWords,
    totalWords,
    ttr,
    label,
    ruminationRisk: ttr < 0.25 && totalWords > 50,
  };
}

// ============================================================
// TEMPORAL DECAY WEIGHTING
// ============================================================

/**
 * Apply exponential decay weighting — recent messages score higher.
 * Returns a weighted version of analyzeMessages().
 */
export function analyzeMessagesWithDecay(
  messages: { text: string; timestamp: Date }[],
  halfLifeMinutes: number = 60,
): KeywordAnalysisResult {
  if (messages.length === 0) {
    return analyzeMessages([]);
  }

  const now = new Date();
  const lambda = Math.LN2 / (halfLifeMinutes * 60 * 1000);

  // Create weighted duplicate messages: repeat recent messages proportionally
  const weightedTexts: string[] = [];
  for (const msg of messages) {
    const ageMs = now.getTime() - msg.timestamp.getTime();
    const weight = Math.exp(-lambda * ageMs);
    // Repeat message based on weight (min 1 if weight > 0.1)
    const repeats = Math.max(1, Math.round(weight * 3));
    for (let i = 0; i < repeats; i++) {
      weightedTexts.push(msg.text);
    }
  }

  return analyzeMessages(weightedTexts);
}

// ============================================================
// EMOTION CLASSIFICATION (Plutchik's Wheel)
// ============================================================

export const EMOTION_WHEEL: Record<string, { color: string; keywords: string[] }> = {
  joy: {
    color: '#fbbf24',
    keywords: ['happy', 'joy', 'delighted', 'excited', 'cheerful', 'elated', 'thrilled', 'ecstatic', 'bliss', 'euphoria'],
  },
  trust: {
    color: '#34d399',
    keywords: ['trust', 'safe', 'secure', 'reliable', 'faithful', 'confident', 'assured', 'certain', 'believe'],
  },
  fear: {
    color: '#a78bfa',
    keywords: ['afraid', 'scared', 'terrified', 'panic', 'phobia', 'dread', 'horror', 'fright', 'alarmed'],
  },
  surprise: {
    color: '#f472b6',
    keywords: ['surprised', 'shocked', 'amazed', 'astonished', 'stunned', 'startled', 'bewildered'],
  },
  sadness: {
    color: '#60a5fa',
    keywords: ['sad', 'grief', 'sorrow', 'melancholy', 'gloomy', 'heartbroken', 'mourning', 'tearful', 'weeping'],
  },
  disgust: {
    color: '#4ade80',
    keywords: ['disgusted', 'revolted', 'repulsed', 'loathe', 'detest', 'contempt', 'aversion'],
  },
  anger: {
    color: '#f87171',
    keywords: ['angry', 'furious', 'enraged', 'livid', 'hostile', 'irritated', 'outraged', 'resentful', 'rage'],
  },
  anticipation: {
    color: '#fb923c',
    keywords: ['anticipate', 'expect', 'hopeful', 'eager', 'optimistic', 'looking forward', 'excited about'],
  },
};

export function classifyEmotions(messages: string[]): {
  emotions: { emotion: string; color: string; score: number; percentage: number }[];
  dominant: string;
} {
  const scores: Record<string, number> = {};
  for (const emotion of Object.keys(EMOTION_WHEEL)) scores[emotion] = 0;

  const combined = messages.join(' ').toLowerCase();

  for (const [emotion, config] of Object.entries(EMOTION_WHEEL)) {
    for (const kw of config.keywords) {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = combined.match(regex);
      if (matches) scores[emotion] += matches.length;
    }
  }

  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  const emotions = Object.entries(EMOTION_WHEEL).map(([emotion, config]) => ({
    emotion,
    color: config.color,
    score: scores[emotion],
    percentage: Math.round((scores[emotion] / total) * 100),
  })).sort((a, b) => b.score - a.score);

  return { emotions, dominant: emotions[0]?.emotion || 'neutral' };
}

// ============================================================
// COMPREHENSIVE ANALYSIS — Combines all techniques
// ============================================================

export interface ComprehensiveAnalysis {
  keywords: KeywordAnalysisResult;
  sentiment: ReturnType<typeof analyzeSentimentTrend>;
  emotions: ReturnType<typeof classifyEmotions>;
  ngrams: ReturnType<typeof analyzeNgrams>;
  lexicalDiversity: LexicalDiversityResult;
  // Chart-ready data
  chartData: {
    sentimentTimeline: { index: number; score: number; ma: number }[];
    categoryRadar: { category: string; value: number }[];
    emotionPie: { name: string; value: number; color: string }[];
    severityGauge: { level: number; label: string; score: number };
  };
}

export function runComprehensiveAnalysis(messages: string[]): ComprehensiveAnalysis {
  const keywords = analyzeMessages(messages);
  const sentiment = analyzeSentimentTrend(messages);
  const emotions = classifyEmotions(messages);
  const ngrams = analyzeNgrams(messages);
  const lexicalDiversity = analyzeLexicalDiversity(messages);

  // Build chart-ready data structures
  const sentimentTimeline = sentiment.scores.map((score, index) => ({
    index,
    score,
    ma: sentiment.movingAverage[index],
  }));

  const categoryRadar = keywords.categoryBreakdown.map(cb => ({
    category: cb.label,
    value: cb.count,
  }));

  const emotionPie = emotions.emotions
    .filter(e => e.score > 0)
    .map(e => ({ name: e.emotion, value: e.score, color: e.color }));

  const severityGauge = {
    level: keywords.mentalHealthLevel,
    label: keywords.levelLabel,
    score: keywords.overallScore,
  };

  return {
    keywords,
    sentiment,
    emotions,
    ngrams,
    lexicalDiversity,
    chartData: { sentimentTimeline, categoryRadar, emotionPie, severityGauge },
  };
}

