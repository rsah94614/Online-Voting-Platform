// lib/sse.ts - Server-Sent Events broadcaster
// A simple in-process pub/sub for vote updates.
// For multi-instance deployments, replace with Redis pub/sub.

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