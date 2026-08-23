"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const VOICE_PREFERENCES = ["Google UK English Female", "Microsoft Aria", "Samantha"];

export function useSpeech(onFinal) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recognition = useRef(null);
  const voice = useRef(null);
  const onFinalRef = useRef(onFinal);

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  useEffect(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setSupported(Boolean(Ctor) && "speechSynthesis" in window);
    if (!Ctor) return;

    const r = new Ctor();
    r.continuous = false;
    r.interimResults = true;
    r.lang = "en-US";

    r.onresult = (e) => {
      let text = "";
      let isFinal = false;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        if (e.results[i].isFinal) isFinal = true;
      }
      setInterim(text);
      if (isFinal) {
        setInterim("");
        onFinalRef.current(text.trim());
      }
    };
    r.onerror = (e) => {
      setListening(false);
      if (e.error === "not-allowed") {
        alert("Microphone access was blocked. Please allow microphone permission in your browser settings and try again.");
      }
    };
    r.onend = () => setListening(false);
    recognition.current = r;

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      voice.current =
        VOICE_PREFERENCES.map((n) => voices.find((v) => v.name.includes(n))).find(Boolean) ??
        voices.find((v) => v.lang.startsWith("en")) ??
        null;
    };
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
  }, []);

  const start = useCallback(() => {
    if (!recognition.current) return;
    try {
      const warmup = new SpeechSynthesisUtterance(" ");
      warmup.volume = 0;
      window.speechSynthesis.speak(warmup);
      setListening(true);
      recognition.current.start();
    } catch {
      setListening(false);
    }
  }, []);

  const stop = useCallback(() => {
    recognition.current?.stop();
    setListening(false);
  }, []);

  const say = useCallback((text) => {
    if (!("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    const u = new SpeechSynthesisUtterance(text);
    if (voice.current) u.voice = voice.current;
    u.rate = 1.0;
    u.pitch = 1.05;
    window.speechSynthesis.speak(u);
  }, []);

  return { supported, listening, interim, start, stop, say };
}
