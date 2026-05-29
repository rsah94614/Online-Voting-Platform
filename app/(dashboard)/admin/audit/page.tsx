"use client";
// app/(dashboard)/admin/audit/page.tsx

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

const ACTION_COLORS: Record<string, string> = {
  USER_LOGIN: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  LOGIN_FAILED: "text-red-400 bg-red-500/10 border-red-500/30",
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
  LOGIN_FAILED: "⚠",
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

async function fetchAudit(action: string, page: number, search: string, startDate: string, endDate: string) {
  const params = new URLSearchParams({ page: String(page), limit: "50" });
  if (action !== "all") params.append("action", action);
  if (search) params.append("search", search);
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  
  const res = await fetch(`/api/audit?${params}`);
  if (!res.ok) throw new Error("Failed to fetch audit logs");
  return res.json() as Promise<{ logs: AuditLog[]; total: number; pages: number }>;
}

async function fetchSummary() {
  const res = await fetch("/api/audit/summary");
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json() as Promise<{ totalEvents: number; failedLogins: number; suspensions: number; votesCast: number }>;
}

export default function AuditPage() {
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const { data: summary } = useQuery({
    queryKey: ["audit-summary"],
    queryFn: fetchSummary,
    refetchInterval: 60_000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", actionFilter, page, debouncedSearch, startDate, endDate],
    queryFn: () => fetchAudit(actionFilter, page, debouncedSearch, startDate, endDate),
    refetchInterval: 30_000,
  });

  const actions = ["all", "VOTE_CAST", "USER_LOGIN", "LOGIN_FAILED", "USER_SUSPENDED", "ELECTION_LAUNCHED", "SETTINGS_CHANGED"];

  const handleExport = () => {
    const params = new URLSearchParams();
    if (actionFilter !== "all") params.append("action", actionFilter);
    if (debouncedSearch) params.append("search", debouncedSearch);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    window.location.href = `/api/audit/export?${params.toString()}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-mono">Security & Audit Log</h1>
          <p className="text-sm text-slate-400 mt-1">Immutable system activity and security trail</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-400 font-mono">Live · refreshes every 30s</span>
        </div>
      </div>

      {/* Security Summary Cards (Last 24h) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Events (24h)", value: summary?.totalEvents ?? 0, color: "text-cyan-400" },
          { label: "Failed Logins", value: summary?.failedLogins ?? 0, color: (summary?.failedLogins ?? 0) > 0 ? "text-red-400" : "text-slate-400" },
          { label: "Suspensions", value: summary?.suspensions ?? 0, color: (summary?.suspensions ?? 0) > 0 ? "text-amber-400" : "text-slate-400" },
          { label: "Votes Cast", value: summary?.votesCast ?? 0, color: "text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="bg-[#0a0f1a] border border-slate-700/30 p-4 rounded-xl">
            <div className={`text-2xl font-mono font-bold ${s.color}`}>{s.value.toLocaleString()}</div>
            <div className="text-xs text-slate-500 font-mono mt-1 uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters and Export Bar */}
      <div className="bg-[#0d1421] border border-slate-700/30 rounded-xl p-4 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full xl:w-auto">
          {/* Search */}
          <div className="flex-1 max-w-sm">
            <input 
              type="text" 
              placeholder="Search user email or name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#060b14] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="bg-[#060b14] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-300 font-mono focus:outline-none focus:border-cyan-500/50 [color-scheme:dark]"
            />
            <span className="text-slate-600">→</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="bg-[#060b14] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-300 font-mono focus:outline-none focus:border-cyan-500/50 [color-scheme:dark]"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded-lg text-xs font-mono transition-colors flex-shrink-0"
          >
            📥 Export CSV
          </button>
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
              <div key={log.id} className="px-4 sm:px-6 py-4 hover:bg-slate-800/20 transition-colors">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
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
                  <div className="text-left sm:text-right flex-shrink-0 ml-11 sm:ml-0">
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
                <p className="font-mono text-sm">No matching events found</p>
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