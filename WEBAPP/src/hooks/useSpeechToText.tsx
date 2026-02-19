import { useState, useEffect, useRef, useCallback } from "react";

// ── Web Speech API type declarations (not in default TS lib) ──
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

interface IWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

type OnResultCallback = (text: string) => void;

const useSpeechToText = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onEndCallbackRef = useRef<OnResultCallback | null>(null);

  useEffect(() => {
    const w = window as unknown as IWindow;
    const SpeechRecognitionCtor =
      w.SpeechRecognition || w.webkitSpeechRecognition;

    if (SpeechRecognitionCtor) {
      const recog = new SpeechRecognitionCtor();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = "en-US";

      recog.onstart = () => setIsListening(true);

      recog.onend = () => {
        setIsListening(false);
      };

      recog.onresult = (event: SpeechRecognitionEvent) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        // Fire the onEnd callback with the recognized text
        if (onEndCallbackRef.current) {
          onEndCallbackRef.current(text);
        }
      };

      recog.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current = recog;
    } else {
      alert("Browser does not support speech recognition. Try Chrome.");
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript("");
      recognitionRef.current.start();
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // Let the consumer register a callback for when speech recognition
  // produces a final result. This is used for auto-send.
  const setOnResult = useCallback((callback: OnResultCallback) => {
    onEndCallbackRef.current = callback;
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript: () => setTranscript(""),
    setOnResult,
  };
};

export default useSpeechToText;
