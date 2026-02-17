'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Activity,
  RefreshCw,
  ClipboardList,
  Shield,
  Heart,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface AnalyticsData {
  currentLevel: number;
  currentLevelLabel: string;
  currentSource: string;
  levelInfo: {
    level: number;
    label: string;
    color: string;
    bgColor: string;
    textColor: string;
    description: string;
  };
  trend: 'improving' | 'worsening' | 'stable';
  keywordCounts: Record<string, number>;
  riskFlags: string[];
  timeline: {
    date: string;
    level: number;
    label: string;
    source: string;
    positiveCount: number;
    negativeCount: number;
  }[];
  assessmentCount: number;
  chatAnalysisCount: number;
  totalAnalyticsEntries: number;
  latestAnalysis: {
    date: string;
    keywordsDetected: Record<string, string[]>;
    keywordCounts: Record<string, number>;
    totalMessages: number;
    positiveCount: number;
    negativeCount: number;
  } | null;
  latestAssessment: {
    date: string;
    totalScore: number;
    maxScore: number;
    level: number;
    label: string;
  } | null;
}

interface AssessmentQuestion {
  id: number;
  question: string;
  category: string;
}

interface AnswerOption {
  label: string;
  score: number;
}

// ============================================================
// Constants
// ============================================================

const LEVEL_COLORS: Record<number, string> = {
  1: '#22c55e',
  2: '#f59e0b',
  3: '#f97316',
  4: '#ef4444',
  5: '#dc2626',
};

const LEVEL_BG_CLASSES: Record<number, string> = {
  1: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
  2: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
  3: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700',
  4: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
  5: 'bg-red-200 dark:bg-red-900/50 border-red-400 dark:border-red-600',
};

const LEVEL_TEXT_CLASSES: Record<number, string> = {
  1: 'text-green-700 dark:text-green-400',
  2: 'text-yellow-700 dark:text-yellow-400',
  3: 'text-orange-700 dark:text-orange-400',
  4: 'text-red-700 dark:text-red-400',
  5: 'text-red-800 dark:text-red-300',
};

const CATEGORY_COLORS: Record<string, string> = {
  stress: '#f59e0b',
  anxiety: '#8b5cf6',
  depression: '#3b82f6',
  anger: '#ef4444',
  self_harm: '#dc2626',
  loneliness: '#6366f1',
  positive: '#22c55e',
};

const CATEGORY_LABELS: Record<string, string> = {
  stress: 'Stress',
  anxiety: 'Anxiety',
  depression: 'Depression',
  anger: 'Anger',
  self_harm: 'Self-Harm Risk',
  loneliness: 'Loneliness',
  positive: 'Positive',
};

// ============================================================
// Main Component
// ============================================================

const MentalHealthAnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const url = `/api/analytics${refresh ? '?refresh=true' : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const data = await res.json();
      setAnalytics(data);
      setError(null);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = () => fetchAnalytics(true);

  const handleAssessmentComplete = () => {
    setShowAssessment(false);
    fetchAnalytics(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <Button onClick={() => fetchAnalytics()} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  // Show assessment modal
  if (showAssessment) {
    return (
      <AssessmentFlow
        onComplete={handleAssessmentComplete}
        onCancel={() => setShowAssessment(false)}
      />
    );
  }

  const hasData = analytics && analytics.totalAnalyticsEntries > 0;

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Brain className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
            Mental Health Analytics
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Insights based on your chat conversations and assessments
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-gray-200 dark:border-gray-600"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Analyzing...' : 'Refresh'}
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAssessment(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ClipboardList className="h-4 w-4 mr-1" />
            Take Assessment
          </Button>
        </div>
      </div>

      {!hasData ? (
        /* Empty State */
        <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Analytics Data Yet
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Start chatting with your AI therapist or take a quick assessment to generate personalized mental health insights.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="border-gray-200 dark:border-gray-600"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Analyze My Chats
              </Button>
              <Button
                onClick={() => setShowAssessment(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                Take Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Level Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Level */}
            <Card className={`border-2 ${LEVEL_BG_CLASSES[analytics!.currentLevel]} shadow-lg`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Mental Health Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                    style={{ backgroundColor: LEVEL_COLORS[analytics!.currentLevel] }}
                  >
                    {analytics!.currentLevel}
                  </div>
                  <div>
                    <div className={`text-xl font-bold ${LEVEL_TEXT_CLASSES[analytics!.currentLevel]}`}>
                      {analytics!.currentLevelLabel}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Based on {analytics!.currentSource === 'assessment' ? 'assessment' : 'chat analysis'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trend */}
            <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  {analytics!.trend === 'improving' ? (
                    <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <TrendingDown className="h-7 w-7 text-green-600 dark:text-green-400" />
                    </div>
                  ) : analytics!.trend === 'worsening' ? (
                    <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <TrendingUp className="h-7 w-7 text-red-600 dark:text-red-400" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <Minus className="h-7 w-7 text-gray-600 dark:text-gray-400" />
                    </div>
                  )}
                  <div>
                    <div className="text-xl font-bold capitalize text-gray-900 dark:text-white">
                      {analytics!.trend}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Based on recent patterns
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Sources */}
            <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Data Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                      Chat Analyses
                    </span>
                    <Badge variant="secondary">{analytics!.chatAnalysisCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                      Assessments
                    </span>
                    <Badge variant="secondary">{analytics!.assessmentCount}</Badge>
                  </div>
                  {analytics!.latestAnalysis && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <Activity className="h-3.5 w-3.5 mr-1.5" />
                        Messages Analyzed
                      </span>
                      <Badge variant="secondary">{analytics!.latestAnalysis.totalMessages}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk Alerts */}
          {analytics!.riskFlags.length > 0 && (
            <Card className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 shadow-lg">
              <CardContent className="py-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-800 dark:text-red-300">Important Notice</h4>
                    <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                      Our analysis has detected some concerning patterns in your conversations.
                      If you&apos;re in crisis, please reach out to a mental health professional or
                      call a crisis helpline immediately.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {analytics!.riskFlags.map(flag => (
                        <Badge key={flag} variant="destructive" className="text-xs">
                          {flag.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Keyword Breakdown & Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Keyword Breakdown */}
            <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Keyword Analysis
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Mental health indicators detected in your chats
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics!.keywordCounts && Object.keys(analytics!.keywordCounts).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(analytics!.keywordCounts)
                      .filter(([cat]) => cat !== 'positive')
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([category, count]) => {
                        const maxCount = Math.max(
                          ...Object.entries(analytics!.keywordCounts)
                            .filter(([c]) => c !== 'positive')
                            .map(([, v]) => v as number),
                          1
                        );
                        const percentage = ((count as number) / maxCount) * 100;
                        return (
                          <div key={category}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {CATEGORY_LABELS[category] || category}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {count as number} mentions
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                              <div
                                className="h-2.5 rounded-full transition-all duration-500"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: CATEGORY_COLORS[category] || '#6b7280',
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}

                    {/* Positive indicators */}
                    {(analytics!.keywordCounts.positive as number) > 0 && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center">
                            <Heart className="h-3.5 w-3.5 mr-1" />
                            Positive Indicators
                          </span>
                          <span className="text-sm text-green-600 dark:text-green-400">
                            {analytics!.keywordCounts.positive as number} mentions
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <BarChart3 className="h-10 w-10 mx-auto mb-2" />
                    <p className="text-sm">No keyword data available yet</p>
                    <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-2">
                      Analyze Chats
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Level Timeline */}
            <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Level History
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Your mental health level over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics!.timeline.length > 0 ? (
                  <div className="space-y-2">
                    {/* Visual bar chart */}
                    <div className="flex items-end space-x-1 h-32 mb-4">
                      {analytics!.timeline.slice(-14).map((entry, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full rounded-t transition-all duration-300 min-h-[4px]"
                            style={{
                              height: `${(entry.level / 5) * 100}%`,
                              backgroundColor: LEVEL_COLORS[entry.level],
                            }}
                            title={`${entry.label} - ${new Date(entry.date).toLocaleDateString()}`}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Level scale */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2">
                      <span>1 - Minimal</span>
                      <span>3 - Moderate</span>
                      <span>5 - Severe</span>
                    </div>

                    {/* Recent entries */}
                    <div className="mt-4 space-y-2">
                      {analytics!.timeline.slice(-5).reverse().map((entry, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm p-2 rounded bg-gray-50 dark:bg-gray-700/50"
                        >
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: LEVEL_COLORS[entry.level] }}
                            />
                            <span className="text-gray-700 dark:text-gray-300">
                              {new Date(entry.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{ borderColor: LEVEL_COLORS[entry.level], color: LEVEL_COLORS[entry.level] }}
                            >
                              {entry.label}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {entry.source}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <Activity className="h-10 w-10 mx-auto mb-2" />
                    <p className="text-sm">No timeline data yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Latest Results Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Latest Chat Analysis */}
            {analytics!.latestAnalysis && (
              <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white text-sm flex items-center">
                    <MessageSquare className="mr-2 h-4 w-4 text-blue-500" />
                    Latest Chat Analysis
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 text-xs">
                    {new Date(analytics!.latestAnalysis.date).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {analytics!.latestAnalysis.totalMessages}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Messages</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {analytics!.latestAnalysis.positiveCount}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Positive</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {analytics!.latestAnalysis.negativeCount}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Concerning</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Latest Assessment */}
            {analytics!.latestAssessment && (
              <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white text-sm flex items-center">
                    <ClipboardList className="mr-2 h-4 w-4 text-purple-500" />
                    Latest Assessment
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 text-xs">
                    {new Date(analytics!.latestAssessment.date).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Score</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {analytics!.latestAssessment.totalScore} / {analytics!.latestAssessment.maxScore}
                      </span>
                    </div>
                    <Progress
                      value={(analytics!.latestAssessment.totalScore / analytics!.latestAssessment.maxScore) * 100}
                      className="h-2"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Level</span>
                      <Badge
                        style={{
                          backgroundColor: LEVEL_COLORS[analytics!.latestAssessment.level],
                          color: '#fff',
                        }}
                      >
                        {analytics!.latestAssessment.label}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Level Guide */}
          <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center">
                <Shield className="mr-2 h-5 w-5 text-gray-600 dark:text-gray-400" />
                Understanding Your Levels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {[
                  { level: 1, label: 'Minimal', desc: 'No significant concerns', icon: '🟢' },
                  { level: 2, label: 'Mild', desc: 'Some mild stressors', icon: '🟡' },
                  { level: 3, label: 'Moderate', desc: 'Moderate concerns', icon: '🟠' },
                  { level: 4, label: 'Mod. Severe', desc: 'Significant distress', icon: '🔴' },
                  { level: 5, label: 'Severe', desc: 'Immediate attention needed', icon: '🆘' },
                ].map(item => (
                  <div
                    key={item.level}
                    className={`p-3 rounded-lg text-center ${
                      analytics!.currentLevel === item.level
                        ? LEVEL_BG_CLASSES[item.level] + ' border-2'
                        : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="text-2xl mb-1">{item.icon}</div>
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">{item.label}</div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

// ============================================================
// Assessment Flow Component
// ============================================================

interface AssessmentFlowProps {
  onComplete: () => void;
  onCancel: () => void;
}

const AssessmentFlow: React.FC<AssessmentFlowProps> = ({ onComplete, onCancel }) => {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [answerOptions, setAnswerOptions] = useState<AnswerOption[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    totalScore: number;
    maxScore: number;
    mentalHealthLevel: number;
    levelLabel: string;
  } | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  // Fetch questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch('/api/analytics/assess');
        if (res.ok) {
          const data = await res.json();
          setQuestions(data.questions);
          setAnswerOptions(data.answerOptions);
        }
      } catch (err) {
        console.error('Failed to fetch questions:', err);
      } finally {
        setLoadingQuestions(false);
      }
    };
    fetchQuestions();
  }, []);

  const handleAnswer = (score: number) => {
    const question = questions[currentQuestion];
    setAnswers(prev => ({ ...prev, [question.id]: score }));

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const answerArray = Object.entries(answers).map(([questionId, score]) => ({
        questionId: parseInt(questionId),
        score,
      }));

      const res = await fetch('/api/analytics/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answerArray }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error('Failed to submit assessment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const isComplete = Object.keys(answers).length === questions.length;
  const progress = questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0;

  if (loadingQuestions) {
    return (
      <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg">
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading assessment...</p>
        </CardContent>
      </Card>
    );
  }

  // Show result
  if (result) {
    return (
      <Card className={`border-2 ${LEVEL_BG_CLASSES[result.mentalHealthLevel]} shadow-lg`}>
        <CardHeader className="text-center">
          <CardTitle className="text-gray-900 dark:text-white">Assessment Complete</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Here are your results
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto shadow-lg"
            style={{ backgroundColor: LEVEL_COLORS[result.mentalHealthLevel] }}
          >
            {result.mentalHealthLevel}
          </div>
          <div>
            <h3 className={`text-2xl font-bold ${LEVEL_TEXT_CLASSES[result.mentalHealthLevel]}`}>
              {result.levelLabel}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Score: {result.totalScore} / {result.maxScore}
            </p>
          </div>
          <Progress
            value={(result.totalScore / result.maxScore) * 100}
            className="h-3 max-w-xs mx-auto"
          />

          {result.mentalHealthLevel >= 4 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-red-700 dark:text-red-400">
                <AlertTriangle className="inline h-4 w-4 mr-1" />
                Your assessment indicates significant distress. We recommend speaking with a
                mental health professional. If you&apos;re in immediate crisis, please reach out
                to a crisis helpline.
              </p>
            </div>
          )}

          <div className="flex items-center justify-center space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onComplete}
              className="border-gray-200 dark:border-gray-600"
            >
              Back to Dashboard
            </Button>
            <Button onClick={onComplete} className="bg-blue-600 hover:bg-blue-700 text-white">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Question flow
  const question = questions[currentQuestion];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <ClipboardList className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
            Mental Health Assessment
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Answer honestly — your responses are private and secure
          </p>
        </div>
        <Button variant="ghost" onClick={onCancel} className="text-gray-500">
          Cancel
        </Button>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Question {currentQuestion + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg">
        <CardContent className="py-8">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-8">
            {question?.question}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
            {answerOptions.map((option) => {
              const isSelected = answers[question?.id] === option.score;
              return (
                <button
                  key={option.score}
                  onClick={() => handleAnswer(option.score)}
                  className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion(prev => prev - 1)}
          className="border-gray-200 dark:border-gray-600"
        >
          Previous
        </Button>

        <div className="flex items-center space-x-2">
          {/* Question dots */}
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentQuestion(idx)}
              aria-label={`Go to question ${idx + 1}`}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === currentQuestion
                  ? 'bg-blue-600 w-4'
                  : answers[questions[idx]?.id] !== undefined
                  ? 'bg-blue-300 dark:bg-blue-700'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        {currentQuestion < questions.length - 1 ? (
          <Button
            disabled={answers[question?.id] === undefined}
            onClick={() => setCurrentQuestion(prev => prev + 1)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            disabled={!isComplete || submitting}
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {submitting ? 'Submitting...' : 'Submit Assessment'}
            <CheckCircle2 className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default MentalHealthAnalyticsDashboard;
