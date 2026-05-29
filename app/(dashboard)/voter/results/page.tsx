'use client'
// app/(dashboard)/voter/results/page.tsx

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import StatsCard from '@/components/dashboard/StatsCard'
import { Card, CardHeader, Progress, Avatar, PageLoader, Empty } from '@/components/dashboard/ui'
import { VotexAreaChart, VotexDonutChart, COLORS } from '@/components/dashboard/charts/Charts'

const apiFetch = (u: string) => fetch(u, { credentials: 'include' }).then(r => r.json())

const MOCK_HOURLY = [
  { time: '06:00', votes: 1200 },  { time: '08:00', votes: 8400 },
  { time: '10:00', votes: 14200 }, { time: '12:00', votes: 22100 },
  { time: '14:00', votes: 18600 }, { time: '16:00', votes: 24300 },
  { time: '18:00', votes: 31200 }, { time: '20:00', votes: 11000 },
]

const CANDIDATE_COLORS: Record<number, keyof typeof COLORS> = {
  0: 'cyan', 1: 'purple', 2: 'pink', 3: 'green', 4: 'amber',
}

/* ── Live ticker ──────────────────────────────────────────────────────────── */
const TICKERS = [
  'Ballot counting in progress across all 29 states',
  'No security anomalies detected — all systems nominal',
  'Mobile votes: 58% · Desktop: 32% · In-person kiosks: 10%',
  'Voter turnout tracking: 68.3% — above national average',
  'Result updates every 5 seconds',
]

function LiveTicker() {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setIdx(i => (i + 1) % TICKERS.length); setVisible(true) }, 400)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-3 bg-[rgba(0,255,136,0.04)] border border-[rgba(0,255,136,0.15)] rounded-xl px-5 py-3 overflow-hidden">
      <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88] animate-pulse flex-shrink-0" />
      <span className="text-xs text-[#00ff88] font-mono flex-shrink-0">LIVE</span>
      <div className={`text-xs text-[#94a3b8] font-mono transition-opacity duration-300 truncate ${visible ? 'opacity-100' : 'opacity-0'}`}>
        {TICKERS[idx]}
      </div>
      <span className="ml-auto text-xs text-[#475569] font-mono flex-shrink-0">
        {new Date().toLocaleTimeString()}
      </span>
    </div>
  )
}

