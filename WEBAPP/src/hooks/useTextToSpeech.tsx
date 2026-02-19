import { useState, useCallback, useRef } from "react";

const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const onEndCallbackRef = useRef<(() => void) | null>(null);

  const speak = useCallback((text: string | undefined) => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 1.5; // Adjust rate for a more natural sound
      utterance.pitch = 1.5; // Adjust pitch for a more natural sound  
      utterance.volume = 1; // Max volume

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        // Fire callback so the app can auto-start listening
        if (onEndCallbackRef.current) {
          onEndCallbackRef.current();
        }
      };

      window.speechSynthesis.speak(utterance);
    } else {
      alert("Browser does not support text-to-speech.");
    }
  }, []);

  // Let the consumer register a callback for when speech finishes
  const setOnSpeechEnd = useCallback((callback: (() => void) | null) => {
    onEndCallbackRef.current = callback;
  }, []);

  return { speak, isSpeaking, setOnSpeechEnd };
};

export default useTextToSpeech;
