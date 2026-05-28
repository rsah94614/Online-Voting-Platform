'use client'
// app/(dashboard)/voter/page.tsx

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import StatsCard from '@/components/dashboard/StatsCard'
import { Card, CardHeader, StatusBadge, Progress, Empty, PageLoader } from '@/components/dashboard/ui'

const apiFetch = (u: string) => fetch(u, { credentials: 'include' }).then(r => r.json())

// ── Active election card ──────────────────────────────────────────────────────
function ElectionCard({ election, voteStatus }: { election: any; voteStatus: any }) {
  const hasVoted   = voteStatus?.hasVoted ?? false
  const isOpen     = election.status === 'LIVE'
  const now        = Date.now()
  const endMs      = new Date(election.endDate).getTime()
  const minsLeft   = Math.max(0, Math.floor((endMs - now) / 60000))
  const hoursLeft  = Math.floor(minsLeft / 60)
  const timeStr    = hoursLeft > 0 ? `${hoursLeft}h ${minsLeft % 60}m` : `${minsLeft}m`

  return (
    <div className={`p-5 rounded-xl border transition-all hover:-translate-y-0.5 ${
      hasVoted
        ? 'border-[rgba(0,255,136,0.25)] bg-[rgba(0,255,136,0.04)]'
        : isOpen
        ? 'border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.05)] shadow-[0_0_20px_rgba(0,212,255,0.08)]'
        : 'border-[rgba(71,85,105,0.3)] bg-[#0a0a1a]'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <StatusBadge status={election.status} />
            {hasVoted && (
              <span className="text-[10px] bg-[rgba(0,255,136,0.12)] text-[#00ff88] border border-[rgba(0,255,136,0.25)] px-2 py-0.5 rounded-full font-mono">
                ✓ VOTED
              </span>
            )}
          </div>
          <h3 className="font-orb font-bold text-white text-sm leading-tight">{election.title}</h3>
          <p className="text-xs text-[#475569] mt-1">
            {election.type?.replace(/_/g, ' ')} · {election._count?.candidates ?? 0} candidates
          </p>
        </div>
      </div>

      {/* Time remaining / Turnout */}
      {isOpen && !hasVoted && (
        <div className="mb-3 p-2.5 bg-[rgba(0,212,255,0.06)] border border-[rgba(0,212,255,0.15)] rounded-lg">
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-[#475569]">Time remaining</span>
            <span className="text-[#f59e0b] font-bold">{timeStr}</span>
          </div>
          <div className="h-1 bg-[#060611] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#f59e0b] to-[#ff2d6a] rounded-full"
              style={{ width: `${Math.min(100, ((endMs - now) / (endMs - new Date(election.startDate).getTime())) * 100)}%` }} />
          </div>
        </div>
      )}

      {hasVoted && voteStatus?.receipt && (
        <div className="mb-3 p-2.5 bg-[rgba(0,255,136,0.04)] border border-[rgba(0,255,136,0.15)] rounded-lg">
          <p className="text-[10px] text-[#475569] font-mono">Vote receipt</p>
          <p className="text-xs text-[#00ff88] font-mono mt-0.5 truncate">{voteStatus.receipt}</p>
        </div>
      )}

      <div className="flex gap-2 mt-3">
        {isOpen && !hasVoted && (
          <Link href={`/voter/vote/${election.id}`} className="flex-1">
            <button className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white text-xs font-bold font-orb tracking-wider hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all">
              🗳️ Cast Your Vote
            </button>
          </Link>
        )}
        <Link href={`/voter/results?election=${election.id}`}
          className={`${(isOpen && !hasVoted) ? '' : 'flex-1'} px-4 py-2.5 rounded-lg border border-[rgba(0,212,255,0.2)] text-xs font-orb text-[#94a3b8] hover:text-[#00d4ff] hover:border-[#00d4ff] transition-all text-center font-bold`}>
          📊 Results
        </Link>
      </div>
    </div>
  )
}

export default function VoterDashboard() {
  const user = useAuthStore(s => s.user)

  const { data: electionsData, isLoading } = useQuery({
    queryKey: ['voter-elections'],
    queryFn: () => apiFetch('/api/elections?status=LIVE&pageSize=10'),
  })

  const { data: upcomingData } = useQuery({
    queryKey: ['voter-upcoming-elections'],
    queryFn: () => apiFetch('/api/elections?status=UPCOMING&pageSize=5'),
  })

  const { data: meData } = useQuery({
    queryKey: ['voter-me'],
    queryFn: () => apiFetch('/api/auth/me'),
  })

  const liveElections     = electionsData?.data?.data ?? []
  const upcomingElections = upcomingData?.data?.data ?? []
  const isVerified        = meData?.data?.isVerified ?? false

  // Per-election vote status (parallel queries would be better; mocking here)
  const voteStatusMap: Record<string, any> = {}

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title={`Welcome, ${user?.name?.split(' ')[0] ?? 'Voter'}`}
        subtitle="Your democratic portal — every vote counts"
      />

      <main className="flex-1 p-6 overflow-y-auto space-y-6">

        {/* Verification banner */}
        {!isVerified && (
          <div className="flex items-start gap-4 p-4 bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.25)] rounded-xl">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-orb font-bold text-[#f59e0b]">Identity Not Verified</p>
              <p className="text-xs text-[#94a3b8] mt-0.5 leading-relaxed">
                Your account is not yet verified. Complete identity verification to unlock voting in all elections.
              </p>
            </div>
            <button className="px-4 py-2 rounded-lg bg-[rgba(245,158,11,0.15)] border border-[rgba(245,158,11,0.3)] text-xs text-[#f59e0b] font-orb font-bold hover:bg-[rgba(245,158,11,0.25)] transition-all flex-shrink-0">
              Verify Now →
            </button>
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard label="Live Elections"  value={liveElections.length}     icon="🗳️" accent="cyan"   sublabel="Open to vote" />
          <StatsCard label="Upcoming"        value={upcomingElections.length}  icon="📅" accent="amber"  sublabel="Coming soon" />
          <StatsCard label="You Have Voted"  value={0}                         icon="✅" accent="green"  sublabel="Total elections" />
          <StatsCard label="ID Status"       value={isVerified ? 'Verified' : 'Pending'} icon="🔐" accent={isVerified ? 'green' : 'amber'} />
        </div>

        {/* Live elections */}
        <Card>
          <CardHeader
            title="Live Elections — Vote Now"
            subtitle={`${liveElections.length} election${liveElections.length !== 1 ? 's' : ''} currently open`}
            action={
              <Link href="/voter/elections" className="text-xs text-[#00d4ff] hover:underline font-mono">
                View all →
              </Link>
            }
          />
          <div className="p-5">
            {isLoading ? (
              <PageLoader />
            ) : liveElections.length === 0 ? (
              <Empty icon="🗳️" title="No live elections right now" subtitle="Check back soon or view upcoming elections below" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {liveElections.map((el: any) => (
                  <ElectionCard key={el.id} election={el} voteStatus={voteStatusMap[el.id]} />
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Upcoming elections */}
        {upcomingElections.length > 0 && (
          <Card>
            <CardHeader title="Upcoming Elections" subtitle="Opening soon — register early" />
            <div className="p-5 space-y-3">
              {upcomingElections.map((el: any) => {
                const daysUntil = Math.ceil((new Date(el.startDate).getTime() - Date.now()) / 86400000)
                return (
                  <div key={el.id} className="flex items-center gap-4 p-4 bg-[#0a0a1a] rounded-xl border border-[rgba(0,212,255,0.1)] hover:border-[rgba(0,212,255,0.2)] transition-all">
                    <div className="w-12 h-12 rounded-xl bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[10px] text-[#f59e0b] font-mono font-bold">{daysUntil}</span>
                      <span className="text-[9px] text-[#475569]">DAYS</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{el.title}</p>
                      <p className="text-xs text-[#475569] font-mono">
                        Opens {new Date(el.startDate).toLocaleDateString()} · {el._count?.candidates ?? 0} candidates
                      </p>
                    </div>
                    <StatusBadge status={el.status} />
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Quick navigation */}
        <Card>
          <CardHeader title="Quick Access" />
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: '/voter/elections', icon: '🗳️', label: 'All Elections',   desc: 'Browse & vote' },
              { href: '/voter/results',   icon: '📊', label: 'Live Results',    desc: 'Track outcomes' },
              { href: '/voter/history',   icon: '📋', label: 'My Vote History', desc: 'Past elections' },
              { href: '/voter/profile',   icon: '⚙️', label: 'My Profile',      desc: 'Settings & ID' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[rgba(0,212,255,0.1)] hover:border-[rgba(0,212,255,0.3)] hover:bg-[rgba(0,212,255,0.04)] transition-all text-center group">
                <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                <div>
                  <p className="text-xs font-orb font-bold text-white group-hover:text-[#00d4ff] transition-colors">{item.label}</p>
                  <p className="text-[10px] text-[#475569]">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>

      </main>
    </div>
  )
}