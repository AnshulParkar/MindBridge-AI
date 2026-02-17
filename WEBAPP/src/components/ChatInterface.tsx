'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useChat } from '../hooks/useChat';
import type { ChatMessage } from '../hooks/useChat';
import {
  shouldSuggestAssessment,
  ASSESSMENT_QUESTIONS,
  ANSWER_OPTIONS,
  MENTAL_HEALTH_LEVELS,
} from '../lib/mentalHealthAnalytics';

// Keep the original interface for parent components
interface Message {
  id: string;
  role: 'user' | 'therapist';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  avatarUrl?: string;
}

interface ChatInterfaceProps {
  userId?: string;
  sessionId?: string;
  enableTTS?: boolean;
  enableAvatar?: boolean;
  onAvatarResponse?: (avatarUrl?: string, audioUrl?: string) => void;
  onAvatarGenerationStart?: () => void;
  onMessagesLoad?: (messages: Message[]) => void;
  onFirstMessage?: () => void;
  className?: string;
}

// Level colour helpers
const LEVEL_COLORS: Record<number, string> = {
  1: '#22c55e', 2: '#f59e0b', 3: '#f97316', 4: '#ef4444', 5: '#dc2626',
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  userId,
  sessionId,
  enableTTS = false,
  enableAvatar = false,
  onAvatarResponse,
  onAvatarGenerationStart,
  onMessagesLoad,
  onFirstMessage,
  className = '',
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { data: session } = useSession();
  const prevSessionIdRef = useRef<string | undefined>(undefined);

  // Assessment in-chat state
  const [assessmentActive, setAssessmentActive] = useState(false);
  const [assessmentQuestionIdx, setAssessmentQuestionIdx] = useState(0);
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<number, number>>({});
  const [assessmentPromptShown, setAssessmentPromptShown] = useState(false);
  const [assessmentSubmitting, setAssessmentSubmitting] = useState(false);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    addLocalMessage,
    clearMessages,
    loadMessages,
  } = useChat({
    enableTTS,
    enableAvatar,
    onAvatarResponse,
    onAvatarGenerationStart,
  });

  // Load messages when sessionId changes
  useEffect(() => {
    if (prevSessionIdRef.current === sessionId) return;
    prevSessionIdRef.current = sessionId;

    if (sessionId) {
      loadSessionMessages(sessionId);
    } else {
      clearMessages();
    }
  }, [sessionId]);

  // Notify parent when messages change
  useEffect(() => {
    if (messages.length > 0) {
      onMessagesLoad?.(messages as unknown as Message[]);
    }
  }, [messages, onMessagesLoad]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load messages from database for a session
  const loadSessionMessages = async (sid: string) => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`/api/chat/sessions/${sid}/messages`);
      if (response.ok) {
        const data = await response.json();
        const formattedMessages: ChatMessage[] = (data.messages || []).map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          audioUrl: msg.metadata?.audioUrl,
          avatarUrl: msg.metadata?.avatarUrl,
          messageType: 'text' as const,
        }));
        loadMessages(formattedMessages);
        onMessagesLoad?.(formattedMessages as unknown as Message[]);
      } else {
        clearMessages();
      }
    } catch (err) {
      console.error('Error loading session messages:', err);
      clearMessages();
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Save message to database
  const saveMessageToDatabase = async (content: string, role: 'user' | 'therapist', metadata?: any) => {
    if (!sessionId) return;
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, role, metadata }),
      });
      if (!response.ok) console.error('Failed to save message to database');
    } catch (err) {
      console.error('Error saving message:', err);
    }
  };

  // ============================================================
  //  ASSESSMENT FLOW HELPERS
  // ============================================================

  /** Push the assessment prompt into chat */
  const showAssessmentPrompt = useCallback(() => {
    if (assessmentPromptShown) return;
    setAssessmentPromptShown(true);

    const promptMsg: ChatMessage = {
      id: `assess_prompt_${Date.now()}`,
      role: 'therapist',
      content:
        "I notice you might be finding it hard to express what you're going through right now — and that's completely okay. 💙\n\nWould you like me to run a quick mental health check-in? It's just 10 short questions where you pick an option. It only takes a couple of minutes and can help us understand how you've been feeling lately.\n\nType **yes** to start the assessment, or just keep chatting — I'm here either way.",
      timestamp: new Date(),
      messageType: 'assessment_prompt',
    };
    addLocalMessage(promptMsg);
    saveMessageToDatabase(promptMsg.content, 'therapist', { type: 'assessment_prompt' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentPromptShown, addLocalMessage]);

  /** Push the current assessment question into chat */
  const showNextAssessmentQuestion = useCallback((idx: number) => {
    const q = ASSESSMENT_QUESTIONS[idx];
    if (!q) return;

    const qMsg: ChatMessage = {
      id: `assess_q_${q.id}_${Date.now()}`,
      role: 'therapist',
      content: `📋 Question ${idx + 1} of ${ASSESSMENT_QUESTIONS.length}\n\n${q.question}`,
      timestamp: new Date(),
      messageType: 'assessment_question',
      assessmentOptions: ANSWER_OPTIONS.map(o => ({ label: o.label, score: o.score })),
      assessmentQuestionId: q.id,
    };
    addLocalMessage(qMsg);
    saveMessageToDatabase(qMsg.content, 'therapist', { type: 'assessment_question', questionId: q.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addLocalMessage]);

  /** Submit all assessment answers to the backend */
  const submitAssessment = useCallback(async (answers: Record<number, number>) => {
    setAssessmentSubmitting(true);
    try {
      const answerArray = Object.entries(answers).map(([qId, score]) => ({
        questionId: parseInt(qId),
        score,
      }));

      const res = await fetch('/api/analytics/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answerArray }),
      });

      if (res.ok) {
        const data = await res.json();
        const levelInfo = MENTAL_HEALTH_LEVELS.find(l => l.level === data.mentalHealthLevel);

        const resultMsg: ChatMessage = {
          id: `assess_result_${Date.now()}`,
          role: 'therapist',
          content:
            `✅ **Assessment Complete!**\n\n` +
            `Your mental health level: **${data.levelLabel}** (Level ${data.mentalHealthLevel}/5)\n` +
            `Score: ${data.totalScore} / ${data.maxScore}\n\n` +
            `${levelInfo?.description || ''}\n\n` +
            (data.mentalHealthLevel >= 4
              ? '⚠️ Your responses indicate significant distress. I strongly recommend reaching out to a mental health professional or crisis helpline. You are not alone.\n\n'
              : '') +
            'You can view detailed analytics on your **Dashboard → Progress** tab. Let\'s continue our conversation — I\'m here for you. 💙',
          timestamp: new Date(),
          messageType: 'assessment_result',
          assessmentResult: {
            totalScore: data.totalScore,
            maxScore: data.maxScore,
            mentalHealthLevel: data.mentalHealthLevel,
            levelLabel: data.levelLabel,
          },
        };
        addLocalMessage(resultMsg);
        saveMessageToDatabase(resultMsg.content, 'therapist', { type: 'assessment_result', ...data });
      } else {
        addLocalMessage({
          id: `assess_err_${Date.now()}`,
          role: 'therapist',
          content: 'Sorry, there was an error submitting the assessment. You can try again from the Dashboard → Progress tab.',
          timestamp: new Date(),
          messageType: 'text',
        });
      }
    } catch (err) {
      console.error('Assessment submit error:', err);
    } finally {
      setAssessmentSubmitting(false);
      setAssessmentActive(false);
      setAssessmentQuestionIdx(0);
      setAssessmentAnswers({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addLocalMessage]);

  // ============================================================
  //  HANDLE SEND MESSAGE
  // ============================================================
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || assessmentActive) return;

    const message = inputMessage;
    setInputMessage('');

    // Check if user is responding to assessment prompt
    if (assessmentPromptShown && !assessmentActive) {
      const lower = message.trim().toLowerCase();
      const yesPatterns = ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'y', 'start', 'begin', 'go ahead'];
      if (yesPatterns.some(p => lower === p || lower.startsWith(p))) {
        // User accepted — show their message and kick off assessment
        addLocalMessage({
          id: `user_${Date.now()}`,
          role: 'user',
          content: message,
          timestamp: new Date(),
          messageType: 'text',
        });
        saveMessageToDatabase(message, 'user');

        setAssessmentActive(true);
        setAssessmentQuestionIdx(0);
        setAssessmentAnswers({});

        setTimeout(() => showNextAssessmentQuestion(0), 500);
        return;
      }
    }

    // Notify parent on first message
    if (messages.length === 0) {
      onFirstMessage?.();
    }

    // Normal AI conversation
    const response = await sendMessage(message);

    // Save to DB
    if (session?.user && sessionId) {
      await saveMessageToDatabase(message, 'user');
      if (response) {
        await saveMessageToDatabase(response.content, 'therapist', {
          audioUrl: response.audioUrl,
          avatarUrl: response.avatarUrl,
        });
      }
    }

    // Confusion detection — check recent user messages
    const allUserMsgs = [...messages.filter(m => m.role === 'user').map(m => m.content), message];
    if (shouldSuggestAssessment(allUserMsgs)) {
      setTimeout(() => showAssessmentPrompt(), 1500);
    }
  };

  // ============================================================
  //  HANDLE MCQ OPTION CLICK
  // ============================================================
  const handleAssessmentOptionClick = (questionId: number, score: number, label: string) => {
    if (!assessmentActive || assessmentSubmitting) return;

    // Record the answer
    const newAnswers = { ...assessmentAnswers, [questionId]: score };
    setAssessmentAnswers(newAnswers);

    // Show user's selection as a chat bubble
    addLocalMessage({
      id: `user_assess_${questionId}_${Date.now()}`,
      role: 'user',
      content: label,
      timestamp: new Date(),
      messageType: 'text',
    });
    saveMessageToDatabase(`[Assessment Q${questionId}] ${label}`, 'user', {
      type: 'assessment_answer',
      questionId,
      score,
    });

    const nextIdx = assessmentQuestionIdx + 1;

    if (nextIdx < ASSESSMENT_QUESTIONS.length) {
      setAssessmentQuestionIdx(nextIdx);
      setTimeout(() => showNextAssessmentQuestion(nextIdx), 600);
    } else {
      // All questions answered — submit
      setTimeout(() => submitAssessment(newAnswers), 800);
    }
  };

  // ============================================================
  //  RENDER HELPERS
  // ============================================================
  const formatTime = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  /** Only the latest assessment question should have active MCQ buttons */
  const isActiveAssessmentQuestion = (msg: ChatMessage): boolean => {
    if (!assessmentActive || msg.messageType !== 'assessment_question') return false;
    const assessmentQMsgs = messages.filter(m => m.messageType === 'assessment_question');
    return assessmentQMsgs.length > 0 && assessmentQMsgs[assessmentQMsgs.length - 1].id === msg.id;
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
            </div>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading chat history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <div className="flex justify-center text-4xl mb-4">
              <Image src="/logo.png" alt="Logo" width={50} height={50} />
            </div>
            <p className="text-lg font-medium">Welcome to MindBridge</p>
            <p className="text-sm mt-2">
              I&apos;m here to listen and support you. Share what&apos;s on your mind.
            </p>
          </div>
        ) : null}

        {messages.map((message) => (
          <div key={message.id}>
            {/* Message bubble */}
            <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 dark:bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm border dark:border-gray-700'
                }`}
              >
                {/* Content — basic bold markdown for assessment messages */}
                <div className="text-sm whitespace-pre-line">
                  {message.content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={i}>{part.slice(2, -2)}</strong>;
                    }
                    return <span key={i}>{part}</span>;
                  })}
                </div>

                {/* Assessment result — level indicator */}
                {message.messageType === 'assessment_result' && message.assessmentResult && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                        style={{ backgroundColor: LEVEL_COLORS[message.assessmentResult.mentalHealthLevel] || '#6b7280' }}
                      >
                        {message.assessmentResult.mentalHealthLevel}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{message.assessmentResult.levelLabel}</div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                          <div
                            className="h-2 rounded-full transition-all duration-700"
                            style={{
                              width: `${(message.assessmentResult.totalScore / message.assessmentResult.maxScore) * 100}%`,
                              backgroundColor: LEVEL_COLORS[message.assessmentResult.mentalHealthLevel] || '#6b7280',
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {message.assessmentResult.totalScore} / {message.assessmentResult.maxScore}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timestamp & label */}
                <div className={`flex items-center justify-between mt-2 text-xs ${
                  message.role === 'user' ? 'text-blue-100 dark:text-blue-200' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  <span>{formatTime(message.timestamp)}</span>
                  {message.messageType === 'assessment_question' && (
                    <span className="text-blue-500 dark:text-blue-400">📋 Assessment</span>
                  )}
                </div>
              </div>
            </div>

            {/* MCQ option buttons — only active for the latest assessment question */}
            {message.messageType === 'assessment_question' &&
              message.assessmentOptions &&
              isActiveAssessmentQuestion(message) && (
                <div className="flex justify-start mt-2">
                  <div className="grid grid-cols-2 gap-2 max-w-xs lg:max-w-md">
                    {message.assessmentOptions.map((option) => (
                      <button
                        key={option.score}
                        onClick={() =>
                          handleAssessmentOptionClick(message.assessmentQuestionId!, option.score, option.label)
                        }
                        disabled={assessmentSubmitting}
                        className="px-3 py-2.5 text-sm font-medium rounded-lg border-2 border-blue-300 dark:border-blue-600
                          bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300
                          hover:bg-blue-100 dark:hover:bg-blue-800/40 hover:border-blue-500 dark:hover:border-blue-400
                          active:scale-95 transition-all duration-150
                          disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {/* Already-answered question — show dimmed options with selection */}
            {message.messageType === 'assessment_question' &&
              message.assessmentOptions &&
              !isActiveAssessmentQuestion(message) &&
              message.assessmentQuestionId != null &&
              assessmentAnswers[message.assessmentQuestionId] !== undefined && (
                <div className="flex justify-start mt-2">
                  <div className="grid grid-cols-2 gap-2 max-w-xs lg:max-w-md opacity-50">
                    {message.assessmentOptions.map((option) => {
                      const isSelected = assessmentAnswers[message.assessmentQuestionId!] === option.score;
                      return (
                        <div
                          key={option.score}
                          className={`px-3 py-2.5 text-sm rounded-lg border-2 ${
                            isSelected
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold'
                              : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500'
                          }`}
                        >
                          {isSelected && '✓ '}{option.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
          </div>
        ))}

        {/* Loading / submitting indicators */}
        {(isLoading || assessmentSubmitting) && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm border dark:border-gray-700 rounded-lg px-4 py-3 max-w-xs">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {assessmentSubmitting ? 'Analyzing your responses...' : 'Therapist is typing...'}
                </span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded">
            <div className="flex items-center">
              <span className="mr-2">⚠️</span>
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4 transition-colors duration-300">
        {assessmentActive ? (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
            <span className="inline-flex items-center space-x-2">
              <span>📋</span>
              <span>Please select an option above to continue the assessment</span>
            </span>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Share your thoughts..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors duration-300"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
