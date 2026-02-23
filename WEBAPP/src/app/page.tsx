'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useState, useEffect, useRef } from 'react';
import ThemeToggle from '../components/ThemeToggle';
import { useSession, signOut } from 'next-auth/react';

export default function Home() {
  const { data: session, status } = useSession();
  const [logoError, setLogoError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let app: any;
    (async () => {
      const { Application } = await import('@splinetool/runtime');
      if (canvasRef.current) {
        app = new Application(canvasRef.current);
        await app.load('https://prod.spline.design/6JLico0CrrctmQ7N/scene.splinecode');
      }
    })();
    return () => {
      app?.dispose();
    };
  }, []);

  return (
    <div className="min-h-screen relative transition-colors duration-300">
      {/* Spline 3D Background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full z-0"
      />
      {/* Overlay for text readability */}
      <div className="fixed inset-0 z-[1] bg-white/30 dark:bg-gray-900/50 pointer-events-none" />

      {/* Page content */}
      <div className="relative z-10">
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">
                {!logoError ? (
                  <Image 
                    className="h-12 w-12" 
                    src="/logo.png" 
                    alt="MindBridge Logo" 
                    width={48} 
                    height={48}
                    priority={true}
                    onError={(e) => {
                      console.error('Logo failed to load, trying fallback:', e);
                      setLogoError(true);
                    }}
                  />
                ) : (
                  <Image 
                    className="h-12 w-12" 
                    src="/logo-fallback.svg" 
                    alt="MindBridge Logo" 
                    width={48} 
                    height={48}
                    priority={true}
                  />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">MindBridge</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">AI Therapy Session</p>
              </div>
            </div>
            <nav className="flex items-center space-x-4">
              <ThemeToggle />
              {session ? (
                <>
                  {session.user?.role === 'patient' && (
                    <>
                      <Link
                        href="/patient/dashboard"
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/patient/session"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                      >
                        Start Session
                      </Link>
                    </>
                  )}
                  {session.user?.role === 'therapist' && (
                    <>
                      <Link
                        href="/therapist/dashboard"
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/therapist/schedule"
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 transition-colors"
                      >
                        Schedule
                      </Link>
                    </>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors border border-red-600 dark:border-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Your AI-Powered{' '}
            <span className="text-blue-600 dark:text-blue-400">Mental Health Companion</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Chat or talk with an AI Therapy Session, book sessions with real therapists, 
            track your mental health over time, and connect anonymously with peers — all in one platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {session ? (
              <>
                {session.user?.role === 'patient' ? (
                  <Link
                    href="/patient/session"
                    className="px-8 py-4 bg-blue-600 dark:bg-blue-500 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-lg"
                  >
                    Start Therapy Session
                  </Link>
                ) : (
                  <Link
                    href="/therapist/dashboard"
                    className="px-8 py-4 bg-green-600 dark:bg-green-500 text-white text-lg font-semibold rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors shadow-lg"
                  >
                    Go to Dashboard
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/auth/register"
                  className="px-8 py-4 bg-blue-600 dark:bg-blue-500 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-lg"
                >
                  Register
                </Link>
                <Link
                  href="/auth/signin"
                  className="px-8 py-4 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-blue-600 dark:text-blue-400 text-lg font-semibold rounded-lg border-2 border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Core Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border dark:border-gray-700 transition-colors duration-300">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-black dark:text-white mb-2">AI Therapy Chat</h3>
            <p className="text-gray-600 dark:text-gray-300">
              RAG-powered conversations using Groq LLaMA 3.1 with mental health knowledge retrieval via Pinecone vector database
            </p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border dark:border-gray-700 transition-colors duration-300">
            <div className="text-4xl mb-4">🎙️</div>
            <h3 className="text-xl font-semibold text-black dark:text-white mb-2">Virtual Therapy Sessions</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Full voice therapy with speech-to-text input, AI processing, and text-to-speech output in real-time
            </p>
          </div>

          {/* <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border dark:border-gray-700 transition-colors duration-300">
            <div className="text-4xl mb-4">🎭</div>
            <h3 className="text-xl font-semibold text-black dark:text-white mb-2">Emotion Detection</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Real-time webcam-based facial emotion recognition detecting 7 emotions with confidence scores via OpenCV
            </p>
          </div> */}

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border dark:border-gray-700 transition-colors duration-300">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl text-black dark:text-white font-semibold mb-2">AI Therapist</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Groq LLaMA 3.1 powered conversations that adapt to your state and needs
            </p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border dark:border-gray-700 transition-colors duration-300">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-black dark:text-white mb-2">Mental Health Analytics</h3>
            <p className="text-gray-600 dark:text-gray-300">
              5-level severity scoring, keyword analysis across 7 categories, risk flag detection, trend tracking, and PHQ-9/GAD-7 assessments
            </p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border dark:border-gray-700 transition-colors duration-300">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-black dark:text-white mb-2">Therapist Appointments</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Book sessions with verified therapists, manage availability slots, and get email reminders with Google Calendar integration
            </p>
          </div>
        </div>

        {/* Platform Roles */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-16 border dark:border-gray-700 transition-colors duration-300">
          <h3 className="text-3xl font-bold text-center mb-12 text-black dark:text-white">Built for Everyone</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
                <span className="text-2xl">💚</span>
              </div>
              <h4 className="text-xl font-semibold mb-2 text-black dark:text-white">Patients</h4>
              <p className="text-gray-600 dark:text-gray-300">
                AI chat &amp; voice sessions, emotion tracking, mental health assessments, appointment booking, session history, and progress dashboard
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
                <span className="text-2xl">🩺</span>
              </div>
              <h4 className="text-xl font-semibold mb-2 text-black dark:text-white">Therapists</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Patient management, schedule &amp; availability control, appointment confirmations, session analytics, and professional dashboard
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
                <span className="text-2xl">🛡️</span>
              </div>
              <h4 className="text-xl font-semibold mb-2 text-black dark:text-white">Admins</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Platform analytics, therapist verification &amp; approval, user management with ban controls, and system-wide monitoring
              </p>
            </div>
          </div>
        </div>

        {/* More Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border dark:border-gray-700 transition-colors duration-300">
            <div className="text-4xl mb-4">🫂</div>
            <h3 className="text-xl font-semibold text-black dark:text-white mb-2">Anonymous Peer Support</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Post anonymously across categories like Academic Stress, Social &amp; Emotional, Career Anxiety, and more. Reply, like, and search — no account required.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border dark:border-gray-700 transition-colors duration-300">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-xl font-semibold text-black dark:text-white mb-2">Secure Authentication</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Email/password &amp; Google OAuth sign-in, role-based access (Patient, Therapist, Admin), OTP password recovery, session management, and incognito detection.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border dark:border-gray-700 transition-colors duration-300">
            <div className="text-4xl mb-4">🌙</div>
            <h3 className="text-xl font-semibold text-black dark:text-white mb-2">Dark Mode &amp; Responsive UI</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Full dark/light theme toggle, mobile-responsive navigation, and a polished component library built with shadcn/ui and Radix UI.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border dark:border-gray-700 transition-colors duration-300">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-black dark:text-white mb-2">Chat History &amp; Sessions</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Multiple chat sessions with create, rename, and delete. Full message persistence, session timer, and automatic cleanup of empty sessions.
            </p>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 mb-16 border dark:border-gray-700 transition-colors duration-300">
          <h3 className="text-3xl text-gray-700 dark:text-gray-200 font-bold text-center mb-8">Powered by Advanced Technology</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-center">
            <div className="bg-white/90 dark:bg-gray-700/90 p-4 rounded-lg shadow transition-colors duration-300">
              <div className="text-2xl mb-2">⚛️</div>
              <p className="font-medium text-sm text-black dark:text-white">Next.js</p>
            </div>
            <div className="bg-white/90 dark:bg-gray-700/90 p-4 rounded-lg shadow transition-colors duration-300">
              <div className="text-2xl mb-2">🧠</div>
              <p className="font-medium text-sm text-black dark:text-white">Groq LLaMA</p>
            </div>
            <div className="bg-white/90 dark:bg-gray-700/90 p-4 rounded-lg shadow transition-colors duration-300">
              <div className="text-2xl mb-2">🔍</div>
              <p className="font-medium text-sm text-black dark:text-white">Pinecone RAG</p>
            </div>
            
            
            
            <div className="bg-white/90 dark:bg-gray-700/90 p-4 rounded-lg shadow transition-colors duration-300">
              <div className="text-2xl mb-2">⚡</div>
              <p className="font-medium text-sm text-black dark:text-white">FastAPI</p>
            </div>
            <div className="bg-white/90 dark:bg-gray-700/90 p-4 rounded-lg shadow transition-colors duration-300">
              <div className="text-2xl mb-2">🗄️</div>
              <p className="font-medium text-sm text-black dark:text-white">MySQL + Prisma</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h3 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Ready to Start Your Journey?</h3>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Join MindBridge and take the first step toward better mental health
          </p>
          <Link
            href={session ? (session.user?.role === 'patient' ? "/patient/session" : "/therapist/dashboard") : "/auth/register"}
            className="inline-flex items-center px-8 py-4 bg-blue-600 dark:bg-blue-500 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-lg"
          >
            {session ? (session.user?.role === 'patient' ? 'Begin Your Session' : 'Go to Dashboard') : 'Begin Your First Session'}
            <svg className="ml-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900/90 dark:bg-gray-950/90 backdrop-blur-sm text-white py-8 mt-16 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="text-2xl">🧠</div>
            <h4 className="text-xl font-bold">MindBridge</h4>
          </div>
          <p className="text-gray-400 dark:text-gray-500">
            Trying to fix people&apos;s mental health, one session at a time.
          </p>
          <p className="text-gray-400 dark:text-gray-500 mt-2">
            &copy; {new Date().getFullYear()} MindBridge. All rights reserved.
          </p>
        </div>
      </footer>
      </div>{/* End content wrapper */}
    </div>
  );
}
