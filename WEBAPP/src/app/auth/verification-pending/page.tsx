"use client";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import ThemeToggle from "../../../components/ThemeToggle";

export default function VerificationPendingPage() {
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
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Check Status
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
