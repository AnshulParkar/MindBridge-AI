"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import useSpeechToText from "../../../hooks/useSpeechToText";
import useTextToSpeech from "../../../hooks/useTextToSpeech";
import { useWebcam } from "../../../hooks/useWebcam";
import { therapyApi } from "../../../lib/api";
import { Button } from "../../../components/ui/button";
import ThemeToggle from "../../../components/ThemeToggle";
import {
  Brain,
  Play,
  Pause,
  RotateCcw,
  Square,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MessageSquare,
  LayoutDashboard,
  Camera,
  CameraOff,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface SessionMessage {
  id: string;
  role: "user" | "therapist";
  content: string;
  timestamp: Date;
}

type SessionStatus =
  | "idle"
  | "greeting"
  | "listening"
  | "processing"
  | "answering"
  | "paused"
  | "ended";

// ─── AI Avatar (Logo + speaking ring) ───────────────────────────────────────
const AiAvatar = ({ speaking }: { speaking?: boolean }) => (
  <div
    className={`w-[150px] h-[150px] rounded-full flex items-center justify-center transition-all duration-300 ${
      speaking
        ? "ring-4 ring-green-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 shadow-[0_0_20px_rgba(34,197,94,0.4)]"
        : "ring-0"
    }`}
  >
    <Image
      src="/logo.png"
      alt="AI Therapist"
      width={140}
      height={140}
      className="rounded-full object-contain"
      priority
    />
  </div>
);

// ─── Sound Wave Animation ────────────────────────────────────────────────────
const SoundWave = ({ active }: { active: boolean }) => (
  <div className="flex items-center justify-center gap-1 h-20">
    {[...Array(7)].map((_, i) => (
      <div
        key={i}
        className={`w-1 rounded-full transition-all duration-500 ${
          active ? "bg-blue-500 dark:bg-blue-400" : "bg-gray-300 dark:bg-gray-600"
        }`}
        style={{
          height: active
            ? `${20 + Math.sin(i * 0.8) * 30 + 15}px`
            : "8px",
          animation: active
            ? `pulse ${0.5 + i * 0.1}s ease-in-out ${i * 0.1}s infinite alternate`
            : "none",
        }}
      />
    ))}
  </div>
);

// ─── Main Virtual Session Component ──────────────────────────────────────────
const VirtualSessionPage: React.FC = () => {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  // ── Auth guard ──
  useEffect(() => {
    if (authStatus === "loading") return;
    if (
      !session ||
      (session.user as { role?: string })?.role !== "patient"
    ) {
      router.replace("/auth/signin");
    }
  }, [session, authStatus, router]);

  // ── Session state ──
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("idle");
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [latestTherapistText, setLatestTherapistText] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // ── Hooks ──
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    setOnResult,
  } = useSpeechToText();

  const { speak, isSpeaking, setOnSpeechEnd } = useTextToSpeech();

  const {
    videoRef,
    isActive: isWebcamActive,
    startWebcam,
    stopWebcam,
  } = useWebcam({ width: 480, height: 360 });

  // ── Refs to keep latest values in callbacks ──
  const sessionStatusRef = useRef(sessionStatus);
  const chatSessionIdRef = useRef(chatSessionId);
  const messagesRef = useRef(messages);
  const isAiLoadingRef = useRef(isAiLoading);

  useEffect(() => {
    sessionStatusRef.current = sessionStatus;
  }, [sessionStatus]);
  useEffect(() => {
    chatSessionIdRef.current = chatSessionId;
  }, [chatSessionId]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    isAiLoadingRef.current = isAiLoading;
  }, [isAiLoading]);

  // ── Timer ──
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (
      sessionStatus !== "idle" &&
      sessionStatus !== "ended" &&
      sessionStatus !== "paused"
    ) {
      timerRef.current = setInterval(() => {
        setElapsedTime((t) => t + 1);
      }, 1000);
    } else if (sessionStatus === "paused") {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionStatus]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // ── Get user display name ──
  const getUserDisplayName = useCallback(() => {
    if (!session?.user) return "there";
    return session.user.name || session.user.email || "there";
  }, [session]);

  // ── Persist message to DB ──
  const persistMessage = useCallback(
    async (content: string, role: "user" | "therapist", sid: string) => {
      try {
        await fetch(`/api/chat/sessions/${sid}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, role }),
        });
      } catch (err) {
        console.error("Failed to persist message:", err);
      }
    },
    []
  );

  // ── Add message helper ──
  const addMessage = useCallback(
    (role: "user" | "therapist", content: string) => {
      const msg: SessionMessage = {
        id: `${role}_${Date.now()}`,
        role,
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, msg]);
      if (role === "therapist") {
        setLatestTherapistText(content);
      }
      // Persist to DB
      if (chatSessionIdRef.current) {
        persistMessage(content, role, chatSessionIdRef.current);
      }
      return msg;
    },
    [persistMessage]
  );

  // ── Send user text to AI backend ──
  const sendToAI = useCallback(
    async (text: string) => {
      if (!text.trim() || isAiLoadingRef.current) return;

      addMessage("user", text);
      setIsAiLoading(true);
      setSessionStatus("processing");

      try {
        const response = await therapyApi.chat(text, "neutral");

        if (response.status === "success" && response.response) {
          addMessage("therapist", response.response);
          setSessionStatus("answering");
          speak(response.response);
        } else {
          throw new Error("Invalid AI response");
        }
      } catch (err) {
        console.error("AI chat error:", err);
        const fallback =
          "I'm sorry, I'm having trouble responding right now. Could you please try again?";
        addMessage("therapist", fallback);
        setSessionStatus("answering");
        speak(fallback);
      } finally {
        setIsAiLoading(false);
      }
    },
    [addMessage, speak]
  );

  // ── TTS finished → auto-listen ──
  useEffect(() => {
    setOnSpeechEnd(() => {
      const status = sessionStatusRef.current;
      if (status !== "paused" && status !== "ended" && status !== "idle") {
        setSessionStatus("listening");
        setTimeout(() => startListening(), 400);
      }
    });
  }, [setOnSpeechEnd, startListening]);

  // ── STT result → auto-send ──
  useEffect(() => {
    setOnResult((text: string) => {
      const status = sessionStatusRef.current;
      if (
        text.trim() &&
        status !== "paused" &&
        status !== "ended" &&
        status !== "idle"
      ) {
        sendToAI(text);
      }
    });
  }, [setOnResult, sendToAI]);

  // ── Create chat session in DB ──
  const createChatSession = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Virtual Session" }),
      });
      const data = await res.json();
      if (data.session?.id) {
        setChatSessionId(data.session.id);
        chatSessionIdRef.current = data.session.id;
        return data.session.id;
      }
    } catch (err) {
      console.error("Failed to create chat session:", err);
    }
    return null;
  }, []);

  // ── START session ──
  const handleStart = useCallback(async () => {
    if (sessionStatus !== "idle" && sessionStatus !== "ended") return;

    // Reset state
    setMessages([]);
    setElapsedTime(0);
    setLatestTherapistText("");
    setSessionStatus("greeting");

    // Create DB session
    await createChatSession();

    // Start webcam
    startWebcam();

    // Greet user
    const name = getUserDisplayName();
    const greeting = `Hello ${name}! Welcome to your virtual therapy session. I'm here to listen and support you. How are you feeling today?`;

    addMessage("therapist", greeting);
    speak(greeting);
    // After TTS finishes, onSpeechEnd callback will trigger startListening
  }, [
    sessionStatus,
    createChatSession,
    startWebcam,
    getUserDisplayName,
    addMessage,
    speak,
  ]);

  // ── PAUSE session ──
  const handlePause = useCallback(() => {
    if (sessionStatus === "paused") {
      // Resume
      setSessionStatus("listening");
      startListening();
    } else if (sessionStatus !== "idle" && sessionStatus !== "ended") {
      setSessionStatus("paused");
      stopListening();
      window.speechSynthesis.cancel();
    }
  }, [sessionStatus, startListening, stopListening]);

  // ── REANSWER — re-speak last AI response ──
  const handleReanswer = useCallback(() => {
    if (
      sessionStatus === "idle" ||
      sessionStatus === "ended" ||
      !latestTherapistText
    )
      return;

    stopListening();
    setSessionStatus("answering");
    speak(latestTherapistText);
  }, [sessionStatus, latestTherapistText, stopListening, speak]);

  // ── END session ──
  const handleEnd = useCallback(() => {
    stopListening();
    window.speechSynthesis.cancel();
    stopWebcam();
    setSessionStatus("ended");

    if (timerRef.current) clearInterval(timerRef.current);
  }, [stopListening, stopWebcam]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Derive status label ──
  const getStatusLabel = (): string => {
    switch (sessionStatus) {
      case "idle":
        return "Ready to Start";
      case "greeting":
        return "AI is greeting you...";
      case "listening":
        return "Listening...";
      case "processing":
        return "Processing your response...";
      case "answering":
        return "Therapist is speaking...";
      case "paused":
        return "Session Paused";
      case "ended":
        return "Session Ended";
      default:
        return "";
    }
  };

  // ── Loading auth state ──
  if (authStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300 flex flex-col">
      {/* ── Header ── */}
      <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">
                <Image className="h-12 w-12" src="/logo.png" alt="Logo" width={48} height={48} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">MindBridge</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Emotion Aware AI Therapist</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {sessionStatus !== "idle" && sessionStatus !== "ended" && (
                <span className="text-sm font-mono text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-md">
                  {formatTime(elapsedTime)}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/patient/session")}
                className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Chat Session
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/patient/dashboard")}
                className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <LayoutDashboard className="w-4 h-4 mr-1" />
                Dashboard
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col items-center px-4 py-6 gap-6 max-w-6xl mx-auto w-full">
        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Virtual Session</h2>

        {/* ── Video Panels ── */}
        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-4">
          {/* AI Therapist Panel */}
          <div className="flex-1 max-w-md border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 p-6 flex flex-col items-center justify-center min-h-[300px] shadow-lg transition-colors duration-300">
            <div
              className={`transition-transform duration-300 ${
                isSpeaking ? "scale-110" : "scale-100"
              }`}
            >
              <AiAvatar speaking={isSpeaking} />
            </div>
            <p className="mt-4 text-lg font-semibold text-blue-600 dark:text-blue-400">
              AI Therapist
            </p>
            {isSpeaking ? (
              <span className="mt-1 text-xs text-green-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Speaking
              </span>
            ) : sessionStatus !== "idle" && sessionStatus !== "ended" ? (
              <span className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Listening
              </span>
            ) : null}
          </div>

          {/* Sound Wave */}
          <div className="hidden md:flex items-center justify-center w-32">
            <SoundWave
              active={
                sessionStatus !== "idle" &&
                sessionStatus !== "ended" &&
                sessionStatus !== "paused" &&
                (isSpeaking || isListening || sessionStatus === "processing")
              }
            />
          </div>

          {/* User / Webcam Panel */}
          <div className="flex-1 max-w-md border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden shadow-lg transition-colors duration-300">
            <p className="absolute top-3 right-4 text-sm text-gray-500 dark:text-gray-400 font-medium z-10">
              You
            </p>
            {/* Camera toggle button inside panel */}
            <button
              onClick={() => (isWebcamActive ? stopWebcam() : startWebcam())}
              className="absolute top-3 left-3 z-10 p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
              title={isWebcamActive ? "Turn off camera" : "Turn on camera"}
            >
              {isWebcamActive ? (
                <CameraOff className="w-4 h-4" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            {/* Video element always in DOM so videoRef is never null */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full min-h-[300px] object-cover rounded-lg ${
                isWebcamActive ? "block" : "hidden"
              }`}
              style={{ transform: "scaleX(-1)" }}
            />
            {!isWebcamActive && (
              <div className="flex flex-col items-center text-gray-400 dark:text-gray-500 p-6">
                {/* Stick figure SVG */}
                <svg
                  viewBox="0 0 200 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-40 h-40"
                >
                  <circle
                    cx="100"
                    cy="60"
                    r="25"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d="M 55 180 L 100 110 L 145 180"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
                <p className="text-sm mt-2">Camera off</p>
                <button
                  onClick={() => startWebcam()}
                  className="mt-3 flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <Camera className="w-3 h-3" />
                  Turn On Camera
                </button>
              </div>
            )}
            {isListening && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                <span className="flex items-center gap-1 text-xs text-red-500 bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Recording
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Transcript Box ── */}
        <div className="w-full max-w-4xl border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 p-4 shadow transition-colors duration-300">
          <div className="flex items-start gap-2">
            <span className="font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
              Therapist :
            </span>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed flex-1 min-h-[40px]">
              {latestTherapistText || (
                <span className="italic text-gray-400 dark:text-gray-500">
                  Click &quot;Start&quot; to begin your session...
                </span>
              )}
            </p>
          </div>
        </div>

        {/* ── Status Indicator ── */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
          <span
            className={`w-2 h-2 rounded-full ${
              sessionStatus === "listening"
                ? "bg-green-500 animate-pulse"
                : sessionStatus === "answering" || sessionStatus === "greeting"
                  ? "bg-blue-500 animate-pulse"
                  : sessionStatus === "processing"
                    ? "bg-yellow-500 animate-pulse"
                    : sessionStatus === "paused"
                      ? "bg-orange-500"
                      : sessionStatus === "ended"
                        ? "bg-red-500"
                        : "bg-gray-400"
            }`}
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{getStatusLabel()}</span>
        </div>

        {/* ── Control Buttons ── */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {/* Start */}
          <Button
            onClick={handleStart}
            disabled={
              sessionStatus !== "idle" && sessionStatus !== "ended"
            }
            className={`gap-2 px-6 ${
              sessionStatus === "idle" || sessionStatus === "ended"
                ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400"
            }`}
            variant={
              sessionStatus === "idle" || sessionStatus === "ended"
                ? "default"
                : "outline"
            }
          >
            <Play className="w-4 h-4" />
            Start
          </Button>

          {/* Pause / Resume */}
          <Button
            onClick={handlePause}
            disabled={sessionStatus === "idle" || sessionStatus === "ended"}
            variant="outline"
            className="gap-2 px-6 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {sessionStatus === "paused" ? (
              <>
                <Play className="w-4 h-4" />
                Resume
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" />
                Pause
              </>
            )}
          </Button>

          {/* Reanswer */}
          <Button
            onClick={handleReanswer}
            disabled={
              sessionStatus === "idle" ||
              sessionStatus === "ended" ||
              !latestTherapistText
            }
            variant="outline"
            className="gap-2 px-6 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RotateCcw className="w-4 h-4" />
            Reanswer
          </Button>

          {/* End */}
          <Button
            onClick={handleEnd}
            disabled={sessionStatus === "idle" || sessionStatus === "ended"}
            variant="destructive"
            className="gap-2 px-6"
          >
            <Square className="w-4 h-4" />
            End
          </Button>
        </div>

        {/* ── Camera & Mic Toggles ── */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (isWebcamActive ? stopWebcam() : startWebcam())}
            className={`gap-2 border-gray-300 dark:border-gray-600 ${
              isWebcamActive
                ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                : "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
            }`}
          >
            {isWebcamActive ? (
              <>
                <CameraOff className="w-4 h-4" />
                Turn Off Camera
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                Turn On Camera
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (isListening) stopListening();
              else if (
                sessionStatus !== "idle" &&
                sessionStatus !== "ended"
              )
                startListening();
            }}
            disabled={sessionStatus === "idle" || sessionStatus === "ended"}
            className={`gap-2 border-gray-300 dark:border-gray-600 ${
              isListening
                ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                Mute Mic
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Unmute Mic
              </>
            )}
          </Button>
        </div>

        {/* ── Language note ── */}
        <p className="text-sm text-red-500 font-medium text-center">
          Talk in any language : Special trained to talk in Hinglish (Hindi
          English mix)
        </p>

        {/* ── Conversation Transcript (scrollable) ── */}
        {messages.length > 0 && (
          <div className="w-full max-w-4xl border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow transition-colors duration-300">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Conversation Transcript
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {messages.length} messages
              </span>
            </div>
            <div className="max-h-60 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-blue-600 dark:bg-blue-500 text-white rounded-br-md"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md"
                    }`}
                  >
                    <p className="text-[10px] font-semibold mb-1 opacity-70">
                      {msg.role === "user" ? "You" : "Therapist"}
                    </p>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Ended Summary ── */}
        {sessionStatus === "ended" && messages.length > 0 && (
          <div className="w-full max-w-4xl border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 p-6 text-center shadow transition-colors duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Session Ended</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Duration: {formatTime(elapsedTime)} &middot;{" "}
              {messages.length} messages exchanged
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={handleStart} className="gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white">
                <Play className="w-4 h-4" />
                Start New Session
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/patient/dashboard")}
                className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default VirtualSessionPage;
