'use client'
// app/(dashboard)/admin/elections/create/page.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useElectionStore } from '@/stores/electionStore'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { Card, Field, Btn, inputCls, selectCls, textareaCls } from '@/components/dashboard/ui'
import toast from 'react-hot-toast'

// ── Step schemas ──────────────────────────────────────────────────────────────
const step1Schema = z.object({
  title:       z.string().min(5, 'Minimum 5 characters').max(200),
  description: z.string().min(20, 'Minimum 20 characters'),
  type:        z.enum(['PRESIDENTIAL','PARLIAMENTARY','CORPORATE','UNIVERSITY','COMMUNITY','ORGANIZATIONAL','REFERENDUM','CUSTOM']),
})

const step2Schema = z.object({
  votingMethod:         z.enum(['FPTP','RANKED_CHOICE','APPROVAL','WEIGHTED','MULTI_SEAT']),
  resultDisclosure:     z.enum(['IMMEDIATE','AFTER_CLOSE','MANUAL']),
  startDate:            z.string().min(1, 'Required'),
  endDate:              z.string().min(1, 'Required'),
  registrationDeadline: z.string().optional(),
  rounds:               z.coerce.number().int().min(1).default(1),
})

const step3Schema = z.object({
  maxCandidates:    z.coerce.number().int().positive().optional().or(z.literal('')),
  maxVoters:        z.coerce.number().int().positive().optional().or(z.literal('')),
  allowSplitVoting: z.boolean().default(false),
  requirePhotoId:   z.boolean().default(false),
  anonymizeVoters:  z.boolean().default(true),
})

const STEPS = ['Basic Info', 'Schedule & Voting', 'Security & Limits', 'Review & Create']

const ELECTION_TYPES = [
  { value: 'PRESIDENTIAL',    label: 'Presidential',     icon: '🏛️' },
  { value: 'PARLIAMENTARY',   label: 'Parliamentary',    icon: '🏟️' },
  { value: 'CORPORATE',       label: 'Corporate',        icon: '🏢' },
  { value: 'UNIVERSITY',      label: 'University',       icon: '🎓' },
  { value: 'COMMUNITY',       label: 'Community',        icon: '🏘️' },
  { value: 'ORGANIZATIONAL',  label: 'Organizational',   icon: '🤝' },
  { value: 'REFERENDUM',      label: 'Referendum',       icon: '📋' },
  { value: 'CUSTOM',          label: 'Custom',           icon: '⚙️' },
]

const VOTING_METHODS = [
  { value: 'FPTP',           label: 'First Past The Post',  desc: 'Most votes wins' },
  { value: 'RANKED_CHOICE',  label: 'Ranked Choice',        desc: 'Voters rank candidates by preference' },
  { value: 'APPROVAL',       label: 'Approval Voting',      desc: 'Voters approve multiple candidates' },
  { value: 'MULTI_SEAT',     label: 'Multi-Seat',           desc: 'Multiple winners selected' },
]

