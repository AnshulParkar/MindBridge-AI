import { useState, useCallback, useRef, useEffect } from 'react';
import { therapyApi, API_CONFIG } from '../lib/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'therapist';
  content: string;
  emotion?: string;
  timestamp: Date;
  audioUrl?: string;
  avatarUrl?: string;
  // Assessment support
  messageType?: 'text' | 'assessment_prompt' | 'assessment_question' | 'assessment_result';
  assessmentOptions?: { label: string; score: number }[];
  assessmentQuestionId?: number;
  assessmentResult?: {
    totalScore: number;
    maxScore: number;
    mentalHealthLevel: number;
    levelLabel: string;
  };
}

interface UseChatOptions {
  enableTTS?: boolean;
  enableAvatar?: boolean;
  onAvatarResponse?: (avatarUrl?: string, audioUrl?: string) => void;
  onAvatarGenerationStart?: () => void;
}

export type { ChatMessage };

export const useChat = (options: UseChatOptions = {}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { enableTTS = false, enableAvatar = false, onAvatarResponse, onAvatarGenerationStart } = options;

  const sendMessage = useCallback(async (
    content: string,
    currentEmotion?: string
  ): Promise<ChatMessage | null> => {
    if (!content.trim() || isLoading) return null;

    setIsLoading(true);
    setError(null);

    try {
      // Create user message
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: content.trim(),
        emotion: currentEmotion,
        timestamp: new Date(),
        messageType: 'text',
      };

      setMessages(prev => [...prev, userMessage]);

      // Get AI response
      const response = await therapyApi.chat(
        content,
        currentEmotion || 'neutral',
        undefined
      );

      if (response.status !== 'success') {
        throw new Error('Failed to get therapy response');
      }

      // Create therapist message
      const therapistMessage: ChatMessage = {
        id: `therapist_${Date.now()}`,
        role: 'therapist',
        content: response.response,
        timestamp: new Date(),
        messageType: 'text',
      };

      // Generate TTS if enabled
      if (enableTTS) {
        try {
          const ttsResponse = await therapyApi.generateSpeech(response.response);
          if (ttsResponse.status === 'success') {
            therapistMessage.audioUrl = ttsResponse.audio_url.startsWith('/') 
              ? `${API_CONFIG.AI_BACKEND_URL}${ttsResponse.audio_url}`
              : ttsResponse.audio_url;
          }
        } catch (ttsError) {
          console.warn('TTS generation failed:', ttsError);
        }
      }

      // Generate avatar if enabled
      if (enableAvatar) {
        onAvatarGenerationStart?.();
        therapistMessage.avatarUrl = '/aiVideo.mp4';
        console.log('Avatar enabled: Using dummy video /aiVideo.mp4');
      }

      setMessages(prev => [...prev, therapistMessage]);
      
      onAvatarResponse?.(therapistMessage.avatarUrl, therapistMessage.audioUrl);
      
      return therapistMessage;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, enableTTS, enableAvatar, onAvatarResponse, onAvatarGenerationStart]);

  /** Add a local-only message (used for assessment flow, no AI call) */
  const addLocalMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  // Load messages from an array (used when switching sessions)
  const loadMessages = useCallback((msgs: ChatMessage[]) => {
    setMessages(msgs);
    setError(null);
  }, []);

  const getLastUserEmotion = useCallback((): string | undefined => {
    const userMessages = messages.filter(msg => msg.role === 'user');
    return userMessages[userMessages.length - 1]?.emotion;
  }, [messages]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    addLocalMessage,
    clearMessages,
    loadMessages,
    getLastUserEmotion,
  };
};
