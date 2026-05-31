// lib/sse.ts - Server-Sent Events broadcaster
// A simple in-process pub/sub for vote updates.
//
// ⚠️  MULTI-INSTANCE / SERVERLESS LIMITATION
// This Map lives in a single Node.js process. If you run multiple app
// instances (e.g. Docker replicas, PM2 cluster, Vercel serverless),
// a vote arriving at Instance A will NOT wake up SSE clients connected
// to Instance B.
//
// Upgrade path: replace subscribe/unsubscribe/broadcast with a Redis
// pub/sub implementation (e.g. ioredis SUBSCRIBE / PUBLISH) so all
// instances share a single event bus.
//
// For a single-process VPS deployment (the current setup) this is fine.

type Subscriber = (data: string) => void;

const subscribers = new Map<string, Set<Subscriber>>();

export function subscribe(electionId: string, fn: Subscriber) {
  if (!subscribers.has(electionId)) {
    subscribers.set(electionId, new Set());
  }
  subscribers.get(electionId)!.add(fn);
}

export function unsubscribe(electionId: string, fn: Subscriber) {
  subscribers.get(electionId)?.delete(fn);
  if (subscribers.get(electionId)?.size === 0) {
    subscribers.delete(electionId);
  }
}

export function broadcast(electionId: string, payload: object) {
  const data = JSON.stringify(payload);
  subscribers.get(electionId)?.forEach((fn) => {
    try { fn(data); } catch {}
  });
}

export function subscriberCount(electionId: string) {
  return subscribers.get(electionId)?.size ?? 0;
}

/**
 * Returns the standard headers required for an SSE response.
 *
 * Includes `X-Accel-Buffering: no` which tells Nginx to disable proxy
 * buffering for this response — without this header Nginx will buffer
 * the stream and clients won't receive events until the buffer is full
 * or the connection closes.
 */
export function sseHeaders(): Record<string, string> {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    // Nginx: disable response buffering so events are flushed immediately.
    "X-Accel-Buffering": "no",
  };
}