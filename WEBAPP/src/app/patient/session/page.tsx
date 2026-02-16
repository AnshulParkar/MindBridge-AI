"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Switch } from "../../../components/ui/switch"
import { Label } from "../../../components/ui/label"
import {
  Brain,
  Video,
  User,
  Settings,
  Volume2,
  History
} from "lucide-react"
import ChatInterface from "../../../components/ChatInterface"
import AvatarDisplay from "../../../components/AvatarDisplay"
import ThemeToggle from "../../../components/ThemeToggle"
import ChatHistory from "../../../components/ChatHistory"



const TherapySession: React.FC = () => {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return
  if (!session || (session.user as { role?: string })?.role !== "patient") {
      router.replace("/auth/signin")
    }
  }, [session, status, router])

  const [sessionStartTime] = useState(new Date())
  const [sessionDuration, setSessionDuration] = useState(0)

  // Session controls
  const [isSessionActive, setIsSessionActive] = useState(true)
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>()
  const [hasMessagesInCurrent, setHasMessagesInCurrent] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [avatarSettings, setAvatarSettings] = useState({
    enableTTS: false,
    enableAvatar: false,
  })

  // Refs to track latest values for unmount cleanup
  const currentSessionIdRef = useRef<string | undefined>(undefined)
  const hasMessagesRef = useRef(false)
  useEffect(() => { currentSessionIdRef.current = currentSessionId }, [currentSessionId])
  useEffect(() => { hasMessagesRef.current = hasMessagesInCurrent }, [hasMessagesInCurrent])

  // Avatar state
  const [latestAvatarUrl, setLatestAvatarUrl] = useState<string | undefined>()
  const [latestAudioUrl, setLatestAudioUrl] = useState<string | undefined>()
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false)

  // Session timer
  useEffect(() => {
    if (!isSessionActive) return

    const interval = setInterval(() => {
      setSessionDuration(Math.floor((Date.now() - sessionStartTime.getTime()) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [isSessionActive, sessionStartTime])

  // Cleanup empty session ONLY on actual page unmount
  useEffect(() => {
    return () => {
      if (currentSessionIdRef.current && !hasMessagesRef.current) {
        fetch(`/api/chat/sessions?sessionId=${currentSessionIdRef.current}`, {
          method: 'DELETE',
        }).catch(() => {});
      }
    }
  }, []) // Empty deps = only runs on unmount

  const handleNewAvatarResponse = (avatarUrl?: string, audioUrl?: string) => {
    if (avatarUrl) {
      setLatestAvatarUrl(avatarUrl)
    }
    if (audioUrl) {
      setLatestAudioUrl(audioUrl)
    }
    setIsGeneratingAvatar(false)
  }

  // Handle session selection from history
  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId)
    setHasMessagesInCurrent(true) // Assume history sessions have messages
  }

  // Handle new chat creation — do NOT reset hasMessages here,
  // cleanup of empty sessions is handled by ChatHistory
  const handleNewChat = () => {
    // Nothing to reset here; ChatHistory handles empty session cleanup
  }

  // Handle session auto-created by ChatHistory
  const handleSessionCreated = (sessionId: string) => {
    setCurrentSessionId(sessionId)
    setHasMessagesInCurrent(false)
  }

  // Handle first message sent - mark session as having messages
  const handleFirstMessage = () => {
    setHasMessagesInCurrent(true)
    // Trigger a refresh of the sessions list to update message counts
    setRefreshTrigger(prev => prev + 1)
  }




  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">
                <Image className="h-12 w-12" src="/logo.png" alt="Logo" width={48} height={48} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">MindBridge</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">AI Therapy Session</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/patient/dashboard")}
                className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Dashboard
              </Button>
              
              <ThemeToggle />
              
    
            </div>
          </div>
          
          
        </div>
      </header>

      {/* Welcome Section */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Column - Chat Channels (History Chats) */}
          <div className="xl:col-span-1 space-y-6">
            <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg transition-colors duration-300">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <History className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Chat History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChatHistory 
                  activeSessionId={currentSessionId}
                  onSessionSelect={handleSessionSelect}
                  onNewChat={handleNewChat}
                  onSessionCreated={handleSessionCreated}
                  refreshTrigger={refreshTrigger}
                />
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Chat Interface */}
          <div className="xl:col-span-2">
            <Card className="h-[700px] bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg transition-colors duration-300">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <Brain className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                  AI Therapist Chat
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">Share your thoughts and feelings with our AI therapist</CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100%-5rem)] p-0">
                <ChatInterface
                  sessionId={currentSessionId}
                  enableTTS={avatarSettings.enableTTS}
                  enableAvatar={avatarSettings.enableAvatar}
                  onAvatarResponse={handleNewAvatarResponse}
                  onFirstMessage={handleFirstMessage}
                  className="h-full rounded-none border-0"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Avatar and Settings */}
          <div className="xl:col-span-1 space-y-6">
            {/* Avatar Display */}
            <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg transition-colors duration-300">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <User className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                  AI Therapist
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">Visual and audio responses from your AI therapist</CardDescription>
              </CardHeader>
              <CardContent>
                <AvatarDisplay
                  avatarUrl={latestAvatarUrl}
                  audioUrl={latestAudioUrl}
                  isGenerating={isGeneratingAvatar}
                  className="w-full"
                />
              </CardContent>
            </Card>

            {/* Avatar Settings */}
            <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg transition-colors duration-300">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <Settings className="mr-2 h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Avatar Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Volume2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <Label htmlFor="enable-tts" className="text-sm text-gray-900 dark:text-white">
                      Text-to-Speech
                    </Label>
                  </div>
                  <Switch
                    id="enable-tts"
                    checked={avatarSettings.enableTTS}
                    onCheckedChange={(checked) => setAvatarSettings((prev) => ({ ...prev, enableTTS: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Video className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <Label htmlFor="enable-avatar" className="text-sm text-gray-900 dark:text-white">
                      Avatar Video
                    </Label>
                  </div>
                  <Switch
                    id="enable-avatar"
                    checked={avatarSettings.enableAvatar}
                    onCheckedChange={(checked) => setAvatarSettings((prev) => ({ ...prev, enableAvatar: checked }))}
                  />
                </div>
              </CardContent>
            </Card>


          
          </div>
        </div>

        {/* Session Info Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Session started at {sessionStartTime.toLocaleTimeString()} • 
            Real-time emotion detection powered by AI
          </p>
        </div>
      </div>
    </div>
  )
}

export default TherapySession
