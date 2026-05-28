'use client'
// app/(dashboard)/voter/history/page.tsx

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import StatsCard from '@/components/dashboard/StatsCard'
import { Card, CardHeader, Empty, PageLoader } from '@/components/dashboard/ui'
import toast from 'react-hot-toast'

const apiFetch = (u: string) => fetch(u, { credentials: 'include' }).then(r => r.json())

/* ── Mock history data (replace with real API) ─────────────────────────────── */
const MOCK_HISTORY = [
  {
    id: '1',
    electionTitle: 'National Presidential Election 2024',
    electionType: 'PRESIDENTIAL',
    status: 'LIVE',
    votedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    receipt: 'RCPT-A8F2C913KL',
    candidateName: 'Aria Chen',
    candidateParty: 'National Progress',
    partyColor: '#00d4ff',
    resultKnown: false,
    won: null,
  },
  {
    id: '2',
    electionTitle: 'City Municipal Election 2024',
    electionType: 'COMMUNITY',
    status: 'ENDED',
    votedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    receipt: 'RCPT-B7D3E821MN',
    candidateName: 'Priya Sharma',
    candidateParty: 'United Front',
    partyColor: '#ff2d6a',
    resultKnown: true,
    won: true,
  },
  {
    id: '3',
    electionTitle: 'University Student Council 2023',
    electionType: 'UNIVERSITY',
    status: 'ENDED',
    votedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    receipt: 'RCPT-C5F9K442PQ',
    candidateName: 'Rahul Verma',
    candidateParty: 'Independent',
    partyColor: '#94a3b8',
    resultKnown: true,
    won: false,
  },
  {
    id: '4',
    electionTitle: 'Corporate Board of Directors Vote 2023',
    electionType: 'CORPORATE',
    status: 'ENDED',
    votedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    receipt: 'RCPT-D1G7R553RS',
    candidateName: 'Elena Vasquez',
    candidateParty: 'Board Nominee',
    partyColor: '#f59e0b',
    resultKnown: true,
    won: true,
  },
]

const TYPE_ICONS: Record<string, string> = {
  PRESIDENTIAL: '🏛️', PARLIAMENTARY: '🏟️', CORPORATE: '🏢',
  UNIVERSITY: '🎓', COMMUNITY: '🏘️', REFERENDUM: '📋', CUSTOM: '⚙️',
}

