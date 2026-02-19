"use client";
import { useState } from "react";
import ThemeToggle from "../../components/ThemeToggle";

export default function AdminLoginPage() {
  const [form, setForm] = useState({ adminId: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("admin_token", data.token);
        window.location.href = "/admin/dashboard";
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-10 border border-gray-700 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🛡️</div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-gray-400">MindBridge Administration</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Admin ID</label>
            <input
              name="adminId" type="text" placeholder="Enter Admin ID" value={form.adminId} onChange={handleChange} required
              className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              name="password" type="password" placeholder="Enter Password" value={form.password} onChange={handleChange} required
              className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-900 border border-red-700 rounded-lg p-3">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <button type="submit" disabled={isLoading}
            className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center">
            {isLoading ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />Authenticating...</> : "Login to Admin Panel"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs">Admin credentials cannot be created or recovered. Contact system administrator.</p>
        </div>
      </div>
    </div>
  );
}
