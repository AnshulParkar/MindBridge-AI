"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type Tab = "overview" | "therapists" | "users";

interface Analytics {
  overview: {
    totalPatients: number;
    totalTherapists: number;
    totalUsers: number;
    totalSessions: number;
    totalAppointments: number;
    activePatients: number;
    activeTherapists: number;
    pendingVerifications: number;
    bannedUsers: number;
    newRegistrations: number;
  };
  appointmentStats: Record<string, number>;
}

interface TherapistProfile {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  age: number;
  degree: string;
  experience: string;
  hospitalAffiliation: string;
  photoUrl: string;
  isVerified: boolean;
  verificationStatus: string;
  rejectionReason: string | null;
  createdAt: string;
  user: { id: string; email: string; createdAt: string; isBanned: boolean };
}

interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isBanned: boolean;
  isProfileComplete: boolean;
  createdAt: string;
  image: string | null;
  patientDetails: { fullName: string } | null;
  therapistProfile: {
    id: string;
    fullName: string;
    degree: string;
    experience: string;
    isVerified: boolean;
    verificationStatus: string;
    photoUrl: string;
  } | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [token, setToken] = useState<string>("");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [therapists, setTherapists] = useState<TherapistProfile[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [therapistFilter, setTherapistFilter] = useState("pending");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionModal, setRejectionModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Check admin auth
  useEffect(() => {
    const t = localStorage.getItem("admin_token");
    if (!t) {
      router.push("/admin");
      return;
    }
    setToken(t);
  }, [router]);

  const headers = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }), [token]);

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/analytics", { headers: headers() });
      if (res.status === 401) { localStorage.removeItem("admin_token"); router.push("/admin"); return; }
      const data = await res.json();
      setAnalytics(data);
    } catch (err) { console.error("Analytics fetch error:", err); }
  }, [token, headers, router]);

  // Fetch therapists
  const fetchTherapists = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/therapists?status=${therapistFilter}`, { headers: headers() });
      if (res.status === 401) { localStorage.removeItem("admin_token"); router.push("/admin"); return; }
      const data = await res.json();
      setTherapists(data.therapists || []);
    } catch (err) { console.error("Therapists fetch error:", err); }
  }, [token, therapistFilter, headers, router]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams();
      if (userRoleFilter) params.set("role", userRoleFilter);
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/admin/users?${params}`, { headers: headers() });
      if (res.status === 401) { localStorage.removeItem("admin_token"); router.push("/admin"); return; }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) { console.error("Users fetch error:", err); }
  }, [token, userRoleFilter, searchQuery, headers, router]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([fetchAnalytics(), fetchTherapists(), fetchUsers()]).finally(() => setLoading(false));
  }, [token, fetchAnalytics, fetchTherapists, fetchUsers]);

  // Therapist actions
  const handleTherapistAction = async (profileId: string, action: "approve" | "reject", reason?: string) => {
    setActionLoading(profileId);
    try {
      await fetch("/api/admin/therapists", {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ therapistProfileId: profileId, action, rejectionReason: reason }),
      });
      fetchTherapists();
      fetchAnalytics();
    } catch (err) { console.error("Action error:", err); }
    setActionLoading(null);
    setRejectionModal(null);
  };

  // User actions
  const handleUserAction = async (userId: string, action: "ban" | "unban" | "delete") => {
    if (action === "delete" && !confirm("Are you sure you want to permanently delete this user?")) return;
    setActionLoading(userId);
    try {
      await fetch("/api/admin/users", {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ userId, action }),
      });
      fetchUsers();
      fetchAnalytics();
    } catch (err) { console.error("Action error:", err); }
    setActionLoading(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top Bar */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🛡️</span>
            <h1 className="text-xl font-bold">MindBridge Admin</h1>
          </div>
          <button onClick={handleLogout} className="text-red-400 hover:text-red-300 text-sm font-medium border border-red-400 px-4 py-2 rounded-lg hover:bg-red-900 transition-colors">
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-800 rounded-lg p-1 w-fit">
          {[
            { key: "overview", label: "Overview", icon: "📊" },
            { key: "therapists", label: "Verify Therapists", icon: "🩺" },
            { key: "users", label: "Manage Users", icon: "👥" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as Tab)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? "bg-red-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ================== OVERVIEW TAB ================== */}
        {tab === "overview" && analytics && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[
                { label: "Total Users", value: analytics.overview.totalUsers, icon: "👥", color: "blue" },
                { label: "Patients", value: analytics.overview.totalPatients, icon: "🧑", color: "green" },
                { label: "Therapists", value: analytics.overview.totalTherapists, icon: "🩺", color: "purple" },
                { label: "Active Patients", value: analytics.overview.activePatients, icon: "✅", color: "teal" },
                { label: "Active Therapists", value: analytics.overview.activeTherapists, icon: "✅", color: "cyan" },
                { label: "Total Sessions", value: analytics.overview.totalSessions, icon: "📋", color: "indigo" },
                { label: "Appointments", value: analytics.overview.totalAppointments, icon: "📅", color: "yellow" },
                { label: "Pending Verifications", value: analytics.overview.pendingVerifications, icon: "⏳", color: "orange" },
                { label: "Banned Users", value: analytics.overview.bannedUsers, icon: "🚫", color: "red" },
                { label: "New (30 days)", value: analytics.overview.newRegistrations, icon: "🆕", color: "emerald" },
              ].map((stat) => (
                <div key={stat.label} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Appointment Stats */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Appointment Status Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(analytics.appointmentStats).map(([status, count]) => (
                  <div key={status} className="bg-gray-700 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm text-gray-400 capitalize">{status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================== THERAPIST VERIFICATION TAB ================== */}
        {tab === "therapists" && (
          <div className="space-y-6">
            {/* Filter */}
            <div className="flex space-x-2">
              {["pending", "approved", "rejected"].map((f) => (
                <button key={f} onClick={() => setTherapistFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    therapistFilter === f ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white border border-gray-700"
                  }`}>
                  {f}
                </button>
              ))}
            </div>

            {therapists.length === 0 ? (
              <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
                <span className="text-5xl block mb-4">📋</span>
                <p className="text-gray-400 text-lg">No {therapistFilter} therapists</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {therapists.map((t) => (
                  <div key={t.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="flex items-start gap-6">
                      {/* Photo */}
                      <div className="flex-shrink-0">
                        {t.photoUrl ? (
                          <img src={t.photoUrl} alt={t.fullName} className="w-24 h-24 rounded-full object-cover border-2 border-gray-600" />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center"><span className="text-3xl">👤</span></div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-bold text-white">{t.fullName}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            t.verificationStatus === "pending" ? "bg-yellow-900 text-yellow-200" :
                            t.verificationStatus === "approved" ? "bg-green-900 text-green-200" :
                            "bg-red-900 text-red-200"
                          }`}>
                            {t.verificationStatus}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-3">{t.user.email}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div><span className="text-gray-500">Age:</span> <span className="text-gray-200">{t.age}</span></div>
                          <div><span className="text-gray-500">Gender:</span> <span className="text-gray-200 capitalize">{t.gender}</span></div>
                          <div><span className="text-gray-500">DOB:</span> <span className="text-gray-200">{new Date(t.dateOfBirth).toLocaleDateString()}</span></div>
                          <div><span className="text-gray-500">Joined:</span> <span className="text-gray-200">{new Date(t.createdAt).toLocaleDateString()}</span></div>
                        </div>

                        <div className="mt-3 space-y-1 text-sm">
                          <p><span className="text-gray-500">Degree:</span> <span className="text-gray-200">{t.degree}</span></p>
                          <p><span className="text-gray-500">Experience:</span> <span className="text-gray-200">{t.experience}</span></p>
                          <p><span className="text-gray-500">Hospital/LOR:</span> <span className="text-gray-200">{t.hospitalAffiliation}</span></p>
                        </div>

                        {t.rejectionReason && (
                          <div className="mt-3 bg-red-900/50 border border-red-700 rounded-lg p-3">
                            <p className="text-red-200 text-sm"><strong>Rejection Reason:</strong> {t.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {t.verificationStatus === "pending" && (
                      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-700">
                        <button
                          onClick={() => handleTherapistAction(t.id, "approve")}
                          disabled={actionLoading === t.id}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === t.id ? "Processing..." : "✅ Approve"}
                        </button>
                        <button
                          onClick={() => setRejectionModal({ id: t.id, name: t.fullName })}
                          disabled={actionLoading === t.id}
                          className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================== MANAGE USERS TAB ================== */}
        {tab === "users" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="flex space-x-2">
                {[
                  { value: "", label: "All Users" },
                  { value: "patient", label: "Patients" },
                  { value: "therapist", label: "Therapists" },
                ].map((f) => (
                  <button key={f.value} onClick={() => setUserRoleFilter(f.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      userRoleFilter === f.value ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white border border-gray-700"
                    }`}>
                    {f.label}
                  </button>
                ))}
              </div>
              <input
                type="text" placeholder="Search by name or email..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm flex-1 min-w-[200px]"
              />
            </div>

            {/* Users Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-750">
                    <tr className="border-b border-gray-700">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Profile</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-750 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {user.image ? (
                              <img src={user.image} alt="" className="w-9 h-9 rounded-full object-cover" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-sm">
                                {user.role === "patient" ? "🧑" : "🩺"}
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-white">{user.name || user.patientDetails?.fullName || user.therapistProfile?.fullName || "—"}</div>
                              <div className="text-xs text-gray-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                            user.role === "patient" ? "bg-blue-900 text-blue-200" : "bg-purple-900 text-purple-200"
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {user.isBanned ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-900 text-red-200">Banned</span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-900 text-green-200">Active</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs ${user.isProfileComplete ? "text-green-400" : "text-yellow-400"}`}>
                            {user.isProfileComplete ? "Complete" : "Incomplete"}
                          </span>
                          {user.therapistProfile && (
                            <span className={`ml-2 text-xs ${
                              user.therapistProfile.verificationStatus === "approved" ? "text-green-400" :
                              user.therapistProfile.verificationStatus === "rejected" ? "text-red-400" :
                              "text-yellow-400"
                            }`}>
                              ({user.therapistProfile.verificationStatus})
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {user.isBanned ? (
                              <button
                                onClick={() => handleUserAction(user.id, "unban")}
                                disabled={actionLoading === user.id}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                              >
                                Unban
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUserAction(user.id, "ban")}
                                disabled={actionLoading === user.id}
                                className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-xs font-medium hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                              >
                                Ban
                              </button>
                            )}
                            <button
                              onClick={() => handleUserAction(user.id, "delete")}
                              disabled={actionLoading === user.id}
                              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-500">No users found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-2">Reject Therapist</h3>
            <p className="text-gray-400 mb-4">Provide a reason for rejecting <strong>{rejectionModal.name}</strong>:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setRejectionModal(null); setRejectionReason(""); }}
                className="px-5 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleTherapistAction(rejectionModal.id, "reject", rejectionReason)}
                disabled={!rejectionReason.trim()}
                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
