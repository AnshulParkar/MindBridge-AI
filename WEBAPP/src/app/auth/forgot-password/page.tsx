"use client";
import { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "../../../components/ThemeToggle";

type Step = "email" | "otp" | "reset" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [form, setForm] = useState({ email: "", role: "patient", otp: "", newPassword: "", confirmPassword: "" });
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  // Step 1: Send OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, role: form.role }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserId(data.userId);
        setSuccess("OTP sent to your email!");
        setStep("otp");
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, otp: form.otp }),
      });
      const data = await res.json();
      if (res.ok && data.verified) {
        setSuccess("OTP verified! You can now reset your password.");
        setStep("reset");
      } else {
        setError(data.error || "Invalid OTP");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.newPassword.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Password reset successfully! Signing you in...");
        setStep("done");
        // Auto sign-in with new password and redirect to dashboard
        const signInRes = await signIn("credentials", {
          email: form.email,
          password: form.newPassword,
          role: form.role,
          redirect: false,
        });
        if (signInRes?.ok) {
          const dashboard = form.role === "therapist" ? "/therapist/dashboard" : "/patient/dashboard";
          setTimeout(() => router.push(dashboard), 1500);
        } else {
          setTimeout(() => router.push("/auth/signin"), 2000);
        }
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="text-3xl"><Image className="h-12 w-12" src="/logo.png" alt="Logo" width={48} height={48} /></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">MindBridge</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">AI Therapy Session</p>
              </div>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border dark:border-gray-700 transition-colors duration-300">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8 space-x-2">
            {["email", "otp", "reset"].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === s || ["otp", "reset", "done"].indexOf(step) > ["email", "otp", "reset"].indexOf(s as Step)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                }`}>
                  {i + 1}
                </div>
                {i < 2 && <div className={`w-12 h-1 mx-1 ${
                  ["otp", "reset", "done"].indexOf(step) > i
                    ? "bg-blue-600"
                    : "bg-gray-200 dark:bg-gray-600"
                }`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Email Input */}
          {step === "email" && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Forgot Password</h2>
                <p className="text-gray-600 dark:text-gray-300">Enter your registered email to receive an OTP</p>
              </div>
              <form onSubmit={handleSendOTP} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                  <input
                    name="email" type="email" placeholder="Enter your email" value={form.email} onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account Type</label>
                  <select
                    id="role" name="role" value={form.role} onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  >
                    <option value="patient">Patient</option>
                    <option value="therapist">Therapist</option>
                  </select>
                </div>
                {error && <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-3"><p className="text-red-700 dark:text-red-200 text-sm">{error}</p></div>}
                {success && <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-3"><p className="text-green-700 dark:text-green-200 text-sm">{success}</p></div>}
                <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center">
                  {isLoading ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />Sending OTP...</> : "Send OTP"}
                </button>
              </form>
            </>
          )}

          {/* Step 2: OTP Verification */}
          {step === "otp" && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verify OTP</h2>
                <p className="text-gray-600 dark:text-gray-300">Enter the 6-digit OTP sent to your email</p>
              </div>
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">OTP Code</label>
                  <input
                    name="otp" type="text" placeholder="Enter 6-digit OTP" value={form.otp} onChange={handleChange} required maxLength={6}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-2xl tracking-widest placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>
                {error && <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-3"><p className="text-red-700 dark:text-red-200 text-sm">{error}</p></div>}
                {success && <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-3"><p className="text-green-700 dark:text-green-200 text-sm">{success}</p></div>}
                <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center">
                  {isLoading ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />Verifying...</> : "Verify OTP"}
                </button>
                <button type="button" onClick={() => { setStep("email"); setError(""); setSuccess(""); }} className="w-full text-gray-600 dark:text-gray-300 py-2 text-sm hover:underline">
                  Resend OTP
                </button>
              </form>
            </>
          )}

          {/* Step 3: Reset Password */}
          {step === "reset" && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reset Password</h2>
                <p className="text-gray-600 dark:text-gray-300">Enter your new password</p>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                  <input
                    name="newPassword" type="password" placeholder="New password" value={form.newPassword} onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
                  <input
                    name="confirmPassword" type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>
                {error && <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-3"><p className="text-red-700 dark:text-red-200 text-sm">{error}</p></div>}
                {success && <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-3"><p className="text-green-700 dark:text-green-200 text-sm">{success}</p></div>}
                <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center">
                  {isLoading ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />Resetting...</> : "Reset Password"}
                </button>
              </form>
            </>
          )}

          {/* Step 4: Done */}
          {step === "done" && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Password Reset!</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">Your password has been reset successfully. Redirecting to your dashboard...</p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link href="/auth/signin" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm">
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
