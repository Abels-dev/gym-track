"use client";

import { X, Share, PlusSquare, Smartphone, MoreVertical } from "lucide-react";
import { usePwaStore } from "../../store/pwaStore";
import { useEffect } from "react";

export function InstallInstructionsModal() {
  const { showInstructionsModal, setShowInstructionsModal, isIOS } = usePwaStore();

  useEffect(() => {
    if (showInstructionsModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showInstructionsModal]);

  if (!showInstructionsModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
        <button
          onClick={() => setShowInstructionsModal(false)}
          className="absolute top-4 right-4 p-1.5 text-foreground/50 hover:text-foreground rounded-lg transition-colors"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Smartphone size={22} />
          </div>
          <div>
            <h3 className="font-semibold text-base">Install Gym Track</h3>
            <p className="text-xs opacity-70">Add to your home screen</p>
          </div>
        </div>

        {isIOS ? (
          <div className="space-y-3.5 text-sm">
            <div className="flex items-start gap-3 p-3 bg-background/50 rounded-xl border border-border/50">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0 mt-0.5">
                1
              </span>
              <p className="text-xs leading-relaxed">
                Tap the <span className="font-semibold text-foreground">Share</span> icon{" "}
                <Share size={14} className="inline mx-1 text-primary" /> in your Safari bottom bar.
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 bg-background/50 rounded-xl border border-border/50">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0 mt-0.5">
                2
              </span>
              <p className="text-xs leading-relaxed">
                Scroll down and select{" "}
                <span className="font-semibold text-foreground">Add to Home Screen</span>{" "}
                <PlusSquare size={14} className="inline mx-1 text-primary" />.
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 bg-background/50 rounded-xl border border-border/50">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0 mt-0.5">
                3
              </span>
              <p className="text-xs leading-relaxed">
                Tap <span className="font-semibold text-foreground">Add</span> in the top right corner.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 text-sm">
            <div className="flex items-start gap-3 p-3 bg-background/50 rounded-xl border border-border/50">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0 mt-0.5">
                1
              </span>
              <p className="text-xs leading-relaxed">
                Tap the browser menu <MoreVertical size={14} className="inline mx-1 text-primary" /> (three dots in Chrome).
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 bg-background/50 rounded-xl border border-border/50">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0 mt-0.5">
                2
              </span>
              <p className="text-xs leading-relaxed">
                Select <span className="font-semibold text-foreground">Install App</span> or{" "}
                <span className="font-semibold text-foreground">Add to Home screen</span>.
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowInstructionsModal(false)}
          className="mt-6 w-full py-2.5 bg-primary text-primary-foreground font-medium text-xs rounded-xl hover:opacity-90 transition-opacity"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
