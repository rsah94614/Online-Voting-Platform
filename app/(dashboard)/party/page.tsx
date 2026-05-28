'use client'
// app/(dashboard)/party/page.tsx

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import StatsCard from '@/components/dashboard/StatsCard'
import { Card, CardHeader, Progress, Avatar, PageLoader, Empty } from '@/components/dashboard/ui'
import { VotexAreaChart, VotexDonutChart, VotexBarChart, COLORS } from '@/components/dashboard/charts/Charts'

const apiFetch = (u: string) => fetch(u, { credentials: 'include' }).then(r => r.json())

/* ── Mock data (replace with real party API) ────────────────────────────────── */
const PARTY_INFO = {
  name: 'National Progress Party',
  abbreviation: 'NPP',
  color: '#00d4ff',
  ideology: ['Progressive', 'Social Democracy', 'Tech Policy'],
  foundedYear: 1998,
  status: 'ACTIVE',
}

const PARTY_CANDIDATES = [
  { id: '1', name: 'Aria Chen',      election: 'Presidential 2024',    pct: 34.2, votes: 289574, rank: 1, status: 'LIVE', color: '#00d4ff' },
  { id: '2', name: 'Ray Nakamura',   election: 'Senate District 7',    pct: 41.8, votes: 35140,  rank: 1, status: 'LIVE', color: '#00d4ff' },
  { id: '3', name: 'Meera Iyer',     election: 'State Assembly 2024',  pct: 28.3, votes: 18900,  rank: 2, status: 'UPCOMING', color: '#7c3aed' },
]

const TREND_DATA = [
  { month: 'Jan', share: 31.2, seats: 4 },
  { month: 'Feb', share: 32.8, seats: 6 },
  { month: 'Mar', share: 30.1, seats: 3 },
  { month: 'Apr', share: 34.5, seats: 8 },
  { month: 'May', share: 33.2, seats: 5 },
  { month: 'Jun', share: 36.1, seats: 9 },
]

const REGION_SUPPORT = [
  { name: 'North',   value: 38, color: 'cyan'   as const },
  { name: 'South',   value: 30, color: 'purple' as const },
  { name: 'East',    value: 36, color: 'green'  as const },
  { name: 'West',    value: 33, color: 'amber'  as const },
  { name: 'Central', value: 35, color: 'pink'   as const },
]

const RECENT_ACTIVITY = [
  { icon: '📊', msg: 'Aria Chen gained 1.8% in last 2 hours', time: '5m ago', color: 'text-[#00ff88]' },
  { icon: '🗳️', msg: 'Ray Nakamura leads District 7 by 9.2%', time: '12m ago', color: 'text-[#00d4ff]' },
  { icon: '👤', msg: 'New candidate application — Priya Malhotra', time: '1h ago', color: 'text-[#f59e0b]' },
  { icon: '📈', msg: 'Party vote share up 2.1% nationally', time: '3h ago', color: 'text-[#7c3aed]' },
]

