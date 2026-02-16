"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  CalendarIcon,
  Clock,
  Plus,
  Eye,
  Edit,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Filter,
  Search,
  CalendarDays,
  Timer,
  Settings,
  Trash2,
  RefreshCw,
} from "lucide-react"
import ThemeToggle from "../../../components/ThemeToggle"
import MobileNavigation from "../../../components/MobileNavigation"

interface AppointmentData {
  id: string
  patientId: string
  patient: { id: string; name: string; email: string }
  therapist: { id: string; name: string; email: string }
  scheduledTime: string
  duration: number
  status: "pending" | "confirmed" | "cancelled" | "completed"
  type: string
  notes?: string
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

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const ScheduleManagement: React.FC = () => {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return
    if (!session || (session.user as { role?: string })?.role !== "therapist") {
      router.replace("/auth/signin")
    }
  }, [session, status, router])

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [appointments, setAppointments] = useState<AppointmentData[]>([])
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // New slot form state
  const [newSlot, setNewSlot] = useState({
    dayOfWeek: "1",
    startTime: "09:00",
    endTime: "10:00",
    isRecurring: true,
  })
  const [slotError, setSlotError] = useState<string | null>(null)
  const [slotSuccess, setSlotSuccess] = useState<string | null>(null)

  // Fetch appointments from API
  const fetchAppointments = useCallback(async () => {
    if (!session?.user?.id) return
    try {
      const res = await fetch(`/api/therapy/appointments?therapistId=${session.user.id}`)
      if (res.ok) {
        const data = await res.json()
        setAppointments(data)
      }
    } catch (error) {
      console.error("Error fetching appointments:", error)
    }
  }, [session?.user?.id])

  // Fetch availability slots from API
  const fetchAvailability = useCallback(async () => {
    if (!session?.user?.id) return
    setSlotsLoading(true)
    try {
      const res = await fetch(`/api/therapy/availability?therapistId=${session.user.id}`)
      if (res.ok) {
        const data = await res.json()
        setAvailabilitySlots(data)
      }
    } catch (error) {
      console.error("Error fetching availability:", error)
    } finally {
      setSlotsLoading(false)
    }
  }, [session?.user?.id])

  // Initial data fetch
  useEffect(() => {
    if (!session?.user?.id) return
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchAppointments(), fetchAvailability()])
      setLoading(false)
    }
    loadData()
  }, [session?.user?.id, fetchAppointments, fetchAvailability])

  // Poll for new appointments every 30 seconds
  useEffect(() => {
    if (!session?.user?.id) return
    const interval = setInterval(fetchAppointments, 30000)
    return () => clearInterval(interval)
  }, [session?.user?.id, fetchAppointments])

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString() + " " + new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatTime = (date: string): string => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    return `${minutes} min`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "completed": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default: return "bg-secondary text-secondary-foreground"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "initial": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "followup": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "emergency": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default: return "bg-secondary text-secondary-foreground"
    }
  }

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      (appointment.patient?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (appointment.patient?.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      const res = await fetch(`/api/therapy/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      })
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((apt) => (apt.id === appointmentId ? { ...apt, status: "confirmed" } : apt))
        )
      }
    } catch (error) {
      console.error("Error confirming appointment:", error)
    }
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const res = await fetch(`/api/therapy/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      })
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((apt) => (apt.id === appointmentId ? { ...apt, status: "cancelled" } : apt))
        )
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error)
    }
  }

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      const res = await fetch(`/api/therapy/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      })
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((apt) => (apt.id === appointmentId ? { ...apt, status: "completed" } : apt))
        )
      }
    } catch (error) {
      console.error("Error completing appointment:", error)
    }
  }

  // Availability management
  const handleAddSlot = async () => {
    setSlotError(null)
    setSlotSuccess(null)

    try {
      const res = await fetch("/api/therapy/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek: parseInt(newSlot.dayOfWeek),
          startTime: newSlot.startTime,
          endTime: newSlot.endTime,
          isRecurring: newSlot.isRecurring,
        }),
      })

      if (res.ok) {
        const slot = await res.json()
        setAvailabilitySlots((prev) => [...prev, slot])
        setSlotSuccess(`Slot added: ${DAY_NAMES[parseInt(newSlot.dayOfWeek)]} ${newSlot.startTime}-${newSlot.endTime}`)
        setNewSlot({ dayOfWeek: "1", startTime: "09:00", endTime: "10:00", isRecurring: true })
      } else {
        const error = await res.json()
        setSlotError(error.error || "Failed to add slot")
      }
    } catch (error) {
      console.error("Error adding slot:", error)
      setSlotError("Network error. Please try again.")
    }
  }

  const handleBulkAddSlots = async () => {
    setSlotError(null)
    setSlotSuccess(null)

    // Generate standard business hours for weekdays
    const slots = []
    for (let day = 1; day <= 5; day++) { // Mon-Fri
      const hours = [
        { start: "09:00", end: "10:00" },
        { start: "10:00", end: "11:00" },
        { start: "11:00", end: "12:00" },
        { start: "14:00", end: "15:00" },
        { start: "15:00", end: "16:00" },
        { start: "16:00", end: "17:00" },
      ]
      for (const h of hours) {
        slots.push({
          dayOfWeek: day,
          startTime: h.start,
          endTime: h.end,
          isRecurring: true,
        })
      }
    }

    try {
      const res = await fetch("/api/therapy/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slots),
      })

      if (res.ok) {
        const newSlots = await res.json()
        setAvailabilitySlots((prev) => [...prev, ...newSlots])
        setSlotSuccess(`Added ${newSlots.length} slots for standard business hours (Mon-Fri, 9AM-5PM)`)
      } else {
        const error = await res.json()
        setSlotError(error.error || "Failed to add slots")
      }
    } catch (error) {
      console.error("Error adding bulk slots:", error)
      setSlotError("Network error. Please try again.")
    }
  }

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const res = await fetch(`/api/therapy/availability/${slotId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setAvailabilitySlots((prev) => prev.filter((s) => s.id !== slotId))
      }
    } catch (error) {
      console.error("Error deleting slot:", error)
    }
  }

  const handleToggleSlot = async (slotId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/therapy/availability/${slotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (res.ok) {
        setAvailabilitySlots((prev) =>
          prev.map((s) => (s.id === slotId ? { ...s, isActive: !isActive } : s))
        )
      }
    } catch (error) {
      console.error("Error toggling slot:", error)
    }
  }

  const todayAppointments = appointments.filter((apt) => {
    const today = new Date()
    const aptDate = new Date(apt.scheduledTime)
    return aptDate.toDateString() === today.toDateString()
  })

  const upcomingAppointments = appointments.filter((apt) => {
    const now = new Date()
    return new Date(apt.scheduledTime) > now && apt.status !== "cancelled"
  })

  const stats = {
    totalAppointments: appointments.length,
    todayAppointments: todayAppointments.length,
    pendingAppointments: appointments.filter((apt) => apt.status === "pending").length,
    confirmedAppointments: appointments.filter((apt) => apt.status === "confirmed").length,
    totalSlots: availabilitySlots.filter((s) => s.isActive).length,
  }

  // Group slots by day
  const slotsByDay = DAY_NAMES.reduce((acc, day, index) => {
    acc[index] = availabilitySlots.filter((s) => s.dayOfWeek === index && s.isActive)
    return acc
  }, {} as Record<number, AvailabilitySlot[]>)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading schedule...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/therapist/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Schedule Management</h1>
                  <p className="text-muted-foreground">Manage appointments and availability</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={() => { fetchAppointments(); fetchAvailability(); }}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <MobileNavigation />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">All Appointments</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>

          {/* ===== OVERVIEW TAB ===== */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalAppointments}</div>
                  <p className="text-xs text-muted-foreground">All scheduled appointments</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todayAppointments}</div>
                  <p className="text-xs text-muted-foreground">Appointments today</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingAppointments}</div>
                  <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.confirmedAppointments}</div>
                  <p className="text-xs text-muted-foreground">Ready to go</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Slots</CardTitle>
                  <Timer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSlots}</div>
                  <p className="text-xs text-muted-foreground">Available time slots</p>
                </CardContent>
              </Card>
            </div>

            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Today&apos;s Schedule</CardTitle>
                <CardDescription>Your appointments for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayAppointments.length > 0 ? (
                    todayAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarFallback>
                              {(appointment.patient?.name || "?")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{appointment.patient?.name || "Unknown"}</div>
                            <div className="text-sm text-muted-foreground">{appointment.patient?.email}</div>
                            {appointment.notes && (
                              <div className="text-xs text-muted-foreground mt-1">{appointment.notes}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="font-medium">{formatTime(appointment.scheduledTime)}</div>
                            <div className="text-sm text-muted-foreground">{formatDuration(appointment.duration)}</div>
                          </div>
                          <Badge className={getTypeColor(appointment.type)}>{appointment.type}</Badge>
                          <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                          {appointment.status === "pending" && (
                            <div className="flex space-x-1">
                              <Button size="sm" variant="default" onClick={() => handleConfirmAppointment(appointment.id)}>
                                <UserCheck className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleCancelAppointment(appointment.id)}>
                                <AlertCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {appointment.status === "confirmed" && (
                            <Button size="sm" variant="outline" onClick={() => handleCompleteAppointment(appointment.id)}>
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4" />
                      <p>No appointments scheduled for today</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Appointments */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>Next 5 upcoming appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.slice(0, 5).map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarFallback>
                              {(appointment.patient?.name || "?")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{appointment.patient?.name || "Unknown"}</div>
                            <div className="text-sm text-muted-foreground">{formatDate(appointment.scheduledTime)}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge className={getTypeColor(appointment.type)}>{appointment.type}</Badge>
                          <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                          {appointment.status === "pending" && (
                            <div className="flex space-x-1">
                              <Button size="sm" variant="default" onClick={() => handleConfirmAppointment(appointment.id)}>
                                <UserCheck className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleCancelAppointment(appointment.id)}>
                                <AlertCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4" />
                      <p>No upcoming appointments</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== ALL APPOINTMENTS TAB ===== */}
          <TabsContent value="appointments" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search patients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Appointments ({filteredAppointments.length})</CardTitle>
                <CardDescription>Complete list of all scheduled appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredAppointments.length > 0 ? (
                    filteredAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarFallback>
                              {(appointment.patient?.name || "?")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{appointment.patient?.name || "Unknown"}</div>
                            <div className="text-sm text-muted-foreground">{appointment.patient?.email}</div>
                            <div className="text-sm text-muted-foreground">{formatDate(appointment.scheduledTime)}</div>
                            {appointment.notes && (
                              <div className="text-xs text-muted-foreground mt-1">{appointment.notes}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-sm font-medium">{formatDuration(appointment.duration)}</div>
                          </div>
                          <Badge className={getTypeColor(appointment.type)}>{appointment.type}</Badge>
                          <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                          <div className="flex space-x-1">
                            {appointment.status === "pending" && (
                              <>
                                <Button size="sm" variant="default" onClick={() => handleConfirmAppointment(appointment.id)}>
                                  <UserCheck className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleCancelAppointment(appointment.id)}>
                                  <AlertCircle className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                            {appointment.status === "confirmed" && (
                              <Button size="sm" variant="outline" onClick={() => handleCompleteAppointment(appointment.id)}>
                                <CheckCircle2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4" />
                      <p>No appointments match your filters</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== CALENDAR VIEW TAB ===== */}
          <TabsContent value="calendar" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Calendar</CardTitle>
                  <CardDescription>Select a date to view appointments</CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rounded-md" />
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>
                    {selectedDate ? `Appointments for ${selectedDate.toDateString()}` : "Select a date"}
                  </CardTitle>
                  <CardDescription>View and manage appointments for the selected date</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedDate ? (
                    <div className="space-y-4">
                      {appointments
                        .filter((apt) => {
                          const aptDate = new Date(apt.scheduledTime)
                          return aptDate.toDateString() === selectedDate.toDateString()
                        })
                        .map((appointment) => (
                          <div
                            key={appointment.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center space-x-4">
                              <Avatar>
                                <AvatarFallback>
                                  {(appointment.patient?.name || "?")
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{appointment.patient?.name || "Unknown"}</div>
                                <div className="text-sm text-muted-foreground">
                                  {formatTime(appointment.scheduledTime)} • {formatDuration(appointment.duration)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getTypeColor(appointment.type)}>{appointment.type}</Badge>
                              <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                              {appointment.status === "pending" && (
                                <div className="flex space-x-1">
                                  <Button size="sm" variant="default" onClick={() => handleConfirmAppointment(appointment.id)}>
                                    <UserCheck className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleCancelAppointment(appointment.id)}>
                                    <AlertCircle className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      {appointments.filter((apt) => {
                        const aptDate = new Date(apt.scheduledTime)
                        return aptDate.toDateString() === selectedDate.toDateString()
                      }).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <CalendarIcon className="h-12 w-12 mx-auto mb-4" />
                          <p>No appointments scheduled for this date</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4" />
                      <p>Select a date from the calendar to view appointments</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== AVAILABILITY TAB ===== */}
          <TabsContent value="availability" className="space-y-6">
            {/* Add New Slot */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="mr-2 h-5 w-5" />
                  Add Availability Slot
                </CardTitle>
                <CardDescription>Define when you are available for appointments</CardDescription>
              </CardHeader>
              <CardContent>
                {slotError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {slotError}
                  </div>
                )}
                {slotSuccess && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-200 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    {slotSuccess}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div>
                    <Label htmlFor="day-of-week">Day of Week</Label>
                    <Select value={newSlot.dayOfWeek} onValueChange={(v) => setNewSlot((p) => ({ ...p, dayOfWeek: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAY_NAMES.map((day, i) => (
                          <SelectItem key={i} value={String(i)}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={newSlot.startTime}
                      onChange={(e) => setNewSlot((p) => ({ ...p, startTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time">End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={newSlot.endTime}
                      onChange={(e) => setNewSlot((p) => ({ ...p, endTime: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is-recurring"
                      checked={newSlot.isRecurring}
                      onChange={(e) => setNewSlot((p) => ({ ...p, isRecurring: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="is-recurring">Recurring weekly</Label>
                  </div>
                  <Button onClick={handleAddSlot}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Slot
                  </Button>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" onClick={handleBulkAddSlots}>
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Auto-fill Business Hours (Mon-Fri, 9AM-5PM)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Availability */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Weekly Availability
                </CardTitle>
                <CardDescription>
                  {slotsLoading ? "Loading..." : `${availabilitySlots.filter((s) => s.isActive).length} active slots configured`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {slotsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading availability...</p>
                  </div>
                ) : availabilitySlots.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Timer className="h-12 w-12 mx-auto mb-4" />
                    <p className="font-medium">No availability slots configured</p>
                    <p className="text-sm mt-1">Add time slots above or use the auto-fill button to get started quickly.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {DAY_NAMES.map((dayName, dayIndex) => {
                      const daySlots = slotsByDay[dayIndex] || []
                      if (daySlots.length === 0) return null
                      return (
                        <div key={dayIndex}>
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            {dayName}
                            <Badge variant="secondary">{daySlots.length} slots</Badge>
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                            {daySlots
                              .sort((a, b) => a.startTime.localeCompare(b.startTime))
                              .map((slot) => (
                                <div
                                  key={slot.id}
                                  className={`p-3 border rounded-lg text-center transition-colors relative group ${
                                    slot.isBooked
                                      ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200"
                                      : slot.isActive
                                        ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200"
                                        : "bg-muted border-muted-foreground/20 text-muted-foreground"
                                  }`}
                                >
                                  <div className="font-medium text-sm">
                                    {slot.startTime} - {slot.endTime}
                                  </div>
                                  <div className="text-xs mt-1">
                                    {slot.isBooked ? "Booked" : slot.isActive ? "Available" : "Inactive"}
                                  </div>
                                  {slot.isRecurring && (
                                    <div className="text-xs mt-0.5 opacity-60">
                                      <RefreshCw className="h-3 w-3 inline" /> Recurring
                                    </div>
                                  )}
                                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button
                                      onClick={() => handleToggleSlot(slot.id, slot.isActive)}
                                      className="p-1 rounded hover:bg-background/80"
                                      title={slot.isActive ? "Deactivate" : "Activate"}
                                    >
                                      {slot.isActive ? (
                                        <Eye className="h-3 w-3" />
                                      ) : (
                                        <CheckCircle2 className="h-3 w-3" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSlot(slot.id)}
                                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600"
                                      title="Delete slot"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default ScheduleManagement
