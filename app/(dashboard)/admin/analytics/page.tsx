'use client'
// app/(dashboard)/admin/analytics/page.tsx

import { useQuery } from '@tanstack/react-query'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import StatsCard from '@/components/dashboard/StatsCard'
import { Card, CardHeader, PageLoader } from '@/components/dashboard/ui'
import { VotexAreaChart, VotexBarChart, VotexDonutChart, VotexLineChart, COLORS } from '@/components/dashboard/charts/Charts'

const apiFetch = (url: string) => fetch(url, { credentials: 'include' }).then(r => r.json())

// Mock rich analytics data
const MONTHLY = [
  { month: 'Nov', elections: 2, votes: 44000, voters: 60000, turnout: 73 },
  { month: 'Dec', elections: 4, votes: 88000, voters: 110000, turnout: 80 },
  { month: 'Jan', elections: 3, votes: 62000, voters: 85000, turnout: 73 },
  { month: 'Feb', elections: 6, votes: 156000, voters: 200000, turnout: 78 },
  { month: 'Mar', elections: 3, votes: 52000, voters: 80000, turnout: 65 },
  { month: 'Apr', elections: 8, votes: 280000, voters: 350000, turnout: 80 },
  { month: 'May', elections: 5, votes: 140000, voters: 175000, turnout: 80 },
  { month: 'Jun', elections: 11, votes: 390000, voters: 480000, turnout: 81 },
]

const HOURLY = [
  { time: '06:00', votes: 1200 }, { time: '08:00', votes: 8400 },
  { time: '10:00', votes: 14200 }, { time: '12:00', votes: 22100 },
  { time: '14:00', votes: 18600 }, { time: '16:00', votes: 24300 },
  { time: '18:00', votes: 31200 }, { time: '20:00', votes: 12400 },
]

const PARTY_DATA = [
  { name: 'National Progress', value: 34.2, color: 'cyan' as const },
  { name: 'Liberty Alliance',  value: 28.7, color: 'purple' as const },
  { name: 'United Front',      value: 22.1, color: 'pink' as const },
  { name: 'Green Future',      value: 15.0, color: 'green' as const },
]

const ELECTION_TYPE_DATA = [
  { name: 'Presidential',  value: 12, color: 'cyan' as const },
  { name: 'Parliamentary', value: 28, color: 'purple' as const },
  { name: 'Corporate',     value: 35, color: 'amber' as const },
  { name: 'University',    value: 20, color: 'green' as const },
  { name: 'Community',     value: 15, color: 'pink' as const },
]

const DEVICE_DATA = [
  { device: 'Mobile', votes: 58 },
  { device: 'Desktop', votes: 32 },
  { device: 'In-Person', votes: 10 },
]