export default function PartyDashboard() {
  const user = useAuthStore(s => s.user)

  const { data: partyData, isLoading } = useQuery({
    queryKey: ['party-info'],
    queryFn: () => apiFetch('/api/auth/me'),
  })

  const partyMembership = partyData?.data?.partyMembership
  const partyName = partyMembership?.party?.name ?? PARTY_INFO.name
  const partyColor = partyMembership?.party?.color ?? PARTY_INFO.color
  const partyAbbr = partyMembership?.party?.abbreviation ?? PARTY_INFO.abbreviation

  const totalVotes      = PARTY_CANDIDATES.reduce((s, c) => s + c.votes, 0)
  const leadingCount    = PARTY_CANDIDATES.filter(c => c.rank === 1 && c.status === 'LIVE').length

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="Party Command Center"
        subtitle={`${partyName} · ${partyAbbr}`}
        actions={
          <div className="flex gap-2">
            <Link href="/party/candidates">
              <button className="px-4 py-2 rounded-lg border border-[rgba(0,212,255,0.2)] text-xs font-orb text-[#94a3b8] hover:text-[#00d4ff] hover:border-[#00d4ff] transition-all">
                👤 Candidates
              </button>
            </Link>
            <Link href="/party/performance">
              <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white text-xs font-orb font-bold hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all">
                📊 Analytics
              </button>
            </Link>
          </div>
        }
      />

      <main className="flex-1 p-6 overflow-y-auto space-y-6">

        {/* Party identity banner */}
        <Card className="p-5">
          <div className="flex items-center gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-orb font-black text-white flex-shrink-0 shadow-[0_0_20px_rgba(0,212,255,0.3)]"
              style={{ background: `linear-gradient(135deg, ${partyColor}, #7c3aed)` }}>
              {partyAbbr?.slice(0, 3)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-orb font-black text-white text-xl">{partyName}</h2>
                <span className="text-[10px] bg-[rgba(0,255,136,0.1)] text-[#00ff88] border border-[rgba(0,255,136,0.2)] px-2 py-0.5 rounded font-mono">
                  ACTIVE
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {PARTY_INFO.ideology.map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(0,212,255,0.08)] text-[#475569] border border-[rgba(0,212,255,0.1)] font-mono">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-orb font-bold text-3xl" style={{ color: partyColor }}>38.1%</p>
              <p className="text-xs text-[#475569] font-mono">national vote share</p>
              <p className="text-xs text-[#00ff88] font-mono mt-0.5">↑ +2.1% this week</p>
            </div>
          </div>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
          <StatsCard label="Candidates"    value={PARTY_CANDIDATES.length}       icon="👤" accent="cyan"   sublabel="Active campaigns" />
          <StatsCard label="Leading"       value={leadingCount}                   icon="🥇" accent="green"  sublabel="Currently #1" />
          <StatsCard label="Total Votes"   value={totalVotes.toLocaleString()}    icon="🗳️" accent="purple" sublabel="Combined all races" />
          <StatsCard label="Vote Share"    value="38.1%"                          icon="📊" accent="amber"  sublabel="Nationally" />
          <StatsCard label="Party Rank"    value="#1"                             icon="⚡" accent="cyan"   sublabel="Out of 4 parties" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          <Card className="xl:col-span-2">
            <CardHeader title="Vote Share Trend" subtitle="Last 6 months — all elections" />
            <div className="p-5">
              <VotexAreaChart
                data={TREND_DATA}
                xKey="month"
                lines={[{ key: 'share', color: 'cyan', name: 'Party Vote Share %' }]}
                height={220}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Regional Support" subtitle="Vote share by region" />
            <div className="p-4">
              <VotexDonutChart data={REGION_SUPPORT} height={190} innerRadius={48} />
            </div>
            <div className="px-5 pb-4 space-y-2">
              {REGION_SUPPORT.map(r => (
                <div key={r.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[r.color] }} />
                  <span className="text-[#94a3b8] flex-1">{r.name}</span>
                  <span className="font-orb font-bold" style={{ color: COLORS[r.color] }}>{r.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Candidates overview + Recent activity */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          <Card>
            <CardHeader
              title={`Candidate Performance (${PARTY_CANDIDATES.length})`}
              action={<Link href="/party/candidates" className="text-xs text-[#00d4ff] hover:underline font-mono">Manage →</Link>}
            />
            <div className="p-5 space-y-4">
              {PARTY_CANDIDATES.map(c => (
                <div key={c.id} className="p-4 bg-[#0a0a1a] rounded-xl border border-[rgba(0,212,255,0.1)] hover:border-[rgba(0,212,255,0.2)] transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={c.name} size={9}
                      gradient={c.rank === 1 ? 'from-[#00d4ff] to-[#7c3aed]' : 'from-[#475569] to-[#334155]'} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white">{c.name}</p>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${
                          c.status === 'LIVE'
                            ? 'bg-[rgba(0,255,136,0.1)] text-[#00ff88] border-[rgba(0,255,136,0.2)]'
                            : 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b] border-[rgba(245,158,11,0.2)]'
                        }`}>
                          {c.status === 'LIVE' ? '● LIVE' : 'UPCOMING'}
                        </span>
                        {c.rank === 1 && c.status === 'LIVE' && (
                          <span className="text-[10px] bg-[rgba(245,158,11,0.12)] text-[#f59e0b] border border-[rgba(245,158,11,0.2)] px-1.5 py-0.5 rounded font-mono">
                            🥇 LEADING
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#475569] mt-0.5">{c.election}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-orb font-bold text-lg" style={{ color: c.color }}>{c.pct}%</p>
                      <p className="text-[10px] text-[#475569] font-mono">{c.votes.toLocaleString()}</p>
                    </div>
                  </div>
                  <Progress value={c.pct} color={c.color} />
                </div>
              ))}
            </div>
          </Card>

          {/* Right column */}
          <div className="space-y-6">
            {/* Recent activity */}
            <Card>
              <CardHeader title="Recent Activity" />
              <div className="p-4 space-y-3">
                {RECENT_ACTIVITY.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-[rgba(0,212,255,0.06)] last:border-0">
                    <span className="text-base flex-shrink-0">{a.icon}</span>
                    <p className={`text-xs flex-1 leading-relaxed ${a.color}`}>{a.msg}</p>
                    <span className="text-[10px] text-[#475569] font-mono flex-shrink-0">{a.time}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick actions */}
            <Card>
              <CardHeader title="Quick Actions" />
              <div className="p-4 space-y-2">
                {[
                  { href: '/party/candidates',  icon: '👤', label: 'Manage Candidates',    desc: 'View and support all candidates' },
                  { href: '/party/performance', icon: '📊', label: 'Full Analytics',        desc: 'Deep dive into performance data' },
                  { href: '/party/campaign',    icon: '🎯', label: 'Campaign Manager',      desc: 'Strategy and messaging tools' },
                  { href: '/party/finances',    icon: '💰', label: 'Party Finances',        desc: 'Fund allocation and reporting' },
                  { href: '/party/settings',    icon: '⚙️', label: 'Party Settings',        desc: 'Profile, branding, contacts' },
                ].map(item => (
                  <Link key={item.href} href={item.href}
                    className="flex items-center gap-3 p-3 rounded-xl border border-[rgba(0,212,255,0.1)] hover:border-[rgba(0,212,255,0.3)] hover:bg-[rgba(0,212,255,0.03)] transition-all group">
                    <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white group-hover:text-[#00d4ff] transition-colors">{item.label}</p>
                      <p className="text-xs text-[#475569]">{item.desc}</p>
                    </div>
                    <span className="text-[#475569] group-hover:text-[#00d4ff] transition-colors">→</span>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>

      </main>
    </div>
  )
}