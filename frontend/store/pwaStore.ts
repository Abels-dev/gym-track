import { create } from "zustand";

interface PwaState {
  deferredPrompt: any | null;
  isStandalone: boolean;
  isBannerDismissed: boolean;
  isIOS: boolean;
  showInstructionsModal: boolean;
  initPwa: () => void;
  setDeferredPrompt: (prompt: any) => void;
  dismissBanner: () => void;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
  setShowInstructionsModal: (show: boolean) => void;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const DISMISS_KEY = "gym_track_pwa_dismissed_at";
const LEGACY_KEY = "gym_track_pwa_dismissed";

export const usePwaStore = create<PwaState>((set, get) => ({
  deferredPrompt: null,
  isStandalone: false,
  isBannerDismissed: true,
  isIOS: false,
  showInstructionsModal: false,

  initPwa: () => {
    if (typeof window === "undefined") return;

    // Check standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    // Check iOS
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    // Check 7-day dismiss cooldown
    let isDismissed = false;
    const dismissedAtStr = localStorage.getItem(DISMISS_KEY);
    const legacyDismissed = localStorage.getItem(LEGACY_KEY);

    if (dismissedAtStr) {
      const dismissedAt = parseInt(dismissedAtStr, 10);
      if (!isNaN(dismissedAt) && Date.now() - dismissedAt < SEVEN_DAYS_MS) {
        isDismissed = true;
      }
    } else if (legacyDismissed === "true") {
      // Migrate old permanent dismissal to a 7-day timestamp starting now
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
      localStorage.removeItem(LEGACY_KEY);
      isDismissed = true;
    }

    set({ isStandalone, isIOS, isBannerDismissed: isDismissed });

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      set({ deferredPrompt: e });
    };

    const handleAppInstalled = () => {
      set({ deferredPrompt: null, isStandalone: true, isBannerDismissed: true });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);
  },

  setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt }),

  dismissBanner: () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
      localStorage.removeItem(LEGACY_KEY);
    }
    set({ isBannerDismissed: true });
  },

  promptInstall: async () => {
    const { deferredPrompt, isStandalone } = get();

    if (isStandalone) {
      return "accepted";
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        set({ deferredPrompt: null, isBannerDismissed: true });
        return "accepted";
      }
      return "dismissed";
    }

    // If native prompt is not available (e.g. iOS Safari or unsupported browser), show modal
    set({ showInstructionsModal: true });
    return "unavailable";
  },

  setShowInstructionsModal: (show) => set({ showInstructionsModal: show }),
}));
