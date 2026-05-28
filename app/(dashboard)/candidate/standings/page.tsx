"use client";
// app/(dashboard)/candidate/standings/page.tsx

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useElectionStream } from "@/hooks/useElectionStream";

function StandingsElection({ election }: { election: { id: string; title: string; status: string; type: string } }) {
  const { data: resultsData } = useQuery({
    queryKey: ["results", election.id],
    queryFn: () => fetch(`/api/elections/${election.id}/results`).then((r) => r.json()),
  });

  const { data: liveData, connected } = useElectionStream(
    election.status === "LIVE" ? election.id : null
  );

  const results = liveData?.candidates ?? resultsData?.results ?? [];
  const totalVotes = liveData?.totalVotes ?? resultsData?.totalVotes ?? 0;

  if (results.length === 0) return null;

  return (
    <div className="bg-[#0d1421] border border-slate-700/30 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700/30 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">{election.title}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs font-mono ${
              election.status === "LIVE" ? "text-emerald-400" : "text-slate-500"
            }`}>
              {election.status}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-500">{totalVotes.toLocaleString()} votes</span>
          </div>
        </div>
        {connected && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-400 font-mono">Live</span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-4">
        {results.map((r: { id?: string; name: string; partyColor?: string; votes: number; percentage: number }, i: number) => {
          const color = r.partyColor ?? "#00d4ff";
          return (
            <div key={r.id ?? r.name}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-slate-600 w-4">{i + 1}.</span>
                  <span className="text-sm text-white">{r.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400">{r.votes.toLocaleString()}</span>
                  <span
                    className="text-sm font-mono font-bold w-14 text-right"
                    style={{ color }}
                  >
                    {r.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${r.percentage}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StandingsPage() {
  const [statusFilter, setStatusFilter] = useState<"LIVE" | "ENDED" | "all">("LIVE");

  const { data, isLoading } = useQuery({
    queryKey: ["standings-elections", statusFilter],
    queryFn: async () => {
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/elections${params}`);
      return res.json();
    },
    refetchInterval: statusFilter === "LIVE" ? 60_000 : false,
  });

  const elections = data?.elections ?? [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-mono">Live Standings</h1>
        <p className="text-sm text-slate-400 mt-1">Real-time vote counts for your elections</p>
      </div>

      <div className="flex gap-2">
        {(["LIVE", "ENDED", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-mono border transition-all ${
              statusFilter === s
                ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                : "bg-[#0d1421] text-slate-400 border-slate-700/50 hover:text-white"
            }`}
          >
            {s === "all" ? "All" : s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <div className="animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full mr-3" />
          Loading...
        </div>
      ) : elections.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="font-mono text-sm">No {statusFilter !== "all" ? statusFilter.toLowerCase() : ""} elections found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {elections.map((e: { id: string; title: string; status: string; type: string }) => (
            <StandingsElection key={e.id} election={e} />
          ))}
        </div>
      )}
    </div>
  );
}