'use client'
// app/(dashboard)/party/performance/page.tsx

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { useElectionStore } from '@/stores/electionStore'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import StatsCard from '@/components/dashboard/StatsCard'
import { Card, CardHeader, Progress, Avatar, PageLoader, Empty, Table, TR, TD, Btn } from '@/components/dashboard/ui'
import { VotexAreaChart, VotexBarChart, VotexDonutChart, VotexLineChart, COLORS } from '@/components/dashboard/charts/Charts'
import toast from 'react-hot-toast'

const apiFetch = (url: string) => fetch(url, { credentials: 'include' }).then(r => r.json())

// ─── Mock Performance Data (replace with real API) ──────────────────────────────

const MOCK_HOURLY_VOTES = [
  { time: '06:00', partyVotes: 240, totalVotes: 1200, cumulative: 240 },
  { time: '08:00', partyVotes: 680, totalVotes: 8400, cumulative: 920 },
  { time: '10:00', partyVotes: 1100, totalVotes: 14200, cumulative: 2020 },
  { time: '12:00', partyVotes: 1650, totalVotes: 22100, cumulative: 3670 },
  { time: '14:00', partyVotes: 1400, totalVotes: 18600, cumulative: 5070 },
  { time: '16:00', partyVotes: 1800, totalVotes: 24300, cumulative: 6870 },
  { time: '18:00', partyVotes: 2200, totalVotes: 31200, cumulative: 9070 },
  { time: '20:00', partyVotes: 920, totalVotes: 12400, cumulative: 9990 },
]

const MOCK_PARTY_COMPARISON = [
  { name: 'National Progress', votes: 9990, percentage: 38.2, color: 'cyan' as const },
  { name: 'Liberty Alliance', votes: 7240, percentage: 27.6, color: 'purple' as const },
  { name: 'United Front', votes: 5810, percentage: 22.1, color: 'pink' as const },
  { name: 'Green Future', votes: 3960, percentage: 12.1, color: 'green' as const },
]

const MOCK_CANDIDATE_PERFORMANCE = [
  { id: '1', name: 'Aria Chen', votes: 5420, percentage: 20.5, rank: 1, status: 'LEADING' as const, color: '#00d4ff' },
  { id: '2', name: 'Ray Nakamura', votes: 2840, percentage: 10.8, rank: 3, status: 'STRONG' as const, color: '#00d4ff' },
  { id: '3', name: 'Meera Iyer', votes: 1730, percentage: 6.6, rank: 7, status: 'COMPETITIVE' as const, color: '#7c3aed' },
]

const MOCK_REGIONAL_DATA = [
  { region: 'North', partyVotes: 2400, totalVotes: 3500, partyShare: 68.6 },
  { region: 'South', partyVotes: 2100, totalVotes: 3800, partyShare: 55.3 },
  { region: 'East', partyVotes: 2800, totalVotes: 4200, partyShare: 66.7 },
  { region: 'West', partyVotes: 1540, totalVotes: 3600, partyShare: 42.8 },
  { region: 'Central', partyVotes: 1150, totalVotes: 2700, partyShare: 42.6 },
]

const MOCK_VOTE_TREND = [
  { day: 'Day 1', votes: 2400, share: 38.1 },
  { day: 'Day 2', votes: 2810, share: 37.5 },
  { day: 'Day 3', votes: 3200, share: 38.8 },
  { day: 'Day 4', votes: 2900, share: 37.2 },
  { day: 'Day 5', votes: 4100, share: 39.1 },
  { day: 'Day 6', votes: 3800, share: 38.5 },
]

const MOCK_DEVICE_BREAKDOWN = [
  { device: 'Mobile', votes: 15240, percentage: 58 },
  { device: 'Desktop', votes: 8360, percentage: 32 },
  { device: 'In-Person', votes: 2600, percentage: 10 },
]

// ─── Component ─────────────────────────────────────────────────────────────────

interface PerformancePageProps {
  params?: { electionId?: string }
  searchParams?: { election?: string }
}

