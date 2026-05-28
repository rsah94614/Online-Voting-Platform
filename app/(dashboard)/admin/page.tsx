'use client'

import { useQuery } from '@tanstack/react-query'
import { analyticsApi, electionApi } from '@/lib/api'
import { queryKeys } from '@/lib/queryClient'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import StatsCard from '@/components/dashboard/StatsCard'
import { VotexAreaChart, VotexBarChart, VotexDonutChart, COLORS } from '@/components/dashboard/charts/Charts'
import Link from 'next/link'

// ─── Mock data ─────────────────────────────────────────────────────────────────

const TURNOUT_DATA = [
  { hour: '06:00', votes: 1200, cumulative: 1200 },
  { hour: '08:00', votes: 8400, cumulative: 9600 },
  { hour: '10:00', votes: 14200, cumulative: 23800 },
  { hour: '12:00', votes: 22100, cumulative: 45900 },
  { hour: '14:00', votes: 18600, cumulative: 64500 },
  { hour: '16:00', votes: 24300, cumulative: 88800 },
  { hour: '18:00', votes: 31200, cumulative: 120000 },
]

const MONTHLY_DATA = [
  { month: 'Jan', elections: 4, voters: 120000, votes: 88000 },
  { month: 'Feb', elections: 6, voters: 200000, votes: 156000 },
  { month: 'Mar', elections: 3, voters: 80000,  votes: 62000 },
  { month: 'Apr', elections: 8, voters: 350000, votes: 280000 },
  { month: 'May', elections: 5, voters: 175000, votes: 140000 },
  { month: 'Jun', elections: 11, voters: 480000, votes: 390000 },
]

const PARTY_SHARE = [
  { name: 'National Progress', value: 34.2, color: 'cyan' as const },
  { name: 'Liberty Alliance',  value: 28.7, color: 'purple' as const },
  { name: 'United Front',      value: 22.1, color: 'pink' as const },
  { name: 'Green Future',      value: 15.0, color: 'green' as const },
]

const LIVE_ELECTIONS = [
  { id: '1', title: 'National Presidential Election 2024', voters: '1.24M', cast: '847K', pct: 68.3, status: 'live', ends: '2h 34m' },
  { id: '2', title: 'Senate District 7',                  voters: '84K',  cast: '61K',  pct: 72.6, status: 'live', ends: '2h 34m' },
  { id: '3', title: 'State Governorship 2024',            voters: '2.1M', cast: '-',    pct: 0,    status: 'upcoming', ends: 'In 3 days' },
]

const RECENT_ACTIVITY = [
  { icon: '🗳️', msg: 'New vote cast — Presidential Election', time: '2s ago', color: 'text-[#00d4ff]' },
  { icon: '👤', msg: 'Candidate profile updated — James Okafor', time: '1m ago', color: 'text-[#7c3aed]' },
  { icon: '✅', msg: 'Voter identity verified — voter #847294', time: '2m ago', color: 'text-[#00ff88]' },
  { icon: '⚠️', msg: 'Unusual login attempt blocked', time: '5m ago', color: 'text-[#ff2d6a]' },
  { icon: '📊', msg: 'Results snapshot exported — District 7', time: '8m ago', color: 'text-[#f59e0b]' },
  { icon: '🗳️', msg: 'New vote cast — Senate District 7', time: '9m ago', color: 'text-[#00d4ff]' },
]

