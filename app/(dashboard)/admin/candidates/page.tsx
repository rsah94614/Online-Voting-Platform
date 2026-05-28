'use client'
// app/(dashboard)/admin/candidates/page.tsx

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import StatsCard from '@/components/dashboard/StatsCard'
import { Card, CardHeader, StatusBadge, Table, TR, TD, Btn, Avatar, Empty, PageLoader } from '@/components/dashboard/ui'
import toast from 'react-hot-toast'

const apiFetch = (url: string) => fetch(url, { credentials: 'include' }).then(r => r.json())

type Status = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

export default function AdminCandidatesPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<Status>('ALL')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Fetch elections to get candidates per election
  const { data: elData } = useQuery({
    queryKey: ['elections-for-candidates'],
    queryFn: () => apiFetch('/api/elections?pageSize=50'),
  })

  // Aggregate candidates from first election (in real app, have a top-level candidates endpoint)
  const elections = elData?.data?.data ?? []
  const firstElectionId = elections[0]?.id

  const { data: candData, isLoading } = useQuery({
    queryKey: ['admin-candidates', firstElectionId, statusFilter],
    queryFn: () => apiFetch(`/api/elections/${firstElectionId}/candidates?status=${statusFilter === 'ALL' ? '' : statusFilter}`),
    enabled: !!firstElectionId,
  })

  const candidates: any[] = (candData?.data ?? []).filter((c: any) =>
    !search || c.user?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/candidates/${id}/approve`, { method: 'POST', credentials: 'include' }).then(r => r.json()),
    onSuccess: (r) => {
      if (r.success) { toast.success('Candidate approved'); qc.invalidateQueries({ queryKey: ['admin-candidates'] }) }
      else toast.error(r.error)
    },
  })

  const pending  = candidates.filter((c) => c.status === 'PENDING').length
  const approved = candidates.filter((c) => c.status === 'APPROVED').length
  const rejected = candidates.filter((c) => c.status === 'REJECTED').length

  const STATUS_TABS: Status[] = ['ALL', 'PENDING', 'APPROVED', 'REJECTED']

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="Candidates"
        subtitle="Review and manage candidate applications"
      />
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard label="Total"    value={candidates.length} icon="👤" accent="cyan" />
          <StatsCard label="Pending"  value={pending}           icon="⏳" accent="amber" />
          <StatsCard label="Approved" value={approved}          icon="✅" accent="green" />
          <StatsCard label="Rejected" value={rejected}          icon="❌" accent="pink" />
        </div>

        <Card>
          <CardHeader
            title="Candidate Applications"
            action={
              <div className="flex gap-2 items-center">
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name..."
                  className="bg-[#0a0a1a] border border-[rgba(0,212,255,0.18)] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#00d4ff] w-36" />
              </div>
            }
          />

          {/* Status filter tabs */}
          <div className="px-4 py-3 flex gap-1 border-b border-[rgba(0,212,255,0.1)]">
            {STATUS_TABS.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  statusFilter === s
                    ? 'bg-[rgba(0,212,255,0.15)] text-[#00d4ff] border border-[rgba(0,212,255,0.3)]'
                    : 'text-[#475569] hover:text-[#94a3b8]'
                }`}>
                {s}
              </button>
            ))}
          </div>

          {isLoading ? <PageLoader /> : candidates.length === 0 ? (
            <Empty icon="👤" title="No candidates found" subtitle="Adjust your filters to see candidates" />
          ) : (
            <Table headers={['Candidate', 'Election', 'Party', 'Constituency', 'Status', 'Applied', 'Actions']}>
              {candidates.map((c: any) => (
                <TR key={c.id} onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <Avatar name={c.user?.name ?? '?'} size={8} />
                      <div>
                        <div className="text-sm font-semibold text-white">{c.user?.name}</div>
                        <div className="text-xs text-[#475569]">{c.user?.email}</div>
                      </div>
                    </div>
                  </TD>
                  <TD className="text-xs text-[#94a3b8] max-w-xs">
                    <div className="truncate">{c.election?.title ?? elections.find((e: any) => e.id === firstElectionId)?.title}</div>
                  </TD>
                  <TD>
                    {c.party ? (
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: c.party.color }} />
                        <span className="text-xs text-[#94a3b8]">{c.party.abbreviation}</span>
                      </div>
                    ) : <span className="text-xs text-[#475569]">Independent</span>}
                  </TD>
                  <TD className="text-xs text-[#94a3b8]">{c.constituency ?? '—'}</TD>
                  <TD><StatusBadge status={c.status} /></TD>
                  <TD className="text-xs text-[#475569] font-mono">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </TD>
                  <TD>
                    <div className="flex gap-1">
                      {c.status === 'PENDING' && (
                        <>
                          <Btn size="sm" loading={approveMutation.isPending}
                            onClick={(e) => { e.stopPropagation(); approveMutation.mutate(c.id) }}>
                            ✓ Approve
                          </Btn>
                          <Btn variant="danger" size="sm"
                            onClick={(e) => { e.stopPropagation(); toast('Rejection flow coming soon') }}>
                            ✕
                          </Btn>
                        </>
                      )}
                      {c.status === 'APPROVED' && (
                        <span className="text-xs text-[#00ff88] font-mono">Approved ✓</span>
                      )}
                    </div>
                  </TD>
                </TR>
              ))}
            </Table>
          )}
        </Card>

        {/* Expanded candidate detail */}
        {selectedId && (() => {
          const c = candidates.find((x: any) => x.id === selectedId)
          if (!c) return null
          return (
            <Card>
              <CardHeader title={`Profile: ${c.user?.name}`}
                action={<Btn variant="ghost" size="sm" onClick={() => setSelectedId(null)}>✕ Close</Btn>} />
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-[#475569] uppercase font-mono mb-1">Biography</p>
                  <p className="text-sm text-[#94a3b8] leading-relaxed">{c.biography || 'No biography provided'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#475569] uppercase font-mono mb-1">Manifesto</p>
                  <p className="text-sm text-[#94a3b8] leading-relaxed">{c.manifesto || 'No manifesto provided'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#475569] uppercase font-mono mb-2">Achievements</p>
                  <ul className="space-y-1">
                    {(c.achievements ?? []).map((a: string, i: number) => (
                      <li key={i} className="text-sm text-[#94a3b8] flex gap-2">
                        <span className="text-[#00d4ff]">•</span>{a}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-[#475569] uppercase font-mono mb-2">Asset Declarations</p>
                  {(c.assetDeclarations as any[] ?? []).length === 0
                    ? <p className="text-sm text-[#475569]">Not declared</p>
                    : (c.assetDeclarations as any[]).map((a: any, i: number) => (
                      <div key={i} className="text-sm text-[#94a3b8] flex justify-between">
                        <span>{a.description}</span>
                        <span className="font-mono text-[#00d4ff]">{a.currency} {a.value?.toLocaleString()}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
              {c.status === 'PENDING' && (
                <div className="px-6 pb-6 flex gap-3">
                  <Btn loading={approveMutation.isPending} onClick={() => approveMutation.mutate(c.id)}>
                    ✓ Approve Candidate
                  </Btn>
                  <Btn variant="danger">✕ Reject Candidate</Btn>
                </div>
              )}
            </Card>
          )
        })()}
      </main>
    </div>
  )
}