export default function CreateElectionPage() {
  const router  = useRouter()
  const [step, setStep]   = useState(0)
  const [draft, setDraft] = useState<Record<string, unknown>>({})
  const { resetDraft }    = useElectionStore()

  const f1 = useForm({ resolver: zodResolver(step1Schema), defaultValues: draft as any })
  const f2 = useForm({ resolver: zodResolver(step2Schema), defaultValues: { rounds: 1, ...draft } as any })
  const f3 = useForm({ resolver: zodResolver(step3Schema), defaultValues: { anonymizeVoters: true, ...draft } as any })

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch('/api/elections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      }).then(r => r.json()),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Election created!')
        resetDraft()
        router.push(`/admin/elections/${res.data.id}`)
      } else {
        toast.error(res.error ?? 'Failed to create election')
      }
    },
    onError: () => toast.error('Network error'),
  })

  const save1 = f1.handleSubmit((d) => { setDraft(p => ({ ...p, ...d })); setStep(1) })
  const save2 = f2.handleSubmit((d) => {
    if (new Date(d.endDate) <= new Date(d.startDate)) {
      f2.setError('endDate', { message: 'Must be after start date' }); return
    }
    setDraft(p => ({ ...p, ...d })); setStep(2)
  })
  const save3 = f3.handleSubmit((d) => { setDraft(p => ({ ...p, ...d })); setStep(3) })

  const submit = () => {
    const body = {
      ...draft,
      startDate: new Date(draft.startDate as string).toISOString(),
      endDate:   new Date(draft.endDate as string).toISOString(),
      ...(draft.registrationDeadline ? { registrationDeadline: new Date(draft.registrationDeadline as string).toISOString() } : {}),
      maxCandidates: draft.maxCandidates ? Number(draft.maxCandidates) : undefined,
      maxVoters:     draft.maxVoters     ? Number(draft.maxVoters)     : undefined,
    }
    createMutation.mutate(body)
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Create Election" subtitle="Configure a new election from scratch" />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Progress */}
          <Card className="p-5">
            <div className="flex justify-between mb-3">
              {STEPS.map((s, i) => (
                <div key={s} className={`flex items-center gap-2 text-xs font-mono transition-colors ${
                  i < step ? 'text-[#00ff88]' : i === step ? 'text-[#00d4ff]' : 'text-[#475569]'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                    i < step ? 'bg-[rgba(0,255,136,0.15)] border-[#00ff88] text-[#00ff88]' :
                    i === step ? 'bg-[rgba(0,212,255,0.15)] border-[#00d4ff] text-[#00d4ff]' :
                    'border-[#475569] text-[#475569]'
                  }`}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span className="hidden sm:block">{s}</span>
                </div>
              ))}
            </div>
            <div className="h-1 bg-[#0a0a1a] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }} />
            </div>
          </Card>

          {/* ── Step 0: Basic Info ── */}
          {step === 0 && (
            <Card>
              <div className="p-6">
                <h2 className="font-orb font-bold text-white text-lg mb-1">Basic Information</h2>
                <p className="text-sm text-[#475569] mb-6">Name and categorise your election</p>
                <form onSubmit={save1} className="space-y-5">
                  <Field label="Election Title" error={f1.formState.errors.title?.message}>
                    <input {...f1.register('title')} placeholder="e.g. National Presidential Election 2025" className={inputCls} />
                  </Field>
                  <Field label="Description" error={f1.formState.errors.description?.message}>
                    <textarea {...f1.register('description')} rows={4}
                      placeholder="Describe the election purpose, scope, and any special instructions for voters..."
                      className={textareaCls} />
                  </Field>
                  <Field label="Election Type" error={f1.formState.errors.type?.message}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                      {ELECTION_TYPES.map((t) => (
                        <label key={t.value} className={`cursor-pointer border rounded-xl p-3 text-center transition-all ${
                          f1.watch('type') === t.value
                            ? 'border-[#00d4ff] bg-[rgba(0,212,255,0.1)] text-white'
                            : 'border-[rgba(0,212,255,0.15)] text-[#475569] hover:border-[rgba(0,212,255,0.3)]'
                        }`}>
                          <input type="radio" {...f1.register('type')} value={t.value} className="sr-only" />
                          <div className="text-xl mb-1">{t.icon}</div>
                          <div className="text-xs font-semibold">{t.label}</div>
                        </label>
                      ))}
                    </div>
                  </Field>
                  <div className="flex justify-end pt-2">
                    <Btn type="submit">Continue →</Btn>
                  </div>
                </form>
              </div>
            </Card>
          )}

          {/* ── Step 1: Schedule & Voting ── */}
          {step === 1 && (
            <Card>
              <div className="p-6">
                <h2 className="font-orb font-bold text-white text-lg mb-1">Schedule & Voting Method</h2>
                <p className="text-sm text-[#475569] mb-6">Set dates and configure how votes are counted</p>
                <form onSubmit={save2} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Start Date & Time" error={f2.formState.errors.startDate?.message}>
                      <input {...f2.register('startDate')} type="datetime-local" className={inputCls} />
                    </Field>
                    <Field label="End Date & Time" error={f2.formState.errors.endDate?.message}>
                      <input {...f2.register('endDate')} type="datetime-local" className={inputCls} />
                    </Field>
                    <Field label="Registration Deadline (optional)" error={f2.formState.errors.registrationDeadline?.message}>
                      <input {...f2.register('registrationDeadline')} type="datetime-local" className={inputCls} />
                    </Field>
                    <Field label="Number of Rounds" error={f2.formState.errors.rounds?.message}
                      hint="Use 2+ for runoff elections">
                      <input {...f2.register('rounds')} type="number" min={1} max={10} className={inputCls} />
                    </Field>
                  </div>

                  <Field label="Voting Method" error={f2.formState.errors.votingMethod?.message}>
                    <div className="space-y-2 mt-1">
                      {VOTING_METHODS.map((m) => (
                        <label key={m.value} className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all ${
                          f2.watch('votingMethod') === m.value
                            ? 'border-[#00d4ff] bg-[rgba(0,212,255,0.08)]'
                            : 'border-[rgba(0,212,255,0.12)] hover:border-[rgba(0,212,255,0.25)]'
                        }`}>
                          <input type="radio" {...f2.register('votingMethod')} value={m.value} className="accent-[#00d4ff]" />
                          <div>
                            <div className="text-sm font-semibold text-white">{m.label}</div>
                            <div className="text-xs text-[#475569]">{m.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </Field>

                  <Field label="Result Disclosure" error={f2.formState.errors.resultDisclosure?.message}>
                    <select {...f2.register('resultDisclosure')} className={selectCls}>
                      <option value="IMMEDIATE">Immediate — results visible as votes come in</option>
                      <option value="AFTER_CLOSE">After Close — revealed only after election ends</option>
                      <option value="MANUAL">Manual — admin publishes results when ready</option>
                    </select>
                  </Field>

                  <div className="flex gap-3 justify-end pt-2">
                    <Btn variant="outline" type="button" onClick={() => setStep(0)}>← Back</Btn>
                    <Btn type="submit">Continue →</Btn>
                  </div>
                </form>
              </div>
            </Card>
          )}

          {/* ── Step 2: Security & Limits ── */}
          {step === 2 && (
            <Card>
              <div className="p-6">
                <h2 className="font-orb font-bold text-white text-lg mb-1">Security & Eligibility</h2>
                <p className="text-sm text-[#475569] mb-6">Control access, limits, and privacy settings</p>
                <form onSubmit={save3} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Max Candidates (blank = unlimited)" error={undefined}
                      hint="Leave blank for unlimited candidates">
                      <input {...f3.register('maxCandidates')} type="number" min={1} placeholder="Unlimited" className={inputCls} />
                    </Field>
                    <Field label="Max Voters (blank = unlimited)" error={undefined}
                      hint="Leave blank for unlimited voters">
                      <input {...f3.register('maxVoters')} type="number" min={1} placeholder="Unlimited" className={inputCls} />
                    </Field>
                  </div>

                  {/* Toggle options */}
                  <div className="space-y-3">
                    {[
                      { name: 'anonymizeVoters',  label: 'Anonymize voter identity',    hint: 'Voter IDs are hashed — voting is secret',  recommended: true },
                      { name: 'requirePhotoId',   label: 'Require government photo ID', hint: 'Voters must upload a valid photo ID',       recommended: false },
                      { name: 'allowSplitVoting', label: 'Allow split-ticket voting',   hint: 'Voters can choose different parties per race', recommended: false },
                    ].map((opt) => (
                      <label key={opt.name} className="flex items-start gap-3 p-4 rounded-lg border border-[rgba(0,212,255,0.12)] hover:border-[rgba(0,212,255,0.25)] cursor-pointer transition-all">
                        <input type="checkbox" {...f3.register(opt.name as any)} className="w-4 h-4 accent-[#00d4ff] mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{opt.label}</span>
                            {opt.recommended && (
                              <span className="text-[10px] bg-[rgba(0,255,136,0.1)] text-[#00ff88] border border-[rgba(0,255,136,0.2)] px-1.5 py-0.5 rounded font-mono">
                                RECOMMENDED
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#475569] mt-0.5">{opt.hint}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <Btn variant="outline" type="button" onClick={() => setStep(1)}>← Back</Btn>
                    <Btn type="submit">Review →</Btn>
                  </div>
                </form>
              </div>
            </Card>
          )}

          {/* ── Step 3: Review ── */}
          {step === 3 && (
            <Card>
              <div className="p-6">
                <h2 className="font-orb font-bold text-white text-lg mb-1">Review & Confirm</h2>
                <p className="text-sm text-[#475569] mb-6">Double-check your election configuration before creating</p>

                <div className="space-y-4">
                  {/* Summary grid */}
                  {[
                    { label: 'Title',           value: draft.title as string },
                    { label: 'Type',            value: draft.type as string },
                    { label: 'Voting Method',   value: String(draft.votingMethod).replace('_', ' ') },
                    { label: 'Result Disclosure', value: String(draft.resultDisclosure).replace('_', ' ') },
                    { label: 'Start Date',      value: draft.startDate ? new Date(draft.startDate as string).toLocaleString() : '—' },
                    { label: 'End Date',        value: draft.endDate   ? new Date(draft.endDate as string).toLocaleString()   : '—' },
                    { label: 'Anonymous Voting',value: draft.anonymizeVoters ? '✅ Yes' : '❌ No' },
                    { label: 'Photo ID Required',value: draft.requirePhotoId ? '✅ Yes' : '❌ No' },
                    { label: 'Max Candidates',  value: draft.maxCandidates ? String(draft.maxCandidates) : 'Unlimited' },
                    { label: 'Max Voters',      value: draft.maxVoters      ? String(draft.maxVoters)     : 'Unlimited' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-start py-2.5 border-b border-[rgba(0,212,255,0.07)]">
                      <span className="text-xs text-[#475569] font-mono uppercase tracking-wider">{label}</span>
                      <span className="text-sm text-white font-semibold text-right max-w-xs">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] rounded-lg p-4 mt-6">
                  <p className="text-xs text-[#f59e0b] leading-relaxed">
                    ⚠️ The election will be created in <strong>DRAFT</strong> status. You can add candidates and verify voters before launching it live. Once launched, key settings cannot be changed.
                  </p>
                </div>

                <div className="flex gap-3 justify-end mt-6">
                  <Btn variant="outline" type="button" onClick={() => setStep(2)}>← Back</Btn>
                  <Btn loading={createMutation.isPending} onClick={submit}>
                    🚀 Create Election
                  </Btn>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}