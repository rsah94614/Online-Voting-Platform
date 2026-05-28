'use client'
// app/(dashboard)/candidate/standings/page.tsx

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import StatsCard from '@/components/dashboard/StatsCard'
import { Card, CardHeader, Progress, Avatar, PageLoader } from '@/components/dashboard/ui'
import {
  VotexAreaChart,
  VotexBarChart,
  VotexLineChart,
  VotexDonutChart,
  COLORS,
} from '@/components/dashboard/charts/Charts'

// ── Mock rich data (replace with real API calls in production) ───────────────
const RACE_CANDIDATES = [
  { id: '1', name: 'Aria Chen',    party: 'National Progress', pct: 34.2, votes: 289574, gradient: 'from-[#00d4ff] to-[#7c3aed]', color: '#00d4ff' as const, isYou: true },
  { id: '2', name: 'Marcus Reed',  party: 'Liberty Alliance',  pct: 28.7, votes: 243173, gradient: 'from-[#7c3aed] to-[#ff2d6a]', color: '#7c3aed' as const, isYou: false },
  { id: '3', name: 'Sofia Vega',   party: 'United Front',      pct: 22.1, votes: 187253, gradient: 'from-[#ff2d6a] to-[#f59e0b]', color: '#ff2d6a' as const, isYou: false },
  { id: '4', name: 'James Okafor', party: 'Green Future',      pct: 15.0, votes: 127293, gradient: 'from-[#00ff88] to-[#00d4ff]', color: '#00ff88' as const, isYou: false },
]

const TREND_DATA = [
  { time: '06:00', aria: 32.1, marcus: 29.8, sofia: 23.4, james: 14.7 },
  { time: '08:00', aria: 32.8, marcus: 29.5, sofia: 23.1, james: 14.6 },
  { time: '10:00', aria: 33.2, marcus: 29.2, sofia: 22.8, james: 14.8 },
  { time: '12:00', aria: 33.7, marcus: 29.0, sofia: 22.4, james: 14.9 },
  { time: '14:00', aria: 34.0, marcus: 28.9, sofia: 22.2, james: 14.9 },
  { time: '16:00', aria: 34.1, marcus: 28.8, sofia: 22.2, james: 14.9 },
  { time: '18:00', aria: 34.2, marcus: 28.7, sofia: 22.1, james: 15.0 },
]

const HOURLY_VOTES = [
  { time: '06:00', gain: 1240 },
  { time: '08:00', gain: 5820 },
  { time: '10:00', gain: 8340 },
  { time: '12:00', gain: 9100 },
  { time: '14:00', gain: 7650 },
  { time: '16:00', gain: 8900 },
  { time: '18:00', gain: 6200 },
]

const REGION_DATA = [
  { region: 'North',   aria: 38, marcus: 26, sofia: 24, james: 12 },
  { region: 'South',   aria: 30, marcus: 32, sofia: 21, james: 17 },
  { region: 'East',    aria: 36, marcus: 27, sofia: 22, james: 15 },
  { region: 'West',    aria: 33, marcus: 29, sofia: 23, james: 15 },
  { region: 'Central', aria: 35, marcus: 28, sofia: 20, james: 17 },
]

const DONUT_DATA = RACE_CANDIDATES.map(c => ({
  name:  c.name.split(' ')[0],
  value: c.pct,
  color: c.color,
}))

