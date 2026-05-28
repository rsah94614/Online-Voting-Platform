"use client";
// app/(dashboard)/admin/audit/page.tsx

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

const ACTION_COLORS: Record<string, string> = {
  USER_LOGIN: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  USER_LOGOUT: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  USER_REGISTER: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  USER_APPROVED: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  USER_SUSPENDED: "text-red-400 bg-red-500/10 border-red-500/30",
  VOTE_CAST: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  ELECTION_CREATED: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  ELECTION_LAUNCHED: "text-pink-400 bg-pink-500/10 border-pink-500/30",
  ELECTION_ENDED: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  CANDIDATE_APPROVED: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  CANDIDATE_REJECTED: "text-red-400 bg-red-500/10 border-red-500/30",
  SETTINGS_CHANGED: "text-amber-400 bg-amber-500/10 border-amber-500/30",
};

const ACTION_ICONS: Record<string, string> = {
  USER_LOGIN: "→",
  USER_REGISTER: "+",
  USER_APPROVED: "✓",
  USER_SUSPENDED: "⊘",
  VOTE_CAST: "🗳",
  ELECTION_CREATED: "◆",
  ELECTION_LAUNCHED: "▶",
  ELECTION_ENDED: "■",
  CANDIDATE_APPROVED: "✓",
  CANDIDATE_REJECTED: "✗",
  SETTINGS_CHANGED: "⚙",
};

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  user: { name: string; email: string; role: string } | null;
}

async function fetchAudit(action: string, page: number) {
  const params = new URLSearchParams({ page: String(page), limit: "50", ...(action !== "all" ? { action } : {}) });
  const res = await fetch(`/api/audit?${params}`);
  if (!res.ok) throw new Error("Failed to fetch audit logs");
  return res.json() as Promise<{ logs: AuditLog[]; total: number; pages: number }>;
}

export default function AuditPage() {
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", actionFilter, page],
    queryFn: () => fetchAudit(actionFilter, page),
    refetchInterval: 30_000,
  });

  const actions = ["all", "VOTE_CAST", "USER_LOGIN", "ELECTION_LAUNCHED", "CANDIDATE_APPROVED", "USER_SUSPENDED"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-mono">Audit Log</h1>
          <p className="text-sm text-slate-400 mt-1">Immutable system activity trail</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-400 font-mono">Live · refreshes every 30s</span>
        </div>
      </div>

      {/* Action filter pills */}
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a}
            onClick={() => { setActionFilter(a); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
              actionFilter === a
                ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                : "bg-slate-800/50 text-slate-400 border-slate-700/50 hover:border-slate-600"
            }`}
          >
            {a === "all" ? "All Events" : a.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Log entries */}
      <div className="bg-[#0d1421] border border-slate-700/30 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-slate-400">
            <div className="animate-spin w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full mr-3" />
            Loading audit logs...
          </div>
        ) : (
          <div className="divide-y divide-slate-700/20">
            {(data?.logs ?? []).map((log) => (
              <div key={log.id} className="px-6 py-4 hover:bg-slate-800/20 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm border font-mono ${
                        ACTION_COLORS[log.action] ?? "text-slate-400 bg-slate-500/10 border-slate-500/20"
                      }`}
                    >
                      {ACTION_ICONS[log.action] ?? "·"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${
                            ACTION_COLORS[log.action] ?? "text-slate-400"
                          }`}
                        >
                          {log.action}
                        </span>
                        <span className="text-xs text-slate-500">{log.resource}</span>
                        {log.resourceId && (
                          <span className="text-xs text-slate-600 font-mono">{log.resourceId.slice(0, 12)}…</span>
                        )}
                      </div>
                      {log.user && (
                        <div className="mt-1 text-xs text-slate-400">
                          <span className="text-slate-300">{log.user.name}</span>
                          <span className="mx-1">·</span>
                          <span>{log.user.email}</span>
                          <span className="mx-1">·</span>
                          <span className="text-slate-500">{log.user.role}</span>
                        </div>
                      )}
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-1.5 text-xs text-slate-500 font-mono bg-slate-900/40 rounded px-2 py-1 max-w-md truncate">
                          {JSON.stringify(log.details)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-slate-400 font-mono">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </div>
                    {log.ipAddress && (
                      <div className="text-xs text-slate-700 font-mono mt-0.5">{log.ipAddress}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {(data?.logs ?? []).length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                <p className="font-mono text-sm">No audit events found</p>
              </div>
            )}
          </div>
        )}

        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/30">
            <span className="text-xs text-slate-500 font-mono">{data.total} events · page {page}/{data.pages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs font-mono bg-slate-800 border border-slate-700 text-slate-300 rounded disabled:opacity-40 hover:bg-slate-700">← Prev</button>
              <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page === data.pages} className="px-3 py-1.5 text-xs font-mono bg-slate-800 border border-slate-700 text-slate-300 rounded disabled:opacity-40 hover:bg-slate-700">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}