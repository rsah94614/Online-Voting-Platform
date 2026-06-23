"use client";
// app/(dashboard)/admin/elections/[id]/page.tsx

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useElectionStream } from "@/hooks/useElectionStream";
import QRCode from "react-qr-code";
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

  const exportToCsv = () => {
    const results = liveData?.candidates ?? resultsData?.results ?? [];
    const rows = [
      ["Candidate", "Party", "Votes", "Percentage"],
      ...results.map((r: any) => [
        r.name,
        r.party && r.party !== 'Independent' ? (typeof r.party === 'object' ? r.party.name : r.party) : 'Independent',
        r.votes,
        r.percentage.toFixed(1) + "%"
      ])
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `votex-results-${data?.election?.searchCode || id}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const copyPublicLink = () => {
    if (!data?.election?.searchCode) return;
    const url = `${window.location.origin}/verify?type=election&code=${data.election.searchCode}`;
    navigator.clipboard.writeText(url);
    toast.success("Public link copied to clipboard");
  };

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
    <div className="p-6 space-y-6 print:p-0 print:m-0 print:space-y-4">
      {/* Breadcrumb + Header */}
      <div className="print:hidden">
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

      {/* QR Code Section */}
      {election.searchCode && (
        <div className="bg-[#0d1421] border border-slate-700/30 rounded-xl p-6 print:hidden flex flex-col sm:flex-row items-center gap-6">
          <div className="bg-white p-3 rounded-xl shadow-lg">
            <QRCode 
              value={`${typeof window !== 'undefined' ? window.location.origin : 'https://votex.app'}/verify?type=election&code=${election.searchCode}`} 
              size={120} 
            />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-mono mb-2">Quick-Join QR Code</h2>
            <p className="text-sm text-slate-400 mb-4 max-w-md">
              Voters in physical meetings can scan this QR code to instantly access the live voting portal on their mobile devices.
            </p>
            <div className="flex gap-3">
              <button 
                  onClick={copyPublicLink}
                  className="px-4 py-2 bg-[#060b14] border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 rounded-lg text-sm font-mono font-bold transition-all"
                >
                  🔗 Copy Link
              </button>
              <button 
                  onClick={() => {
                    const canvas = document.createElement("canvas");
                    const svg = document.querySelector("svg");
                    if (!svg) return;
                    const data = (new XMLSerializer()).serializeToString(svg);
                    const img = new Image();
                    img.onload = () => {
                      canvas.width = img.width;
                      canvas.height = img.height;
                      canvas.getContext("2d")?.drawImage(img, 0, 0);
                      const a = document.createElement("a");
                      a.download = `QR-${election.searchCode}.png`;
                      a.href = canvas.toDataURL("image/png");
                      a.click();
                    };
                    img.src = "data:image/svg+xml;base64," + btoa(data);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] rounded-lg text-sm font-mono font-bold transition-all"
                >
                  ⬇️ Download QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Dashboard & Export (Visible only when ended) */}
      {election.status === "ENDED" && results.length > 0 && (
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-5 sm:p-6 print:border-none print:bg-none print:p-0">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🏆</span>
                <h2 className="text-xl font-bold text-white font-mono">Winner Declared</h2>
              </div>
              <p className="text-sm text-purple-300">
                <strong className="text-white text-base">{results[0].name}</strong> has won the election with {results[0].votes.toLocaleString()} votes ({results[0].percentage.toFixed(1)}%).
              </p>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              <button 
                onClick={exportToCsv}
                className="px-4 py-2 bg-[#060b14] border border-cyan-500/30 text-cyan-400 rounded-lg text-xs font-mono font-bold hover:bg-cyan-500/10 transition-colors"
              >
                📥 Export CSV
              </button>
              <button 
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#060b14] border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-mono font-bold hover:bg-emerald-500/10 transition-colors"
              >
                🖨️ Print PDF
              </button>
              <button 
                onClick={copyPublicLink}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-mono font-bold transition-colors"
              >
                🔗 Public Link
              </button>
            </div>
          </div>
        </div>
      )}

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
      <div className="bg-[#0d1421] border border-slate-700/30 rounded-xl p-6 print:hidden">
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