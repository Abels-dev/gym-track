"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CloudOff, Check } from "lucide-react";
import { syncQueue } from "../../lib/syncQueue";
import { useAuthStore } from "../../store/authStore";

export function SyncStatusBadge() {
  const pathname = usePathname();
  const token = useAuthStore((state) => state.accessToken);

  const [showSyncedBriefly, setShowSyncedBriefly] = useState(false);
  const [showOfflineBriefly, setShowOfflineBriefly] = useState(false);

  const isOnlineRef = useRef<boolean | null>(null);
  const prevPendingCountRef = useRef<number>(0);
  const offlineTimerRef = useRef<NodeJS.Timeout | null>(null);
  const syncedTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = syncQueue.subscribe((newStatus) => {
      const prevOnline = isOnlineRef.current;
      const prevCount = prevPendingCountRef.current;

      // First run: initialize tracking refs
      if (prevOnline === null) {
        isOnlineRef.current = newStatus.isOnline;
        prevPendingCountRef.current = newStatus.pendingCount;

        // If initially loaded while offline, show briefly once
        if (!newStatus.isOnline) {
          setShowOfflineBriefly(true);
          if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
          offlineTimerRef.current = setTimeout(() => {
            setShowOfflineBriefly(false);
          }, 3500);
        }
        return;
      }

      // Transitioned: Online -> Offline OR new item saved to queue while offline
      if (
        (prevOnline && !newStatus.isOnline) ||
        (!newStatus.isOnline && newStatus.pendingCount > prevCount)
      ) {
        if (syncedTimerRef.current) clearTimeout(syncedTimerRef.current);
        setShowSyncedBriefly(false);
        setShowOfflineBriefly(true);

        if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
        offlineTimerRef.current = setTimeout(() => {
          setShowOfflineBriefly(false);
        }, 3500);
      }
      // Transitioned: Offline -> Online
      else if (!prevOnline && newStatus.isOnline) {
        if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
        setShowOfflineBriefly(false);
        setShowSyncedBriefly(true);

        if (syncedTimerRef.current) clearTimeout(syncedTimerRef.current);
        syncedTimerRef.current = setTimeout(() => {
          setShowSyncedBriefly(false);
        }, 2200);
      }

      isOnlineRef.current = newStatus.isOnline;
      prevPendingCountRef.current = newStatus.pendingCount;
    });

    return () => {
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
      if (syncedTimerRef.current) clearTimeout(syncedTimerRef.current);
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

  // 100% invisible unless briefly triggered
  if (!showOfflineBriefly && !showSyncedBriefly) {
    return null;
  }

  return (
    <div className="fixed top-3 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-top-1 duration-200 pointer-events-none">
      <div
        className={`flex items-center gap-1.5 px-3 py-1 backdrop-blur-md border rounded-full text-xs font-medium shadow-md transition-all ${
          showOfflineBriefly
            ? "bg-amber-500/10 border-amber-500/30 text-amber-500 dark:text-amber-400"
            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
        }`}
      >
        {showOfflineBriefly ? (
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
