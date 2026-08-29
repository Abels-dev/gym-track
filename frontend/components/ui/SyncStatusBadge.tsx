"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CloudOff, Check } from "lucide-react";
import { syncQueue, SyncStatus } from "../../lib/syncQueue";
import { useAuthStore } from "../../store/authStore";

export function SyncStatusBadge() {
  const pathname = usePathname();
  const token = useAuthStore((state) => state.accessToken);

  const [status, setStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
  });
  const [showSyncedBriefly, setShowSyncedBriefly] = useState(false);

  useEffect(() => {
    let wasOffline = false;
    let timer: NodeJS.Timeout | null = null;

    const unsubscribe = syncQueue.subscribe((newStatus) => {
      // If we were offline and are now back online, show brief reassurance
      if (wasOffline && newStatus.isOnline) {
        setShowSyncedBriefly(true);
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          setShowSyncedBriefly(false);
        }, 2200);
      }

      if (!newStatus.isOnline) {
        wasOffline = true;
      } else if (!newStatus.isSyncing && newStatus.pendingCount === 0) {
        wasOffline = false;
      }

      setStatus(newStatus);
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const isAuthPage =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/forgot-password") ||
    pathname?.startsWith("/setup-profile");

  if (isAuthPage || !token) {
    return null;
  }

  // 100% invisible during normal online operation
  if (status.isOnline && !showSyncedBriefly) {
    return null;
  }

  return (
    <div className="fixed top-3 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-top-1 duration-200 pointer-events-none">
      <div
        className={`flex items-center gap-1.5 px-3 py-1 backdrop-blur-md border rounded-full text-xs font-medium shadow-md transition-all ${
          !status.isOnline
            ? "bg-amber-500/10 border-amber-500/30 text-amber-500 dark:text-amber-400"
            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
        }`}
      >
        {!status.isOnline ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <CloudOff size={13} className="shrink-0" />
            <span>Offline • Saved locally</span>
          </>
        ) : showSyncedBriefly ? (
          <>
            <Check size={13} className="shrink-0" />
            <span>Synced</span>
          </>
        ) : null}
      </div>
    </div>
  );
}
