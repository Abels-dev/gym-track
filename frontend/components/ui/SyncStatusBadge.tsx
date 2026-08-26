"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { syncQueue } from "../../lib/syncQueue";

export function SyncStatusBadge() {
  const [status, setStatus] = useState({
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
  });
  const [showSyncedSuccess, setShowSyncedSuccess] = useState(false);

  useEffect(() => {
    let prevSyncing = false;
    let prevPending = 0;
    let timer: NodeJS.Timeout | null = null;

    const unsubscribe = syncQueue.subscribe((newStatus) => {
      // If we just finished syncing queued items
      if (prevSyncing && !newStatus.isSyncing && newStatus.isOnline && prevPending > 0) {
        setShowSyncedSuccess(true);
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          setShowSyncedSuccess(false);
        }, 2500);
      }

      prevSyncing = newStatus.isSyncing;
      prevPending = newStatus.pendingCount;
      setStatus(newStatus);
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  // When fully online and not syncing, only display if the temporary success banner is active
  if (status.isOnline && !status.isSyncing && !showSyncedSuccess) {
    return null;
  }

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-none">
      <div className="flex items-center gap-2 px-3.5 py-1.5 bg-surface/95 backdrop-blur-md border border-border shadow-lg rounded-full text-xs font-medium pointer-events-auto">
        {!status.isOnline ? (
          <>
            <WifiOff size={14} className="text-tag-yellow-text animate-pulse" />
            <span className="text-tag-yellow-text font-semibold">
              Offline Mode
            </span>
            {status.pendingCount > 0 && (
              <span className="opacity-60 text-[11px]">
                ({status.pendingCount} {status.pendingCount === 1 ? "change" : "changes"} saved locally)
              </span>
            )}
          </>
        ) : status.isSyncing ? (
          <>
            <RefreshCw size={14} className="text-primary animate-spin" />
            <span className="text-primary font-semibold">
              Syncing {status.pendingCount} {status.pendingCount === 1 ? "change" : "changes"}...
            </span>
          </>
        ) : showSyncedSuccess ? (
          <>
            <CheckCircle2 size={14} className="text-tag-green-text" />
            <span className="text-tag-green-text font-semibold">
              All changes synced
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}
