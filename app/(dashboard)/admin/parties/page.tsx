'use client'
// app/(dashboard)/admin/parties/page.tsx

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import StatsCard from '@/components/dashboard/StatsCard'
import { Card, CardHeader, Table, TR, TD, Btn, Empty, PageLoader, Field, inputCls, textareaCls } from '@/components/dashboard/ui'
import toast from 'react-hot-toast'

const apiFetch = (url: string) => fetch(url, { credentials: 'include' }).then(r => r.json())

export default function AdminPartiesPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const { register, handleSubmit, reset } = useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['parties'],
    queryFn: () => apiFetch('/api/parties'),
  })

  const parties: any[] = data?.data ?? []

  const activateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/parties/${id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then(r => r.json()),
    onSuccess: (res) => {
      if (res.success) { toast.success('Party status updated'); qc.invalidateQueries({ queryKey: ['parties'] }) }
      else toast.error(res.error)
    },
  })

  const createMutation = useMutation({
    mutationFn: (body: any) =>
      fetch('/api/parties', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.json()),
    onSuccess: (res) => {
      if (res.success) { toast.success('Party created'); qc.invalidateQueries({ queryKey: ['parties'] }); setShowCreate(false); reset() }
      else toast.error(res.error)
    },
  })

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="Political Parties"
        subtitle="Manage registered parties and coalitions"
        actions={<Btn size="sm" onClick={() => setShowCreate(!showCreate)}>+ Register Party</Btn>}
      />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard label="Total Parties"  value={parties.length}                                         icon="🏛️" accent="cyan" />
          <StatsCard label="Active"         value={parties.filter((p: any) => p.status === 'ACTIVE').length}  icon="✅" accent="green" />
          <StatsCard label="Pending"        value={parties.filter((p: any) => p.status === 'PENDING').length} icon="⏳" accent="amber" />
          <StatsCard label="Suspended"      value={parties.filter((p: any) => p.status === 'SUSPENDED').length} icon="🚫" accent="pink" />
        </div>

        {/* Create form */}
        {showCreate && (
          <Card>
            <CardHeader title="Register New Party"
              action={<Btn variant="ghost" size="sm" onClick={() => setShowCreate(false)}>✕</Btn>} />
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Party Name"><input {...register('name')} placeholder="Full party name" className={inputCls} /></Field>
              <Field label="Abbreviation"><input {...register('abbreviation')} placeholder="e.g. NPP" maxLength={6} className={inputCls} /></Field>
              <Field label="Party Color">
                <input {...register('color')} type="color" defaultValue="#00d4ff" className={`${inputCls} h-11 px-2 cursor-pointer`} />
              </Field>
              <Field label="Founded Year"><input {...register('foundedYear')} type="number" placeholder="e.g. 1998" className={inputCls} /></Field>
              <div className="sm:col-span-2">
                <Field label="Description">
                  <textarea {...register('description')} rows={3} placeholder="Party ideology and mission..." className={textareaCls} />
                </Field>
              </div>
              <div className="sm:col-span-2 flex justify-end gap-3">
                <Btn variant="outline" type="button" onClick={() => { setShowCreate(false); reset() }}>Cancel</Btn>
                <Btn type="submit" loading={createMutation.isPending}>Create Party</Btn>
              </div>
            </form>
          </Card>
        )}

        {/* Parties list */}
        <Card>
          <CardHeader title={`All Parties (${parties.length})`} />
          {isLoading ? <PageLoader /> : parties.length === 0 ? (
            <Empty icon="🏛️" title="No parties registered" subtitle="Create the first party above" />
          ) : (
            <Table headers={['Party', 'Abbr.', 'Founded', 'Candidates', 'Members', 'Status', 'Actions']}>
              {parties.map((p: any) => (
                <TR key={p.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: p.color }}>
                        {p.abbreviation?.slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{p.name}</div>
                        <div className="text-xs text-[#475569] truncate max-w-xs">{p.description?.slice(0, 60)}…</div>
                      </div>
                    </div>
                  </TD>
                  <TD className="font-mono text-[#00d4ff]">{p.abbreviation}</TD>
                  <TD className="text-xs text-[#94a3b8]">{p.foundedYear ?? '—'}</TD>
                  <TD className="text-sm text-[#94a3b8]">{p._count?.candidates ?? 0}</TD>
                  <TD className="text-sm text-[#94a3b8]">{p._count?.members ?? 0}</TD>
                  <TD>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                      p.status === 'ACTIVE'    ? 'bg-[rgba(0,255,136,0.1)] text-[#00ff88] border-[rgba(0,255,136,0.2)]' :
                      p.status === 'PENDING'   ? 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b] border-[rgba(245,158,11,0.2)]' :
                                                 'bg-[rgba(255,45,106,0.1)] text-[#ff2d6a] border-[rgba(255,45,106,0.2)]'
                    }`}>{p.status}</span>
                  </TD>
                  <TD>
                    <div className="flex gap-1">
                      {p.status === 'PENDING' && (
                        <Btn size="sm" loading={activateMutation.isPending}
                          onClick={() => activateMutation.mutate({ id: p.id, status: 'ACTIVE' })}>
                          Activate
                        </Btn>
                      )}
                      {p.status === 'ACTIVE' && (
                        <Btn size="sm" variant="danger"
                          onClick={() => activateMutation.mutate({ id: p.id, status: 'SUSPENDED' })}>
                          Suspend
                        </Btn>
                      )}
                      {p.status === 'SUSPENDED' && (
                        <Btn size="sm"
                          onClick={() => activateMutation.mutate({ id: p.id, status: 'ACTIVE' })}>
                          Reinstate
                        </Btn>
                      )}
                    </div>
                  </TD>
                </TR>
              ))}
            </Table>
          )}
        </Card>
      </main>
    </div>
  )
}