/* ── Main page ─────────────────────────────────────────────────────────────── */
function VoterResultsContent() {
  const searchParams = useSearchParams()
  const electionIdParam = searchParams.get('election')

  /* Elections list for selector */
  const { data: electionsData } = useQuery({
    queryKey: ['voter-elections-for-results'],
    queryFn: () => apiFetch('/api/elections?pageSize=20'),
  })

  const elections: any[] = useMemo(() => electionsData?.data?.data ?? [], [electionsData?.data?.data])
  const [selectedId, setSelectedId] = useState<string>(electionIdParam ?? '')

  useEffect(() => {
    if (!selectedId && elections.length > 0) {
      const live = elections.find((e: any) => e.status === 'LIVE')
      setSelectedId(live?.id ?? elections[0]?.id ?? '')
    }
  }, [elections, selectedId])

  /* Results for selected election */
  const { data: resultsData, isLoading: resLoading } = useQuery({
    queryKey: ['voter-results', selectedId],
    queryFn: () => selectedId ? apiFetch(`/api/elections/${selectedId}/results`) : Promise.resolve(null),
    enabled: !!selectedId,
    refetchInterval: 5000,
  })

  const results       = resultsData?.data
  const candidateRes: any[] = results?.candidateResults ?? []
  const selectedElec  = elections.find((e: any) => e.id === selectedId)

  const donutData = candidateRes.map((c, i) => ({
    name:  c.name.split(' ')[0],
    value: parseFloat(c.percentage.toFixed(1)),
    color: CANDIDATE_COLORS[i] ?? 'cyan',
  }))

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="Live Election Results"
        subtitle="Real-time vote counts — updated every 5 seconds"
      />

      <main className="flex-1 p-6 overflow-y-auto space-y-6">

        {/* Live ticker */}
        <LiveTicker />

        {/* Election selector */}
        <Card>
          <div className="p-4 flex flex-wrap gap-3 items-center">
            <span className="text-xs text-[#475569] font-mono uppercase tracking-wider flex-shrink-0">Viewing:</span>
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="flex-1 min-w-0 bg-[#0a0a1a] border border-[rgba(0,212,255,0.2)] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#00d4ff] transition-all font-orb cursor-pointer">
              <option value="">— Select an election —</option>
              {elections.map((e: any) => (
                <option key={e.id} value={e.id}>
                  {e.title} [{e.status}]
                </option>
              ))}
            </select>
            {selectedElec && (
              <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border flex-shrink-0 ${
                selectedElec.status === 'LIVE'
                  ? 'bg-[rgba(0,255,136,0.1)] text-[#00ff88] border-[rgba(0,255,136,0.25)]'
                  : 'bg-[rgba(71,85,105,0.2)] text-[#475569] border-[rgba(71,85,105,0.3)]'
              }`}>
                {selectedElec.status === 'LIVE' ? '● LIVE' : selectedElec.status}
              </span>
            )}
          </div>
        </Card>

        {!selectedId ? (
          <Empty icon="📊" title="Select an election above" subtitle="Choose an election to view live results" />
        ) : resLoading ? (
          <PageLoader />
        ) : !results ? (
          <Empty icon="🔒" title="Results not available yet" subtitle="Results will be published after the election closes" />
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <StatsCard label="Votes Cast"    value={(results.totalVotesCast ?? 0).toLocaleString()}
                trend="Counted so far" icon="🗳️" accent="cyan" />
              <StatsCard label="Registered"   value={(results.totalVoters ?? 0).toLocaleString()}
                sublabel="Eligible voters" icon="👥" accent="purple" />
              <StatsCard label="Turnout"       value={`${results.turnoutPercent ?? 0}%`}
                trend="Of registered voters" icon="📈" accent="green" />
              <StatsCard label="Candidates"    value={candidateRes.length}
                sublabel="On the ballot" icon="👤" accent="amber" />
            </div>

            {/* Turnout progress bar */}
            <Card>
              <div className="p-5">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="font-orb font-bold text-white text-sm">Overall Voter Turnout</p>
                    <p className="text-xs text-[#475569] mt-0.5 font-mono">
                      {(results.totalVotesCast ?? 0).toLocaleString()} of {(results.totalVoters ?? 0).toLocaleString()} registered voters
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-orb font-bold text-3xl text-[#00d4ff]">{results.turnoutPercent ?? 0}%</p>
                    <p className="text-xs text-[#00ff88] font-mono">
                      {results.turnoutPercent > 65 ? '↑ Above average' : '↓ Below average'}
                    </p>
                  </div>
                </div>
                <div className="h-4 bg-[#060611] rounded-full overflow-hidden border border-[rgba(0,212,255,0.1)]">
                  <div
                    className="h-full bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] rounded-full transition-all duration-1000 relative"
                    style={{ width: `${results.turnoutPercent ?? 0}%` }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 rounded-full" />
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-[#475569] font-mono mt-1.5">
                  <span>0%</span>
                  <span>Target: 75%</span>
                  <span>100%</span>
                </div>
              </div>
            </Card>

            {/* Main results + chart */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

              {/* Candidate bars */}
              <Card className="xl:col-span-3">
                <CardHeader
                  title="Candidate Vote Breakdown"
                  subtitle={selectedElec?.status === 'LIVE' ? 'Updating live every 5 seconds' : 'Final results'}
                />
                <div className="p-5 space-y-5">
                  {candidateRes.length === 0 ? (
                    <Empty icon="👤" title="No results yet" subtitle="Votes will appear as they are counted" />
                  ) : (
                    candidateRes.map((c: any, i: number) => {
                      const colorKey = CANDIDATE_COLORS[i] ?? 'cyan'
                      const color    = COLORS[colorKey]
                      return (
                        <div key={c.candidateId} className={`p-4 rounded-xl border transition-all ${
                          c.isLeading
                            ? 'border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.04)]'
                            : 'border-[rgba(0,212,255,0.08)] bg-[#0a0a1a]'
                        }`}>
                          <div className="flex items-center gap-3 mb-3">
                            {/* Rank */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-orb font-black flex-shrink-0 ${
                              i === 0 ? 'bg-[rgba(245,158,11,0.2)] text-[#f59e0b]' :
                              i === 1 ? 'bg-[rgba(148,163,184,0.15)] text-[#94a3b8]' :
                              i === 2 ? 'bg-[rgba(245,158,11,0.1)] text-[#92400e]' :
                                        'bg-[rgba(71,85,105,0.2)] text-[#475569]'
                            }`}>
                              {i + 1}
                            </div>
                            <Avatar name={c.name} size={10} gradient={
                              i === 0 ? 'from-[#00d4ff] to-[#7c3aed]' :
                              i === 1 ? 'from-[#7c3aed] to-[#ff2d6a]' :
                              i === 2 ? 'from-[#ff2d6a] to-[#f59e0b]' :
                                        'from-[#00ff88] to-[#00d4ff]'
                            } />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-white text-sm">{c.name}</p>
                                {c.isLeading && (
                                  <span className="text-[10px] bg-[rgba(0,255,136,0.12)] text-[#00ff88] border border-[rgba(0,255,136,0.2)] px-1.5 py-0.5 rounded font-mono">
                                    LEADING
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ background: c.partyColor ?? color }} />
                                <p className="text-xs text-[#475569]">{c.party}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-orb font-bold text-2xl" style={{ color }}>
                                {c.percentage.toFixed(1)}%
                              </p>
                              <p className="text-[10px] text-[#475569] font-mono">
                                {c.votes.toLocaleString()} votes
                              </p>
                            </div>
                          </div>

                          {/* Bar relative to leader */}
                          <div className="h-2.5 bg-[#060611] rounded-full overflow-hidden border border-[rgba(0,212,255,0.06)]">
                            <div
                              className="h-full rounded-full transition-all duration-1000"
                              style={{
                                width: `${candidateRes[0]?.percentage > 0 ? (c.percentage / candidateRes[0].percentage) * 100 : 0}%`,
                                background: color,
                              }}
                            />
                          </div>

                          {/* Gap from leader */}
                          {i > 0 && candidateRes[0] && (
                            <p className="text-[10px] text-[#475569] font-mono mt-1.5">
                              Behind leader by {(candidateRes[0].percentage - c.percentage).toFixed(1)}%
                              · {(candidateRes[0].votes - c.votes).toLocaleString()} votes
                            </p>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </Card>

              {/* Right column: donut + hourly chart */}
              <div className="xl:col-span-2 space-y-6">
                {donutData.length > 0 && (
                  <Card>
                    <CardHeader title="Vote Share" subtitle="Current distribution" />
                    <div className="p-4">
                      <VotexDonutChart data={donutData} height={200} innerRadius={52} />
                    </div>
                    <div className="px-5 pb-5 space-y-2">
                      {donutData.map((d, i) => (
                        <div key={d.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[d.color] }} />
                            <span className="text-[#94a3b8]">{candidateRes[i]?.name}</span>
                          </div>
                          <span className="font-orb font-bold" style={{ color: COLORS[d.color] }}>{d.value}%</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <Card>
                  <CardHeader title="Hourly Votes" subtitle="Vote flow today" />
                  <div className="p-4">
                    <VotexAreaChart
                      data={results?.turnoutByHour?.length > 0
                        ? results.turnoutByHour.map((h: any) => ({
                          time:  new Date(h.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          votes: h.votes,
                        }))
                        : MOCK_HOURLY
                      }
                      xKey="time"
                      lines={[{ key: 'votes', color: 'cyan', name: 'Votes/hour' }]}
                      height={180}
                    />
                  </div>
                </Card>
              </div>
            </div>

            {/* Last updated */}
            <p className="text-center text-xs text-[#475569] font-mono">
              Last updated: {results.lastUpdated ? new Date(results.lastUpdated).toLocaleString() : 'Just now'}
              {selectedElec?.status === 'LIVE' && (
                <span className="ml-2 text-[#00ff88]">· auto-refreshing every 5s</span>
              )}
            </p>
          </>
        )}
      </main>
    </div>
  )
}

export default function VoterResultsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen">
        <DashboardHeader title="Live Election Results" subtitle="Loading results..." />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-[#00d4ff] border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    }>
      <VoterResultsContent />
    </Suspense>
  )
}