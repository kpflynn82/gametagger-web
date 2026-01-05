import { useEffect, useRef, useState, useCallback } from 'react';

export interface WSMessage {
  type: string;
  [key: string]: unknown;
}

export function useWebSocket(jobId: string | null) {
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!jobId) return;

    // Use Railway backend for WebSocket, local proxy in development
    const isLocalhost = window.location.hostname === 'localhost';
    const wsHost = isLocalhost
      ? window.location.host
      : 'gametagger-web-production.up.railway.app';
    const protocol = isLocalhost ? 'ws:' : 'wss:';
    const wsUrl = `${protocol}//${wsHost}/ws/job/${jobId}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WSMessage;
        setMessages((prev) => [...prev, message]);
        setLastMessage(message);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
  }, [jobId]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Send ping every 25 seconds to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      sendMessage('ping');
    }, 25000);

    return () => clearInterval(interval);
  }, [isConnected, sendMessage]);

  return {
    messages,
    lastMessage,
    isConnected,
    sendMessage,
    disconnect,
  };
}
