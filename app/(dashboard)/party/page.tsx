"use client";
// app/(dashboard)/party/page.tsx

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

interface Candidate {
  id: string;
  isApproved: boolean;
  user: { name: string; email: string };
}

export default function PartyDashboard() {
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => fetch("/api/auth/me").then((r) => r.json()),
  });

  // In a real app, fetch /api/party/my — for now use candidates list
  const { data: candidatesData } = useQuery({
    queryKey: ["party-candidates"],
    queryFn: () => fetch("/api/candidates?approved=true").then((r) => r.json()),
  });

  const { data: electionsData } = useQuery({
    queryKey: ["party-elections"],
    queryFn: () => fetch("/api/elections").then((r) => r.json()),
  });

  const user = me?.user;
  const candidates: Candidate[] = candidatesData?.candidates ?? [];
  const elections = electionsData?.elections ?? [];
  const liveElections = elections.filter((e: { status: string }) => e.status === "LIVE");

  const stats = [
    { label: "Our Candidates", value: candidates.length, color: "cyan" },
    { label: "Active Elections", value: liveElections.length, color: "emerald" },
    { label: "Approved", value: candidates.filter((c) => c.isApproved).length, color: "emerald" },
    { label: "Pending", value: candidates.filter((c) => !c.isApproved).length, color: "amber" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-mono">Party Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Welcome, {user?.name ?? "Party Admin"}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-[#0d1421] border border-slate-700/30 rounded-xl p-4">
            <div className={`text-2xl font-mono font-bold text-${s.color}-400`}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Candidates table */}
        <div className="bg-[#0d1421] border border-slate-700/30 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700/30 flex items-center justify-between">
            <h2 className="text-sm font-mono text-cyan-400 uppercase tracking-wider">
              Party Candidates
            </h2>
          </div>
          {candidates.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No candidates yet</div>
          ) : (
            <div className="divide-y divide-slate-700/20">
              {candidates.slice(0, 8).map((c) => (
                <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                      {c.user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm text-white">{c.user.name}</div>
                      <div className="text-xs text-slate-500">{c.user.email}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-mono rounded-full border ${
                    c.isApproved
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}>
                    {c.isApproved ? "Approved" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active elections + results preview */}
        <div className="space-y-4">
          {liveElections.length > 0 ? (
            <div className="bg-[#0d1421] border border-emerald-500/20 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-700/30">
                <h2 className="text-sm font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Elections
                </h2>
              </div>
              <div className="divide-y divide-slate-700/20">
                {liveElections.map((e: { id: string; title: string; type: string }) => (
                  <div key={e.id} className="px-5 py-4">
                    <div className="text-sm text-white font-medium">{e.title}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{e.type}</div>
                    <Link
                      href={`/candidate/standings`}
                      className="mt-2 inline-block text-xs text-cyan-400 hover:underline font-mono"
                    >
                      View live standings →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-[#0d1421] border border-slate-700/30 rounded-xl p-8 text-center text-slate-500 text-sm">
              <div className="text-3xl mb-2">📊</div>
              No live elections right now
            </div>
          )}

          {/* Quick links */}
          <div className="bg-[#0d1421] border border-slate-700/30 rounded-xl p-5 space-y-3">
            <h2 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Quick Actions</h2>
            {[
              { href: "/candidate/standings", label: "View All Standings", icon: "📈" },
              { href: "/party/manifesto", label: "Update Party Manifesto", icon: "📝" },
              { href: "/party/members", label: "Manage Members", icon: "👥" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 p-3 bg-[#060b14] rounded-lg border border-slate-700/20 hover:border-cyan-500/30 transition-all group"
              >
                <span>{link.icon}</span>
                <span className="text-sm text-slate-300 group-hover:text-cyan-400 transition-colors">{link.label}</span>
                <span className="ml-auto text-slate-600 group-hover:text-cyan-500">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}