"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";

// Dynamically import to avoid SSR issues with recharts
const MentalHealthDashboard = dynamic(
  () => import("../../../components/analytics/MentalHealthDashboard"),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )}
);

export default function PatientAnalytics() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || (session.user as { role?: string })?.role !== "patient") {
      router.replace("/auth/signin");
      return;
    }

    // Fetch user's chat messages
    const fetchMessages = async () => {
      try {
        // Fetch all messages (up to 500 for analysis)
        const res = await fetch(`/api/chat/messages?limit=500`);
        if (res.ok) {
          const data = await res.json();
          // Extract message content texts
          const userMessages: string[] = data.messages
            .map((m: { content: string }) => m.content)
            .filter((c: string) => c && c.trim().length > 0)
            .reverse(); // oldest first for timeline
          setMessages(userMessages);
        } else {
          setError("Failed to load chat messages");
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError("Failed to load chat messages");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [session, status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">
            Analyzing your mental health data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/patient/dashboard"
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Advanced Mental Health Analytics
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              AI-powered NLP analysis of your conversation patterns — sentiment,
              emotions, n-grams, and more
            </p>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Main content */}
        {messages.length > 0 ? (
          <MentalHealthDashboard messages={messages} />
        ) : (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
              No messages to analyze yet
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">
              Start a therapy session to generate conversation data for analysis
            </p>
            <Link
              href="/patient/session"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Start a Session
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
