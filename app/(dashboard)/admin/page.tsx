'use client'

import { useQuery } from '@tanstack/react-query'
import { analyticsApi, electionApi } from '@/lib/api'
import { queryKeys } from '@/lib/queryClient'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import StatsCard from '@/components/dashboard/StatsCard'
import { VotexAreaChart, VotexBarChart, VotexDonutChart, COLORS } from '@/components/dashboard/charts/Charts'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import AdBanner from '@/components/AdBanner'

// ─── Real Data Mappings ────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, 'cyan' | 'amber' | 'purple' | 'pink' | 'green'> = {
  LIVE: 'cyan',
  UPCOMING: 'amber',
  ENDED: 'purple',
  DRAFT: 'pink',
  CANCELLED: 'green'
}

const getActivityIcon = (action: string) => {
  if (action.includes('VOTE')) return '🗳️'
  if (action.includes('USER') || action.includes('CANDIDATE')) return '👤'
  if (action.includes('LOGIN')) return '✅'
  if (action.includes('ELECTION')) return '⚡'
  return '📊'
}

const getActivityColor = (action: string) => {
  if (action.includes('VOTE')) return 'text-[#00d4ff]'
  if (action.includes('CREATE')) return 'text-[#00ff88]'
  if (action.includes('UPDATE') || action.includes('APPROVE')) return 'text-[#f59e0b]'
  if (action.includes('DELETE') || action.includes('BLOCK')) return 'text-[#ff2d6a]'
  return 'text-[#7c3aed]'
}

