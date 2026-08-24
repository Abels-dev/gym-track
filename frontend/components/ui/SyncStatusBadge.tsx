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

  useEffect(() => {
    const unsubscribe = syncQueue.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  if (status.isOnline && !status.isSyncing && status.pendingCount === 0) {
    return null;
  }

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none">
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
              Syncing {status.pendingCount} changes...
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 size={14} className="text-tag-green-text" />
            <span className="text-tag-green-text font-semibold">
              All changes synced
            </span>
          </>
        )}
      </div>
    </div>
  );
}
