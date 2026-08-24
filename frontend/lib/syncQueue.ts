"use client";

import { get, set } from "idb-keyval";
import { apiClient } from "./api";

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

  async enqueue(
    mutation: Omit<QueuedMutation, "id" | "timestamp" | "retryCount">
  ): Promise<QueuedMutation> {
    const queue = await this.getQueue();
    const item: QueuedMutation = {
      ...mutation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
    };

    queue.push(item);
    await this.saveQueue(queue);

    // If online, attempt immediate background flush
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
    if (this.isSyncing || !this.isOnline()) {
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
          // If server returned 4xx (client error / resource gone), don't keep stuck in queue
          if (error.response && error.response.status >= 400 && error.response.status < 500) {
            console.warn(`Discarding non-retryable queued mutation ${item.url}`, error);
            failedCount++;
          } else {
            // Transient or offline error: increment retryCount and keep
            item.retryCount += 1;
            if (item.retryCount < 5) {
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
