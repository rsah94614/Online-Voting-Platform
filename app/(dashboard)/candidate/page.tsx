"use client";
// app/(dashboard)/candidate/page.tsx

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export default function CandidateDashboard() {
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => fetch("/api/auth/me").then((r) => r.json()),
  });

  const { data: electionsData } = useQuery({
    queryKey: ["candidate-elections"],
    queryFn: () => fetch("/api/elections").then((r) => r.json()),
  });

  const user = me?.user;
  const elections = electionsData?.elections ?? [];
  const liveElections = elections.filter((e: { status: string }) => e.status === "LIVE");
  const upcomingElections = elections.filter((e: { status: string }) => e.status === "UPCOMING");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-mono">Candidate Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Welcome back, {user?.name ?? "Candidate"}</p>
      </div>

      {/* Approval Status */}
      {!user?.candidate?.isApproved && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-xl">⏳</span>
            <div>
              <p className="text-amber-400 font-semibold text-sm">Pending Admin Approval</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Your candidate profile is under review. You&apos;ll be notified once approved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Elections", value: liveElections.length, color: "emerald" },
          { label: "Upcoming", value: upcomingElections.length, color: "amber" },
          { label: "Total Elections", value: elections.length, color: "cyan" },
          { label: "Profile Status", value: user?.candidate?.isApproved ? "Active" : "Pending", color: user?.candidate?.isApproved ? "emerald" : "amber" },
        ].map((s) => (
          <div key={s.label} className="bg-[#0d1421] border border-slate-700/30 rounded-xl p-4">
            <div className={`text-2xl font-mono font-bold text-${s.color}-400`}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { href: "/candidate/profile", icon: "👤", title: "My Profile", desc: "Update bio, photo, and manifesto" },
          { href: "/candidate/standings", icon: "📊", title: "Live Standings", desc: "See real-time election results" },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="flex items-center gap-4 p-5 bg-[#0d1421] border border-slate-700/30 rounded-xl hover:border-cyan-500/30 transition-all group"
          >
            <span className="text-3xl">{card.icon}</span>
            <div>
              <div className="text-white font-semibold group-hover:text-cyan-400 transition-colors">{card.title}</div>
              <div className="text-sm text-slate-400">{card.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Active elections */}
      {liveElections.length > 0 && (
        <div className="bg-[#0d1421] border border-emerald-500/20 rounded-xl p-5">
          <h2 className="text-sm font-mono text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Active Elections
          </h2>
          <div className="space-y-3">
            {liveElections.map((e: { id: string; title: string; type: string; endDate: string }) => (
              <div key={e.id} className="flex items-center justify-between p-3 bg-[#060b14] rounded-lg border border-slate-700/20">
                <div>
                  <div className="text-sm text-white font-medium">{e.title}</div>
                  <div className="text-xs text-slate-500 font-mono">{e.type}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Ends</div>
                  <div className="text-xs font-mono text-slate-300">{new Date(e.endDate).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}