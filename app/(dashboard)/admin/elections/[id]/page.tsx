'use client'
// app/(dashboard)/admin/elections/[id]/page.tsx

import { use } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import StatsCard from '@/components/dashboard/StatsCard'
import { Card, CardHeader, StatusBadge, Btn, Progress, Avatar, PageLoader } from '@/components/dashboard/ui'
import { VotexAreaChart, VotexBarChart } from '@/components/dashboard/charts/Charts'
import toast from 'react-hot-toast'

const apiFetch = (url: string) => fetch(url, { credentials: 'include' }).then(r => r.json())

export default function ElectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const qc = useQueryClient()

  const { data: elData, isLoading: elLoading } = useQuery({
    queryKey: ['election', id],
    queryFn: () => apiFetch(`/api/elections/${id}`),
  })

  const { data: resData } = useQuery({
    queryKey: ['election-results', id],
    queryFn: () => apiFetch(`/api/elections/${id}/results`),
    refetchInterval: (q) => {
      const status = elData?.data?.status
      return status === 'LIVE' ? 5000 : false
    },
    enabled: !!elData?.data,
  })

  const launchMutation = useMutation({
    mutationFn: () => fetch(`/api/elections/${id}/launch`, { method: 'POST', credentials: 'include' }).then(r => r.json()),
    onSuccess: (r) => {
      if (r.success) { toast.success('🚀 Election launched!'); qc.invalidateQueries({ queryKey: ['election', id] }) }
      else toast.error(r.error)
    },
  })

  const closeMutation = useMutation({
    mutationFn: () => fetch(`/api/elections/${id}/close`, { method: 'POST', credentials: 'include' }).then(r => r.json()),
    onSuccess: (r) => {
      if (r.success) { toast.success('Election closed'); qc.invalidateQueries({ queryKey: ['election', id] }) }
      else toast.error(r.error)
    },
  })

  if (elLoading) return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Election Detail" />
      <PageLoader />
    </div>
  )

  const el  = elData?.data
  const res = resData?.data

  if (!el) return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Election Not Found" />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🗳️</div>
          <p className="font-orb text-white font-bold">Election not found</p>
          <Link href="/admin/elections"><Btn variant="outline" className="mt-4">← Back to Elections</Btn></Link>
        </div>
      </main>
    </div>
  )

  const turnoutData = res?.turnoutByHour?.map((t: any) => ({
    time:  new Date(t.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    votes: t.votes,
  })) ?? []

  const candidateBarData = res?.candidateResults?.map((c: any) => ({
    name:  c.name.split(' ')[0],
    votes: c.votes,
    pct:   c.percentage,
  })) ?? []

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title={el.title}
        subtitle={`ID: ${el.id.slice(0, 12)} · Created by ${el.createdBy?.name}`}
        actions={
          <div className="flex gap-2">
            {el.status === 'DRAFT' && (
              <>
                <Link href={`/admin/elections/${id}/configure`}>
                  <Btn variant="outline" size="sm">⚙️ Configure</Btn>
                </Link>
                <Btn size="sm" loading={launchMutation.isPending} onClick={() => launchMutation.mutate()}>
                  🚀 Launch
                </Btn>
              </>
            )}
            {el.status === 'LIVE' && (
              <Btn variant="danger" size="sm" loading={closeMutation.isPending} onClick={() => closeMutation.mutate()}>
                🔒 Close Election
              </Btn>
            )}
          </div>
        }
      />

      <main className="flex-1 p-6 overflow-y-auto space-y-6">

        {/* Status + Meta */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-[#0e0e24] border border-[rgba(0,212,255,0.15)] rounded-xl">
          <StatusBadge status={el.status} />
          <span className="text-xs text-[#475569] font-mono">Type: {el.type}</span>
          <span className="text-xs text-[#475569] font-mono">Method: {el.votingMethod?.replace('_', ' ')}</span>
          <span className="text-xs text-[#475569] font-mono">
            {new Date(el.startDate).toLocaleDateString()} → {new Date(el.endDate).toLocaleDateString()}
          </span>
          {el.status === 'LIVE' && (
            <span className="ml-auto text-xs text-[#00ff88] font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
              LIVE — results updating every 5s
            </span>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard label="Registered Voters" value={(res?.totalVoters ?? el._count?.voterRegistrations ?? 0).toLocaleString()} icon="👥" accent="cyan" />
          <StatsCard label="Votes Cast"         value={(res?.totalVotesCast ?? el._count?.votes ?? 0).toLocaleString()} icon="🗳️" accent="purple" />
          <StatsCard label="Turnout"            value={`${res?.turnoutPercent ?? 0}%`} icon="📈" accent="green" />
          <StatsCard label="Candidates"         value={el._count?.candidates ?? 0} icon="👤" accent="amber" />
        </div>

        {/* Candidate results */}
        {res?.candidateResults?.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Bar chart */}
            <Card className="xl:col-span-3">
              <CardHeader title="Live Vote Distribution" subtitle="Per candidate" />
              <div className="p-5">
                <VotexBarChart data={candidateBarData} xKey="name"
                  bars={[{ key: 'pct', color: 'cyan', name: 'Vote %' }]} height={220} />
              </div>
            </Card>

            {/* Rankings */}
            <Card className="xl:col-span-2">
              <CardHeader title="Rankings" />
              <div className="p-4 space-y-4">
                {res.candidateResults.map((c: any, i: number) => (
                  <div key={c.candidateId} className="flex items-center gap-3">
                    <span className={`text-sm font-orb font-bold w-5 ${i === 0 ? 'text-[#f59e0b]' : 'text-[#475569]'}`}>
                      #{i + 1}
                    </span>
                    <Avatar name={c.name} size={8}
                      gradient={i === 0 ? 'from-[#00d4ff] to-[#7c3aed]' : 'from-[#475569] to-[#334155]'} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold text-white truncate">{c.name}</span>
                        <span className="text-sm font-orb font-bold text-[#00d4ff] ml-2">{c.percentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={c.percentage} />
                      <span className="text-[10px] text-[#475569] font-mono">{c.votes.toLocaleString()} votes</span>
                    </div>
                    {c.isLeading && (
                      <span className="text-[10px] bg-[rgba(0,255,136,0.12)] text-[#00ff88] border border-[rgba(0,255,136,0.2)] px-1.5 py-0.5 rounded font-mono">
                        LEADING
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Turnout chart */}
        {turnoutData.length > 0 && (
          <Card>
            <CardHeader title="Hourly Turnout" subtitle="Vote flow over time" />
            <div className="p-5">
              <VotexAreaChart data={turnoutData} xKey="time"
                lines={[{ key: 'votes', color: 'cyan', name: 'Votes per hour' }]} height={200} />
            </div>
          </Card>
        )}

        {/* Candidates table */}
        <Card>
          <CardHeader
            title={`Candidates (${el.candidates?.length ?? 0})`}
            action={
              <Link href={`/admin/candidates?electionId=${id}`}>
                <Btn variant="ghost" size="sm">Manage →</Btn>
              </Link>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-[#0a0a1a]">
                {['Candidate', 'Party', 'Status', 'Votes', '%', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-[#475569] font-mono uppercase">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {(el.candidates ?? []).map((c: any) => {
                  const result = res?.candidateResults?.find((r: any) => r.candidateId === c.id)
                  return (
                    <tr key={c.id} className="border-t border-[rgba(0,212,255,0.06)]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={c.user?.name ?? '?'} size={7} />
                          <span className="text-sm font-semibold text-white">{c.user?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#94a3b8]">{c.party?.name ?? 'Independent'}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3 text-sm font-mono text-[#00d4ff]">{(result?.votes ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm font-orb text-[#7c3aed]">{result?.percentage.toFixed(1) ?? '0.0'}%</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Link href={`/admin/candidates?id=${c.id}`}>
                            <Btn variant="ghost" size="sm">View</Btn>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

      </main>
    </div>
  )
}