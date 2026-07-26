"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";

interface StudySessionContextType {
  sessionId: string | null;
  duration: number;
  isConnected: boolean;
}

const StudySessionContext = createContext<StudySessionContextType>({
  sessionId: null,
  duration: 0,
  isConnected: false,
});

export function StudySessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const reconnectAttemptsRef = useRef<number>(0);

  const getWsBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_WS_URL) {
      return process.env.NEXT_PUBLIC_WS_URL;
    }
    if (typeof window !== "undefined") {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = process.env.NEXT_PUBLIC_API_URL
        ? process.env.NEXT_PUBLIC_API_URL.replace(/^https?:\/\//, "").replace(/\/$/, "")
        : "localhost:8000";
      return `${protocol}//${host}`;
    }
    return "ws://localhost:8000";
  };

  useEffect(() => {
    isMountedRef.current = true;

    const connectWebSocket = () => {
      if (typeof window === "undefined" || !isMountedRef.current) return;

      const token = localStorage.getItem("access_token");
      if (!token) {
        setIsConnected(false);
        return;
      }

      // Close existing socket if open or connecting
      if (socketRef.current) {
        if (
          socketRef.current.readyState === WebSocket.OPEN ||
          socketRef.current.readyState === WebSocket.CONNECTING
        ) {
          return; // Already connecting or connected
        }
        socketRef.current.close(1000, "Reconnecting");
        socketRef.current = null;
      }

      const wsBase = getWsBaseUrl();
      const fullWsUrl = `${wsBase}/ws/study-session/?token=${encodeURIComponent(token)}`;

      try {
        const socket = new WebSocket(fullWsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          if (!isMountedRef.current) return;
          setIsConnected(true);
          reconnectAttemptsRef.current = 0; // Reset attempts on clean connection
          startTicking();
        };

        socket.onmessage = (event) => {
          if (!isMountedRef.current) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === "session_connected") {
              setSessionId(data.session_id);
              setDuration(data.duration || 0);
            } else if (data.type === "session_updated") {
              setDuration(data.duration);
            } else if (data.type === "error") {
              console.warn("[StudySession WS]", data.message);
            }
          } catch (err) {
            console.warn("StudySession WS JSON parse error:", err);
          }
        };

        socket.onclose = (event: CloseEvent) => {
          if (!isMountedRef.current) return;
          setIsConnected(false);
          stopTicking();

          // Stop reconnecting for Auth failures (4001/4003/1008) or Normal closures (1000)
          if (
            event.code === 1000 ||
            event.code === 4001 ||
            event.code === 4003 ||
            event.code === 1008
          ) {
            return;
          }

          // Cap reconnect attempts to 3 max with backoff (3s, 6s, 12s)
          if (reconnectAttemptsRef.current < 3) {
            reconnectAttemptsRef.current += 1;
            const delay = 3000 * Math.pow(2, reconnectAttemptsRef.current - 1);
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = setTimeout(() => {
              if (isMountedRef.current && localStorage.getItem("access_token")) {
                connectWebSocket();
              }
            }, delay);
          }
        };

        socket.onerror = () => {
          if (!isMountedRef.current) return;
          setIsConnected(false);
        };
      } catch (err) {
        console.warn("Failed to initialize StudySession WebSocket:", err);
      }
    };

    const startTicking = () => {
      stopTicking();
      if (document.visibilityState === "visible") {
        timerRef.current = setInterval(() => {
          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: "tick", seconds: 30 }));
          }
        }, 30000);
      }
    };

    const stopTicking = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopTicking();
      } else if (document.visibilityState === "visible") {
        startTicking();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    connectWebSocket();

    return () => {
      isMountedRef.current = false;
      stopTicking();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (socketRef.current) {
        socketRef.current.close(1000, "Component unmounted");
        socketRef.current = null;
      }
    };
  }, []);

  return (
    <StudySessionContext.Provider value={{ sessionId, duration, isConnected }}>
      {children}
    </StudySessionContext.Provider>
  );
}

export function useStudySessionTracker() {
  return useContext(StudySessionContext);
}
