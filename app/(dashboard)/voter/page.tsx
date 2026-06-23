"use client";
// app/(dashboard)/voter/page.tsx

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useElectionStream } from "@/hooks/useElectionStream";
import CountdownTimer from "@/components/dashboard/CountdownTimer";
import toast from "react-hot-toast";
import AdBanner from "@/components/AdBanner";

interface Election {
  id: string;
  title: string;
  description: string;
  type: string;
  status: "LIVE" | "UPCOMING" | "ENDED" | "DRAFT";
  startDate: string;
  endDate: string;
  searchCode: string | null;
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

// ─── Receipt Download Helper ─────────────────────────────────────────────────

function downloadReceipt(election: Election, receiptHash: string, castAt: string) {
  const content = [
    "═══════════════════════════════════════════",
    "         VOTEX — VOTE RECEIPT",
    "═══════════════════════════════════════════",
    "",
    `Election:    ${election.title}`,
    `Type:        ${election.type}`,
    `Election ID: ${election.searchCode || election.id}`,
    "",
    `Cast At:     ${new Date(castAt).toLocaleString()}`,
    `Status:      ${election.status}`,
    "",
    "─── Receipt Hash ───────────────────────────",
    receiptHash,
    "",
    "─── Verification ───────────────────────────",
    "To verify your vote, visit:",
    `${typeof window !== "undefined" ? window.location.origin : ""}/verify`,
    'Select "Vote Receipt" and paste your hash.',
    "",
    "═══════════════════════════════════════════",
    "This receipt proves your vote was recorded.",
    "It does NOT reveal your candidate choice.",
    "═══════════════════════════════════════════",
    "",
    `Generated: ${new Date().toISOString()}`,
  ].join("\n");

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `votex-receipt-${election.searchCode || election.id}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Election Card ────────────────────────────────────────────────────────────

function ElectionCard({ election }: { election: Election }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [expandedBio, setExpandedBio] = useState<string | null>(null);

  const { data: voteStatus } = useQuery({
    queryKey: ["vote-status", election.id],
    queryFn: async () => {
      const res = await fetch(`/api/votes?electionId=${election.id}`);
      return res.json() as Promise<{ voted: boolean; vote: { castAt: string; receiptHash: string } | null }>;
    },
    enabled: election.status === "LIVE" || election.status === "ENDED",
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
  const isEnded = election.status === "ENDED";

  // If ended, we can calculate percentages
  const displayResults = election.candidates ?? [];
  const totalEndedVotes = displayResults.reduce((sum, c) => sum + c._count.votes, 0);

  return (
    <div className={`bg-[#0d1421] border rounded-xl overflow-hidden transition-all ${
      isLive ? "border-emerald-500/30" : "border-slate-700/30"
    }`}>
      {/* Card header */}
      <div className="p-4 sm:p-5 border-b border-slate-700/30">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
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
            <h3 className="text-white font-semibold text-base sm:text-lg">{election.title}</h3>
            {election.description && (
              <p className="text-sm text-slate-400 mt-1 line-clamp-2">{election.description}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {connected && (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-slate-400 font-mono">Live</span>
              </div>
            )}
          </div>
        </div>

        {/* Countdown timer */}
        <div className="flex flex-wrap gap-3 mt-3 items-center">
          {isLive && (
            <CountdownTimer targetDate={election.endDate} label="Closes in" variant="live" />
          )}
          {election.status === "UPCOMING" && (
            <CountdownTimer targetDate={election.startDate} label="Opens in" variant="upcoming" />
          )}
          {!isLive && election.status !== "UPCOMING" && (
            <div className="flex gap-4 text-xs text-slate-500 font-mono flex-wrap">
              <span>Ended {new Date(election.endDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Already voted - receipt */}
      {alreadyVoted ? (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 sm:p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <div className="text-2xl">✅</div>
            <div className="flex-1 min-w-0">
              <div className="text-emerald-400 font-semibold text-sm">Vote recorded</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Cast on {voteStatus?.vote?.castAt ? new Date(voteStatus.vote.castAt).toLocaleString() : "earlier"}
              </div>
              {(receipt || voteStatus?.vote?.receiptHash) && (
                <div className="mt-1 text-xs font-mono text-slate-500 bg-slate-900/60 px-2 py-1 rounded truncate max-w-full">
                  Receipt: {(receipt ?? voteStatus!.vote!.receiptHash).slice(0, 24)}…
                </div>
              )}
            </div>
          </div>

          {/* Download receipt button */}
          {(receipt || voteStatus?.vote?.receiptHash) && (
            <button
              onClick={() => downloadReceipt(
                election,
                receipt ?? voteStatus!.vote!.receiptHash,
                voteStatus?.vote?.castAt ?? new Date().toISOString()
              )}
              className="w-full py-2.5 bg-[#060b14] border border-slate-700/30 text-slate-300 rounded-xl text-xs font-mono font-semibold
                hover:border-cyan-500/40 hover:text-cyan-400 transition-all flex items-center justify-center gap-2"
            >
              📄 Download Vote Receipt
            </button>
          )}

          {/* Show live results ONLY if election is ENDED */}
          {isEnded && displayResults.length > 0 && (
            <div className="space-y-3 mt-4 border-t border-slate-800 pt-4">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Final Results · {totalEndedVotes} votes
              </div>
              {displayResults.map((c) => {
                const percentage = totalEndedVotes > 0 ? (c._count.votes / totalEndedVotes) * 100 : 0;
                const partyColor = c.candidate.party?.color || "#888";
                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-300">{c.candidate.user.name}</span>
                      <span className="font-mono" style={{ color: partyColor }}>{percentage.toFixed(1)}% ({c._count.votes})</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${percentage}%`, backgroundColor: partyColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {isLive && (
             <div className="p-4 bg-slate-800/50 rounded-lg text-center mt-4">
               <span className="text-sm text-slate-400 font-mono">Results will be revealed when the election ends.</span>
             </div>
          )}
        </div>
      ) : isLive ? (
        /* Voting UI */
        <div className="p-4 sm:p-5 space-y-4">
          {!showConfirm ? (
            <>
              <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">
                Select a candidate to vote for:
              </p>
              <div className="space-y-2">
                {election.candidates.map((ec) => {
                  const isChecked = selected === ec.id;
                  const isBioExpanded = expandedBio === ec.id;
                  return (
                    <div key={ec.id} className="space-y-0">
                      <div
                        onClick={() => setSelected(ec.id)}
                        className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? "border-cyan-500/50 bg-cyan-500/10"
                            : "border-slate-700/30 hover:border-slate-600/50 bg-[#060b14]"
                        }`}
                      >
                        {/* Radio — larger touch target on mobile */}
                        <div
                          className={`w-6 h-6 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isChecked ? "border-cyan-400 bg-cyan-400" : "border-slate-600"
                          }`}
                        >
                          {isChecked && <div className="w-2.5 h-2.5 sm:w-2 sm:h-2 rounded-full bg-[#0d1421]" />}
                        </div>
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {ec.candidate.user.name.charAt(0)}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-semibold text-sm sm:text-base">{ec.candidate.user.name}</div>
                          <div className="flex items-center gap-2 flex-wrap">
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
                        {/* Info toggle */}
                        {ec.candidate.bio && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBio(isBioExpanded ? null : ec.id);
                            }}
                            className="w-7 h-7 rounded-full border border-slate-700 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all flex-shrink-0 text-xs"
                            title="View candidate profile"
                          >
                            {isBioExpanded ? '✕' : 'ℹ'}
                          </button>
                        )}
                      </div>
                      {/* Expandable bio */}
                      {isBioExpanded && ec.candidate.bio && (
                        <div className="mx-2 p-3 bg-[#060b14] border border-slate-700/30 border-t-0 rounded-b-xl text-xs text-slate-400 leading-relaxed">
                          <span className="text-slate-500 font-mono text-[10px] uppercase tracking-wider block mb-1">About this candidate</span>
                          {ec.candidate.bio}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => selected && setShowConfirm(true)}
                disabled={!selected}
                className="w-full py-3 sm:py-3.5 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 rounded-xl text-sm font-mono font-semibold hover:bg-cyan-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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

// ─── Voter Dashboard ──────────────────────────────────────────────────────────

export default function VoterDashboard() {
  const qc = useQueryClient();
  const [searchCode, setSearchCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["voter-elections"],
    queryFn: async () => {
      const [live, upcoming, ended] = await Promise.all([
        fetch("/api/elections?status=LIVE").then((r) => r.json()),
        fetch("/api/elections?status=UPCOMING").then((r) => r.json()),
        fetch("/api/elections?status=ENDED&limit=5").then((r) => r.json()),
      ]);
      return { live: live.elections || [], upcoming: upcoming.elections || [], ended: ended.elections || [] };
    },
  });

  const handleJoinElection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCode.trim().length < 6) return toast.error("Code must be at least 6 characters");
    
    setIsJoining(true);
    try {
      const res = await fetch("/api/elections/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: searchCode.trim().toUpperCase() })
      });
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error || "Failed to join");
      
      toast.success("Successfully joined the election!");
      setSearchCode("");
      qc.invalidateQueries({ queryKey: ["voter-elections"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  // Count actionable elections (live & not voted)
  const liveCount = data?.live?.length ?? 0;

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
      {/* Active election banner */}
      {liveCount > 0 && (
        <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="text-sm text-emerald-300 font-semibold">
            ⚡ You have {liveCount} active election{liveCount > 1 ? 's' : ''} — Vote Now!
          </span>
        </div>
      )}

      {/* Join Election Section */}
      <div className="bg-[#0a0f18] border border-cyan-500/20 p-4 sm:p-6 rounded-xl shadow-[0_0_30px_rgba(0,212,255,0.05)]">
        <h2 className="text-base sm:text-lg font-bold text-white font-mono mb-2">Have an Election Code?</h2>
        <p className="text-xs sm:text-sm text-slate-400 mb-4">Enter the 6-character code provided by your administrator to add an election to your ballot.</p>
        <form onSubmit={handleJoinElection} className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text" 
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
            placeholder="e.g. AB1234"
            maxLength={10}
            className="flex-1 bg-[#0d1421] border border-slate-700/50 rounded-lg px-4 py-2.5 sm:py-2.5 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all text-center sm:text-left"
          />
          <button 
            type="submit" 
            disabled={isJoining || searchCode.length < 6}
            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg font-mono disabled:opacity-50 transition-colors"
          >
            {isJoining ? "Joining..." : "Join"}
          </button>
        </form>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white font-mono">My Enrolled Elections</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">Active and upcoming elections you are eligible to vote in</p>
      </div>

      <AdBanner />

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

          {!(data?.live?.length) && !(data?.upcoming?.length) && !(data?.ended?.length) && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-center border border-dashed border-slate-800 rounded-xl">
              <div className="text-5xl mb-4">🗳️</div>
              <p className="font-mono text-sm">No elections added yet</p>
              <p className="text-xs mt-1">Enter a code above to join your first election</p>
            </div>
          )}
        </>
      )}
      
      {!isLoading && <AdBanner />}
    </div>
  );
}