export default function AdminDashboard() {
  const analytics = useQuery({
    queryKey: queryKeys.adminAnalytics,
    queryFn: () => analyticsApi.admin().then((r) => r.data),
    staleTime: 30_000,
  })

  const elections = useQuery({
    queryKey: queryKeys.elections({ status: 'live' }),
    queryFn: () => electionApi.list({ status: 'live', page: 1, pageSize: 5 }).then((r) => r.data),
    refetchInterval: 10_000, // poll every 10s
  })

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="Admin Overview"
        subtitle="Real-time election intelligence"
        actions={
          <Link href="/admin/elections/create"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white text-xs font-bold font-orb tracking-wider hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all">
            + New Election
          </Link>
        }
      />

      <main className="flex-1 p-6 overflow-y-auto space-y-6">

        {/* ── System status banner ── */}
        <div className="flex items-center justify-between bg-[rgba(0,255,136,0.05)] border border-[rgba(0,255,136,0.2)] rounded-xl px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88] animate-pulse" />
            <span className="text-xs text-[#00ff88] font-mono">ALL SYSTEMS OPERATIONAL — 3 elections live</span>
          </div>
          <div className="flex items-center gap-6 text-xs font-mono text-[#475569]">
            <span>Uptime: <span className="text-[#00ff88]">99.97%</span></span>
            <span>API: <span className="text-[#00ff88]">12ms</span></span>
            <span>DB: <span className="text-[#00ff88]">4ms</span></span>
          </div>
        </div>

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard label="Total Voters"       value="1,240,000"  trend="+12.4% this week"      icon="👥"  accent="cyan"   sublabel="Registered" />
          <StatsCard label="Votes Cast"         value="847,293"    trend="+8,200 in last hour"   icon="🗳️" accent="purple" sublabel="And counting" />
          <StatsCard label="Voter Turnout"      value="68.3%"      trend="+4.2% above avg"       icon="📈"  accent="green"  sublabel="Live metric" />
          <StatsCard label="Active Elections"   value="3"          trend="2 closing today"        icon="⚡"  accent="amber"  sublabel="Right now" />
        </div>

        {/* ── Charts Row 1 ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Turnout over time */}
          <div className="xl:col-span-2 bg-[#0e0e24] border border-[rgba(0,212,255,0.15)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-orb text-sm font-bold text-white">Hourly Vote Turnout</h3>
                <p className="text-xs text-[#475569] font-mono mt-0.5">Presidential Election 2024 · Today</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#00ff88] bg-[rgba(0,255,136,0.08)] px-2.5 py-1 rounded-full border border-[rgba(0,255,136,0.2)] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />LIVE
              </div>
            </div>
            <VotexAreaChart
              data={TURNOUT_DATA}
              xKey="hour"
              lines={[
                { key: 'cumulative', color: 'cyan',   name: 'Cumulative' },
                { key: 'votes',      color: 'purple',  name: 'Per hour' },
              ]}
            />
          </div>

          {/* Party share donut */}
          <div className="bg-[#0e0e24] border border-[rgba(0,212,255,0.15)] rounded-xl p-5">
            <h3 className="font-orb text-sm font-bold text-white mb-1">Party Vote Share</h3>
            <p className="text-xs text-[#475569] font-mono mb-4">Live distribution</p>
            <VotexDonutChart data={PARTY_SHARE} />
            <div className="space-y-2 mt-2">
              {PARTY_SHARE.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: COLORS[p.color] }} />
                    <span className="text-[#94a3b8]">{p.name}</span>
                  </div>
                  <span className="font-mono font-bold" style={{ color: COLORS[p.color] }}>{p.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Charts Row 2 ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Monthly activity */}
          <div className="bg-[#0e0e24] border border-[rgba(0,212,255,0.15)] rounded-xl p-5">
            <h3 className="font-orb text-sm font-bold text-white mb-1">Election Activity — Last 6 Months</h3>
            <p className="text-xs text-[#475569] font-mono mb-4">Elections run and voters engaged</p>
            <VotexBarChart
              data={MONTHLY_DATA}
              xKey="month"
              bars={[
                { key: 'votes',    color: 'cyan',   name: 'Votes Cast' },
                { key: 'voters',   color: 'purple',  name: 'Registered Voters' },
              ]}
              height={220}
            />
          </div>

          {/* Live elections list */}
          <div className="bg-[#0e0e24] border border-[rgba(0,212,255,0.15)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-orb text-sm font-bold text-white">Live Elections</h3>
              <Link href="/admin/elections" className="text-xs text-[#00d4ff] hover:underline font-mono">View all →</Link>
            </div>
            <div className="space-y-3">
              {LIVE_ELECTIONS.map((el) => (
                <div key={el.id} className="border border-[rgba(0,212,255,0.12)] rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{el.title}</p>
                      <p className="text-xs text-[#475569] font-mono mt-0.5">{el.voters} registered · {el.cast} voted</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-mono flex-shrink-0 ml-2 ${
                      el.status === 'live'
                        ? 'bg-[rgba(0,255,136,0.1)] text-[#00ff88] border border-[rgba(0,255,136,0.2)]'
                        : 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b] border border-[rgba(245,158,11,0.2)]'
                    }`}>
                      {el.status === 'live' ? '● LIVE' : '◎ SOON'}
                    </span>
                  </div>
                  {el.status === 'live' && (
                    <div>
                      <div className="flex justify-between text-xs text-[#475569] font-mono mb-1">
                        <span>Turnout</span>
                        <span className="text-[#00d4ff]">{el.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-[#060611] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] rounded-full"
                          style={{ width: `${el.pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Link href={`/admin/elections/${el.id}`}
                      className="text-xs px-3 py-1.5 rounded border border-[rgba(0,212,255,0.2)] text-[#94a3b8] hover:text-[#00d4ff] hover:border-[#00d4ff] transition-all font-mono">
                      Monitor
                    </Link>
                    <Link href={`/admin/elections/${el.id}/configure`}
                      className="text-xs px-3 py-1.5 rounded border border-[rgba(0,212,255,0.2)] text-[#94a3b8] hover:text-[#00d4ff] hover:border-[#00d4ff] transition-all font-mono">
                      Configure
                    </Link>
                    {el.status === 'live' && (
                      <button className="text-xs px-3 py-1.5 rounded border border-[rgba(255,45,106,0.2)] text-[#ff2d6a] hover:border-[#ff2d6a] transition-all font-mono ml-auto">
                        Pause
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom Row ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Recent activity */}
          <div className="xl:col-span-2 bg-[#0e0e24] border border-[rgba(0,212,255,0.15)] rounded-xl p-5">
            <h3 className="font-orb text-sm font-bold text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {RECENT_ACTIVITY.map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-[rgba(0,212,255,0.06)] last:border-0">
                  <span className="text-base">{a.icon}</span>
                  <span className={`text-xs flex-1 ${a.color}`}>{a.msg}</span>
                  <span className="text-xs text-[#475569] font-mono flex-shrink-0">{a.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-[#0e0e24] border border-[rgba(0,212,255,0.15)] rounded-xl p-5">
            <h3 className="font-orb text-sm font-bold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {[
                { href: '/admin/elections/create', label: 'Create Election',      icon: '＋', color: 'from-[#00d4ff] to-[#7c3aed]' },
                { href: '/admin/candidates',        label: 'Approve Candidates',   icon: '✅', color: 'from-[#7c3aed] to-[#ff2d6a]' },
                { href: '/admin/voters',            label: 'Manage Voters',        icon: '👥', color: 'from-[#ff2d6a] to-[#f59e0b]' },
                { href: '/admin/analytics',         label: 'View Full Analytics',  icon: '📊', color: 'from-[#f59e0b] to-[#00ff88]' },
                { href: '/admin/audit',             label: 'Audit Logs',           icon: '🔍', color: 'from-[#00ff88] to-[#00d4ff]' },
              ].map((a) => (
                <Link key={a.href} href={a.href}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[rgba(0,212,255,0.12)]
                    hover:border-[rgba(0,212,255,0.3)] hover:bg-[rgba(0,212,255,0.04)] transition-all group">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${a.color} flex items-center justify-center text-sm flex-shrink-0`}>
                    {a.icon}
                  </div>
                  <span className="text-xs font-semibold text-[#94a3b8] group-hover:text-white transition-colors">{a.label}</span>
                  <span className="ml-auto text-[#475569] text-xs group-hover:text-[#00d4ff] transition-colors">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}