"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import {
  runComprehensiveAnalysis,
  MENTAL_HEALTH_LEVELS,
  type ComprehensiveAnalysis,
} from "../../lib/mentalHealthAnalytics";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  Activity,
  Heart,
  MessageSquare,
} from "lucide-react";

interface Props {
  messages: string[];
  className?: string;
}

export default function MentalHealthDashboard({ messages, className = "" }: Props) {
  const analysis: ComprehensiveAnalysis = useMemo(
    () => runComprehensiveAnalysis(messages),
    [messages]
  );

  const { keywords, sentiment, emotions, ngrams, lexicalDiversity, chartData } =
    analysis;
  const levelInfo = MENTAL_HEALTH_LEVELS.find(
    (l) => l.level === keywords.mentalHealthLevel
  )!;

  const trendIcon = () => {
    if (
      sentiment.overallSentiment === "positive" ||
      sentiment.overallSentiment === "very_positive"
    )
      return <TrendingUp className="h-5 w-5 text-green-500" />;
    if (
      sentiment.overallSentiment === "negative" ||
      sentiment.overallSentiment === "very_negative"
    )
      return <TrendingDown className="h-5 w-5 text-red-500" />;
    return <Minus className="h-5 w-5 text-gray-400" />;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* -------- TOP STATS CARDS -------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Severity Level */}
        <div
          className={`rounded-xl p-5 border ${levelInfo.bgColor} border-opacity-50`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Severity Level
            </span>
            <Brain className="h-5 w-5 text-gray-400" />
          </div>
          <div className={`text-3xl font-bold ${levelInfo.textColor}`}>
            {keywords.mentalHealthLevel}/5
          </div>
          <p className={`text-sm mt-1 ${levelInfo.textColor}`}>
            {levelInfo.label}
          </p>
        </div>

        {/* Sentiment */}
        <div className="rounded-xl p-5 border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Overall Sentiment
            </span>
            {trendIcon()}
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white capitalize">
            {sentiment.overallSentiment.replace("_", " ")}
          </div>
          <p className="text-sm mt-1 text-gray-500">
            Volatility: {sentiment.volatility}
          </p>
        </div>

        {/* Dominant Emotion */}
        <div className="rounded-xl p-5 border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Dominant Emotion
            </span>
            <Heart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white capitalize">
            {emotions.dominant}
          </div>
          <p className="text-sm mt-1 text-gray-500">
            {emotions.emotions[0]?.percentage || 0}% of emotional content
          </p>
        </div>

        {/* Lexical Diversity */}
        <div className="rounded-xl p-5 border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Lexical Diversity
            </span>
            <MessageSquare className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {(lexicalDiversity.ttr * 100).toFixed(0)}%
          </div>
          <p className="text-sm mt-1 text-gray-500 capitalize">
            {lexicalDiversity.label}
            {lexicalDiversity.ruminationRisk && (
              <span className="text-amber-600 ml-1">⚠ Rumination risk</span>
            )}
          </p>
        </div>
      </div>

      {/* -------- RISK FLAGS -------- */}
      {keywords.riskFlags.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h3 className="font-bold text-red-800 dark:text-red-200">
              Risk Flags Detected
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords.riskFlags.map((flag) => (
              <span
                key={flag}
                className="px-3 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 rounded-full text-sm font-medium"
              >
                {flag.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* -------- CHARTS ROW 1: Sentiment + Emotion -------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Timeline (Line + Area Chart) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Sentiment Over Time
          </h3>
          {chartData.sentimentTimeline.length > 1 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.sentimentTimeline}>
                <defs>
                  <linearGradient
                    id="sentimentGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="index"
                  label={{
                    value: "Message #",
                    position: "insideBottom",
                    offset: -5,
                  }}
                />
                <YAxis
                  domain={[-1, 1]}
                  label={{
                    value: "Sentiment",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                  }}
                  formatter={(value: number) => [value.toFixed(3), ""]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  fill="url(#sentimentGradient)"
                  name="Raw Score"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="ma"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Moving Average"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              Need at least 2 messages for timeline
            </div>
          )}
        </div>

        {/* Emotion Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Emotion Distribution (Plutchik&apos;s Wheel)
          </h3>
          {chartData.emotionPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.emotionPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                  label={((props: any) => {
                    const { name, percent } = props;
                    return `${name} ${((percent ?? 0) * 100).toFixed(0)}%`;
                  }) as any}
                >
                  {chartData.emotionPie.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              No emotional content detected yet
            </div>
          )}
        </div>
      </div>

      {/* -------- CHARTS ROW 2: Radar + Category Bar -------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Radar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Mental Health Radar
          </h3>
          {chartData.categoryRadar.some((c) => c.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={chartData.categoryRadar}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <PolarRadiusAxis angle={90} />
                <Radar
                  name="Keyword Frequency"
                  dataKey="value"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              No keyword categories detected yet
            </div>
          )}
        </div>

        {/* Category Breakdown Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Keyword Category Breakdown
          </h3>
          {keywords.categoryBreakdown.some((c) => c.count > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={keywords.categoryBreakdown.filter((c) => c.count > 0)}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" />
                <YAxis
                  dataKey="label"
                  type="category"
                  width={120}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Bar dataKey="count" name="Mentions" radius={[0, 8, 8, 0]}>
                  {keywords.categoryBreakdown
                    .filter((c) => c.count > 0)
                    .map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              No keywords detected yet
            </div>
          )}
        </div>
      </div>

      {/* -------- SEVERITY GAUGE -------- */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Severity Gauge
        </h3>
        <div className="flex items-center gap-2 mb-3">
          {MENTAL_HEALTH_LEVELS.map((lvl) => (
            <div key={lvl.level} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full h-4 rounded-full transition-all ${
                  keywords.mentalHealthLevel >= lvl.level
                    ? "opacity-100"
                    : "opacity-20"
                }`}
                style={{ backgroundColor: lvl.color }}
              />
              <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                {lvl.label}
              </span>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Current Level:{" "}
          <strong className={levelInfo.textColor}>{levelInfo.label}</strong> —{" "}
          {levelInfo.description}
        </p>
      </div>

      {/* -------- N-GRAM ANALYSIS -------- */}
      {(ngrams.bigrams.length > 0 || ngrams.trigrams.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {ngrams.bigrams.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Common Phrases (Bigrams)
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ngrams.bigrams.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="phrase"
                    angle={-30}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    name="Occurrences"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {ngrams.trigrams.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Common Phrases (Trigrams)
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ngrams.trigrams.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="phrase"
                    angle={-30}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="#ec4899"
                    radius={[4, 4, 0, 0]}
                    name="Occurrences"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* -------- DETECTED KEYWORDS LIST -------- */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Detected Keywords by Category
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {keywords.categoryBreakdown
            .filter((cat) => cat.keywords.length > 0)
            .map((cat) => (
              <div
                key={cat.category}
                className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {cat.label}
                  </span>
                  <span className="ml-auto text-sm text-gray-500">
                    {cat.count}x
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {cat.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2 py-0.5 text-xs rounded-full"
                      style={{
                        backgroundColor: `${cat.color}20`,
                        color: cat.color,
                        border: `1px solid ${cat.color}40`,
                      }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          {keywords.categoryBreakdown.filter((cat) => cat.keywords.length > 0)
            .length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-400">
              No keywords detected yet — start chatting to see analysis
            </div>
          )}
        </div>
      </div>

      {/* -------- ANALYSIS SUMMARY -------- */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-6 border border-blue-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
          Analysis Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">
              Messages Analyzed
            </span>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {keywords.totalMessages}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">
              Positive Messages
            </span>
            <p className="text-xl font-bold text-green-600">
              {keywords.positiveCount}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">
              Concerning Messages
            </span>
            <p className="text-xl font-bold text-red-600">
              {keywords.negativeCount}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">
              Unique Words Used
            </span>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {lexicalDiversity.uniqueWords}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
