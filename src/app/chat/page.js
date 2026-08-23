"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { plants, suggestedPrompts } from "@/lib/mockData";
import { useFirebaseValue } from "@/hooks/useFirebaseValue";
import { useSpeech } from "@/hooks/useSpeech";
import {
  Send,
  Mic,
  MicOff,
  Plus,
  Droplets,
  Volume2,
  VolumeOff,
} from "lucide-react";

export default function ChatPage() {
  const currentPlant = plants[0];
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [audioMode, setAudioMode] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("groot-chat");
      if (saved) setMessages(JSON.parse(saved));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem("groot-chat", JSON.stringify(messages));
  }, [messages, hydrated]);

  const fbMoisture = useFirebaseValue("current/moisture", null);
  const fbTemperature = useFirebaseValue("current/temperature", null);
  const fbHumidity = useFirebaseValue("current/humidity", null);
  const fbStatus = useFirebaseValue("current/status", null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = useCallback(async (text) => {
    const msg = typeof text === "string" ? text : inputText;
    if (!msg.trim() || isLoading) return;
    setInputText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: msg.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg.trim(),
          context: {
            moisture: fbMoisture,
            temperature: fbTemperature,
            humidity: fbHumidity,
            status: fbStatus,
          },
          history: messages.slice(-6),
        }),
      });
      const data = res.ok ? await res.json() : null;
      const replyText = data?.reply || "...my leaves are quiet just now.";

      const aiMsg = {
        id: `msg-${Date.now() + 1}`,
        sender: "ai",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      if (audioMode) say(replyText);
    } catch {
      const aiMsg = {
        id: `msg-${Date.now() + 1}`,
        sender: "ai",
        text: "...my leaves are quiet just now.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }
    setIsLoading(false);
  }, [inputText, isLoading, fbMoisture, fbTemperature, fbHumidity, fbStatus, messages, audioMode]);

  const { supported, listening, interim, start, stop, say } = useSpeech(handleSend);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (prompt) => {
    setInputText(prompt);
    textareaRef.current?.focus();
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const toggleAudio = () => {
    const on = !audioMode;
    setAudioMode(on);
    if (on && "speechSynthesis" in window) {
      const warmup = new SpeechSynthesisUtterance(" ");
      warmup.volume = 0;
      window.speechSynthesis.speak(warmup);
    }
  };

  return (
    <main className="flex flex-col max-w-5xl mx-auto w-full relative bg-surface-container-low rounded-3xl border border-surface-dim/50 shadow-sm m-4" style={{ height: "calc(100vh - 7rem)" }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-50 z-0 rounded-3xl">
        <div className="absolute -top-12 -right-12 w-96 h-96 rounded-full bg-primary-container/15 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-96 h-96 rounded-full bg-secondary-container/15 blur-3xl" />
      </div>

      {/* Chat Header — pinned */}
      <div className="flex-shrink-0 px-6 py-4 flex justify-between items-center z-10 bg-white/75 backdrop-blur-md border-b border-surface-dim/60 rounded-t-3xl">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-full bg-surface-container-low overflow-hidden relative shadow-xs border-2 border-white">
            <img
              src={currentPlant.avatarUrl}
              alt={currentPlant.name}
              className="w-full h-full object-cover"
            />
            <div
              className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                currentPlant.status === "thirsty" || currentPlant.status === "critical"
                  ? "bg-secondary"
                  : "bg-primary"
              }`}
            />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-on-surface leading-none">
              {currentPlant.name}
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-container/20 text-on-secondary-container font-body-sm text-[11px] font-semibold flex items-center gap-1">
                <Droplets className="w-3 h-3" />
                <span>{currentPlant.statusLabel}</span>
              </span>
              <span className="font-body-sm text-xs text-outline">
                {currentPlant.species}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleAudio}
            title={audioMode ? "Disable audio mode" : "Enable audio mode"}
            className={`p-2.5 rounded-full transition-colors squish-press cursor-pointer ${
              audioMode
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
            }`}
          >
            {audioMode ? <Volume2 className="w-4 h-4" /> : <VolumeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-primary text-primary font-body-sm font-semibold text-xs hover:bg-primary-container/10 transition-colors squish-press cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </div>

      {/* Messages — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-6 z-10 flex flex-col gap-6 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center mb-4">
              <img
                src={currentPlant.avatarUrl}
                alt={currentPlant.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            </div>
            <h3 className="font-display font-bold text-xl text-on-surface mb-1">
              Say hello to {currentPlant.name}
            </h3>
            <p className="font-body-sm text-sm text-on-surface-variant max-w-sm">
              Your plant companion is here to share how it's feeling. Ask about its soil, the temperature, or just say hi.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isAI = msg.sender === "ai";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] sm:max-w-[80%] ${
                isAI ? "self-start" : "self-end flex-row-reverse"
              }`}
            >
              {isAI && (
                <div className="w-8 h-8 rounded-full bg-surface-container-low overflow-hidden flex-shrink-0 mt-auto border border-surface-dim/50 hidden sm:block">
                  <img
                    src={currentPlant.avatarUrl}
                    alt={currentPlant.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div
                className={`p-4 sm:p-5 font-body-md text-[15px] leading-relaxed shadow-xs ${
                  isAI
                    ? "bg-white chat-bubble-ai border border-surface-dim/50 text-on-surface"
                    : "bg-primary-container chat-bubble-user text-on-primary-container font-medium"
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
                <div
                  className={`text-[10px] mt-2 text-right ${
                    isAI ? "text-outline" : "text-on-primary-container/70"
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-[80%] self-start">
            <div className="w-8 h-8 rounded-full bg-surface-container-low overflow-hidden flex-shrink-0 mt-auto border border-surface-dim/50 hidden sm:block">
              <img
                src={currentPlant.avatarUrl}
                alt={currentPlant.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="bg-white p-4 chat-bubble-ai shadow-xs border border-surface-dim/50 flex items-center gap-1.5 h-12">
              <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" />
              <div
                className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-2 h-2 rounded-full bg-primary/80 animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area — pinned */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-3 pb-5 z-10 bg-surface-container-low relative border-t border-surface-dim/30 rounded-b-3xl">
        <div className="flex gap-2 overflow-x-auto pb-3.5 hide-scrollbar">
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptClick(prompt)}
              className="flex-shrink-0 px-4 py-2 rounded-full bg-surface-container-high/70 hover:bg-primary-container/20 hover:text-primary transition-all text-on-surface-variant font-body-sm text-xs font-medium border border-transparent hover:border-primary-container/30 squish-press cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {listening && interim && (
          <div className="mb-2 px-4 py-2 rounded-xl bg-surface-container-high/70 text-on-surface-variant font-body-sm text-sm italic">
            {interim}
          </div>
        )}

        <div className="relative bg-white rounded-3xl shadow-sm border border-surface-dim focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all flex items-end p-2">
          {audioMode && (
            <button
              onClick={() => {
                if (!supported) return;
                listening ? stop() : start();
              }}
              title={listening ? "Stop listening" : "Speak to Groot"}
              className={`p-3 rounded-full transition-colors squish-press flex-shrink-0 cursor-pointer ${
                listening
                  ? "bg-error text-on-error animate-pulse"
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
              } ${!supported ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {listening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          )}

          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              listening
                ? interim || "Listening..."
                : `Share your thoughts with ${currentPlant.name}...`
            }
            className="w-full bg-transparent border-none focus:outline-hidden resize-none font-body-md text-[15px] py-3 px-2 max-h-32 text-on-surface placeholder:text-on-surface-variant/50"
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
            aria-label="Send message"
            className="p-3 bg-primary disabled:opacity-40 hover:bg-[#495524] text-on-primary rounded-full squish-press transition-colors flex-shrink-0 shadow-xs ml-2 mb-0.5 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center mt-3">
          <button className="font-body-sm text-xs text-on-surface-variant hover:text-primary underline decoration-primary/30 underline-offset-4 transition-colors cursor-pointer">
            Need more support? Here are some real resources & mindful tools.
          </button>
        </div>
      </div>
    </main>
  );
}