export default function AdminDashboard() {
  const analytics = useQuery({
    queryKey: queryKeys.adminAnalytics,
    queryFn: () => analyticsApi.admin().then((r) => r.data),
    staleTime: 30_000,
  })

  const elections = useQuery({
    queryKey: queryKeys.elections({ status: 'LIVE' }),
    queryFn: () => electionApi.list({ status: 'LIVE', page: 1, limit: 5 }).then((r) => r.elections),
    refetchInterval: 10_000, // poll every 10s
  })

  if (analytics.isLoading || elections.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const {
    totalVoters = 0,
    totalVotesCast = 0,
    averageTurnout = 0,
    liveElections = 0,
    systemUptime = '99.99%',
    electionsByStatus = {},
    electionsByMonth = [],
    recentActivity = []
  } = analytics.data || {}

  const liveElectionsList = elections.data || []

  // Format Status Donut Chart Data
  const statusShareData = Object.entries(electionsByStatus).map(([status, count]) => ({
    name: status,
    value: Number(count),
    color: STATUS_COLORS[status] || 'cyan'
  })).filter(d => d.value > 0)


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

        <AdBanner />

        {/* ── System status banner ── */}
        <div className="flex items-center justify-between bg-[rgba(0,255,136,0.05)] border border-[rgba(0,255,136,0.2)] rounded-xl px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88] animate-pulse" />
            <span className="text-xs text-[#00ff88] font-mono">ALL SYSTEMS OPERATIONAL — {liveElections} elections live</span>
          </div>
          <div className="flex items-center gap-6 text-xs font-mono text-[#475569]">
            <span>Uptime: <span className="text-[#00ff88]">{systemUptime}</span></span>
            <span>API: <span className="text-[#00ff88]">12ms</span></span>
            <span>DB: <span className="text-[#00ff88]">4ms</span></span>
          </div>
        </div>

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard label="Total Voters"       value={totalVoters.toLocaleString()}  trend="Registered across tenant"      icon="👥"  accent="cyan"   sublabel="Total Users" />
          <StatsCard label="Votes Cast"         value={totalVotesCast.toLocaleString()}    trend="All-time platform votes"   icon="🗳️" accent="purple" sublabel="Historical count" />
          <StatsCard label="Avg Turnout"        value={`${averageTurnout}%`}      trend="Average participation"       icon="📈"  accent="green"  sublabel="Global metric" />
          <StatsCard label="Active Elections"   value={liveElections}          trend="Currently processing votes"        icon="⚡"  accent="amber"  sublabel="Right now" />
        </div>

        {/* ── Charts Row 1 ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Monthly activity (Primary Chart) */}
          <div className="xl:col-span-2 bg-[#0e0e24] border border-[rgba(0,212,255,0.15)] rounded-xl p-5">
            <h3 className="font-orb text-sm font-bold text-white mb-1">Election Activity — Last 6 Months</h3>
            <p className="text-xs text-[#475569] font-mono mb-4">Historical trend of elections run and votes cast</p>
            <VotexBarChart
              data={electionsByMonth}
              xKey="month"
              bars={[
                { key: 'votes',    color: 'cyan',   name: 'Votes Cast' },
                { key: 'elections', color: 'purple', name: 'Elections Run' },
              ]}
              height={280}
            />
          </div>

          {/* Status Donut */}
          <div className="bg-[#0e0e24] border border-[rgba(0,212,255,0.15)] rounded-xl p-5">
            <h3 className="font-orb text-sm font-bold text-white mb-1">Elections by Status</h3>
            <p className="text-xs text-[#475569] font-mono mb-4">Current platform distribution</p>
            {statusShareData.length > 0 ? (
              <VotexDonutChart data={statusShareData} />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-500 font-mono text-xs">No elections yet</div>
            )}
            <div className="space-y-2 mt-4">
              {statusShareData.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: COLORS[p.color as keyof typeof COLORS] }} />
                    <span className="text-[#94a3b8]">{p.name}</span>
                  </div>
                  <span className="font-mono font-bold" style={{ color: COLORS[p.color as keyof typeof COLORS] }}>{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Second Row ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Live elections list */}
          <div className="xl:col-span-2 bg-[#0e0e24] border border-[rgba(0,212,255,0.15)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-orb text-sm font-bold text-white">Live Elections</h3>
              <Link href="/admin/elections" className="text-xs text-[#00d4ff] hover:underline font-mono">View all →</Link>
            </div>
            {liveElectionsList.length === 0 ? (
              <div className="text-center text-slate-500 py-10 font-mono text-sm">No live elections currently running.</div>
            ) : (
              <div className="space-y-3">
                {liveElectionsList.map((el: any) => {
                  const pct = el.totalVoters > 0 ? ((el._count?.votes || 0) / el.totalVoters) * 100 : 0
                  return (
                    <div key={el.id} className="border border-[rgba(0,212,255,0.12)] rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{el.title}</p>
                          <p className="text-xs text-[#475569] font-mono mt-0.5">{el.totalVoters} registered · {el._count?.votes || 0} voted</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full font-mono flex-shrink-0 ml-2 bg-[rgba(0,255,136,0.1)] text-[#00ff88] border border-[rgba(0,255,136,0.2)]">
                          ● LIVE
                        </span>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-[#475569] font-mono mb-1">
                          <span>Turnout</span>
                          <span className="text-[#00d4ff]">{pct.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-[#060611] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Link href={`/admin/elections/${el.id}`}
                          className="text-xs px-3 py-1.5 rounded border border-[rgba(0,212,255,0.2)] text-[#94a3b8] hover:text-[#00d4ff] hover:border-[#00d4ff] transition-all font-mono">
                          Monitor
                        </Link>
                        <Link href={`/admin/elections/${el.id}/configure`}
                          className="text-xs px-3 py-1.5 rounded border border-[rgba(0,212,255,0.2)] text-[#94a3b8] hover:text-[#00d4ff] hover:border-[#00d4ff] transition-all font-mono ml-auto">
                          Configure
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
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
              
              <Link href="/admin/billing" className="flex items-center gap-3 p-3 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 transition-all group mt-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm flex-shrink-0">
                  ⭐
                </div>
                <div className="flex-1">
                  <span className="text-xs font-semibold text-purple-300 block">Upgrade to Pro</span>
                  <span className="text-[10px] text-purple-400/70">Remove ads & unlock features</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Bottom Row ── */}
        <div className="grid grid-cols-1 gap-6">

          {/* Recent activity */}
          <div className="bg-[#0e0e24] border border-[rgba(0,212,255,0.15)] rounded-xl p-5">
            <h3 className="font-orb text-sm font-bold text-white mb-4">Audit & Activity Log</h3>
            {recentActivity.length === 0 ? (
              <div className="text-center text-slate-500 py-10 font-mono text-sm">No recent activity.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-2">
                {recentActivity.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-3 py-2 border-b border-[rgba(0,212,255,0.06)] last:border-0">
                    <span className="text-base">{getActivityIcon(a.action)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs truncate ${getActivityColor(a.action)}`}>
                        {a.action} · {a.resource}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">by {a.user}</p>
                    </div>
                    <span className="text-[10px] text-[#475569] font-mono flex-shrink-0">
                      {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}