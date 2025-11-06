"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Calendar, Clock, User, Plus, CheckCircle, XCircle } from "lucide-react"

interface Therapist {
  id: string
  name: string
  email: string
}

interface Appointment {
  id: string
  therapist: Therapist
  scheduledTime: string
  duration: number
  status: string
  notes?: string
}

export default function PatientAppointments() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [loading, setLoading] = useState(true)
  const [showBooking, setShowBooking] = useState(false)
  const [bookingData, setBookingData] = useState({
    therapistId: "",
    scheduledTime: "",
    duration: 3600,
    notes: ""
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session || (session.user as { role?: string })?.role !== "patient") {
      router.replace("/auth/signin")
    }
  }, [session, status, router])

  useEffect(() => {
    if (!session?.user?.id) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const patientId = session.user.id

        // Fetch patient's appointments
        const res = await fetch(`/api/therapy/appointments?patientId=${patientId}`)
        const data = await res.json()
        setAppointments(data)

        // Fetch available therapists
        const therapistsRes = await fetch("/api/therapy/therapists")
        if (therapistsRes.ok) {
          const therapistsData = await therapistsRes.json()
          setTherapists(therapistsData)
        }
      } catch (error) {
        console.error("Error fetching appointments:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session])

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user?.id || !bookingData.therapistId || !bookingData.scheduledTime) {
      alert("Please fill in all required fields")
      return
    }

    try {
      const res = await fetch("/api/therapy/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          therapistId: bookingData.therapistId,
          patientId: session.user.id,
          scheduledTime: bookingData.scheduledTime,
          duration: bookingData.duration,
          notes: bookingData.notes
        })
      })

      if (res.ok) {
        const newAppointment = await res.json()
        setAppointments([...appointments, newAppointment])
        setShowBooking(false)
        setBookingData({ therapistId: "", scheduledTime: "", duration: 3600, notes: "" })
        alert("Appointment booked successfully!")
      }
    } catch (error) {
      console.error("Error booking appointment:", error)
      alert("Failed to book appointment")
    }
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return

    try {
      const res = await fetch(`/api/therapy/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" })
      })

      if (res.ok) {
        const updated = await res.json()
        setAppointments(appointments.map(apt => 
          apt.id === appointmentId ? { ...apt, status: updated.status } : apt
        ))
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error)
    }
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString()
  }

  const formatDuration = (seconds: number) => {
    return `${Math.floor(seconds / 60)} minutes`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Appointments</h1>
          <button
            onClick={() => setShowBooking(!showBooking)}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Book Appointment</span>
          </button>
        </div>

        {showBooking && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Book New Appointment</h2>
            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Therapist
                </label>
                <select
                  value={bookingData.therapistId}
                  onChange={(e) => setBookingData({ ...bookingData, therapistId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  title="Select a therapist for your appointment"
                  required
                >
                  <option value="">Select a therapist...</option>
                  {therapists.map((therapist) => (
                    <option key={therapist.id} value={therapist.id}>
                      {therapist.name} - {therapist.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date and Time
                </label>
                <input
                  type="datetime-local"
                  value={bookingData.scheduledTime}
                  onChange={(e) => setBookingData({ ...bookingData, scheduledTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration
                </label>
                <select
                  value={bookingData.duration}
                  onChange={(e) => setBookingData({ ...bookingData, duration: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  title="Select appointment duration"
                >
                  <option value={1800}>30 minutes</option>
                  <option value={3600}>1 hour</option>
                  <option value={5400}>1.5 hours</option>
                  <option value={7200}>2 hours</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Any specific topics or concerns you'd like to discuss..."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Book Appointment
                </button>
                <button
                  type="button"
                  onClick={() => setShowBooking(false)}
                  className="flex-1 px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                    <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {appointment.therapist.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">{appointment.therapist.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`status-badge ${
                    appointment.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  } px-3 py-1 rounded-full text-sm font-medium`}>
                    {appointment.status}
                  </div>
                  {appointment.status === 'pending' && (
                    <button
                      onClick={() => handleCancelAppointment(appointment.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                      title="Cancel appointment"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDateTime(appointment.scheduledTime)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(appointment.duration)}</span>
                </div>
              </div>
              
              {appointment.notes && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{appointment.notes}</p>
                </div>
              )}
            </div>
          ))}

          {appointments.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
              <Calendar className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No appointments yet. Book your first appointment!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
