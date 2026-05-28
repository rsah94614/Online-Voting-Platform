'use client'
// app/(dashboard)/admin/audit/page.tsx

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { Card, CardHeader, Table, TR, TD, Empty, PageLoader } from '@/components/dashboard/ui'

const apiFetch = (url: string) => fetch(url, { credentials: 'include' }).then(r => r.json())

const ACTION_COLOR: Record<string, string> = {
  VOTE_CAST:          'text-[#00d4ff]',
  ELECTION_LAUNCHED:  'text-[#00ff88]',
  ELECTION_CREATED:   'text-[#7c3aed]',
  ELECTION_CLOSED:    'text-[#f59e0b]',
  ELECTION_PAUSED:    'text-[#f59e0b]',
  CANDIDATE_APPROVED: 'text-[#00ff88]',
  CANDIDATE_REJECTED: 'text-[#ff2d6a]',
  USER_LOGIN:         'text-[#94a3b8]',
  USER_REGISTERED:    'text-[#7c3aed]',
}

const ACTION_ICON: Record<string, string> = {
  VOTE_CAST: '🗳️', ELECTION_LAUNCHED: '🚀', ELECTION_CREATED: '✚',
  ELECTION_CLOSED: '🔒', ELECTION_PAUSED: '⏸', CANDIDATE_APPROVED: '✅',
  CANDIDATE_REJECTED: '❌', USER_LOGIN: '🔑', USER_REGISTERED: '👤',
}

export default function AuditPage() {
  const [actionFilter, setActionFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['audit', actionFilter, page],
    queryFn: () => apiFetch(`/api/audit?action=${actionFilter}&page=${page}&limit=30`),
    refetchInterval: 30_000,
  })

  const logs      = data?.data?.data ?? []
  const total     = data?.data?.total ?? 0
  const totalPages = data?.data?.totalPages ?? 1

  const FILTERS = ['', 'VOTE_CAST', 'ELECTION_LAUNCHED', 'ELECTION_CREATED', 'CANDIDATE_APPROVED', 'USER_LOGIN']

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Audit Logs" subtitle="Immutable record of all platform events" />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto">

        {/* Live ticker */}
        <div className="flex items-center gap-3 bg-[rgba(0,255,136,0.04)] border border-[rgba(0,255,136,0.15)] rounded-xl px-5 py-3">
          <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88] animate-pulse" />
          <span className="text-xs text-[#00ff88] font-mono">{total.toLocaleString()} total log entries — auto-refreshes every 30s</span>
          <span className="ml-auto text-xs text-[#475569] font-mono">{new Date().toLocaleTimeString()}</span>
        </div>

        <Card>
          <CardHeader
            title="System Event Log"
            action={
              <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
                className="bg-[#0a0a1a] border border-[rgba(0,212,255,0.18)] rounded-lg px-3 py-1.5 text-xs text-[#94a3b8] focus:outline-none cursor-pointer">
                <option value="">All Actions</option>
                {FILTERS.slice(1).map(f => <option key={f} value={f}>{f.replace(/_/g,' ')}</option>)}
              </select>
            }
          />

          {isLoading ? <PageLoader /> : logs.length === 0 ? (
            <Empty icon="🔍" title="No audit logs" subtitle="System events will appear here" />
          ) : (
            <Table headers={['Time', 'Action', 'Entity', 'User', 'Election', 'Severity']}>
              {logs.map((log: any) => (
                <TR key={log.id}>
                  <TD className="text-[10px] text-[#475569] font-mono whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <span>{ACTION_ICON[log.action] ?? '📋'}</span>
                      <span className={`text-xs font-mono font-bold ${ACTION_COLOR[log.action] ?? 'text-[#94a3b8]'}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </TD>
                  <TD className="text-xs text-[#94a3b8]">
                    <div>{log.entity}</div>
                    {log.entityId && (
                      <div className="text-[10px] text-[#475569] font-mono">{log.entityId.slice(0, 12)}…</div>
                    )}
                  </TD>
                  <TD className="text-xs text-[#94a3b8]">
                    {log.user?.name ?? <span className="text-[#475569]">System</span>}
                  </TD>
                  <TD className="text-xs text-[#94a3b8] max-w-xs">
                    <div className="truncate">{log.election?.title ?? '—'}</div>
                  </TD>
                  <TD>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      log.severity === 'ERROR'    ? 'bg-[rgba(255,45,106,0.1)] text-[#ff2d6a] border-[rgba(255,45,106,0.2)]' :
                      log.severity === 'WARN'     ? 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b] border-[rgba(245,158,11,0.2)]' :
                      log.severity === 'CRITICAL' ? 'bg-[rgba(255,45,106,0.2)] text-[#ff2d6a] border-[rgba(255,45,106,0.4)]' :
                                                    'bg-[rgba(0,212,255,0.06)] text-[#475569] border-[rgba(0,212,255,0.1)]'
                    }`}>
                      {log.severity ?? 'INFO'}
                    </span>
                  </TD>
                </TR>
              ))}
            </Table>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(0,212,255,0.1)]">
              <span className="text-xs text-[#475569] font-mono">Page {page} / {totalPages} · {total} total</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="px-3 py-1.5 rounded border border-[rgba(0,212,255,0.18)] text-xs text-[#94a3b8] hover:text-[#00d4ff] disabled:opacity-40">
                  ← Prev
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded border border-[rgba(0,212,255,0.18)] text-xs text-[#94a3b8] hover:text-[#00d4ff] disabled:opacity-40">
                  Next →
                </button>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}