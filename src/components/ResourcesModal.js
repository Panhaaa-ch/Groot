"use client";

import { useState, useEffect } from "react";
import { X, Heart, Sparkles, ShieldCheck } from "lucide-react";

export default function ResourcesModal({ isOpen, onClose }) {
  const [breathPhase, setBreathPhase] = useState("Inhale");
  const [seconds, setSeconds] = useState(4);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev > 1) return prev - 1;
        setBreathPhase((current) => {
          if (current === "Inhale") return "Hold";
          if (current === "Hold") return "Exhale";
          if (current === "Exhale") return "Rest";
          return "Inhale";
        });
        return 4;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-surface-dim/50">
        <div className="flex items-center justify-between pb-4 border-b border-surface-dim/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary-container/15 text-primary">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-2xl text-on-surface">
              Botanical Calm & Support
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-high text-outline cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 mt-6">
          <div className="bg-surface rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-surface-dim/60 relative overflow-hidden">
            <div
              className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-1000 ${
                breathPhase === "Inhale"
                  ? "scale-110 bg-primary-container/30 text-primary"
                  : breathPhase === "Hold"
                  ? "scale-110 bg-primary/40 text-on-primary-fixed"
                  : breathPhase === "Exhale"
                  ? "scale-90 bg-secondary-container/30 text-secondary"
                  : "scale-90 bg-surface-container-high text-on-surface-variant"
              }`}
            >
              <div className="flex flex-col items-center">
                <span className="font-display font-bold text-lg">
                  {breathPhase}
                </span>
                <span className="font-body-md text-2xl font-bold">
                  {seconds}s
                </span>
              </div>
            </div>
            <p className="font-body-sm text-xs text-on-surface-variant mt-4 max-w-xs">
              4-4-4-4 Box Breathing: Root down like a deep forest tree and let
              your shoulders drop.
            </p>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-body-sm text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Helpful Mindful Links
            </h4>
            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-dim/50 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-body-sm font-semibold text-xs text-on-surface">
                  988 Suicide & Crisis Lifeline (US/Canada)
                </p>
                <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                  Free, confidential support 24/7. Call or text 988 or chat at
                  988lifeline.org
                </p>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-dim/50 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-body-sm font-semibold text-xs text-on-surface">
                  Crisis Text Line
                </p>
                <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                  Text HOME to 741741 to connect with a crisis counselor 24/7.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
