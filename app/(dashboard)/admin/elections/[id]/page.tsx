"use client";
// app/(dashboard)/admin/elections/[id]/page.tsx

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useElectionStream } from "@/hooks/useElectionStream";
import toast from "react-hot-toast";

const STATUS_STYLES: Record<string, string> = {
  DRAFT:     "bg-slate-500/20 text-slate-400 border-slate-500/30",
  UPCOMING:  "bg-amber-500/20 text-amber-400 border-amber-500/30",
  LIVE:      "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  ENDED:     "bg-purple-500/20 text-purple-400 border-purple-500/30",
  CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
};

const STATUS_TRANSITIONS: Record<string, { next: string; label: string; color: string }[]> = {
  DRAFT:    [{ next: "UPCOMING", label: "Mark Upcoming", color: "amber" }, { next: "LIVE", label: "Launch Now", color: "emerald" }],
  UPCOMING: [{ next: "LIVE", label: "Launch Now", color: "emerald" }, { next: "CANCELLED", label: "Cancel", color: "red" }],
  LIVE:     [{ next: "ENDED", label: "End Election", color: "purple" }, { next: "CANCELLED", label: "Cancel", color: "red" }],
  ENDED:    [],
  CANCELLED:[],
};

export default function ElectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["election", id],
    queryFn: async () => {
      const res = await fetch(`/api/elections/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const { data: resultsData } = useQuery({
    queryKey: ["election-results", id],
    queryFn: async () => {
      const res = await fetch(`/api/elections/${id}/results`);
      return res.json();
    },
    enabled: !!id,
  });

  const { data: liveData, connected } = useElectionStream(
    data?.election?.status === "LIVE" ? id : null
  );

  const mutation = useMutation({
    mutationFn: (status: string) =>
      fetch(`/api/elections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then((r) => r.json()),
    onSuccess: (_, status) => {
      toast.success(`Election status updated to ${status}`);
      qc.invalidateQueries({ queryKey: ["election", id] });
      qc.invalidateQueries({ queryKey: ["election-results", id] });
    },
    onError: () => toast.error("Update failed"),
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64 text-slate-400">
        <div className="animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full mr-3" />
        Loading...
      </div>
    );
  }

  const election = data?.election;
  if (!election) return <div className="p-6 text-slate-400">Election not found.</div>;

  const displayData = liveData ?? resultsData;
  const totalVotes = displayData?.totalVotes ?? election._count?.votes ?? 0;
  const results = liveData?.candidates ?? resultsData?.results ?? [];
  const transitions = STATUS_TRANSITIONS[election.status] ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        <button onClick={() => router.back()} className="text-xs text-slate-500 hover:text-slate-300 font-mono mb-2 block transition-colors">
          ← Back to Elections
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white font-mono">{election.title}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-mono border ${STATUS_STYLES[election.status]}`}>
                {election.status}
                {election.status === "LIVE" && connected && (
                  <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">{election.description}</p>
          </div>
          {/* Status actions */}
          <div className="flex gap-2 flex-wrap">
            {transitions.map((t) => (
              <button
                key={t.next}
                onClick={() => mutation.mutate(t.next)}
                disabled={mutation.isPending}
                className={`px-4 py-2 rounded-lg text-sm font-mono border transition-all disabled:opacity-50 bg-${t.color}-500/10 border-${t.color}-500/30 text-${t.color}-400 hover:bg-${t.color}-500/20`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Type", value: election.type },
          { label: "Total Votes", value: totalVotes.toLocaleString(), accent: true },
          { label: "Start", value: new Date(election.startDate).toLocaleString() },
          { label: "End", value: new Date(election.endDate).toLocaleString() },
        ].map((m) => (
          <div key={m.label} className="bg-[#0d1421] border border-slate-700/30 rounded-xl p-4">
            <div className={`text-lg font-mono font-bold ${m.accent ? "text-cyan-400" : "text-white"}`}>
              {m.value}
            </div>
            <div className="text-xs text-slate-400 mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-[#0d1421] border border-slate-700/30 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono text-cyan-400 uppercase tracking-wider">
              {election.status === "LIVE" ? "Live Results" : "Final Results"}
            </h2>
            {connected && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-slate-400 font-mono">Live</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {results.map((r: { id?: string; name: string; partyColor?: string; party?: { color?: string } | string; votes: number; percentage: number }, i: number) => {
              const color = r.partyColor ?? (typeof r.party === "object" ? r.party?.color : undefined) ?? "#00d4ff";
              const isLeading = i === 0;
              return (
                <div key={r.id ?? r.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isLeading && election.status !== "LIVE" && (
                        <span className="text-xs font-mono text-amber-400">👑</span>
                      )}
                      <span className="text-sm text-white font-medium">{r.name}</span>
                      {typeof r.party === "string" && r.party !== "Independent" && (
                        <span className="text-xs text-slate-500">· {r.party}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-slate-300">{r.votes.toLocaleString()}</span>
                      <span className="text-sm font-mono font-bold" style={{ color }}>{r.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${r.percentage}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {displayData?.turnout !== undefined && displayData.turnout !== null && (
            <div className="text-xs text-slate-500 font-mono pt-2 border-t border-slate-700/30">
              Voter turnout: <span className="text-slate-300">{displayData.turnout.toFixed(1)}%</span>
              {" "}· Total votes: <span className="text-slate-300">{totalVotes.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Candidate list */}
      <div className="bg-[#0d1421] border border-slate-700/30 rounded-xl p-6">
        <h2 className="text-sm font-mono text-cyan-400 uppercase tracking-wider mb-4">
          Registered Candidates ({election.candidates?.length ?? 0})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(election.candidates ?? []).map((ec: { id: string; candidate: { user: { name: string }; party: { name: string; color: string } | null } }) => (
            <div key={ec.id} className="flex items-center gap-3 p-3 bg-[#060b14] rounded-lg border border-slate-700/20">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {ec.candidate.user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-sm text-white truncate">{ec.candidate.user.name}</div>
                {ec.candidate.party && (
                  <span
                    className="text-xs font-mono"
                    style={{ color: ec.candidate.party.color }}
                  >
                    {ec.candidate.party.name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}