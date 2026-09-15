"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicQueue } from "./types";

const EMPTY: PublicQueue = {
  nowServing: null,
  upNext: [],
  waiting: [],
  recent: [],
  all: [],
};

export function useQueue(options?: { onUpdate?: () => void }) {
  const [queue, setQueue] = useState<PublicQueue>(EMPTY);
  const [connected, setConnected] = useState(false);
  const onUpdateRef = useRef(options?.onUpdate);
  onUpdateRef.current = options?.onUpdate;

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/queue", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setQueue(data.queue);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let es: EventSource | null = null;
    let closed = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (closed) return;
      es = new EventSource("/api/events");

      es.addEventListener("queue", (ev) => {
        try {
          const data = JSON.parse((ev as MessageEvent).data) as PublicQueue;
          setQueue(data);
          setConnected(true);
          onUpdateRef.current?.();
        } catch {
          // ignore bad payloads
        }
      });

      es.onopen = () => setConnected(true);

      es.onerror = () => {
        setConnected(false);
        es?.close();
        if (!closed) {
          retryTimer = setTimeout(connect, 2000);
        }
      };
    };

    connect();
    refresh();

    return () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      es?.close();
    };
  }, [refresh]);

  return { queue, connected, refresh };
}

export function formatTicketNumber(n: number): string {
  return String(n).padStart(3, "0");
}