export default function PartyPerformancePage(props: PerformancePageProps) {
  const user = useAuthStore(s => s.user)
  const { liveElectionId, isPollingActive, pollInterval, startPolling, stopPolling } = useElectionStore()

  // Get election ID from URL or store
  const electionId = props.searchParams?.election || liveElectionId || 'default'

  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // Fetch user's party info
  const { data: partyData } = useQuery({
    queryKey: ['party-info'],
    queryFn: () => apiFetch('/api/auth/me'),
    staleTime: 60_000,
  })

  // Fetch election data
  const { data: electionData, isLoading: elLoading } = useQuery({
    queryKey: ['election', electionId],
    queryFn: () => apiFetch(`/api/elections/${electionId}`),
    staleTime: 30_000,
  })

  // Fetch election results (live or cached)
  const { data: resultsData, isLoading: resultsLoading, refetch: refetchResults } = useQuery({
    queryKey: ['election-results', electionId],
    queryFn: () => {
      const endpoint = election?.status === 'LIVE'
        ? `/api/elections/${electionId}/results/live`
        : `/api/elections/${electionId}/results`
      return apiFetch(endpoint)
    },
    staleTime: election?.status === 'LIVE' ? 5_000 : 60_000,
    refetchInterval: autoRefresh && election?.status === 'LIVE' ? pollInterval : false,
  })

  // Fetch party-specific performance metrics
  const { data: perfData, isLoading: perfLoading } = useQuery({
    queryKey: ['party-performance', electionId, user?.partyId],
    queryFn: () => apiFetch(`/api/elections/${electionId}/party-performance`),
    staleTime: election?.status === 'LIVE' ? 5_000 : 60_000,
    refetchInterval: autoRefresh && election?.status === 'LIVE' ? pollInterval : false,
  })

  const election = electionData?.data
  const results = resultsData?.data
  const performance = perfData?.data
  const partyMembership = partyData?.data?.partyMembership
  const partyColor = partyMembership?.party?.color ?? '#00d4ff'
  const partyName = partyMembership?.party?.name ?? 'National Progress Party'

  // Handle live polling
  useEffect(() => {
    if (election?.status === 'LIVE' && autoRefresh) {
      startPolling(electionId)
    } else {
      stopPolling()
    }
    return () => stopPolling()
  }, [election?.status, autoRefresh, electionId, startPolling, stopPolling])

  // Export to CSV
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const csvContent = generateCSVReport({
        election,
        performance: performance || MOCK_CANDIDATE_PERFORMANCE,
        regions: MOCK_REGIONAL_DATA,
        partyComparison: MOCK_PARTY_COMPARISON,
      })
      downloadCSV(csvContent, `${election?.title || 'election'}-performance-${new Date().toISOString().split('T')[0]}.csv`)
      toast.success('📊 Report exported successfully')
    } catch (error) {
      toast.error('Failed to export report')
      console.error(error)
    } finally {
      setIsExporting(false)
    }
  }

  // Calculate aggregate metrics
  const totalPartyVotes = MOCK_CANDIDATE_PERFORMANCE.reduce((s, c) => s + c.votes, 0)
  const totalVotes = MOCK_PARTY_COMPARISON.reduce((s, p) => s + p.votes, 0)
  const partyShare = (totalPartyVotes / totalVotes) * 100
  const leadingCandidates = MOCK_CANDIDATE_PERFORMANCE.filter(c => c.rank === 1).length
  const avgCandidateVotes = totalPartyVotes / MOCK_CANDIDATE_PERFORMANCE.length

  const isLoading = elLoading || resultsLoading || perfLoading

  if (isLoading && !election) {
    return (
      <div className="flex flex-col min-h-screen">
        <DashboardHeader title="Performance Analytics" />
        <PageLoader />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="Performance Analytics"
        subtitle={election?.title ? `${election.title} · Real-time tracking` : 'Live election tracking'}
        actions={
          <div className="flex gap-2 items-center">
            {election?.status === 'LIVE' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(0,255,136,0.1)] border border-[rgba(0,255,136,0.2)]">
                <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
                <span className="text-xs text-[#00ff88] font-mono font-bold">LIVE</span>
              </div>
            )}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                autoRefresh
                  ? 'bg-[rgba(0,212,255,0.15)] text-[#00d4ff] border border-[rgba(0,212,255,0.3)]'
                  : 'border border-[rgba(0,212,255,0.2)] text-[#94a3b8] hover:text-[#00d4ff]'
              }`}
              title="Toggle live refresh"
            >
              {autoRefresh ? '🔄 Auto' : '⏸ Paused'}
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-3 py-1.5 rounded-lg border border-[rgba(0,212,255,0.2)] text-xs text-[#94a3b8] hover:text-[#00d4ff] hover:border-[#00d4ff] transition-all font-mono disabled:opacity-50"
            >
              {isExporting ? '⬇️ Exporting...' : '⬇️ Export Report'}
            </button>
          </div>
        }
      />

      <main className="flex-1 p-6 overflow-y-auto space-y-6">

        {/* Top KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
          <StatsCard
            label="Party Votes"
            value={totalPartyVotes.toLocaleString()}
            icon="🗳️"
            accent="cyan"
            sublabel={`${partyShare.toFixed(1)}% of total`}
          />
          <StatsCard
            label="Vote Share"
            value={`${partyShare.toFixed(1)}%`}
            icon="📊"
            accent="green"
            sublabel={`↑ +2.1% since morning`}
          />
          <StatsCard
            label="Candidates"
            value={MOCK_CANDIDATE_PERFORMANCE.length}
            icon="👤"
            accent="purple"
            sublabel={`${leadingCandidates} leading`}
          />
          <StatsCard
            label="Avg per Candidate"
            value={Math.round(avgCandidateVotes).toLocaleString()}
            icon="📈"
            accent="amber"
            sublabel="Average votes"
          />
          <StatsCard
            label="Rank"
            value="#1"
            icon="⚡"
            accent="cyan"
            sublabel="Out of 4 parties"
          />
        </div>

        {/* Row 1: Vote trend + Party comparison */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
            <CardHeader
              title="Vote Trend"
              subtitle="Party vote growth over time"
            />
            <div className="p-5">
              <VotexAreaChart
                data={MOCK_VOTE_TREND}
                xKey="day"
                lines={[{ key: 'votes', color: 'cyan', name: 'Votes Received' }]}
                height={240}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Party Comparison" subtitle="Current standings" />
            <div className="p-4">
              <VotexDonutChart data={MOCK_PARTY_COMPARISON} height={200} innerRadius={48} />
            </div>
            <div className="px-5 pb-4 space-y-2">
              {MOCK_PARTY_COMPARISON.map(p => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[p.color] }} />
                    <span className="text-[#94a3b8] truncate">{p.name}</span>
                  </div>
                  <span className="font-mono font-bold ml-2 flex-shrink-0" style={{ color: COLORS[p.color] }}>
                    {p.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Row 2: Hourly breakdown + Device breakdown */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader
              title="Hourly Vote Turnout"
              subtitle={`Today · ${election?.status === 'LIVE' ? 'Live updates' : 'Final results'}`}
            />
            <div className="p-5">
              <VotexBarChart
                data={MOCK_HOURLY_VOTES}
                xKey="time"
                bars={[
                  { key: 'partyVotes', color: 'cyan', name: 'Party Votes' },
                  { key: 'totalVotes', color: 'purple', name: 'All Votes' },
                ]}
                height={240}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Vote Method Breakdown" subtitle="Online vs in-person" />
            <div className="p-5">
              <VotexBarChart
                data={MOCK_DEVICE_BREAKDOWN}
                xKey="device"
                bars={[{ key: 'votes', color: 'green', name: 'Votes' }]}
                height={240}
              />
            </div>
          </Card>
        </div>

        {/* Row 3: Candidate performance table */}
        <Card>
          <CardHeader
            title={`Candidate Performance (${MOCK_CANDIDATE_PERFORMANCE.length})`}
            subtitle={`${election?.title || 'This election'} · Real-time rankings`}
          />
          <div className="overflow-x-auto">
            <Table headers={['Candidate', 'Votes', 'Vote %', 'Rank', 'Status', 'Trend']}>
              {MOCK_CANDIDATE_PERFORMANCE.map(c => (
                <TR key={c.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={c.name}
                        size={9}
                        gradient={c.rank === 1 ? 'from-[#00d4ff] to-[#7c3aed]' : 'from-[#475569] to-[#334155]'}
                      />
                      <div>
                        <div className="text-sm font-semibold text-white">{c.name}</div>
                        <div className="text-xs text-[#475569] font-mono">ID: {c.id}</div>
                      </div>
                    </div>
                  </TD>
                  <TD className="font-mono font-bold text-[#00d4ff]">
                    {c.votes.toLocaleString()}
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <div className="w-20">
                        <Progress value={c.percentage} color={c.color} />
                      </div>
                      <span className="text-sm font-mono font-bold" style={{ color: c.color }}>
                        {c.percentage}%
                      </span>
                    </div>
                  </TD>
                  <TD>
                    <span className={`text-sm font-mono font-bold px-2 py-1 rounded ${
                      c.rank === 1
                        ? 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b]'
                        : 'text-[#94a3b8]'
                    }`}>
                      #{c.rank}
                    </span>
                  </TD>
                  <TD>
                    <span className={`text-xs font-mono px-2 py-1 rounded border ${
                      c.status === 'LEADING'
                        ? 'bg-[rgba(0,255,136,0.1)] text-[#00ff88] border-[rgba(0,255,136,0.2)]'
                        : c.status === 'STRONG'
                        ? 'bg-[rgba(0,212,255,0.1)] text-[#00d4ff] border-[rgba(0,212,255,0.2)]'
                        : 'bg-[rgba(100,116,139,0.1)] text-[#94a3b8] border-[rgba(100,116,139,0.2)]'
                    }`}>
                      {c.status}
                    </span>
                  </TD>
                  <TD className="text-xs text-[#00ff88] font-mono">↑ +0.3%</TD>
                </TR>
              ))}
            </Table>
          </div>
        </Card>

        {/* Row 4: Regional breakdown */}
        <Card>
          <CardHeader
            title="Regional Performance"
            subtitle="Vote share by constituency/region"
          />
          <div className="p-5 space-y-4">
            {MOCK_REGIONAL_DATA.map(r => (
              <div key={r.region}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">{r.region} Region</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#94a3b8] font-mono">
                      {r.partyVotes.toLocaleString()} / {r.totalVotes.toLocaleString()}
                    </span>
                    <span className="font-mono font-bold text-[#00d4ff] min-w-[50px] text-right">
                      {r.partyShare.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-[#0a0a1a] rounded-full overflow-hidden border border-[rgba(0,212,255,0.1)]">
                  <div
                    className="h-full bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] rounded-full transition-all"
                    style={{ width: `${r.partyShare}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Row 5: Real-time metrics */}
        <Card>
          <CardHeader title="Real-Time Metrics" subtitle="Live election monitoring" />
          <div className="p-5 grid grid-cols-2 xl:grid-cols-6 gap-4">
            {[
              { label: 'Votes/min', value: '42', icon: '⚡', color: '#00ff88' },
              { label: 'Avg Vote Time', value: '3.2s', icon: '⏱️', color: '#00d4ff' },
              { label: 'Turnout Rate', value: '73.8%', icon: '📊', color: '#7c3aed' },
              { label: 'Active Voters', value: '845', icon: '👥', color: '#f59e0b' },
              { label: 'Server Load', value: '42%', icon: '⚙️', color: '#00ff88' },
              { label: 'Uptime', value: '99.98%', icon: '✅', color: '#00ff88' },
            ].map(m => (
              <div key={m.label} className="bg-[#0a0a1a] border border-[rgba(0,212,255,0.1)] rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">{m.icon}</div>
                <div className="font-orb font-bold text-lg" style={{ color: m.color }}>
                  {m.value}
                </div>
                <div className="text-[10px] text-[#475569] uppercase tracking-wider mt-1">
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </Card>

      </main>
    </div>
  )
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

function generateCSVReport(data: any) {
  const { election, performance, regions, partyComparison } = data
  const lines: string[] = []

  // Header
  lines.push(`VOTEX Performance Report - ${election?.title || 'Election'}`)
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push('')

  // Executive Summary
  lines.push('EXECUTIVE SUMMARY')
  lines.push(`Election Title,${election?.title || 'N/A'}`)
  lines.push(`Election Type,${election?.type || 'N/A'}`)
  lines.push(`Election Status,${election?.status || 'N/A'}`)
  lines.push('')

  // Candidate Performance
  lines.push('CANDIDATE PERFORMANCE')
  lines.push('Rank,Name,Votes,Percentage,Status')
  performance.forEach((c: any) => {
    lines.push(`${c.rank},"${c.name}",${c.votes},${c.percentage.toFixed(2)}%,${c.status}`)
  })
  lines.push('')

  // Regional Breakdown
  lines.push('REGIONAL BREAKDOWN')
  lines.push('Region,Party Votes,Total Votes,Vote Share %')
  regions.forEach((r: any) => {
    lines.push(`${r.region},${r.partyVotes},${r.totalVotes},${r.partyShare.toFixed(2)}%`)
  })
  lines.push('')

  // Party Comparison
  lines.push('PARTY COMPARISON')
  lines.push('Party,Votes,Percentage')
  partyComparison.forEach((p: any) => {
    lines.push(`"${p.name}",${p.votes},${p.percentage.toFixed(2)}%`)
  })

  return lines.join('\n')
}

function downloadCSV(content: string, filename: string) {
  const element = document.createElement('a')
  element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(content)}`)
  element.setAttribute('download', filename)
  element.style.display = 'none'
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}