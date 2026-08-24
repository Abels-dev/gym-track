"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";

export function InstallPwaBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed previously
    const dismissed = localStorage.getItem("gym_track_pwa_dismissed");
    if (dismissed) {
      setIsDismissed(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("gym_track_pwa_dismissed", "true");
  };

  if (!deferredPrompt || isDismissed) {
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
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            title="Dismiss banner"
            className="p-1.5 text-foreground/40 hover:text-foreground rounded-lg transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
