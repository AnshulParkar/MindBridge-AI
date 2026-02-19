"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "../../../components/ThemeToggle";

export default function CompleteProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = session?.user?.role;
  const userId = session?.user?.id;

  // If no session, redirect to signin
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Route to appropriate form
  if (role === "therapist") {
    return <TherapistProfileForm userId={userId || ""} />;
  }
  return <PatientProfileForm userId={userId || ""} />;
}

// ========================
// PATIENT PROFILE FORM
// ========================
function PatientProfileForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "", dateOfBirth: "", gender: "", age: "",
    height: "", weight: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.fullName || !form.dateOfBirth || !form.gender || !form.age) {
      setError("Please fill all required fields");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/complete-profile/patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          fullName: form.fullName,
          dateOfBirth: form.dateOfBirth,
          gender: form.gender,
          age: parseInt(form.age),
          height: form.height || undefined,
          weight: form.weight || undefined,
        }),
      });
      if (res.ok) {
        router.push("/patient/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save profile");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="text-3xl"><Image className="h-12 w-12" src="/logo.png" alt="Logo" width={48} height={48} /></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">MindBridge</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Complete Your Profile</p>
              </div>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border dark:border-gray-700 transition-colors duration-300">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">👤</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Patient Registration</h2>
            <p className="text-gray-600 dark:text-gray-300">Tell us about yourself to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
              <input name="fullName" type="text" placeholder="Your full name" value={form.fullName} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth *</label>
                <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age *</label>
                <input name="age" type="number" placeholder="Age" value={form.age} onChange={handleChange} required min="1" max="150"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>

            <div>
              <label htmlFor="patient-gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender *</label>
              <select id="patient-gender" name="gender" value={form.gender} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-Binary</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Height <span className="text-gray-400">(Optional)</span></label>
                <input name="height" type="text" placeholder="e.g. 5'8&quot; or 173cm" value={form.height} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weight <span className="text-gray-400">(Optional)</span></label>
                <input name="weight" type="text" placeholder="e.g. 70kg" value={form.weight} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>

            {error && <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-3"><p className="text-red-700 dark:text-red-200 text-sm">{error}</p></div>}

            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center">
              {isLoading ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />Saving...</> : "Complete Registration"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

// ========================
// THERAPIST PROFILE FORM
// ========================
function TherapistProfileForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "", dateOfBirth: "", gender: "", age: "",
    degree: "", experience: "", hospitalAffiliation: "",
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string>("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be less than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPhotoPreview(base64);
      setPhotoBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.fullName || !form.dateOfBirth || !form.gender || !form.age || !form.degree || !form.experience || !form.hospitalAffiliation) {
      setError("Please fill all required fields");
      return;
    }
    if (!photoBase64) {
      setError("Doctor photo is compulsory");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/complete-profile/therapist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          fullName: form.fullName,
          dateOfBirth: form.dateOfBirth,
          gender: form.gender,
          age: parseInt(form.age),
          degree: form.degree,
          experience: form.experience,
          hospitalAffiliation: form.hospitalAffiliation,
          photoUrl: photoBase64,
        }),
      });
      if (res.ok) {
        router.push("/auth/verification-pending");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save profile");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="text-3xl"><Image className="h-12 w-12" src="/logo.png" alt="Logo" width={48} height={48} /></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">MindBridge</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Therapist Registration</p>
              </div>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border dark:border-gray-700 transition-colors duration-300">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🩺</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Therapist Profile</h2>
            <p className="text-gray-600 dark:text-gray-300">Complete your professional profile for verification</p>
            <div className="mt-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                Your profile will be reviewed by an admin. You will be notified once approved.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Photo Upload */}
            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Doctor Photo * (Compulsory)</label>
              <div className="flex flex-col items-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-32 h-32 rounded-full object-cover border-4 border-green-500 mb-3" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mb-3">
                    <span className="text-4xl text-gray-400">📷</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handlePhotoChange}
                  className="text-sm text-gray-600 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-600 file:text-white hover:file:bg-green-700" />
              </div>
            </div>

            {/* Basic Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
              <input name="fullName" type="text" placeholder="Dr. Full Name" value={form.fullName} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth *</label>
                <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age *</label>
                <input name="age" type="number" placeholder="Age" value={form.age} onChange={handleChange} required min="18" max="100"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500" />
              </div>
              <div>
                <label htmlFor="therapist-gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender *</label>
                <select id="therapist-gender" name="gender" value={form.gender} onChange={handleChange} required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500">
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Professional Info */}
            <div className="border-t pt-5 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Professional Details</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Degree / Qualification *</label>
              <input name="degree" type="text" placeholder="e.g. MD Psychiatry, PhD Clinical Psychology" value={form.degree} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Experience *</label>
              <input name="experience" type="text" placeholder="e.g. 5 years in clinical practice" value={form.experience} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hospital Affiliation / LOR *</label>
              <textarea name="hospitalAffiliation" placeholder="List hospitals you have worked at, letters of recommendation details..." value={form.hospitalAffiliation} onChange={handleChange} required rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500" />
            </div>

            {error && <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-3"><p className="text-red-700 dark:text-red-200 text-sm">{error}</p></div>}

            <button type="submit" disabled={isLoading} className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center">
              {isLoading ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />Submitting...</> : "Submit for Verification"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
