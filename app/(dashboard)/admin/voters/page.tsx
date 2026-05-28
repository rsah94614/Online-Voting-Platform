'use client'
// app/(dashboard)/admin/voters/page.tsx

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import StatsCard from '@/components/dashboard/StatsCard'
import { Card, CardHeader, Table, TR, TD, Btn, Avatar, Empty, PageLoader } from '@/components/dashboard/ui'

const apiFetch = (url: string) => fetch(url, { credentials: 'include' }).then(r => r.json())

// Mock voter data — replace with real API
const MOCK_VOTERS = Array.from({ length: 30 }, (_, i) => ({
  id: `voter-${i}`,
  name: ['Alex Johnson', 'Maria Garcia', 'James Wilson', 'Priya Patel', 'Chen Wei', 'Fatima Al-Hassan',
         'Raj Sharma', 'Emily Brown', 'Luca Rossi', 'Amara Diallo'][i % 10],
  email: `voter${i + 1}@example.com`,
  isVerified: i % 5 !== 3,
  registeredAt: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
  hasVoted: i % 3 === 0,
  constituency: ['North Ward', 'South Ward', 'East District', 'Central'][i % 4],
}))

export default function AdminVotersPage() {
  const [search, setSearch] = useState('')
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all')
  const [filterVoted, setFilterVoted] = useState<'all' | 'voted' | 'not_voted'>('all')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 15

  const filtered = MOCK_VOTERS.filter((v) => {
    if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.email.includes(search)) return false
    if (filterVerified === 'verified'   && !v.isVerified) return false
    if (filterVerified === 'unverified' &&  v.isVerified) return false
    if (filterVoted    === 'voted'      && !v.hasVoted)   return false
    if (filterVoted    === 'not_voted'  &&  v.hasVoted)   return false
    return true
  })

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="Voter Management"
        subtitle={`${filtered.length} voters matched`}
        actions={
          <Btn size="sm">⬇️ Export CSV</Btn>
        }
      />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto">

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard label="Total Registered" value={MOCK_VOTERS.length.toLocaleString()} icon="👥" accent="cyan" />
          <StatsCard label="Verified"          value={MOCK_VOTERS.filter(v => v.isVerified).length} icon="✅" accent="green" />
          <StatsCard label="Have Voted"        value={MOCK_VOTERS.filter(v => v.hasVoted).length} icon="🗳️" accent="purple" />
          <StatsCard label="Turnout"           value={`${Math.round(MOCK_VOTERS.filter(v=>v.hasVoted).length/MOCK_VOTERS.length*100)}%`} icon="📈" accent="amber" />
        </div>

        <Card>
          {/* Filters */}
          <div className="p-4 flex flex-wrap gap-3 items-center border-b border-[rgba(0,212,255,0.1)]">
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search name or email..."
              className="bg-[#0a0a1a] border border-[rgba(0,212,255,0.18)] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#00d4ff] w-48" />

            <select value={filterVerified} onChange={(e) => { setFilterVerified(e.target.value as any); setPage(1) }}
              className="bg-[#0a0a1a] border border-[rgba(0,212,255,0.18)] rounded-lg px-3 py-1.5 text-xs text-[#94a3b8] focus:outline-none cursor-pointer">
              <option value="all">All Verification</option>
              <option value="verified">Verified only</option>
              <option value="unverified">Unverified only</option>
            </select>

            <select value={filterVoted} onChange={(e) => { setFilterVoted(e.target.value as any); setPage(1) }}
              className="bg-[#0a0a1a] border border-[rgba(0,212,255,0.18)] rounded-lg px-3 py-1.5 text-xs text-[#94a3b8] focus:outline-none cursor-pointer">
              <option value="all">All Vote Status</option>
              <option value="voted">Voted</option>
              <option value="not_voted">Not voted yet</option>
            </select>
          </div>

          {paginated.length === 0 ? (
            <Empty icon="👥" title="No voters found" subtitle="Try adjusting your filters" />
          ) : (
            <Table headers={['Voter', 'Constituency', 'Verified', 'Voted', 'Registered', 'Actions']}>
              {paginated.map((v) => (
                <TR key={v.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <Avatar name={v.name} size={8} gradient="from-[#475569] to-[#334155]" />
                      <div>
                        <div className="text-sm font-semibold text-white">{v.name}</div>
                        <div className="text-xs text-[#475569]">{v.email}</div>
                      </div>
                    </div>
                  </TD>
                  <TD className="text-xs text-[#94a3b8]">{v.constituency}</TD>
                  <TD>
                    {v.isVerified
                      ? <span className="text-xs text-[#00ff88] font-mono">✓ Verified</span>
                      : <span className="text-xs text-[#f59e0b] font-mono">⚠ Pending</span>}
                  </TD>
                  <TD>
                    {v.hasVoted
                      ? <span className="text-xs text-[#00d4ff] font-mono">🗳️ Voted</span>
                      : <span className="text-xs text-[#475569] font-mono">Not yet</span>}
                  </TD>
                  <TD className="text-xs text-[#475569] font-mono">
                    {new Date(v.registeredAt).toLocaleDateString()}
                  </TD>
                  <TD>
                    <div className="flex gap-1">
                      {!v.isVerified && (
                        <Btn size="sm" onClick={() => {}}>Verify</Btn>
                      )}
                      <Btn variant="ghost" size="sm">View</Btn>
                    </div>
                  </TD>
                </TR>
              ))}
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(0,212,255,0.1)]">
              <span className="text-xs text-[#475569] font-mono">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex gap-2">
                <Btn variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</Btn>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded text-xs font-mono transition-all ${
                      page === p ? 'bg-[rgba(0,212,255,0.2)] text-[#00d4ff] border border-[rgba(0,212,255,0.3)]'
                                 : 'text-[#475569] hover:text-[#94a3b8]'}`}>
                    {p}
                  </button>
                ))}
                <Btn variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</Btn>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}