"use client";
// app/(dashboard)/voter/page.tsx

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useElectionStream } from "@/hooks/useElectionStream";
import toast from "react-hot-toast";

interface Election {
  id: string;
  title: string;
  description: string;
  type: string;
  status: "LIVE" | "UPCOMING" | "ENDED" | "DRAFT";
  startDate: string;
  endDate: string;
  candidates: {
    id: string;
    candidate: {
      user: { name: string; avatarUrl: string | null };
      party: { name: string; abbreviation: string; color: string } | null;
      bio: string | null;
    };
    _count: { votes: number };
  }[];
}

function ElectionCard({ election }: { election: Election }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);

  const { data: voteStatus } = useQuery({
    queryKey: ["vote-status", election.id],
    queryFn: async () => {
      const res = await fetch(`/api/votes?electionId=${election.id}`);
      return res.json() as Promise<{ voted: boolean; vote: { castAt: string; receiptHash: string } | null }>;
    },
    enabled: election.status === "LIVE",
  });

  const { data: liveData, connected } = useElectionStream(
    election.status === "LIVE" && (voteStatus?.voted ?? false) ? election.id : null
  );

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("No candidate selected");
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ electionId: election.id, electionCandidateId: selected }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Vote failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setReceipt(data.receiptHash);
      toast.success("Vote cast successfully! 🗳️");
      qc.invalidateQueries({ queryKey: ["vote-status", election.id] });
      setShowConfirm(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Vote failed");
      setShowConfirm(false);
    },
  });

  const alreadyVoted = voteStatus?.voted || !!receipt;
  const isLive = election.status === "LIVE";

  const displayResults = liveData?.candidates ?? [];
  const totalLiveVotes = liveData?.totalVotes ?? 0;

  return (
    <div className={`bg-[#0d1421] border rounded-xl overflow-hidden transition-all ${
      isLive ? "border-emerald-500/30" : "border-slate-700/30"
    }`}>
      {/* Card header */}
      <div className="p-5 border-b border-slate-700/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono border ${
                isLive
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : election.status === "UPCOMING"
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  : "bg-slate-500/20 text-slate-400 border-slate-500/30"
              }`}>
                {isLive && <span className="mr-1">●</span>}
                {election.status}
              </span>
              <span className="text-xs text-slate-500 font-mono">{election.type}</span>
            </div>
            <h3 className="text-white font-semibold text-lg">{election.title}</h3>
            {election.description && (
              <p className="text-sm text-slate-400 mt-1">{election.description}</p>
            )}
          </div>
          {connected && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-400 font-mono">Live</span>
            </div>
          )}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-slate-500 font-mono">
          <span>Opens {new Date(election.startDate).toLocaleString()}</span>
          <span>·</span>
          <span>Closes {new Date(election.endDate).toLocaleString()}</span>
        </div>
      </div>

      {/* Already voted - receipt */}
      {alreadyVoted ? (
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <div className="text-2xl">✅</div>
            <div>
              <div className="text-emerald-400 font-semibold text-sm">Vote recorded</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Cast on {voteStatus?.vote?.castAt ? new Date(voteStatus.vote.castAt).toLocaleString() : "earlier"}
              </div>
              {(receipt || voteStatus?.vote?.receiptHash) && (
                <div className="mt-1 text-xs font-mono text-slate-500 bg-slate-900/60 px-2 py-1 rounded truncate max-w-xs">
                  Receipt: {(receipt ?? voteStatus!.vote!.receiptHash).slice(0, 24)}…
                </div>
              )}
            </div>
          </div>

          {/* Show live results after voting */}
          {displayResults.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Live Results · {totalLiveVotes} votes
              </div>
              {displayResults.map((c) => (
                <div key={c.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-300">{c.name}</span>
                    <span className="font-mono" style={{ color: c.partyColor }}>{c.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${c.percentage}%`, backgroundColor: c.partyColor }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : isLive ? (
        /* Voting UI */
        <div className="p-5 space-y-4">
          {!showConfirm ? (
            <>
              <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">
                Select a candidate to vote for:
              </p>
              <div className="space-y-2">
                {election.candidates.map((ec) => {
                  const isChecked = selected === ec.id;
                  return (
                    <div
                      key={ec.id}
                      onClick={() => setSelected(ec.id)}
                      className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? "border-cyan-500/50 bg-cyan-500/10"
                          : "border-slate-700/30 hover:border-slate-600/50 bg-[#060b14]"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isChecked ? "border-cyan-400 bg-cyan-400" : "border-slate-600"
                        }`}
                      >
                        {isChecked && <div className="w-2 h-2 rounded-full bg-[#0d1421]" />}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {ec.candidate.user.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold">{ec.candidate.user.name}</div>
                        {ec.candidate.party ? (
                          <span
                            className="text-xs font-mono px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: `${ec.candidate.party.color}22`, color: ec.candidate.party.color }}
                          >
                            {ec.candidate.party.name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">Independent</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => selected && setShowConfirm(true)}
                disabled={!selected}
                className="w-full py-3 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 rounded-xl text-sm font-mono font-semibold hover:bg-cyan-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Confirm Selection →
              </button>
            </>
          ) : (
            /* Confirmation step */
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <p className="text-amber-400 text-sm font-semibold mb-1">⚠ This action is irreversible</p>
                <p className="text-slate-300 text-sm">
                  You are about to cast your vote for{" "}
                  <strong className="text-white">
                    {election.candidates.find((c) => c.id === selected)?.candidate.user.name}
                  </strong>
                  . Once submitted, your vote cannot be changed.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-sm font-mono hover:bg-slate-700 transition-all"
                >
                  ← Back
                </button>
                <button
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isPending}
                  className="flex-1 py-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-xl text-sm font-mono font-semibold hover:bg-emerald-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {mutation.isPending && <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />}
                  Cast My Vote
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-5 text-center text-slate-500 text-sm font-mono py-8">
          {election.status === "UPCOMING"
            ? `Voting opens ${new Date(election.startDate).toLocaleString()}`
            : "This election has ended"}
        </div>
      )}
    </div>
  );
}

export default function VoterDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["voter-elections"],
    queryFn: async () => {
      const [live, upcoming, ended] = await Promise.all([
        fetch("/api/elections?status=LIVE").then((r) => r.json()),
        fetch("/api/elections?status=UPCOMING").then((r) => r.json()),
        fetch("/api/elections?status=ENDED&limit=5").then((r) => r.json()),
      ]);
      return { live: live.elections, upcoming: upcoming.elections, ended: ended.elections };
    },
  });

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white font-mono">My Ballot</h1>
        <p className="text-sm text-slate-400 mt-1">Active and upcoming elections available to you</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <div className="animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full mr-3" />
          Loading elections...
        </div>
      ) : (
        <>
          {/* Live */}
          {(data?.live ?? []).length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-sm font-mono text-emerald-400 uppercase tracking-wider">Active Now</h2>
              </div>
              {data!.live.map((e: Election) => <ElectionCard key={e.id} election={e} />)}
            </section>
          )}

          {/* Upcoming */}
          {(data?.upcoming ?? []).length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-mono text-amber-400 uppercase tracking-wider">Upcoming</h2>
              {data!.upcoming.map((e: Election) => <ElectionCard key={e.id} election={e} />)}
            </section>
          )}

          {/* Ended */}
          {(data?.ended ?? []).length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-mono text-slate-500 uppercase tracking-wider">Recently Ended</h2>
              {data!.ended.map((e: Election) => <ElectionCard key={e.id} election={e} />)}
            </section>
          )}

          {!(data?.live?.length) && !(data?.upcoming?.length) && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-center">
              <div className="text-5xl mb-4">🗳️</div>
              <p className="font-mono text-sm">No active elections right now</p>
              <p className="text-xs mt-1">Check back soon — your vote matters</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}