const GEO_DATA = [
  { region: 'North', voters: 320000, turnout: 72 },
  { region: 'South', voters: 280000, turnout: 68 },
  { region: 'East',  voters: 190000, turnout: 75 },
  { region: 'West',  voters: 150000, turnout: 64 },
  { region: 'Central', voters: 300000, turnout: 71 },
]

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => apiFetch('/api/analytics/admin'),
    staleTime: 60_000,
  })

  const analytics = data?.data

  if (isLoading) return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Analytics" />
      <PageLoader />
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="Analytics & Insights"
        subtitle="Platform-wide election intelligence"
        actions={<button className="px-3 py-1.5 rounded-lg border border-[rgba(0,212,255,0.2)] text-xs text-[#94a3b8] hover:text-[#00d4ff] hover:border-[#00d4ff] transition-all font-mono">⬇️ Export Report</button>}
      />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto">

        {/* Top KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard label="Total Elections"   value={analytics?.totalElections ?? 37}     trend="All time"          icon="🗳️" accent="cyan" />
          <StatsCard label="Total Voters"      value={(analytics?.totalVoters ?? 1240000).toLocaleString()} trend="+12.4% this month" icon="👥" accent="purple" />
          <StatsCard label="Votes Cast"        value={(analytics?.totalVotesCast ?? 847293).toLocaleString()} trend="Active elections"  icon="📊" accent="green" />
          <StatsCard label="Avg Turnout"       value={`${analytics?.averageTurnout ?? 74.2}%`} trend="+2.1% vs last year" icon="📈" accent="amber" />
        </div>

        {/* Row 1 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
            <CardHeader title="Monthly Votes & Elections" subtitle="6-month rolling view" />
            <div className="p-5">
              <VotexBarChart
                data={MONTHLY} xKey="month"
                bars={[
                  { key: 'votes',     color: 'cyan',   name: 'Votes Cast' },
                  { key: 'voters',    color: 'purple',  name: 'Registered Voters' },
                ]}
                height={240}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Elections by Type" subtitle="Distribution" />
            <div className="p-5">
              <VotexDonutChart data={ELECTION_TYPE_DATA} height={200} />
            </div>
            <div className="px-5 pb-5 space-y-2">
              {ELECTION_TYPE_DATA.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: COLORS[d.color] }} />
                    <span className="text-[#94a3b8]">{d.name}</span>
                  </div>
                  <span className="font-mono font-bold" style={{ color: COLORS[d.color] }}>{d.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Hourly Vote Turnout" subtitle="Today — live election" />
            <div className="p-5">
              <VotexAreaChart data={HOURLY} xKey="time"
                lines={[{ key: 'votes', color: 'cyan', name: 'Votes/hour' }]} height={220} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Monthly Turnout Rate %" subtitle="Average across all elections" />
            <div className="p-5">
              <VotexLineChart data={MONTHLY} xKey="month"
                lines={[{ key: 'turnout', color: 'green', name: 'Turnout %' }]} height={220} />
            </div>
          </Card>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card>
            <CardHeader title="Party Vote Share" subtitle="Current election" />
            <div className="p-5">
              <VotexDonutChart data={PARTY_DATA} height={200} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Voting Device Breakdown" />
            <div className="p-5">
              <VotexBarChart data={DEVICE_DATA} xKey="device"
                bars={[{ key: 'votes', color: 'purple', name: 'Share %' }]} height={200} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Geographic Turnout" />
            <div className="p-5 space-y-4">
              {GEO_DATA.map((g) => (
                <div key={g.region}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#94a3b8]">{g.region} Region</span>
                    <span className="font-mono text-[#00d4ff] font-bold">{g.turnout}%</span>
                  </div>
                  <div className="h-2 bg-[#0a0a1a] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] rounded-full transition-all"
                      style={{ width: `${g.turnout}%` }} />
                  </div>
                  <div className="text-[10px] text-[#475569] font-mono mt-0.5">
                    {g.voters.toLocaleString()} registered voters
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* System metrics */}
        <Card>
          <CardHeader title="System Performance Metrics" />
          <div className="p-5 grid grid-cols-2 xl:grid-cols-6 gap-4">
            {[
              { label: 'System Uptime',      value: analytics?.systemUptime ?? '99.97%', icon: '⚡', color: '#00ff88' },
              { label: 'API Avg Response',   value: '12ms',      icon: '🔌', color: '#00d4ff' },
              { label: 'DB Query Time',      value: '4ms',       icon: '🗄️', color: '#7c3aed' },
              { label: 'Active Connections', value: '2,841',     icon: '🌐', color: '#f59e0b' },
              { label: 'Pending Approval',   value: analytics?.pendingCandidates ?? 3, icon: '⏳', color: '#ff2d6a' },
              { label: 'Security Incidents', value: '0',         icon: '🛡️', color: '#00ff88' },
            ].map((m) => (
              <div key={m.label} className="bg-[#0a0a1a] border border-[rgba(0,212,255,0.1)] rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">{m.icon}</div>
                <div className="font-orb font-bold text-lg" style={{ color: m.color }}>{m.value}</div>
                <div className="text-[10px] text-[#475569] uppercase tracking-wider mt-1">{m.label}</div>
              </div>
            ))}
          </div>
        </Card>

      </main>
    </div>
  )
}