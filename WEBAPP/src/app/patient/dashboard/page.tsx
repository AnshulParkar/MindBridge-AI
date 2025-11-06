"use client"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Brain,
  Calendar,
  Clock,
  TrendingUp,
  Activity,
  BarChart3,
  Target,
  Settings,
  LogOut,
  Play,
  Eye,
  Download,
  AlertCircle,
  CheckCircle2,
  Menu,
  X,
  Home,
  MessageSquare,
} from "lucide-react"
import ThemeToggle from "../../../components/ThemeToggle"
import SessionManager from "../../../lib/sessionManager"
import SessionStatus from "../../../components/SessionStatus"

interface SessionData {
  id: string
  userId: string
  startTime: Date
  duration: number
  emotionsSummary: Record<string, number>
  messageCount: number
  status: "active" | "completed"
}

const Dashboard: React.FC = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sessionInfo, setSessionInfo] = useState({
    timeRemaining: "",
    expiringSoon: false,
    isIncognito: false,
  })

  useEffect(() => {
    if (status === "loading") return
  if (!session || (session.user as { role?: string })?.role !== "patient") {
      router.replace("/auth/signin")
    }
  }, [session, status, router])

  // Setup session monitoring
  useEffect(() => {
    if (session) {
      SessionManager.setupSessionHandlers()

      const updateSessionInfo = async () => {
        const timeRemaining = SessionManager.getSessionTimeRemaining(session)
        const expiringSoon = SessionManager.isSessionExpiringSoon(session)
        const isIncognito = await SessionManager.isIncognitoMode()

        setSessionInfo({
          timeRemaining,
          expiringSoon,
          isIncognito,
        })
      }

      updateSessionInfo()
      const interval = setInterval(updateSessionInfo, 60000)
      return () => clearInterval(interval)
    }
  }, [session])

  const [sessions, setSessions] = useState<SessionData[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalDuration: 0,
    dominantEmotion: "neutral",
    weeklyProgress: 0,
    weeklyGoal: 5,
    streakDays: 7,
    improvementScore: 85,
  })

  // Fetch dynamic data from API
  useEffect(() => {
    if (!session?.user?.id) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const patientId = session.user.id

        // Fetch patient's therapy sessions
        const sessionsRes = await fetch(`/api/therapy/sessions?patientId=${patientId}`)
        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json()
          
          // Transform data to match interface
          const transformedSessions = sessionsData.map((s: any) => ({
            id: s.id,
            userId: s.patientId,
            startTime: new Date(s.startTime),
            duration: s.duration,
            emotionsSummary: s.emotionsSummary || {},
            messageCount: s.messageCount,
            status: s.status,
          }))

          setSessions(transformedSessions)

          // Calculate stats from real data
          const completed = transformedSessions.filter((s: any) => s.status === "completed")
          const totalDuration = completed.reduce((sum: number, s: any) => sum + s.duration, 0)
          
          // Calculate dominant emotion across all sessions
          const allEmotions: Record<string, number> = {}
          completed.forEach((s: any) => {
            Object.entries(s.emotionsSummary || {}).forEach(([emotion, count]) => {
              allEmotions[emotion] = (allEmotions[emotion] || 0) + (count as number)
            })
          })
          const dominantEmotion = Object.keys(allEmotions).length > 0
            ? Object.entries(allEmotions).sort(([, a], [, b]) => (b as number) - (a as number))[0][0]
            : "neutral"

          // Calculate weekly progress
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          const weeklyProgress = transformedSessions.filter(
            (s: any) => new Date(s.startTime) > oneWeekAgo && s.status === "completed"
          ).length

          setStats({
            totalSessions: completed.length,
            totalDuration,
            dominantEmotion,
            weeklyProgress,
            weeklyGoal: 5,
            streakDays: 7, // TODO: Calculate actual streak
            improvementScore: 85, // TODO: Calculate from emotion trends
          })
        }

        // Fetch patient's appointments
        const appointmentsRes = await fetch(`/api/therapy/appointments?patientId=${patientId}`)
        if (appointmentsRes.ok) {
          const appointmentsData = await appointmentsRes.json()
          setAppointments(appointmentsData)
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session])

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    return `${minutes} min`
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getEmotionEmoji = (emotion: string): string => {
    const emotionEmojis: Record<string, string> = {
      happy: "😊",
      sad: "😢",
      angry: "😠",
      fearful: "😰",
      surprised: "😲",
      disgusted: "🤢",
      neutral: "😐",
      anxious: "😰",
    }
    return emotionEmojis[emotion.toLowerCase()] || "🤔"
  }

  const getDominantEmotion = (emotions: Record<string, number>): string => {
    if (Object.keys(emotions).length === 0) return "neutral"
    return Object.entries(emotions).sort(([, a], [, b]) => b - a)[0][0]
  }

  const getStatusColor = (status: string) => {
    return status === "active" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
  }

  const progressPercentage = (stats.weeklyProgress / stats.weeklyGoal) * 100

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">
                <Image className="h-12 w-12" src="/logo.png" alt="Logo" width={48} height={48} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">MindBridge</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Patient Dashboard</p>
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
                  href="/patient/session"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors flex items-center"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Session
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
                href="/patient/session"
                className="block px-4 py-2 text-blue-600 dark:text-blue-400 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Play className="inline mr-2 h-4 w-4" />
                Start Session
              </Link>
              <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${sessionInfo.expiringSoon ? "bg-yellow-500" : "bg-green-500"}`} />
                Session expires in {sessionInfo.timeRemaining}
              </div>
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

      {/* Welcome Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome back, <span className="text-blue-600 dark:text-blue-400">{session?.user?.email?.split("@")[0]}</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Continue your mental health journey with personalized AI therapy
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-8">
          {/* Tab Navigation with improved styling */}
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-2 lg:max-w-3xl lg:grid-cols-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Overview</TabsTrigger>
              <TabsTrigger value="sessions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Sessions</TabsTrigger>
              <TabsTrigger value="appointments" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Appointments</TabsTrigger>
              <TabsTrigger value="progress" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Progress</TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Settings</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg transition-colors duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Sessions</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSessions}</div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Therapy sessions completed</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg transition-colors duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Time</CardTitle>
                  <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatDuration(stats.totalDuration)}</div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Time spent in therapy</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg transition-colors duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Current Streak</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.streakDays} days</div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Consecutive therapy days</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg transition-colors duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Improvement Score</CardTitle>
                  <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.improvementScore}%</div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Based on emotion trends</p>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Progress */}
            <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg transition-colors duration-300">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <Target className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Weekly Progress
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  You&apos;ve completed {stats.weeklyProgress} out of {stats.weeklyGoal} sessions this week
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-900 dark:text-white">Progress</span>
                  <span className="text-gray-900 dark:text-white">
                    {stats.weeklyProgress}/{stats.weeklyGoal} sessions
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-3 bg-gray-200 dark:bg-gray-700" />
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                  <Calendar className="h-4 w-4" />
                  <span>{stats.weeklyGoal - stats.weeklyProgress} sessions remaining this week</span>
                </div>
              </CardContent>
            </Card>

            {/* Current Mood & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg transition-colors duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900 dark:text-white">
                    <Activity className="mr-2 h-5 w-5 text-purple-600 dark:text-purple-400" />
                    Current Mood Trend
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">Your most frequent emotion this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">{getEmotionEmoji(stats.dominantEmotion)}</div>
                    <div>
                      <div className="text-2xl font-bold capitalize text-gray-900 dark:text-white">{stats.dominantEmotion}</div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Dominant emotion</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg transition-colors duration-300">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Quick Actions</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">Common tasks and tools</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Emotion Reports
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Target className="mr-2 h-4 w-4" />
                    Set Therapy Goals
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Settings className="mr-2 h-4 w-4" />
                    Customize Experience
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            {/* Start New Session Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 shadow-lg transition-colors duration-300">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <Play className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Start New Therapy Session
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Begin a new AI-powered therapy session with real-time emotion detection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      Ready to start your mental health journey? Our AI therapist is here to listen and support you.
                    </div>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                      <span className="flex items-center">
                        <Brain className="mr-1 h-3 w-3" />
                        AI-Powered
                      </span>
                      <span className="flex items-center">
                        <Activity className="mr-1 h-3 w-3" />
                        Emotion Detection
                      </span>
                      <span className="flex items-center">
                        <MessageSquare className="mr-1 h-3 w-3" />
                        Real-time Chat
                      </span>
                    </div>
                  </div>
                  <Link href="/patient/session">
                    <Button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200">
                      <Play className="mr-2 h-4 w-4" />
                      Start Session Now
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg transition-colors duration-300">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Recent Sessions</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">Your therapy session history and progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessions.map((session) => {
                    const dominantEmotion = getDominantEmotion(session.emotionsSummary)
                    return (
                      <div
                        key={session.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors space-y-4 sm:space-y-0"
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar className="bg-blue-100 dark:bg-blue-900">
                            <AvatarFallback>
                              <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{session.id}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">{formatDate(session.startTime)}</div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {session.status === "active" ? "In progress" : formatDuration(session.duration)}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-300">{session.messageCount} messages</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getEmotionEmoji(dominantEmotion)}</span>
                            <Badge variant="secondary" className="capitalize bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
                              {dominantEmotion}
                            </Badge>
                          </div>
                          <Badge className={`${session.status === "active" 
                            ? "bg-blue-600 text-white hover:bg-blue-700" 
                            : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"}`}>
                            {session.status}
                          </Badge>
                          <div className="flex space-x-1">
                            {session.status === "active" ? (
                              <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Link href="/patient/session">
                                  <Play className="h-3 w-3" />
                                </Link>
                              </Button>
                            ) : (
                              <>
                                <Button size="sm" variant="outline" className="border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" className="border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
                                  <Download className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-6">
            {/* Book Appointment Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 shadow-lg transition-colors duration-300">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <Calendar className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Book New Appointment
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Schedule a therapy session with an available therapist
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      Choose from our available therapists, select your preferred time, and book your next therapy session.
                    </div>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                      <span className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        Flexible Scheduling
                      </span>
                      <span className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        Multiple Time Slots
                      </span>
                    </div>
                  </div>
                  <Link href="/patient/appointments">
                    <Button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200">
                      <Calendar className="mr-2 h-4 w-4" />
                      View & Book Appointments
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Appointments */}
            <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg transition-colors duration-300">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <Clock className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" />
                  Upcoming Appointments
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Your scheduled sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointments
                    .filter((apt) => new Date(apt.scheduledTime) > new Date() && apt.status !== "cancelled")
                    .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
                    .map((appointment) => (
                      <div
                        key={appointment.id}
                        className={`flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg ${
                          appointment.status === "confirmed"
                            ? "bg-green-50 dark:bg-green-900/20"
                            : "bg-yellow-50 dark:bg-yellow-900/20"
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div
                              className={`w-12 h-12 ${
                                appointment.status === "confirmed"
                                  ? "bg-green-100 dark:bg-green-900"
                                  : "bg-yellow-100 dark:bg-yellow-900"
                              } rounded-lg flex items-center justify-center`}
                            >
                              <Calendar
                                className={`h-6 w-6 ${
                                  appointment.status === "confirmed"
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-yellow-600 dark:text-yellow-400"
                                }`}
                              />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                              {appointment.therapist?.name || "Therapist"}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {new Date(appointment.scheduledTime).toLocaleString()}
                            </p>
                            <p
                              className={`text-xs ${
                                appointment.status === "confirmed"
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-yellow-600 dark:text-yellow-400"
                              }`}
                            >
                              {appointment.status === "confirmed" ? "Confirmed" : "Pending Confirmation"}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={
                            appointment.status === "confirmed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          }
                        >
                          {appointment.status === "confirmed" ? "Confirmed" : "Pending"}
                        </Badge>
                      </div>
                    ))}
                  {appointments.filter((apt) => new Date(apt.scheduledTime) > new Date() && apt.status !== "cancelled")
                    .length === 0 && (
                    <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                      <p>No upcoming appointments</p>
                      <Link href="/patient/appointments">
                        <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                          Book an Appointment
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Past Appointments */}
            <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg transition-colors duration-300">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <CheckCircle2 className="mr-2 h-5 w-5 text-gray-600 dark:text-gray-400" />
                  Past Appointments
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Your appointment history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointments
                    .filter((apt) => new Date(apt.scheduledTime) <= new Date() || apt.status === "completed")
                    .sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime())
                    .slice(0, 5)
                    .map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                              <CheckCircle2 className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                              {appointment.therapist?.name || "Therapist"}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {new Date(appointment.scheduledTime).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Duration: {Math.floor(appointment.duration / 60)} minutes
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            {appointment.status === "completed" ? "Completed" : "Past"}
                          </Badge>
                          {appointment.notes && (
                            <Button variant="outline" size="sm" className="mt-2 ml-2">
                              <Eye className="h-4 w-4 mr-2" />
                              View Notes
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  {appointments.filter((apt) => new Date(apt.scheduledTime) <= new Date() || apt.status === "completed")
                    .length === 0 && (
                    <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                      <p>No past appointments</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg transition-colors duration-300">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Emotion Analytics</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">Track your emotional patterns over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                      <p>Detailed analytics coming soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg transition-colors duration-300">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Therapy Goals</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">Set and track your mental health objectives</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Target className="h-12 w-12 mx-auto mb-4" />
                      <p>Goal tracking coming soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg transition-colors duration-300">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Account Settings</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">Manage your account and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white">Email</label>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{session?.user?.email}</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white">Account Type</label>
                    <Badge variant="outline" className="border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400">Patient</Badge>
                  </div>
                  <Button variant="outline" className="w-full justify-start bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Settings className="mr-2 h-4 w-4" />
                    Update Preferences
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg transition-colors duration-300">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Session Management</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">Manage your login session and security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-900 dark:text-white">Session expires in {sessionInfo.timeRemaining}</span>
                  </div>
                  {sessionInfo.isIncognito && (
                    <div className="flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-400">
                      <AlertCircle className="h-4 w-4" />
                      <span>Private browsing - session will end when browser closes</span>
                    </div>
                  )}
                  <Button
                    variant="destructive"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full justify-start bg-red-600 hover:bg-red-700 text-white"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Session Status Section */}
            <SessionStatus />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Dashboard