export default function CandidateStandingsPage() {
  const user = useAuthStore(s => s.user)
  const [regionView, setRegionView] = useState<'aria' | 'compare'>('compare')

  // In real app, fetch from /api/elections/[id]/results
  const totalVotes  = RACE_CANDIDATES.reduce((s, c) => s + c.votes, 0)
  const me          = RACE_CANDIDATES.find(c => c.isYou)!
  const myRank      = RACE_CANDIDATES.sort((a, b) => b.pct - a.pct).findIndex(c => c.isYou) + 1
  const nearest     = RACE_CANDIDATES.filter(c => !c.isYou).sort((a, b) => b.pct - a.pct)[0]
  const lead        = parseFloat((me.pct - nearest.pct).toFixed(1))

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="Live Race Standings"
        subtitle="Real-time competitor analysis — refreshes every 30s"
        actions={
          <div className="flex items-center gap-2 text-xs text-[#00ff88] bg-[rgba(0,255,136,0.06)] border border-[rgba(0,255,136,0.2)] px-3 py-2 rounded-lg font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse inline-block" />
            LIVE DATA
          </div>
        }
      />

      <main className="flex-1 p-6 overflow-y-auto space-y-6">

        {/* KPI row */}
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
          <StatsCard label="Your Vote Share" value={`${me.pct}%`}     trend="+1.8% vs yesterday" icon="📊" accent="cyan" />
          <StatsCard label="Total Votes"     value={me.votes.toLocaleString()} trend="+5,842 today" icon="🗳️" accent="purple" />
          <StatsCard label="Current Rank"    value={`#${myRank}`}      sublabel="Out of 4 candidates" icon="🏆" accent="amber" />
          <StatsCard label="Lead Margin"     value={`+${lead}%`}       sublabel={`Over ${nearest.name.split(' ')[0]}`} icon="⚡" accent="green" />
          <StatsCard label="Votes to Win"    value="0" sublabel="Already leading" icon="🎯" accent="cyan" />
        </div>

        {/* Two-column main charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Vote share trend over time */}
          <Card className="xl:col-span-2">
            <CardHeader title="Vote Share Trend — All Candidates" subtitle="How the race has shifted today" />
            <div className="p-5">
              <VotexLineChart
                data={TREND_DATA}
                xKey="time"
                lines={[
                  { key: 'aria',   color: 'cyan',   name: 'Aria Chen (you)' },
                  { key: 'marcus', color: 'purple', name: 'Marcus Reed' },
                  { key: 'sofia',  color: 'pink',   name: 'Sofia Vega' },
                  { key: 'james',  color: 'green',  name: 'James Okafor' },
                ]}
                height={240}
              />
            </div>
          </Card>

          {/* Donut + legend */}
          <Card>
            <CardHeader title="Current Distribution" subtitle="Live vote split" />
            <div className="p-3">
              <VotexDonutChart data={DONUT_DATA} height={200} innerRadius={55} />
            </div>
            <div className="px-5 pb-5 space-y-2.5">
              {RACE_CANDIDATES.sort((a, b) => b.pct - a.pct).map((c, i) => (
                <div key={c.id} className={`flex items-center gap-3 p-2 rounded-lg ${c.isYou ? 'bg-[rgba(0,212,255,0.06)] border border-[rgba(0,212,255,0.15)]' : ''}`}>
                  <span className={`text-xs font-orb font-black w-4 ${i === 0 ? 'text-[#f59e0b]' : 'text-[#475569]'}`}>#{i + 1}</span>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[c.color] }} />
                  <span className="text-xs text-[#94a3b8] flex-1 truncate">
                    {c.name.split(' ')[0]}
                    {c.isYou && <span className="text-[#00d4ff] ml-1 font-mono text-[10px]">(you)</span>}
                  </span>
                  <span className="font-orb font-bold text-sm" style={{ color: COLORS[c.color] }}>{c.pct}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Head-to-head + hourly */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Detailed standings */}
          <Card>
            <CardHeader title="Head-to-Head Breakdown" subtitle="Votes and percentage vs all opponents" />
            <div className="p-5 space-y-5">
              {RACE_CANDIDATES.sort((a, b) => b.pct - a.pct).map((c, i) => (
                <div key={c.id} className={`p-4 rounded-xl border transition-all ${
                  c.isYou
                    ? 'border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.05)]'
                    : 'border-[rgba(0,212,255,0.08)] bg-[#0a0a1a]'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-base font-orb font-black w-6 text-center ${i === 0 ? 'text-[#f59e0b]' : 'text-[#475569]'}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                    <Avatar name={c.name} size={9} gradient={c.gradient} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                        {c.isYou && (
                          <span className="text-[10px] bg-[rgba(0,212,255,0.12)] text-[#00d4ff] border border-[rgba(0,212,255,0.2)] px-1.5 py-0.5 rounded font-mono flex-shrink-0">
                            YOU
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#475569]">{c.party}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-orb font-bold text-lg" style={{ color: COLORS[c.color] }}>{c.pct}%</p>
                      <p className="text-[10px] text-[#475569] font-mono">{c.votes.toLocaleString()} votes</p>
                    </div>
                  </div>

                  {/* Bar relative to leader */}
                  <Progress
                    value={(c.pct / RACE_CANDIDATES[0].pct) * 100}
                    color={COLORS[c.color]}
                  />

                  {/* Gap indicator */}
                  {!c.isYou && (
                    <p className="text-[10px] text-[#475569] mt-1.5 font-mono">
                      {c.pct < me.pct
                        ? `You lead by ${(me.pct - c.pct).toFixed(1)}% · ${(me.votes - c.votes).toLocaleString()} votes`
                        : `They lead you by ${(c.pct - me.pct).toFixed(1)}% · ${(c.votes - me.votes).toLocaleString()} votes`
                      }
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Your hourly vote gain */}
          <div className="space-y-6">
            <Card>
              <CardHeader title="Your Hourly Vote Gain" subtitle="New votes received each hour" />
              <div className="p-5">
                <VotexAreaChart
                  data={HOURLY_VOTES}
                  xKey="time"
                  lines={[{ key: 'gain', color: 'cyan', name: 'New Votes/hr' }]}
                  height={180}
                />
              </div>
            </Card>

            {/* Performance metrics */}
            <Card>
              <CardHeader title="Performance Metrics" />
              <div className="p-5 space-y-3">
                {[
                  { label: 'Peak voting hour',    value: '12:00–13:00', sub: '9,100 votes received' },
                  { label: 'Average hourly gain', value: '6,788',       sub: 'votes / hour' },
                  { label: 'Projected final',     value: `~${Math.round(me.pct)}%`, sub: 'if trend continues' },
                  { label: 'Votes to 40%',        value: ((0.40 - me.pct / 100) * totalVotes).toLocaleString(), sub: 'more votes needed' },
                  { label: 'Remaining voters',    value: (totalVotes * 0.317).toLocaleString(), sub: 'yet to cast ballot' },
                ].map(m => (
                  <div key={m.label} className="flex justify-between items-center py-2 border-b border-[rgba(0,212,255,0.06)] last:border-0">
                    <span className="text-xs text-[#475569]">{m.label}</span>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white font-orb">{m.value}</p>
                      <p className="text-[10px] text-[#475569] font-mono">{m.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Regional breakdown */}
        <Card>
          <CardHeader
            title="Regional Vote Distribution"
            subtitle="How each region is voting"
            action={
              <div className="flex gap-1">
                {(['compare', 'aria'] as const).map(v => (
                  <button key={v} onClick={() => setRegionView(v)}
                    className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                      regionView === v
                        ? 'bg-[rgba(0,212,255,0.15)] text-[#00d4ff] border border-[rgba(0,212,255,0.3)]'
                        : 'text-[#475569] hover:text-[#94a3b8]'
                    }`}>
                    {v === 'aria' ? 'My Lead' : 'All Candidates'}
                  </button>
                ))}
              </div>
            }
          />
          <div className="p-5">
            {regionView === 'compare' ? (
              <VotexBarChart
                data={REGION_DATA}
                xKey="region"
                bars={[
                  { key: 'aria',   color: 'cyan',   name: 'Aria Chen' },
                  { key: 'marcus', color: 'purple', name: 'Marcus Reed' },
                  { key: 'sofia',  color: 'pink',   name: 'Sofia Vega' },
                  { key: 'james',  color: 'green',  name: 'James Okafor' },
                ]}
                height={260}
              />
            ) : (
              <VotexAreaChart
                data={REGION_DATA}
                xKey="region"
                lines={[{ key: 'aria', color: 'cyan', name: 'Your vote share %' }]}
                height={260}
              />
            )}
          </div>
        </Card>

      </main>
    </div>
  )
}