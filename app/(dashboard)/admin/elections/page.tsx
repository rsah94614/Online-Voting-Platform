'use client'
// app/(dashboard)/admin/elections/page.tsx

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useElectionStore } from '@/stores/electionStore'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import StatsCard from '@/components/dashboard/StatsCard'
import { Card, StatusBadge, Table, TR, TD, Btn, Empty, PageLoader } from '@/components/dashboard/ui'
import toast from 'react-hot-toast'

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(r => r.json())

function useElections(params: Record<string, string>) {
  const q = new URLSearchParams(params).toString()
  return useQuery({
    queryKey: ['elections', params],
    queryFn: () => fetcher(`/api/elections?${q}`),
    refetchInterval: 15_000,
  })
}

export default function AdminElectionsPage() {
  const qc = useQueryClient()
  const { filters, setFilters } = useElectionStore()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useElections({
    status:   filters.status === 'all' ? '' : filters.status,
    search,
    page:     String(filters.page),
    pageSize: '12',
  })

  const closeMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/elections/${id}/close`, { method: 'POST', credentials: 'include' }).then(r => r.json()),
    onSuccess: (res) => {
      if (res.success) { toast.success('Election closed'); qc.invalidateQueries({ queryKey: ['elections'] }) }
      else toast.error(res.error)
    },
  })

  const launchMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/elections/${id}/launch`, { method: 'POST', credentials: 'include' }).then(r => r.json()),
    onSuccess: (res) => {
      if (res.success) { toast.success('🚀 Election is now LIVE!'); qc.invalidateQueries({ queryKey: ['elections'] }) }
      else toast.error(res.error)
    },
  })

  const elections = data?.data?.data ?? []
  const total     = data?.data?.total ?? 0

  const STATUS_TABS = ['all', 'DRAFT', 'UPCOMING', 'LIVE', 'PAUSED', 'ENDED']

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="Elections"
        subtitle={`${total} total elections`}
        actions={
          <Link href="/admin/elections/create">
            <Btn size="sm">+ New Election</Btn>
          </Link>
        }
      />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Stats row */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard label="Total"    value={total}                             icon="🗳️" accent="cyan" />
          <StatsCard label="Live Now" value={elections.filter((e: any) => e.status === 'LIVE').length}    icon="⚡" accent="green" />
          <StatsCard label="Upcoming" value={elections.filter((e: any) => e.status === 'UPCOMING').length} icon="📅" accent="amber" />
          <StatsCard label="Ended"    value={elections.filter((e: any) => e.status === 'ENDED').length}   icon="✅" accent="purple" />
        </div>

        {/* Filters */}
        <Card>
          <div className="p-4 flex flex-wrap gap-3 items-center border-b border-[rgba(0,212,255,0.1)]">
            {/* Status tabs */}
            <div className="flex gap-1 flex-wrap">
              {STATUS_TABS.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilters({ status: s as any })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    filters.status === s
                      ? 'bg-[rgba(0,212,255,0.15)] text-[#00d4ff] border border-[rgba(0,212,255,0.3)]'
                      : 'text-[#475569] hover:text-[#94a3b8]'
                  }`}
                >
                  {s === 'all' ? 'ALL' : s}
                </button>
              ))}
            </div>
            {/* Search */}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search elections..."
              className="ml-auto bg-[#0a0a1a] border border-[rgba(0,212,255,0.18)] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#00d4ff] w-48"
            />
          </div>

          {isLoading ? (
            <PageLoader />
          ) : elections.length === 0 ? (
            <Empty icon="🗳️" title="No elections found" subtitle="Create your first election to get started" />
          ) : (
            <Table headers={['Title', 'Type', 'Status', 'Candidates', 'Votes', 'Dates', 'Actions']}>
              {elections.map((el: any) => (
                <TR key={el.id}>
                  <TD className="text-white font-semibold max-w-xs">
                    <div className="truncate">{el.title}</div>
                    <div className="text-[10px] text-[#475569] font-mono mt-0.5">{el.id.slice(0, 8)}</div>
                  </TD>
                  <TD>
                    <span className="text-xs text-[#94a3b8] font-mono">{el.type?.replace('_', ' ')}</span>
                  </TD>
                  <TD><StatusBadge status={el.status} /></TD>
                  <TD className="text-[#94a3b8]">{el._count?.candidates ?? 0}</TD>
                  <TD className="font-mono text-[#00d4ff]">{(el._count?.votes ?? 0).toLocaleString()}</TD>
                  <TD className="text-xs text-[#475569] font-mono">
                    <div>{new Date(el.startDate).toLocaleDateString()}</div>
                    <div>{new Date(el.endDate).toLocaleDateString()}</div>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-1.5">
                      <Link href={`/admin/elections/${el.id}`}>
                        <Btn variant="outline" size="sm">View</Btn>
                      </Link>
                      {el.status === 'DRAFT' && (
                        <Btn
                          size="sm"
                          loading={launchMutation.isPending}
                          onClick={() => launchMutation.mutate(el.id)}
                        >
                          Launch
                        </Btn>
                      )}
                      {el.status === 'LIVE' && (
                        <Btn
                          variant="danger"
                          size="sm"
                          loading={closeMutation.isPending}
                          onClick={() => closeMutation.mutate(el.id)}
                        >
                          Close
                        </Btn>
                      )}
                    </div>
                  </TD>
                </TR>
              ))}
            </Table>
          )}

          {/* Pagination */}
          {total > 12 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(0,212,255,0.1)]">
              <span className="text-xs text-[#475569] font-mono">
                Page {filters.page} of {Math.ceil(total / 12)}
              </span>
              <div className="flex gap-2">
                <Btn variant="outline" size="sm" disabled={filters.page <= 1}
                  onClick={() => setFilters({ page: filters.page - 1 })}>← Prev</Btn>
                <Btn variant="outline" size="sm" disabled={filters.page >= Math.ceil(total / 12)}
                  onClick={() => setFilters({ page: filters.page + 1 })}>Next →</Btn>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}