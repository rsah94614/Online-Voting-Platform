'use client'
// app/(dashboard)/admin/elections/[id]/configure/page.tsx

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { Card, CardHeader, Field, Btn, inputCls, selectCls, textareaCls, PageLoader } from '@/components/dashboard/ui'
import toast from 'react-hot-toast'

const schema = z.object({
  title:                z.string().min(5),
  description:          z.string().min(10),
  startDate:            z.string().min(1),
  endDate:              z.string().min(1),
  registrationDeadline: z.string().optional(),
  votingMethod:         z.string(),
  resultDisclosure:     z.string(),
  allowSplitVoting:     z.boolean(),
  requirePhotoId:       z.boolean(),
  anonymizeVoters:      z.boolean(),
  maxCandidates:        z.coerce.number().optional().or(z.literal('')),
  maxVoters:            z.coerce.number().optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

function toDatetimeLocal(iso: string) {
  return iso ? new Date(iso).toISOString().slice(0, 16) : ''
}

export default function ConfigureElectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['election', id],
    queryFn: () => fetch(`/api/elections/${id}`, { credentials: 'include' }).then(r => r.json()),
  })

  const el = data?.data

  const { register, handleSubmit, reset, watch, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (el) {
      reset({
        title:                el.title,
        description:          el.description,
        startDate:            toDatetimeLocal(el.startDate),
        endDate:              toDatetimeLocal(el.endDate),
        registrationDeadline: el.registrationDeadline ? toDatetimeLocal(el.registrationDeadline) : '',
        votingMethod:         el.votingMethod,
        resultDisclosure:     el.resultDisclosure,
        allowSplitVoting:     el.allowSplitVoting,
        requirePhotoId:       el.requirePhotoId,
        anonymizeVoters:      el.anonymizeVoters,
        maxCandidates:        el.maxCandidates ?? '',
        maxVoters:            el.maxVoters     ?? '',
      })
    }
  }, [el, reset])

  const updateMutation = useMutation({
    mutationFn: (body: Partial<FormData>) =>
      fetch(`/api/elections/${id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.json()),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Election updated ✓')
        qc.invalidateQueries({ queryKey: ['election', id] })
      } else toast.error(res.error)
    },
  })

  const launchMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/elections/${id}/launch`, { method: 'POST', credentials: 'include' }).then(r => r.json()),
    onSuccess: (res) => {
      if (res.success) { toast.success('🚀 Election is now LIVE!'); router.push(`/admin/elections/${id}`) }
      else toast.error(res.error)
    },
  })

  const onSubmit = (data: FormData) => {
    const body = {
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate:   new Date(data.endDate).toISOString(),
      ...(data.registrationDeadline ? { registrationDeadline: new Date(data.registrationDeadline).toISOString() } : {}),
      maxCandidates: data.maxCandidates ? Number(data.maxCandidates) : undefined,
      maxVoters:     data.maxVoters     ? Number(data.maxVoters)     : undefined,
    }
    updateMutation.mutate(body)
  }

  if (isLoading) return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Configure Election" />
      <PageLoader />
    </div>
  )

  const isLive = el?.status === 'LIVE'

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="Configure Election"
        subtitle={el?.title ?? ''}
        actions={
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" onClick={() => router.push(`/admin/elections/${id}`)}>← Back</Btn>
            {el?.status === 'DRAFT' && (
              <Btn size="sm" loading={launchMutation.isPending} onClick={() => launchMutation.mutate()}>
                🚀 Launch Election
              </Btn>
            )}
          </div>
        }
      />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6">

          {isLive && (
            <div className="bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.25)] rounded-xl px-5 py-3 text-xs text-[#f59e0b] font-mono">
              ⚠️ This election is LIVE. Only description and result-disclosure can be modified.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Basic */}
            <Card>
              <CardHeader title="Basic Information" />
              <div className="p-6 space-y-4">
                <Field label="Title" error={errors.title?.message}>
                  <input {...register('title')} disabled={isLive} className={inputCls} />
                </Field>
                <Field label="Description" error={errors.description?.message}>
                  <textarea {...register('description')} rows={4} className={textareaCls} />
                </Field>
              </div>
            </Card>

            {/* Schedule */}
            <Card>
              <CardHeader title="Schedule" />
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Start Date & Time" error={errors.startDate?.message}>
                  <input {...register('startDate')} type="datetime-local" disabled={isLive} className={inputCls} />
                </Field>
                <Field label="End Date & Time" error={errors.endDate?.message}>
                  <input {...register('endDate')} type="datetime-local" disabled={isLive} className={inputCls} />
                </Field>
                <Field label="Registration Deadline" error={errors.registrationDeadline?.message}>
                  <input {...register('registrationDeadline')} type="datetime-local" disabled={isLive} className={inputCls} />
                </Field>
              </div>
            </Card>

            {/* Voting settings */}
            <Card>
              <CardHeader title="Voting Configuration" />
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Voting Method">
                  <select {...register('votingMethod')} disabled={isLive} className={selectCls}>
                    <option value="FPTP">First Past The Post</option>
                    <option value="RANKED_CHOICE">Ranked Choice</option>
                    <option value="APPROVAL">Approval Voting</option>
                    <option value="MULTI_SEAT">Multi-Seat</option>
                  </select>
                </Field>
                <Field label="Result Disclosure">
                  <select {...register('resultDisclosure')} className={selectCls}>
                    <option value="IMMEDIATE">Immediate (live)</option>
                    <option value="AFTER_CLOSE">After Election Closes</option>
                    <option value="MANUAL">Manual by Admin</option>
                  </select>
                </Field>
                <Field label="Max Candidates" hint="Leave blank for unlimited">
                  <input {...register('maxCandidates')} type="number" min={1} disabled={isLive} placeholder="Unlimited" className={inputCls} />
                </Field>
                <Field label="Max Voters" hint="Leave blank for unlimited">
                  <input {...register('maxVoters')} type="number" min={1} disabled={isLive} placeholder="Unlimited" className={inputCls} />
                </Field>
              </div>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader title="Security & Privacy" />
              <div className="p-6 space-y-3">
                {[
                  { name: 'anonymizeVoters',  label: 'Anonymize voter identity',    hint: 'Voter IDs are cryptographically hashed' },
                  { name: 'requirePhotoId',   label: 'Require government photo ID', hint: 'Voters must provide valid ID' },
                  { name: 'allowSplitVoting', label: 'Allow split-ticket voting',   hint: 'Voters can vote across multiple races' },
                ].map((opt) => (
                  <label key={opt.name} className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                    watch(opt.name as any)
                      ? 'border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.06)]'
                      : 'border-[rgba(0,212,255,0.12)] hover:border-[rgba(0,212,255,0.2)]'
                  } ${isLive ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    <input type="checkbox" {...register(opt.name as any)} disabled={isLive}
                      className="w-4 h-4 accent-[#00d4ff] mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-white">{opt.label}</p>
                      <p className="text-xs text-[#475569] mt-0.5">{opt.hint}</p>
                    </div>
                  </label>
                ))}
              </div>
            </Card>

            <div className="flex justify-end gap-3 pb-6">
              <Btn variant="outline" type="button" onClick={() => reset()}>Reset Changes</Btn>
              <Btn type="submit" loading={updateMutation.isPending} disabled={!isDirty}>
                💾 Save Configuration
              </Btn>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}