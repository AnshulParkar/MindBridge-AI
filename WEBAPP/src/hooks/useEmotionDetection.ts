'use client';

import { useState, useRef, useEffect } from 'react';

interface EmotionDetectionOptions {
  interval?: number;
  minConfidence?: number;
}

interface DetectedEmotion {
  emotion: string;
  confidence: number;
}

export function useEmotionDetection(
  captureImage: () => string | null,
  options: EmotionDetectionOptions = {}
) {
  const { interval = 3000, minConfidence = 0.4 } = options;

  const [isDetecting, setIsDetecting] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<DetectedEmotion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const startDetection = () => {
    setIsDetecting(true);
    setError(null);

    const detect = async () => {
      try {
        const imageBase64 = captureImage();
        if (!imageBase64) {
          return;
        }

        // Call emotion detection API
        const response = await fetch('/api/analytics/assess', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: imageBase64,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to detect emotion');
        }

        const data = await response.json();

        if (
          isMountedRef.current &&
          data.emotion &&
          data.confidence >= minConfidence
        ) {
          setCurrentEmotion({
            emotion: data.emotion,
            confidence: data.confidence,
          });
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          console.error('Emotion detection error:', err);
        }
      }
    };

    // Run detection immediately
    detect();

    // Then run at interval
    intervalRef.current = setInterval(detect, interval);
  };

  const stopDetection = () => {
    setIsDetecting(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return {
    isDetecting,
    currentEmotion,
    error,
    startDetection,
    stopDetection,
  };
}
