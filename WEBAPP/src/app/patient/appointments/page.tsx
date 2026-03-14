"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Calendar,
  Clock,
  User,
  Plus,
  CheckCircle,
  XCircle,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  CalendarDays,
  Timer,
  Home,
  Play,
  Video,
  MessageSquare,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import ThemeToggle from "../../../components/ThemeToggle"

interface Therapist {
  id: string
  name: string
  email: string
}

interface AvailabilitySlot {
  id: string
  therapistId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isRecurring: boolean
  specificDate: string | null
  isBooked: boolean
  isActive: boolean
}

interface Appointment {
  id: string
  therapist: Therapist
  scheduledTime: string
  duration: number
  status: string
  type: string
  notes?: string
  slot?: AvailabilitySlot | null
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function PatientAppointmentsContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [bookingInProgress, setBookingInProgress] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null)
  const [showBooking, setShowBooking] = useState(false)
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1)

  const [bookingData, setBookingData] = useState({
    therapistId: "",
    selectedDate: "",
    selectedSlot: null as AvailabilitySlot | null,
    duration: 3600,
    type: "followup" as string,
    notes: "",
  })

  // Polling interval for real-time updates (every 30 seconds)
  const POLL_INTERVAL = 30000

  // Handle payment success/cancel from Stripe redirect
  useEffect(() => {
    const payment = searchParams.get("payment")
    const stripeSessionId = searchParams.get("session_id")

    if (payment === "success" && stripeSessionId) {
      // Verify payment and confirm appointment
      const verifyPayment = async () => {
        try {
          const res = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: stripeSessionId }),
          })
          if (res.ok) {
            setBookingSuccess("Payment successful! Your appointment has been confirmed.")
            // Refresh appointments list
            if (session?.user?.id) {
              const aptRes = await fetch(`/api/therapy/appointments?patientId=${session.user.id}`)
              if (aptRes.ok) {
                setAppointments(await aptRes.json())
              }
            }
          } else {
            setBookingSuccess("Payment received! Your appointment is being confirmed.")
          }
        } catch {
          setBookingSuccess("Payment received! Your appointment will be confirmed shortly.")
        }
      }
      verifyPayment()
      // Clean URL params
      router.replace("/patient/appointments")
    } else if (payment === "cancelled") {
      setBookingError("Payment was cancelled. You can try booking again.")
      router.replace("/patient/appointments")
    }
  }, [searchParams, session?.user?.id, router])

  useEffect(() => {
    if (status === "loading") return
    if (!session || (session.user as { role?: string })?.role !== "patient") {
      router.replace("/auth/signin")
    }
  }, [session, status, router])

  const fetchAppointments = useCallback(async () => {
    if (!session?.user?.id) return
    try {
      const res = await fetch(`/api/therapy/appointments?patientId=${session.user.id}`)
      if (res.ok) {
        const data = await res.json()
        setAppointments(data)
      }
    } catch (error) {
      console.error("Error fetching appointments:", error)
    }
  }, [session?.user?.id])

  // Initial data fetch
  useEffect(() => {
    if (!session?.user?.id) return

    const fetchData = async () => {
      try {
        setLoading(true)
        await fetchAppointments()

        const therapistsRes = await fetch("/api/therapy/therapists")
        if (therapistsRes.ok) {
          const therapistsData = await therapistsRes.json()
          setTherapists(therapistsData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session, fetchAppointments])

  // Real-time polling for appointment updates
  useEffect(() => {
    if (!session?.user?.id) return
    const interval = setInterval(fetchAppointments, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [session?.user?.id, fetchAppointments])

  // Fetch available slots when therapist + date are selected
  const fetchAvailableSlots = useCallback(async () => {
    if (!bookingData.therapistId || !bookingData.selectedDate) return

    setSlotsLoading(true)
    try {
      const res = await fetch(
        `/api/therapy/availability?therapistId=${bookingData.therapistId}&date=${bookingData.selectedDate}&availableOnly=true`
      )
      if (res.ok) {
        const slots = await res.json()
        setAvailableSlots(slots.filter((s: AvailabilitySlot) => !s.isBooked))
      }
    } catch (error) {
      console.error("Error fetching slots:", error)
    } finally {
      setSlotsLoading(false)
    }
  }, [bookingData.therapistId, bookingData.selectedDate])

  useEffect(() => {
    fetchAvailableSlots()
  }, [fetchAvailableSlots])

  // Auto-refresh slots every 15 seconds when viewing them
  useEffect(() => {
    if (bookingStep !== 2 || !bookingData.therapistId || !bookingData.selectedDate) return
    const interval = setInterval(fetchAvailableSlots, 15000)
    return () => clearInterval(interval)
  }, [bookingStep, bookingData.therapistId, bookingData.selectedDate, fetchAvailableSlots])

  const handleBookAppointment = async () => {
    if (!session?.user?.id || !bookingData.therapistId || !bookingData.selectedSlot) {
      setBookingError("Please select a therapist and time slot")
      return
    }

    setBookingInProgress(true)
    setBookingError(null)
    setBookingSuccess(null)

    const scheduledTime = `${bookingData.selectedDate}T${bookingData.selectedSlot.startTime}:00`
    const therapistName = therapists.find((t) => t.id === bookingData.therapistId)?.name || "Therapist"

    try {
      // Create Stripe Checkout Session
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          therapistId: bookingData.therapistId,
          therapistName,
          patientId: session.user.id,
          scheduledTime,
          duration: bookingData.duration,
          type: bookingData.type,
          notes: bookingData.notes,
          slotId: bookingData.selectedSlot.id,
        }),
      })

      if (res.ok) {
        const { url } = await res.json()
        if (url) {
          // Redirect to Stripe Checkout
          window.location.href = url
        } else {
          setBookingError("Failed to create payment session")
        }
      } else {
        const errorData = await res.json()
        setBookingError(errorData.error || "Failed to initiate payment")
      }
    } catch (error) {
      console.error("Error initiating payment:", error)
      setBookingError("Network error. Please try again.")
    } finally {
      setBookingInProgress(false)
    }
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return

    try {
      const res = await fetch(`/api/therapy/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      })

      if (res.ok) {
        const updated = await res.json()
        setAppointments((prev) =>
          prev.map((apt) => (apt.id === appointmentId ? { ...apt, status: updated.status } : apt))
        )
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error)
    }
  }

  const formatDateTime = (date: string) => new Date(date).toLocaleString()
  const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)} minutes`

  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split("T")[0]
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
    }
  }

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case "initial":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "emergency":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading appointments...</p>
        </div>
      </div>
    )
  }

  const upcomingAppointments = appointments
    .filter((apt) => new Date(apt.scheduledTime) > new Date() && apt.status !== "cancelled")
    .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())

  const pastAppointments = appointments
    .filter((apt) => new Date(apt.scheduledTime) <= new Date() || apt.status === "completed" || apt.status === "cancelled")
    .sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime())

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Header - matches main project theme */}
      <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">
                <Image className="h-12 w-12" src="/logo.png" alt="Logo" width={48} height={48} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">MindBridge</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Appointments</p>
              </div>
            </div>

            <nav className="flex items-center space-x-4">
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  href="/"
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
                <Link
                  href="/patient/dashboard"
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"
                >
                  Dashboard
                </Link>
                <Link
                  href="/patient/session"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors flex items-center"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Session
                </Link>
                <Link
                  href="/patient/virtual-session"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 transition-colors flex items-center"
                >
                  <Video className="mr-2 h-4 w-4" />
                  Virtual Session
                </Link>
                <Link
                  href="/peer-support"
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Peer Support Forums
                </Link>
              </div>

              <ThemeToggle />

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors border border-red-600 dark:border-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 hidden md:flex items-center"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </button>
            </nav>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 py-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <Link
                href="/"
                className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="inline mr-2 h-4 w-4" />
                Home
              </Link>
              <Link
                href="/patient/dashboard"
                className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/patient/session"
                className="block px-4 py-2 text-blue-600 dark:text-blue-400 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Play className="inline mr-2 h-4 w-4" />
                Start Session
              </Link>
              <Link
                href="/patient/virtual-session"
                className="block px-4 py-2 text-purple-600 dark:text-purple-400 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Video className="inline mr-2 h-4 w-4" />
                Virtual Session
              </Link>
              <Link
                href="/peer-support"
                className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <MessageSquare className="inline mr-2 h-4 w-4" />
                Peer Support Forums
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="block w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              >
                <LogOut className="inline mr-2 h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/patient/dashboard"
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Appointments</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Book and manage your therapy sessions
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowBooking(!showBooking)
              setBookingStep(1)
              setBookingError(null)
              setBookingSuccess(null)
            }}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            <span>Book Appointment</span>
          </button>
        </div>

        {/* Success message */}
        {bookingSuccess && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <p className="text-green-800 dark:text-green-200">{bookingSuccess}</p>
            <button onClick={() => setBookingSuccess(null)} className="ml-auto text-green-600 hover:text-green-800" title="Dismiss">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Slot-Based Booking Form */}
        {showBooking && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
            {/* Progress steps */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                        bookingStep >= step
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {step}
                    </div>
                    <span
                      className={`ml-2 text-sm font-medium hidden sm:inline ${
                        bookingStep >= step ? "text-blue-600 dark:text-blue-400" : "text-gray-400"
                      }`}
                    >
                      {step === 1 ? "Select Therapist" : step === 2 ? "Pick Time Slot" : "Confirm & Pay"}
                    </span>
                    {step < 3 && (
                      <div
                        className={`w-8 h-0.5 mx-2 ${
                          bookingStep > step ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1: Select Therapist & Date */}
            {bookingStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Choose Your Therapist & Date
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <User className="inline h-4 w-4 mr-1" />
                      Select Therapist
                    </label>
                    <select
                      value={bookingData.therapistId}
                      onChange={(e) =>
                        setBookingData({ ...bookingData, therapistId: e.target.value, selectedSlot: null })
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      title="Select a therapist"
                      required
                    >
                      <option value="">Select a therapist...</option>
                      {therapists.map((therapist) => (
                        <option key={therapist.id} value={therapist.id}>
                          {therapist.name || therapist.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <CalendarDays className="inline h-4 w-4 mr-1" />
                      Select Date
                    </label>
                    <input
                      type="date"
                      min={getMinDate()}
                      value={bookingData.selectedDate}
                      onChange={(e) =>
                        setBookingData({ ...bookingData, selectedDate: e.target.value, selectedSlot: null })
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Session Type
                    </label>
                    <select
                      value={bookingData.type}
                      onChange={(e) => setBookingData({ ...bookingData, type: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      title="Select session type"
                    >
                      <option value="initial">Initial Consultation</option>
                      <option value="followup">Follow-up Session</option>
                      <option value="emergency">Emergency Session</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Timer className="inline h-4 w-4 mr-1" />
                      Duration
                    </label>
                    <select
                      value={bookingData.duration}
                      onChange={(e) =>
                        setBookingData({ ...bookingData, duration: parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      title="Select duration"
                    >
                      <option value={1800}>30 minutes</option>
                      <option value={3600}>1 hour</option>
                      <option value={5400}>1.5 hours</option>
                      <option value={7200}>2 hours</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    disabled={!bookingData.therapistId || !bookingData.selectedDate}
                    onClick={() => setBookingStep(2)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Pick Time Slot →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Select Available Slot */}
            {bookingStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Available Time Slots for{" "}
                    {new Date(bookingData.selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </h2>
                  <button
                    onClick={fetchAvailableSlots}
                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800"
                  >
                    <RefreshCw className={`h-4 w-4 ${slotsLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Slots update automatically every 15 seconds. Select an available time slot.
                </p>

                {slotsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-500">Loading available slots...</p>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setBookingData({ ...bookingData, selectedSlot: slot })}
                        className={`p-4 border-2 rounded-xl text-center transition-all duration-200 ${
                          bookingData.selectedSlot?.id === slot.id
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 shadow-lg scale-105"
                            : "border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md"
                        }`}
                      >
                        <Clock className={`h-5 w-5 mx-auto mb-2 ${
                          bookingData.selectedSlot?.id === slot.id
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-400"
                        }`} />
                        <div className={`font-bold text-lg ${
                          bookingData.selectedSlot?.id === slot.id
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-900 dark:text-white"
                        }`}>
                          {slot.startTime}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          to {slot.endTime}
                        </div>
                        {bookingData.selectedSlot?.id === slot.id && (
                          <div className="mt-2">
                            <CheckCircle className="h-4 w-4 text-blue-600 mx-auto" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                      No available slots for this date
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      Try selecting a different date or therapist
                    </p>
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    onClick={() => setBookingStep(1)}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    disabled={!bookingData.selectedSlot}
                    onClick={() => setBookingStep(3)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Confirm →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Confirm & Pay */}
            {bookingStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Confirm & Pay</h2>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Therapist</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {therapists.find((t) => t.id === bookingData.therapistId)?.name || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {new Date(bookingData.selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Time</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {bookingData.selectedSlot?.startTime} – {bookingData.selectedSlot?.endTime}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatDuration(bookingData.duration)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Session Type</p>
                      <p className="font-semibold text-gray-900 dark:text-white capitalize">
                        {bookingData.type === "followup" ? "Follow-up" : bookingData.type}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                      <p className="font-bold text-2xl text-green-700 dark:text-green-400">
                        ${bookingData.duration === 1800 ? "25.00" : bookingData.duration === 3600 ? "50.00" : bookingData.duration === 5400 ? "70.00" : "90.00"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={bookingData.notes}
                    onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Any specific topics or concerns you'd like to discuss..."
                  />
                </div>

                {/* Payment info card */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 flex items-start gap-3">
                  <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Secure Payment via Stripe</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                      You&apos;ll be redirected to Stripe&apos;s secure checkout to complete payment. Your appointment will be confirmed automatically after successful payment.
                    </p>
                  </div>
                </div>

                {bookingError && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <p className="text-red-800 dark:text-red-200">{bookingError}</p>
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    onClick={() => {
                      setBookingStep(2)
                      setBookingError(null)
                    }}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    disabled={bookingInProgress}
                    onClick={handleBookAppointment}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    {bookingInProgress ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Redirecting to Payment...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                          <line x1="1" y1="10" x2="23" y2="10" />
                        </svg>
                        Pay & Confirm Booking
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upcoming Appointments */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Upcoming Appointments ({upcomingAppointments.length})
          </h2>

          <div className="space-y-4">
            {upcomingAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                      <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {appointment.therapist?.name || "Therapist"}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {appointment.therapist?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {appointment.type && (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeBadgeClass(appointment.type)}`}>
                        {appointment.type === "followup" ? "Follow-up" : appointment.type}
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(appointment.status)}`}>
                      {appointment.status}
                    </span>
                    {appointment.status === "pending" && (
                      <button
                        onClick={() => handleCancelAppointment(appointment.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Cancel appointment"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    )}
                    {appointment.status === "confirmed" && (
                      <span className="text-xs text-muted-foreground italic">Contact therapist to cancel</span>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDateTime(appointment.scheduledTime)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(appointment.duration)}</span>
                  </div>
                  {appointment.slot && (
                    <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs">Slot-based booking</span>
                    </div>
                  )}
                </div>

                {appointment.notes && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{appointment.notes}</p>
                  </div>
                )}
              </div>
            ))}

            {upcomingAppointments.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <Calendar className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">No upcoming appointments</p>
                <button
                  onClick={() => {
                    setShowBooking(true)
                    setBookingStep(1)
                  }}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Book an Appointment
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-gray-400" />
              Past Appointments ({pastAppointments.length})
            </h2>
            <div className="space-y-3">
              {pastAppointments.slice(0, 10).map((appointment) => (
                <div
                  key={appointment.id}
                  className="bg-white/80 dark:bg-gray-800/80 rounded-xl shadow p-4 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full">
                        <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {appointment.therapist?.name || "Therapist"}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDateTime(appointment.scheduledTime)} · {formatDuration(appointment.duration)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PatientAppointments() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading appointments...</p>
        </div>
      </div>
    }>
      <PatientAppointmentsContent />
    </Suspense>
  )
}