/* ── Receipt verifier ───────────────────────────────────────────────────────── */
function ReceiptVerifier() {
  const [input, setInput]   = useState('')
  const [result, setResult] = useState<null | { valid: boolean; electionTitle?: string; castAt?: string }>(null)
  const [loading, setLoading] = useState(false)

  const verify = async () => {
    if (!input.trim()) { toast.error('Enter a receipt code'); return }
    setLoading(true)
    try {
      const res = await apiFetch(`/api/votes/verify/${input.trim()}`)
      if (res.success) setResult({ valid: true, electionTitle: res.data.electionTitle, castAt: res.data.castAt })
      else setResult({ valid: false })
    } catch {
      toast.error('Network error — try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="🔍 Verify Your Vote" subtitle="Confirm your vote was correctly recorded using your receipt code" />
      <div className="p-6">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && verify()}
            placeholder="Enter receipt code e.g. RCPT-A8F2C913KL"
            className="flex-1 bg-[#0a0a1a] border border-[rgba(0,212,255,0.18)] rounded-lg px-4 py-3 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#00d4ff] focus:shadow-[0_0_16px_rgba(0,212,255,0.1)] transition-all font-mono tracking-widest"
          />
          <button
            onClick={verify}
            disabled={loading}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white text-sm font-orb font-bold tracking-wider hover:shadow-[0_0_24px_rgba(0,212,255,0.3)] transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : 'Verify'}
          </button>
        </div>

        {result && (
          <div className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${
            result.valid
              ? 'bg-[rgba(0,255,136,0.05)] border-[rgba(0,255,136,0.25)]'
              : 'bg-[rgba(255,45,106,0.05)] border-[rgba(255,45,106,0.25)]'
          }`}>
            <span className="text-2xl">{result.valid ? '✅' : '❌'}</span>
            <div>
              <p className={`font-orb font-bold text-sm ${result.valid ? 'text-[#00ff88]' : 'text-[#ff2d6a]'}`}>
                {result.valid ? 'Vote Verified Successfully' : 'Receipt Not Found'}
              </p>
              {result.valid && (
                <div className="mt-1 space-y-0.5">
                  <p className="text-xs text-[#94a3b8]">Election: <span className="text-white">{result.electionTitle}</span></p>
                  {result.castAt && (
                    <p className="text-xs text-[#94a3b8]">Cast at: <span className="text-white">{new Date(result.castAt).toLocaleString()}</span></p>
                  )}
                </div>
              )}
              {!result.valid && (
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  This receipt code does not match any recorded vote. Check for typos or contact support.
                </p>
              )}
            </div>
            <button className="ml-auto text-[#475569] hover:text-[#94a3b8] text-xs" onClick={() => { setResult(null); setInput('') }}>
              ✕
            </button>
          </div>
        )}
      </div>
    </Card>
  )
}

/* ── History card ─────────────────────────────────────────────────────────── */
function HistoryCard({ item, expanded, onToggle }: { item: typeof MOCK_HISTORY[0]; expanded: boolean; onToggle: () => void }) {
  const [copying, setCopying] = useState(false)

  const copyReceipt = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(item.receipt)
    setCopying(true)
    toast.success('Receipt copied!')
    setTimeout(() => setCopying(false), 2000)
  }

  return (
    <div
      onClick={onToggle}
      className={`rounded-xl border transition-all cursor-pointer hover:-translate-y-0.5 ${
        expanded
          ? 'border-[rgba(0,212,255,0.35)] bg-[rgba(0,212,255,0.04)]'
          : 'border-[rgba(0,212,255,0.1)] bg-[#0a0a1a] hover:border-[rgba(0,212,255,0.25)]'
      }`}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Type icon */}
          <div className="w-11 h-11 rounded-xl bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.15)] flex items-center justify-center text-xl flex-shrink-0">
            {TYPE_ICONS[item.electionType] ?? '🗳️'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-orb font-bold text-white text-sm leading-tight truncate">{item.electionTitle}</p>
                <p className="text-xs text-[#475569] mt-0.5 font-mono">
                  Voted {new Date(item.votedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' · '}
                  {new Date(item.votedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Status badge */}
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  item.status === 'LIVE'
                    ? 'bg-[rgba(0,255,136,0.1)] text-[#00ff88] border-[rgba(0,255,136,0.25)]'
                    : 'bg-[rgba(71,85,105,0.2)] text-[#475569] border-[rgba(71,85,105,0.3)]'
                }`}>
                  {item.status === 'LIVE' ? '● LIVE' : 'ENDED'}
                </span>
                {/* Result badge */}
                {item.resultKnown && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    item.won
                      ? 'bg-[rgba(0,255,136,0.1)] text-[#00ff88] border-[rgba(0,255,136,0.25)]'
                      : 'bg-[rgba(255,45,106,0.08)] text-[#ff2d6a] border-[rgba(255,45,106,0.2)]'
                  }`}>
                    {item.won ? '✓ WON' : '✗ LOST'}
                  </span>
                )}
              </div>
            </div>

            {/* Voted for */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-[#475569]">Voted for:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: item.partyColor }} />
                <span className="text-xs font-semibold text-white">{item.candidateName}</span>
                <span className="text-xs text-[#475569]">· {item.candidateParty}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[rgba(0,212,255,0.1)] px-5 py-4 space-y-4">
          {/* Receipt */}
          <div className="bg-[rgba(0,255,136,0.04)] border border-[rgba(0,255,136,0.15)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-[#475569] font-mono uppercase tracking-wider">Vote Receipt</p>
              <button
                onClick={copyReceipt}
                className="text-[10px] text-[#00d4ff] hover:text-white font-mono transition-colors">
                {copying ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
            <p className="font-mono text-[#00ff88] font-bold tracking-widest text-sm">{item.receipt}</p>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              { label: 'Election Type',  value: item.electionType.replace(/_/g, ' ') },
              { label: 'Vote Status',    value: item.status },
              { label: 'Voted For',      value: item.candidateName },
              { label: 'Party',          value: item.candidateParty },
              { label: 'Date Voted',     value: new Date(item.votedAt).toLocaleDateString() },
              { label: 'Time Voted',     value: new Date(item.votedAt).toLocaleTimeString() },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#060611] rounded-lg p-3 border border-[rgba(0,212,255,0.06)]">
                <p className="text-[#475569] uppercase tracking-wider text-[10px] font-mono mb-1">{label}</p>
                <p className="text-white font-semibold">{value}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={e => { e.stopPropagation(); copyReceipt(e) }}
              className="flex-1 py-2 rounded-lg border border-[rgba(0,212,255,0.2)] text-xs font-orb text-[#94a3b8] hover:text-[#00d4ff] hover:border-[#00d4ff] transition-all">
              📋 Copy Receipt
            </button>
            {item.status === 'ENDED' && (
              <button
                onClick={e => e.stopPropagation()}
                className="flex-1 py-2 rounded-lg border border-[rgba(0,212,255,0.2)] text-xs font-orb text-[#94a3b8] hover:text-[#00d4ff] hover:border-[#00d4ff] transition-all">
                📊 View Final Results
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Main page ─────────────────────────────────────────────────────────────── */
export default function VoterHistoryPage() {
  const user = useAuthStore(s => s.user)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'LIVE' | 'ENDED'>('ALL')

  const filtered = MOCK_HISTORY.filter(h => filterStatus === 'ALL' || h.status === filterStatus)
  const wonCount  = MOCK_HISTORY.filter(h => h.resultKnown && h.won).length
  const lostCount = MOCK_HISTORY.filter(h => h.resultKnown && !h.won).length

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="My Vote History"
        subtitle="Complete record of your democratic participation"
      />

      <main className="flex-1 p-6 overflow-y-auto space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard label="Total Votes Cast" value={MOCK_HISTORY.length}  icon="🗳️" accent="cyan"   sublabel="All time" />
          <StatsCard label="Results Known"    value={MOCK_HISTORY.filter(h=>h.resultKnown).length} icon="📊" accent="purple" sublabel="Concluded" />
          <StatsCard label="Voted for Winner" value={wonCount}             icon="🏆" accent="green"  sublabel="My accuracy" />
          <StatsCard label="Participation"    value="100%"                  icon="⭐" accent="amber"  sublabel="Perfect record" />
        </div>

        {/* Receipt verifier */}
        <ReceiptVerifier />

        {/* History list */}
        <Card>
          <CardHeader
            title={`Vote History (${filtered.length})`}
            subtitle="Click any entry to see full details and receipt"
            action={
              <div className="flex gap-1 bg-[#0a0a1a] rounded-lg p-1 border border-[rgba(0,212,255,0.12)]">
                {(['ALL', 'LIVE', 'ENDED'] as const).map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                      filterStatus === s
                        ? 'bg-[rgba(0,212,255,0.2)] text-[#00d4ff] border border-[rgba(0,212,255,0.3)]'
                        : 'text-[#475569] hover:text-[#94a3b8]'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            }
          />

          <div className="p-5 space-y-3">
            {filtered.length === 0 ? (
              <Empty icon="📋" title="No vote history" subtitle="Your votes will appear here after you participate in elections" />
            ) : (
              filtered.map(item => (
                <HistoryCard
                  key={item.id}
                  item={item}
                  expanded={expandedId === item.id}
                  onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                />
              ))
            )}
          </div>
        </Card>

        {/* Privacy note */}
        <div className="flex items-start gap-3 p-4 bg-[rgba(0,212,255,0.03)] border border-[rgba(0,212,255,0.1)] rounded-xl">
          <span className="text-lg">🔐</span>
          <div>
            <p className="text-xs font-orb font-bold text-white">Your Privacy is Protected</p>
            <p className="text-xs text-[#475569] mt-0.5 leading-relaxed">
              Only you can see who you voted for. This history is private and encrypted.
              Administrators can verify that a vote was cast but cannot see your candidate selection.
              Your receipt code is the only way to publicly verify your participation without revealing your choice.
            </p>
          </div>
        </div>

      </main>
    </div>
  )
}