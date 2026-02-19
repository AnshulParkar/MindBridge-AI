"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../../../components/ThemeToggle";

export default function VerificationPendingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const checkStatus = async () => {
    setChecking(true);
    setStatusMessage("");
    try {
      const userId = session?.user?.id;
      if (!userId) {
        setStatusMessage("Please sign in again.");
        setChecking(false);
        return;
      }

      const res = await fetch("/api/auth/check-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();

      if (data.therapistVerification) {
        if (data.therapistVerification.status === "approved") {
          setStatusMessage("Your account has been approved! Redirecting...");
          setTimeout(() => router.push("/therapist/dashboard"), 1000);
          return;
        }
        if (data.therapistVerification.status === "rejected") {
          const reason = data.therapistVerification.rejectionReason || "No reason provided";
          setStatusMessage(`Your profile was rejected: ${reason}. Redirecting to update your profile...`);
          setTimeout(() => router.push("/auth/complete-profile"), 2000);
          return;
        }
      }
      setStatusMessage("Still pending. Please check again later.");
    } catch {
      setStatusMessage("Could not check status. Try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="text-3xl"><Image className="h-12 w-12" src="/logo.png" alt="Logo" width={48} height={48} /></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">MindBridge</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Therapist Verification</p>
              </div>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-20">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 border dark:border-gray-700 text-center transition-colors duration-300">
          <div className="text-7xl mb-6">⏳</div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Verification Pending</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
            Your therapist profile has been submitted and is under review by our admin team.
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-8">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              This process may take up to 24-48 hours. You will be notified via email once your account is approved.
              Until then, you will see this page when you log in.
            </p>
          </div>

          {statusMessage && (
            <div className={`rounded-lg p-4 mb-4 text-sm ${
              statusMessage.includes("approved") ? "bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-200" :
              statusMessage.includes("rejected") ? "bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200" :
              "bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-200"
            }`}>
              <p>{statusMessage}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={checkStatus}
              disabled={checking}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              {checking ? (
                <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />Checking...</>
              ) : (
                "Check Status"
              )}
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
