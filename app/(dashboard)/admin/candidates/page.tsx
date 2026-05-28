"use client";
// app/(dashboard)/admin/candidates/page.tsx

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

interface Candidate {
  id: string;
  isApproved: boolean;
  bio: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
  party: { name: string; abbreviation: string; color: string } | null;
  nominations: { electionId: string }[];
}

async function fetchCandidates(filter: string) {
  const params = filter !== "all" ? `?approved=${filter === "approved"}` : "";
  const res = await fetch(`/api/candidates${params}`);
  if (!res.ok) throw new Error("Failed to fetch candidates");
  return res.json() as Promise<{ candidates: Candidate[]; total: number }>;
}

async function approveCandidateApi(id: string, approved: boolean) {
  const res = await fetch(`/api/candidates/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approved }),
  });
  if (!res.ok) throw new Error("Action failed");
  return res.json();
}

export default function CandidatesPage() {
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("pending");
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-candidates", filter],
    queryFn: () => fetchCandidates(filter),
  });

  const mutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      approveCandidateApi(id, approved),
    onSuccess: (_, vars) => {
      toast.success(vars.approved ? "Candidate approved ✓" : "Candidate rejected");
      qc.invalidateQueries({ queryKey: ["admin-candidates"] });
    },
    onError: () => toast.error("Action failed"),
  });

  const filtered = (data?.candidates ?? []).filter(
    (c) =>
      c.user.name.toLowerCase().includes(search.toLowerCase()) ||
      c.user.email.toLowerCase().includes(search.toLowerCase())
  );

  const tabs = [
    { key: "pending", label: "Pending Review" },
    { key: "approved", label: "Approved" },
    { key: "all", label: "All" },
  ] as const;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-mono tracking-tight">
            Candidate Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review and approve candidate registrations
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono text-cyan-400 font-bold">
            {data?.total ?? 0}
          </div>
          <div className="text-xs text-slate-400">Total Candidates</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex bg-[#0d1421] border border-slate-700/50 rounded-lg p-1 gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all font-mono ${
                filter === t.key
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-[#0d1421] border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
        />
      </div>

      {/* Table */}
      <div className="bg-[#0d1421] border border-slate-700/30 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-slate-400">
            <div className="animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full mr-3" />
            Loading candidates...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <div className="text-4xl mb-3">🗳️</div>
            <p className="font-mono">No candidates found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-6 py-4">Candidate</th>
                <th className="text-left px-6 py-4 hidden md:table-cell">Party</th>
                <th className="text-left px-6 py-4 hidden lg:table-cell">Bio</th>
                <th className="text-left px-6 py-4">Status</th>
                <th className="text-left px-6 py-4">Registered</th>
                <th className="text-right px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {c.user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-white font-medium">{c.user.name}</div>
                        <div className="text-slate-400 text-xs">{c.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    {c.party ? (
                      <span
                        className="px-2 py-1 rounded text-xs font-mono font-medium"
                        style={{ backgroundColor: `${c.party.color}22`, color: c.party.color }}
                      >
                        {c.party.abbreviation}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs">Independent</span>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell max-w-xs">
                    <p className="text-slate-400 text-xs truncate">{c.bio ?? "No bio provided"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-mono font-semibold ${
                        c.isApproved
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {c.isApproved ? "Approved" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {!c.isApproved && (
                        <button
                          onClick={() => mutation.mutate({ id: c.id, approved: true })}
                          disabled={mutation.isPending}
                          className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-mono hover:bg-emerald-500/30 transition-all disabled:opacity-50"
                        >
                          Approve
                        </button>
                      )}
                      {c.isApproved && (
                        <button
                          onClick={() => mutation.mutate({ id: c.id, approved: false })}
                          disabled={mutation.isPending}
                          className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-mono hover:bg-red-500/20 transition-all disabled:opacity-50"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}