"use client";

import { useEffect, useState } from "react";
import { Timer, X, Plus, Minus, Bell, BellOff } from "lucide-react";

interface RestTimerProps {
  initialSeconds: number;
  onClose: () => void;
}

export function RestTimer({ initialSeconds, onClose }: RestTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (isPaused || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!isMuted && typeof window !== "undefined" && "navigator" in window && navigator.vibrate) {
            try {
              navigator.vibrate([200, 100, 200]);
            } catch {
              // ignore vibration error
            }
          }
          return 0;
        }
        return prev - 1;
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

  const progressPercent = Math.min(100, Math.max(0, (secondsLeft / Math.max(1, initialSeconds)) * 100));

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-96 bg-surface/95 backdrop-blur-md border border-border-strong/50 shadow-2xl rounded-2xl p-4 z-40 animate-in fade-in slide-in-from-bottom-5 duration-200">
      {/* Progress Bar */}
      <div className="w-full bg-border/40 h-1 rounded-full overflow-hidden mb-3">
        <div
          className="bg-primary h-full transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${secondsLeft === 0 ? "bg-tag-green-bg text-tag-green-text border-tag-green-text/20 animate-pulse" : "bg-primary/10 text-primary border-border"}`}>
            <Timer size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider opacity-60">
              {secondsLeft === 0 ? "Rest Complete!" : "Rest Timer"}
            </div>
            <div className="text-2xl font-mono font-semibold tracking-tight">
              {formatTime(secondsLeft)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => adjustTime(-30)}
            title="-30 seconds"
            className="p-2 bg-background hover:bg-border/40 border border-border rounded-lg text-xs font-medium transition-colors"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={() => adjustTime(30)}
            title="+30 seconds"
            className="p-2 bg-background hover:bg-border/40 border border-border rounded-lg text-xs font-medium transition-colors"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => setIsMuted((m) => !m)}
            title={isMuted ? "Unmute" : "Mute"}
            className="p-2 bg-background hover:bg-border/40 border border-border rounded-lg text-xs font-medium transition-colors opacity-70 hover:opacity-100"
          >
            {isMuted ? <BellOff size={14} /> : <Bell size={14} />}
          </button>
          <button
            onClick={onClose}
            title="Dismiss timer"
            className="p-2 bg-background hover:bg-tag-red-bg hover:text-tag-red-text border border-border rounded-lg text-xs font-medium transition-colors ml-1"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
