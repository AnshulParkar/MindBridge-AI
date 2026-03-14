"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Search,
  ArrowLeft,
  Users,
  Brain,
  AlertCircle,
  Loader2,
  User,
  Activity,
  TrendingUp,
} from "lucide-react";

// Dynamic import to avoid SSR issues with Recharts
const MentalHealthDashboard = dynamic(
  () => import("@/components/analytics/MentalHealthDashboard"),
  { ssr: false, loading: () => <DashboardSkeleton /> }
);

function DashboardSkeleton() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Loading analytics dashboard...</p>
      </div>
    </div>
  );
}

interface PatientInfo {
  id: string;
  name: string;
  email: string;
  totalSessions: number;
  lastSession: string | null;
  dominantEmotion: string;
  improvementTrend: string;
  messageCount?: number;
}

export default function TherapistPatientAnalytics() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [allPatients, setAllPatients] = useState<PatientInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);
  const [patientMessages, setPatientMessages] = useState<string[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (status === "loading") return;
    if (!session || (session.user as { role?: string })?.role !== "therapist") {
      router.replace("/auth/signin");
    }
  }, [session, status, router]);

  // Fetch ALL patients on mount
  useEffect(() => {
    if (!session?.user?.email) return;

    const fetchPatients = async () => {
      try {
        setLoadingPatients(true);
        const res = await fetch(`/api/therapy/all-patients`);
        if (!res.ok) throw new Error("Failed to fetch patients");
        const data = await res.json();
        setAllPatients(
          data.map((p: any) => ({
            id: p.id,
            name: p.name || "Unknown",
            email: p.email,
            totalSessions: p.totalSessions || 0,
            lastSession: p.lastSession || null,
            dominantEmotion: p.dominantEmotion || "neutral",
            improvementTrend: p.improvementTrend || "stable",
            messageCount: p.messageCount || 0,
          }))
        );
      } catch (err) {
        console.error("Error fetching patients:", err);
        setError("Failed to load patients list.");
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchPatients();
  }, [session]);

  // Live filter as user types — filters instantly on every keystroke
  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allPatients; // show all by default
    return allPatients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
    );
  }, [allPatients, searchQuery]);

  // Fetch messages for selected patient
  const handleSelectPatient = async (patient: PatientInfo) => {
    setSelectedPatient(patient);
    setPatientMessages([]);
    setError(null);
    setLoadingMessages(true);

    try {
      const res = await fetch(
        `/api/therapy/patient-analytics?patientId=${patient.id}&limit=500`
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to fetch patient data");
      }
      const data = await res.json();
      const messages = data.messages.map((m: any) => m.content);
      setPatientMessages(messages);
    } catch (err: any) {
      console.error("Error fetching patient analytics:", err);
      setError(err.message || "Failed to load patient analytics.");
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleBackToList = () => {
    setSelectedPatient(null);
    setPatientMessages([]);
    setError(null);
  };

  const getEmotionEmoji = (emotion: string): string => {
    const map: Record<string, string> = {
      happy: "😊",
      sad: "😢",
      angry: "😠",
      fearful: "😰",
      surprised: "😲",
      disgusted: "🤢",
      neutral: "😐",
      anxious: "😰",
    };
    return map[emotion.toLowerCase()] || "🤔";
  };

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case "up":
        return (
          <span className="inline-flex items-center text-green-600 dark:text-green-400 text-sm font-medium">
            <TrendingUp className="h-4 w-4 mr-1" /> Improving
          </span>
        );
      case "down":
        return (
          <span className="inline-flex items-center text-red-600 dark:text-red-400 text-sm font-medium">
            <TrendingUp className="h-4 w-4 mr-1 rotate-180" /> Declining
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-gray-500 dark:text-gray-400 text-sm font-medium">
            <Activity className="h-4 w-4 mr-1" /> Stable
          </span>
        );
    }
  };

  if (status === "loading" || loadingPatients) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/therapist/dashboard"
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  Patient Analytics
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Advanced NLP Mental Health Analytics for your patients
                </p>
              </div>
            </div>
            {selectedPatient && (
              <button
                onClick={handleBackToList}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Users className="h-4 w-4" />
                All Patients
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedPatient ? (
          /* ---------- PATIENT LIST VIEW ---------- */
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Select a Patient
                </h2>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {searchQuery
                  ? `Showing ${filteredPatients.length} of ${allPatients.length} patients`
                  : `${allPatients.length} patients total`}
              </p>
            </div>

            {/* Patient Cards */}
            {filteredPatients.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 p-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {allPatients.length === 0
                    ? "No patients found"
                    : "No matching patients"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {allPatients.length === 0
                    ? "No patients are registered in the system yet."
                    : "Try a different search term."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPatients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 p-6 text-left hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl transition-all duration-200 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                        <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {patient.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {patient.email}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Sessions</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {patient.totalSessions}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Messages</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {patient.messageCount || 0}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Mood</p>
                        <p className="text-lg">
                          {getEmotionEmoji(patient.dominantEmotion)}{" "}
                          <span className="text-sm capitalize text-gray-700 dark:text-gray-300">
                            {patient.dominantEmotion}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      {getTrendLabel(patient.improvementTrend)}
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {patient.lastSession
                          ? `Last: ${new Date(patient.lastSession).toLocaleDateString()}`
                          : "No sessions yet"}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t dark:border-gray-700">
                      <span className="text-sm text-blue-600 dark:text-blue-400 font-medium group-hover:underline">
                        View NLP Analytics →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ---------- ANALYTICS VIEW for selected patient ---------- */
          <div className="space-y-6">
            {/* Patient info header  */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBackToList}
                    className="sm:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                    {selectedPatient.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedPatient.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedPatient.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg">
                    <span className="text-blue-700 dark:text-blue-300 font-medium">
                      {selectedPatient.totalSessions} sessions
                    </span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <span>{getEmotionEmoji(selectedPatient.dominantEmotion)}</span>
                    <span className="capitalize text-gray-700 dark:text-gray-300">
                      {selectedPatient.dominantEmotion}
                    </span>
                  </div>
                  {getTrendLabel(selectedPatient.improvementTrend)}
                </div>
              </div>
            </div>

            {/* Error state */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Loading messages */}
            {loadingMessages && <DashboardSkeleton />}

            {/* Dashboard */}
            {!loadingMessages && !error && patientMessages.length > 0 && (
              <MentalHealthDashboard messages={patientMessages} />
            )}

            {/* No messages */}
            {!loadingMessages && !error && patientMessages.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 p-12 text-center">
                <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Messages Yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  This patient hasn&apos;t sent any chat messages yet. Analytics will be available once they start chatting.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
