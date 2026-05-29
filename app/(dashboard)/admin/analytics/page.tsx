"use client";
// app/(dashboard)/admin/analytics/page.tsx

import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ─── Mock Data (replace with real /api/analytics endpoint) ───────────────────

const TURNOUT_TREND = [
  { month: "Aug", turnout: 58 },
  { month: "Sep", turnout: 63 },
  { month: "Oct", turnout: 71 },
  { month: "Nov", turnout: 69 },
  { month: "Dec", turnout: 74 },
  { month: "Jan", turnout: 82 },
];

const VOTES_BY_HOUR = [
  { hour: "00", votes: 12 }, { hour: "02", votes: 8 },  { hour: "04", votes: 5 },
  { hour: "06", votes: 22 }, { hour: "08", votes: 67 }, { hour: "10", votes: 134 },
  { hour: "12", votes: 98 }, { hour: "14", votes: 112 },{ hour: "16", votes: 143 },
  { hour: "18", votes: 189 },{ hour: "20", votes: 156 },{ hour: "22", votes: 74 },
];

const ROLE_DIST = [
  { name: "Voters",      value: 892, color: "#00d4ff" },
  { name: "Candidates",  value: 47,  color: "#7c3aed" },
  { name: "Party Admins",value: 12,  color: "#ff2d6a" },
  { name: "Admins",      value: 3,   color: "#f59e0b" },
];

const ELECTION_STATUS_DATA = [
  { name: "Live",      value: 2,  color: "#10b981" },
  { name: "Upcoming",  value: 5,  color: "#f59e0b" },
  { name: "Ended",     value: 18, color: "#6366f1" },
  { name: "Draft",     value: 3,  color: "#64748b" },
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CyberTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0f1a] border border-cyan-500/30 rounded-lg px-3 py-2 text-xs font-mono shadow-xl">
      {label && <div className="text-slate-400 mb-1">{label}</div>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="text-white font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, change, color }: { label: string; value: string | number; change?: string; color: string }) {
  return (
    <div className="bg-[#0d1421] border border-slate-700/30 rounded-xl p-5">
      <div className={`text-3xl font-mono font-bold text-${color}-400`}>{value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
      {change && (
        <div className={`text-xs font-mono mt-2 ${change.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>
          {change} vs last month
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { data: electionsData } = useQuery({
    queryKey: ["analytics-elections"],
    queryFn: () => fetch("/api/elections").then((r) => r.json()),
  });

  const { data: usersData } = useQuery({
    queryKey: ["analytics-users"],
    queryFn: () => fetch("/api/users?limit=1").then((r) => r.json()),
  });

  const totalElections = electionsData?.total ?? 28;
  const totalUsers = usersData?.total ?? 954;

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-mono">Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">Platform-wide statistics and trends</p>
        </div>
        <button className="px-4 py-2 bg-slate-800 border border-slate-700/50 text-slate-300 rounded-lg text-sm font-mono hover:bg-slate-700 transition-all">
          Export CSV ↓
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={totalUsers.toLocaleString()} change="+12%" color="cyan" />
        <StatCard label="Total Elections" value={totalElections} change="+3%" color="purple" />
        <StatCard label="Votes Cast" value="12,847" change="+28%" color="emerald" />
        <StatCard label="Avg Turnout" value="73.4%" change="+4.1%" color="amber" />
      </div>

      {/* Turnout trend + Votes by hour */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0d1421] border border-slate-700/30 rounded-xl p-5">
          <h2 className="text-sm font-mono text-cyan-400 uppercase tracking-wider mb-5">
            Voter Turnout Trend
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={TURNOUT_TREND} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="turnoutGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip content={<CyberTooltip />} />
              <Area type="monotone" dataKey="turnout" name="Turnout" stroke="#00d4ff" strokeWidth={2} fill="url(#turnoutGrad)" dot={{ fill: "#00d4ff", r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#0d1421] border border-slate-700/30 rounded-xl p-5">
          <h2 className="text-sm font-mono text-purple-400 uppercase tracking-wider mb-5">
            Votes by Hour of Day
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={VOTES_BY_HOUR} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
              <XAxis dataKey="hour" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CyberTooltip />} />
              <Bar dataKey="votes" name="Votes" fill="#7c3aed" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0d1421] border border-slate-700/30 rounded-xl p-5">
          <h2 className="text-sm font-mono text-pink-400 uppercase tracking-wider mb-5">
            User Role Distribution
          </h2>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={ROLE_DIST} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={0}>
                  {ROLE_DIST.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} opacity={0.85} />
                  ))}
                </Pie>
                <Tooltip content={<CyberTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2.5 flex-1">
              {ROLE_DIST.map((r) => (
                <div key={r.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                    <span className="text-xs text-slate-300">{r.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#0d1421] border border-slate-700/30 rounded-xl p-5">
          <h2 className="text-sm font-mono text-amber-400 uppercase tracking-wider mb-5">
            Elections by Status
          </h2>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={ELECTION_STATUS_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={0}>
                  {ELECTION_STATUS_DATA.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} opacity={0.85} />
                  ))}
                </Pie>
                <Tooltip content={<CyberTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2.5 flex-1">
              {ELECTION_STATUS_DATA.map((r) => (
                <div key={r.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                    <span className="text-xs text-slate-300">{r.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity table */}
      <div className="bg-[#0d1421] border border-slate-700/30 rounded-xl p-5">
        <h2 className="text-sm font-mono text-slate-400 uppercase tracking-wider mb-4">
          Top Elections by Participation
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-700/30">
              <th className="text-left pb-3">Election</th>
              <th className="text-left pb-3 hidden md:table-cell">Type</th>
              <th className="text-left pb-3">Votes</th>
              <th className="text-left pb-3 hidden sm:table-cell">Turnout</th>
              <th className="text-left pb-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/20">
            {[
              { title: "2026 Presidential Election", type: "PRESIDENTIAL", votes: 8420, turnout: "82%", status: "LIVE", statusColor: "emerald" },
              { title: "Senate District 7 By-Election", type: "SENATE", votes: 0, turnout: "—", status: "UPCOMING", statusColor: "amber" },
              { title: "Municipal Council 2025", type: "MUNICIPAL", votes: 4421, turnout: "71%", status: "ENDED", statusColor: "purple" },
            ].map((row) => (
              <tr key={row.title} className="hover:bg-slate-800/20">
                <td className="py-3 text-white font-medium">{row.title}</td>
                <td className="py-3 text-slate-400 text-xs hidden md:table-cell font-mono">{row.type}</td>
                <td className="py-3 text-cyan-400 font-mono font-bold">{row.votes.toLocaleString()}</td>
                <td className="py-3 text-slate-300 font-mono hidden sm:table-cell">{row.turnout}</td>
                <td className="py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-mono border bg-${row.statusColor}-500/10 text-${row.statusColor}-400 border-${row.statusColor}-500/20`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}