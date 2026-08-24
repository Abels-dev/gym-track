import { create } from "zustand";
import { soundEffects } from "../lib/audio";

interface RestTimerState {
  isActive: boolean;
  initialSeconds: number;
  secondsLeft: number;
  isPaused: boolean;
  isMuted: boolean;
  isMinimized: boolean;
  targetEndTime: number | null;

  startTimer: (seconds: number) => void;
  stopTimer: () => void;
  togglePause: () => void;
  adjustTime: (deltaSeconds: number) => void;
  toggleMute: () => void;
  setMinimized: (minimized: boolean) => void;
  tick: () => void;
}

export const useRestTimerStore = create<RestTimerState>((set, get) => ({
  isActive: false,
  initialSeconds: 90,
  secondsLeft: 90,
  isPaused: false,
  isMuted: false,
  isMinimized: false,
  targetEndTime: null,

  startTimer: (seconds: number) => {
    const sec = Math.max(1, seconds);
    set({
      isActive: true,
      initialSeconds: sec,
      secondsLeft: sec,
      isPaused: false,
      targetEndTime: Date.now() + sec * 1000,
    });
  },

  stopTimer: () => {
    set({
      isActive: false,
      targetEndTime: null,
      isPaused: false,
    });
  },

  togglePause: () => {
    const state = get();
    if (!state.isActive) return;

    if (state.isPaused) {
      set({
        isPaused: false,
        targetEndTime: Date.now() + state.secondsLeft * 1000,
      });
    } else {
      set({
        isPaused: true,
        targetEndTime: null,
      });
    }
  },

  adjustTime: (deltaSeconds: number) => {
    const state = get();
    if (!state.isActive) return;
    const newSeconds = Math.max(0, state.secondsLeft + deltaSeconds);
    set({
      secondsLeft: newSeconds,
      initialSeconds: Math.max(state.initialSeconds, newSeconds),
      targetEndTime: state.isPaused ? null : Date.now() + newSeconds * 1000,
    });
  },

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  setMinimized: (isMinimized: boolean) => set({ isMinimized }),

  tick: () => {
    const state = get();
    if (!state.isActive || state.isPaused) return;

    if (state.targetEndTime) {
      const remaining = Math.max(0, Math.ceil((state.targetEndTime - Date.now()) / 1000));
      
      // Play audio countdown ticks
      if (!state.isMuted) {
        if (remaining >= 1 && remaining <= 3 && state.secondsLeft !== remaining) {
          soundEffects.playTick();
        } else if (remaining === 0 && state.secondsLeft !== 0) {
          soundEffects.playCompletion();
        }
      }

      // Haptic vibration feedback on completion
      if (remaining === 0 && state.secondsLeft > 0) {
        if (typeof window !== "undefined" && "navigator" in window && navigator.vibrate) {
          try {
            navigator.vibrate([200, 100, 200]);
          } catch {}
        }
      }

      set({ secondsLeft: remaining });
    }
  },
}));
