"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get, set, del } from "idb-keyval";
import { useState, useEffect } from "react";
import { setSyncQueryClient } from "../lib/syncQueue";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
            staleTime: 1000 * 60 * 5, // 5 minutes
            networkMode: "offlineFirst",
            refetchOnReconnect: false, // Prevents race condition: syncQueue flushes before queries refetch
          },
          mutations: {
            networkMode: "offlineFirst",
          },
        },
      })
  );

  const [persister, setPersister] = useState<any>(null);

  useEffect(() => {
    // Connect QueryClient to SyncQueue so successful flushes trigger cache invalidation
    setSyncQueryClient(queryClient);

    if (typeof window !== "undefined") {
      setPersister(
        createAsyncStoragePersister({
          storage: {
            getItem: async (key) => await get(key),
            setItem: async (key, value) => await set(key, value),
            removeItem: async (key) => await del(key),
          },
          throttleTime: 1000,
        })
      );
    }
  }, [queryClient]);

  if (!persister) {
    // Render without persistence while hydrating/loading on server
    return <>{children}</>;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
