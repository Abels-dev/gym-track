"use client";

import { get, set } from "idb-keyval";
import { apiClient } from "./api";
import { useAuthStore } from "../store/authStore";

const QUEUE_STORAGE_KEY = "gym_track_mutation_sync_queue";

export interface QueuedMutation {
  id: string;
  url: string;
  method: "POST" | "PATCH" | "DELETE" | "PUT";
  data?: any;
  timestamp: number;
  retryCount: number;
}

type SyncListener = (status: {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
}) => void;

class SyncQueueManager {
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;

  constructor() {
    if (typeof window !== "undefined") {
      // Clean up any stale or non-workout mutations from existing storage
      this.cleanupQueue();

      window.addEventListener("online", () => {
        this.notify();
        this.flushQueue();
      });

      window.addEventListener("offline", () => {
        this.notify();
      });
    }
  }

  isOnline(): boolean {
    if (typeof window === "undefined") return true;
    return navigator.onLine;
  }

  async getQueue(): Promise<QueuedMutation[]> {
    if (typeof window === "undefined") return [];
    try {
      const queue = (await get(QUEUE_STORAGE_KEY)) as QueuedMutation[];
      return queue || [];
    } catch {
      return [];
    }
  }

  private async saveQueue(queue: QueuedMutation[]): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      await set(QUEUE_STORAGE_KEY, queue);
      this.notify();
    } catch (e) {
      console.error("Failed to save sync queue to IndexedDB", e);
    }
  }

  async clearQueue(): Promise<void> {
    if (typeof window === "undefined") return;
    await set(QUEUE_STORAGE_KEY, []);
    this.notify();
  }

  private async cleanupQueue(): Promise<void> {
    try {
      const queue = await this.getQueue();
      const now = Date.now();
      // Only keep genuine workout set mutations less than 12 hours old
      const valid = queue.filter((item) => {
        const isAuth = item.url.includes("/auth/");
        const isOld = now - item.timestamp > 12 * 60 * 60 * 1000;
        const isTooManyRetries = item.retryCount >= 3;
        return !isAuth && !isOld && !isTooManyRetries;
      });

      if (valid.length !== queue.length) {
        await this.saveQueue(valid);
      }
    } catch {
      // Ignore cleanup error
    }
  }

  async enqueue(
    mutation: Omit<QueuedMutation, "id" | "timestamp" | "retryCount">
  ): Promise<QueuedMutation | null> {
    // Never enqueue authentication or non-workout routes
    if (mutation.url.includes("/auth/") || mutation.url.includes("/profile")) {
      return null;
    }

    const queue = await this.getQueue();
    const item: QueuedMutation = {
      ...mutation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
    };

    queue.push(item);
    await this.saveQueue(queue);

    if (this.isOnline()) {
      this.flushQueue();
    }

    return item;
  }

  async remove(id: string): Promise<void> {
    const queue = await this.getQueue();
    const updated = queue.filter((item) => item.id !== id);
    await this.saveQueue(updated);
  }

  async flushQueue(): Promise<{ syncedCount: number; failedCount: number }> {
    const token = useAuthStore.getState().accessToken;

    // Do not attempt background sync if not logged in or currently syncing or offline
    if (this.isSyncing || !this.isOnline() || !token) {
      return { syncedCount: 0, failedCount: 0 };
    }

    this.isSyncing = true;
    this.notify();

    let syncedCount = 0;
    let failedCount = 0;

    try {
      const queue = await this.getQueue();
      const remaining: QueuedMutation[] = [];

      for (const item of queue) {
        // Discard any auth items that were somehow queued
        if (item.url.includes("/auth/")) {
          continue;
        }

        try {
          await apiClient.request({
            url: item.url,
            method: item.method,
            data: item.data,
            headers: {
              "X-Offline-Synced": "true",
            },
          });
          syncedCount++;
        } catch (error: any) {
          // If server returned 4xx (client error / invalid resource), discard
          if (error.response && error.response.status >= 400 && error.response.status < 500) {
            console.warn(`Discarding invalid queued mutation ${item.url}`, error);
            failedCount++;
          } else {
            item.retryCount += 1;
            if (item.retryCount < 3) {
              remaining.push(item);
            }
            failedCount++;
          }
        }
      }

      await this.saveQueue(remaining);
    } finally {
      this.isSyncing = false;
      this.notify();
    }

    return { syncedCount, failedCount };
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    this.notifyListener(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async notify() {
    const queue = await this.getQueue();
    const status = {
      isOnline: this.isOnline(),
      isSyncing: this.isSyncing,
      pendingCount: queue.length,
    };

    this.listeners.forEach((listener) => listener(status));
  }

  private async notifyListener(listener: SyncListener) {
    const queue = await this.getQueue();
    listener({
      isOnline: this.isOnline(),
      isSyncing: this.isSyncing,
      pendingCount: queue.length,
    });
  }
}

export const syncQueue = new SyncQueueManager();
