// hooks/useElectionStream.ts
"use client";

import { useEffect, useRef, useState } from "react";

export interface CandidateLive {
  id: string;
  name: string;
  party: string;
  partyColor: string;
  votes: number;
  percentage: number;
}

export interface ElectionStreamData {
  type: "snapshot" | "vote_update";
  electionId: string;
  totalVotes: number;
  candidates: CandidateLive[];
  timestamp: number;
}

export function useElectionStream(electionId: string | null) {
  const [data, setData] = useState<ElectionStreamData | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!electionId) return;

    const url = `/api/elections/${electionId}/stream`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => { setConnected(true); setError(null); };

    es.onmessage = (event) => {
      try {
        const parsed: ElectionStreamData = JSON.parse(event.data);
        setData(parsed);
      } catch {}
    };

    es.onerror = () => {
      setConnected(false);
      setError("Connection lost. Reconnecting...");
      // Browser auto-reconnects EventSource — no manual retry needed
    };

    return () => {
      es.close();
      esRef.current = null;
      setConnected(false);
    };
  }, [electionId]);

  const close = () => esRef.current?.close();

  return { data, connected, error, close };
}