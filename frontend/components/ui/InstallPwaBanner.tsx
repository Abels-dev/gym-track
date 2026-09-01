"use client";

import { useEffect } from "react";
import { X, Smartphone } from "lucide-react";
import { usePwaStore } from "../../store/pwaStore";

export function InstallPwaBanner() {
  const {
    deferredPrompt,
    isBannerDismissed,
    isStandalone,
    initPwa,
    dismissBanner,
    promptInstall,
  } = usePwaStore();

  useEffect(() => {
    initPwa();
  }, [initPwa]);

  // Don't show if dismissed within 7 days, already installed, or browser doesn't offer prompt
  if (!deferredPrompt || isBannerDismissed || isStandalone) {
    return null;
  }

  return (
    <div className="fixed top-16 md:top-6 right-4 left-4 md:left-auto md:w-96 z-40 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-surface/95 backdrop-blur-md border border-border shadow-xl rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
            <Smartphone size={20} />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">
              Install Gym Track
            </h4>
            <p className="text-xs opacity-70 mt-0.5">
              Add to home screen for full offline gym tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => promptInstall()}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
          >
            Install
          </button>
          <button
            onClick={dismissBanner}
            title="Dismiss banner for 7 days"
            className="p-1.5 text-foreground/40 hover:text-foreground rounded-lg transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
