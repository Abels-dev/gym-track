"use client";

import { useEffect, useState } from "react";
import {
  Timer,
  X,
  Plus,
  Minus,
  Bell,
  BellOff,
  Minimize2,
  Maximize2,
  Play,
  Pause,
  CheckCircle2,
} from "lucide-react";
import { soundEffects } from "../../lib/audio";

interface RestTimerProps {
  initialSeconds: number;
  onClose: () => void;
}

export function RestTimer({ initialSeconds, onClose }: RestTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setIsPaused(false);
  }, [initialSeconds]);

  useEffect(() => {
    if (isPaused || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;

        // Audio countdown chimes
        if (!isMuted) {
          if (next >= 1 && next <= 3) {
            soundEffects.playTick();
          } else if (next === 0) {
            soundEffects.playCompletion();
          }
        }

        // Haptic feedback on complete
        if (next === 0) {
          clearInterval(interval);
          if (
            typeof window !== "undefined" &&
            "navigator" in window &&
            navigator.vibrate
          ) {
            try {
              navigator.vibrate([200, 100, 200]);
            } catch {
              // ignore vibration error
            }
          }
          return 0;
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, secondsLeft, isMuted]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const adjustTime = (delta: number) => {
    setSecondsLeft((prev) => Math.max(0, prev + delta));
  };

  const progressPercent = Math.min(
    100,
    Math.max(0, (secondsLeft / Math.max(1, initialSeconds)) * 100)
  );

  // -------------------------------------------------------------
  // VIEW 1: MINIMIZED FLOATING PILL
  // -------------------------------------------------------------
  if (isMinimized) {
    return (
      <div className="fixed bottom-24 md:bottom-8 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div
          className={`flex items-center gap-2.5 px-4 py-2.5 bg-surface/95 backdrop-blur-md border shadow-xl rounded-full transition-all ${
            secondsLeft === 0
              ? "border-tag-green-text bg-tag-green-bg/30 text-tag-green-text animate-pulse"
              : "border-border text-foreground"
          }`}
        >
          <button
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            title="Expand timer"
          >
            <Timer size={16} className={secondsLeft === 0 ? "text-tag-green-text" : "text-primary"} />
            <span className="font-mono text-sm font-semibold tracking-tight">
              {secondsLeft === 0 ? "Done!" : formatTime(secondsLeft)}
            </span>
          </button>

          <div className="w-[1px] h-4 bg-border/80 mx-0.5" />

          <button
            onClick={() => adjustTime(30)}
            title="+30s"
            className="p-1 hover:bg-border/40 rounded-full text-xs font-semibold opacity-70 hover:opacity-100 transition-colors"
          >
            +30s
          </button>

          <button
            onClick={() => setIsMinimized(false)}
            title="Expand timer"
            className="p-1 text-foreground/50 hover:text-foreground hover:bg-border/30 rounded-full transition-colors"
          >
            <Maximize2 size={13} />
          </button>

          <button
            onClick={onClose}
            title="Dismiss"
            className="p-1 text-foreground/40 hover:text-tag-red-text hover:bg-tag-red-bg rounded-full transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: EXPANDED FULL REST TIMER CARD
  // -------------------------------------------------------------
  return (
    <div className="fixed bottom-24 md:bottom-8 right-4 left-4 md:left-auto md:w-96 bg-surface/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-4 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
      {/* Progress Bar */}
      <div className="w-full bg-border/40 h-1 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            secondsLeft === 0 ? "bg-tag-green-text" : "bg-primary"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border transition-all ${
              secondsLeft === 0
                ? "bg-tag-green-bg text-tag-green-text border-tag-green-text/20 animate-pulse"
                : "bg-primary/10 text-primary border-border"
            }`}
          >
            {secondsLeft === 0 ? <CheckCircle2 size={20} /> : <Timer size={20} />}
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider opacity-60">
              {secondsLeft === 0 ? "Rest Completed" : isPaused ? "Paused" : "Rest Timer"}
            </div>
            <div
              className={`text-2xl font-mono font-semibold tracking-tight ${
                secondsLeft === 0 ? "text-tag-green-text" : ""
              }`}
            >
              {formatTime(secondsLeft)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => adjustTime(-30)}
            title="-30 seconds"
            className="p-2 bg-background hover:bg-border/40 border border-border rounded-xl text-xs font-medium transition-colors"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={() => adjustTime(30)}
            title="+30 seconds"
            className="p-2 bg-background hover:bg-border/40 border border-border rounded-xl text-xs font-medium transition-colors"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => setIsPaused((p) => !p)}
            title={isPaused ? "Resume timer" : "Pause timer"}
            className="p-2 bg-background hover:bg-border/40 border border-border rounded-xl text-xs font-medium transition-colors opacity-80 hover:opacity-100"
          >
            {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} />}
          </button>
          <button
            onClick={() => setIsMuted((m) => !m)}
            title={isMuted ? "Unmute countdown sound" : "Mute countdown sound"}
            className={`p-2 bg-background border border-border rounded-xl text-xs font-medium transition-colors ${
              isMuted
                ? "text-tag-red-text bg-tag-red-bg/30"
                : "text-foreground opacity-70 hover:opacity-100"
            }`}
          >
            {isMuted ? <BellOff size={14} /> : <Bell size={14} />}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            title="Minimize into floating pill"
            className="p-2 bg-background hover:bg-border/40 border border-border rounded-xl text-xs font-medium transition-colors opacity-70 hover:opacity-100"
          >
            <Minimize2 size={14} />
          </button>
          <button
            onClick={onClose}
            title="Dismiss timer"
            className="p-2 bg-background hover:bg-tag-red-bg hover:text-tag-red-text border border-border rounded-xl text-xs font-medium transition-colors ml-0.5"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
