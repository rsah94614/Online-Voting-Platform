'use client'
// app/(dashboard)/candidate/manifesto/page.tsx

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { Card, CardHeader, Field, Btn, inputCls, selectCls, textareaCls } from '@/components/dashboard/ui'

// ── Schema ────────────────────────────────────────────────────────────────────
const policySchema = z.object({
  title:    z.string().min(3, 'Required'),
  summary:  z.string().min(20, 'Min 20 characters'),
  category: z.string().min(1, 'Select a category'),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
})

const formSchema = z.object({
  manifesto:   z.string().min(100, 'Manifesto must be at least 100 characters'),
  keyPolicies: z.array(policySchema),
})
type FormData = z.infer<typeof formSchema>

const POLICY_CATEGORIES = [
  'Healthcare', 'Education', 'Economy', 'Agriculture', 'Infrastructure',
  'Environment', 'Technology', 'Defense', 'Social Welfare', 'Housing',
  'Employment', 'Women & Children', 'Judicial Reform', 'Foreign Policy', 'Other',
]

const PRIORITY_CONFIG = {
  HIGH:   { label: 'High',   color: 'text-[#ff2d6a]', bg: 'bg-[rgba(255,45,106,0.1)] border-[rgba(255,45,106,0.2)]' },
  MEDIUM: { label: 'Medium', color: 'text-[#f59e0b]', bg: 'bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]' },
  LOW:    { label: 'Low',    color: 'text-[#00ff88]', bg: 'bg-[rgba(0,255,136,0.1)] border-[rgba(0,255,136,0.2)]' },
}

const apiFetch = (u: string) => fetch(u, { credentials: 'include' }).then(r => r.json())

// ── Char counter ─────────────────────────────────────────────────────────────
function CharCount({ current, min }: { current: number; min: number }) {
  const ok = current >= min
  return (
    <span className={`text-[10px] font-mono ${ok ? 'text-[#00ff88]' : 'text-[#475569]'}`}>
      {current} / {min} {ok ? '✓' : `(need ${min - current} more)`}
    </span>
  )
}

export default function CandidateManifestoPage() {
  const qc = useQueryClient()
  const [preview, setPreview] = useState(false)
  const [activeCategory, setActiveCategory] = useState('ALL')

  const { data: meData, isLoading } = useQuery({
    queryKey: ['candidate-me'],
    queryFn: () => apiFetch('/api/auth/me'),
  })
  const profile = meData?.data?.candidateProfile

  const { register, handleSubmit, control, reset, watch, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { manifesto: '', keyPolicies: [] },
  })

  const { fields, append, remove, move } = useFieldArray({ control, name: 'keyPolicies' })

  useEffect(() => {
    if (!profile) return
    const policies = Array.isArray(profile.keyPolicies) ? profile.keyPolicies : []
    reset({ manifesto: profile.manifesto ?? '', keyPolicies: policies })
  }, [profile, reset])

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch(`/api/candidates/${profile?.id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.json()),
    onSuccess: (res) => {
      if (res.success) { toast.success('Manifesto saved ✓'); qc.invalidateQueries({ queryKey: ['candidate-me'] }) }
      else toast.error(res.error)
    },
  })

  const onSubmit = (data: FormData) => saveMutation.mutate(data)

  const manifestoText = watch('manifesto') ?? ''
  const allPolicies   = watch('keyPolicies') ?? []
  const filteredIdx   = fields
    .map((f, i) => ({ f, i, category: allPolicies[i]?.category }))
    .filter(({ category }) => activeCategory === 'ALL' || category === activeCategory)

  const categoriesInUse = ['ALL', ...new Set(allPolicies.map(p => p.category).filter(Boolean))]

  if (isLoading) return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Manifesto" />
      <main className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#00d4ff] border-t-transparent rounded-full animate-spin" />
      </main>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="Manifesto & Key Policies"
        subtitle="Your public commitment to voters — craft it carefully"
        actions={
          <div className="flex gap-2">
            <button type="button" onClick={() => setPreview(!preview)}
              className="px-4 py-2 rounded-lg border border-[rgba(0,212,255,0.2)] text-xs text-[#94a3b8] hover:text-[#00d4ff] hover:border-[#00d4ff] transition-all font-mono">
              {preview ? '✏️ Edit' : '👁️ Preview'}
            </button>
            <Btn size="sm" loading={saveMutation.isPending} disabled={!isDirty}
              onClick={handleSubmit(onSubmit)}>
              💾 Save
            </Btn>
          </div>
        }
      />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Preview mode */}
          {preview ? (
            <Card className="p-8">
              <div className="text-center mb-8 pb-6 border-b border-[rgba(0,212,255,0.1)]">
                <h2 className="font-orb text-2xl font-bold text-white mb-1">{meData?.data?.name}&apos;s Manifesto</h2>
                <p className="text-xs text-[#475569] font-mono">As seen by voters · {allPolicies.length} key policies</p>
              </div>
              <div className="mb-8">
                <h3 className="font-orb text-sm font-bold text-[#00d4ff] mb-3 uppercase tracking-wider">Statement</h3>
                <p className="text-sm text-[#94a3b8] leading-relaxed whitespace-pre-wrap">{manifestoText || 'No manifesto written yet.'}</p>
              </div>
              {allPolicies.length > 0 && (
                <div>
                  <h3 className="font-orb text-sm font-bold text-[#00d4ff] mb-4 uppercase tracking-wider">Key Policies</h3>
                  <div className="space-y-4">
                    {allPolicies.map((p, i) => {
                      const pc = PRIORITY_CONFIG[p.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.MEDIUM
                      return (
                        <div key={i} className="p-4 bg-[#0a0a1a] rounded-xl border border-[rgba(0,212,255,0.1)]">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h4 className="text-sm font-semibold text-white">{p.title}</h4>
                            <div className="flex gap-2 flex-shrink-0">
                              <span className="text-[10px] px-2 py-0.5 rounded-full border font-mono bg-[rgba(0,212,255,0.06)] text-[#475569] border-[rgba(0,212,255,0.1)]">{p.category}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${pc.bg} ${pc.color}`}>{pc.label}</span>
                            </div>
                          </div>
                          <p className="text-xs text-[#94a3b8] leading-relaxed">{p.summary}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

              {/* Manifesto statement */}
              <Card>
                <CardHeader title="Manifesto Statement"
                  subtitle="Your core vision, values, and pledge to the voters" />
                <div className="p-6">
                  <Field label="Full Manifesto" error={errors.manifesto?.message}>
                    <textarea {...register('manifesto')} rows={10} className={textareaCls}
                      placeholder={`Dear Citizens,\n\nI stand before you with a clear vision for a better tomorrow. My commitment to you is...\n\nOn healthcare, I believe...\nOn education, I will...\nOn economic growth, my plan includes...\n\nTogether, we can build a nation where every citizen prospers.`} />
                  </Field>
                  <div className="flex justify-between mt-2">
                    <span className="text-[10px] text-[#475569]">Use paragraphs, be specific, make promises you can keep</span>
                    <CharCount current={manifestoText.length} min={100} />
                  </div>

                  {/* Word count stats */}
                  {manifestoText.length > 0 && (
                    <div className="mt-3 flex gap-4 text-xs text-[#475569] font-mono bg-[#0a0a1a] rounded-lg p-3">
                      <span>Words: <strong className="text-[#94a3b8]">{manifestoText.split(/\s+/).filter(Boolean).length}</strong></span>
                      <span>Characters: <strong className="text-[#94a3b8]">{manifestoText.length}</strong></span>
                      <span>Paragraphs: <strong className="text-[#94a3b8]">{manifestoText.split('\n\n').filter(Boolean).length}</strong></span>
                      <span>Est. read time: <strong className="text-[#94a3b8]">{Math.max(1, Math.ceil(manifestoText.split(/\s+/).length / 200))} min</strong></span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Key policies */}
              <Card>
                <CardHeader
                  title={`Key Policies (${fields.length})`}
                  subtitle="Specific, actionable promises on individual issues"
                  action={
                    <Btn type="button" size="sm"
                      onClick={() => append({ title: '', summary: '', category: '', priority: 'MEDIUM' })}>
                      + Add Policy
                    </Btn>
                  }
                />

                {/* Category filter */}
                {categoriesInUse.length > 1 && (
                  <div className="px-5 pb-3 flex gap-2 flex-wrap border-b border-[rgba(0,212,255,0.08)]">
                    {categoriesInUse.map(cat => (
                      <button key={cat} type="button" onClick={() => setActiveCategory(cat)}
                        className={`px-3 py-1 rounded-full text-xs font-mono transition-all ${
                          activeCategory === cat
                            ? 'bg-[rgba(0,212,255,0.15)] text-[#00d4ff] border border-[rgba(0,212,255,0.3)]'
                            : 'text-[#475569] hover:text-[#94a3b8]'
                        }`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                <div className="p-5 space-y-4">
                  {fields.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-3 opacity-40">📋</div>
                      <p className="text-sm text-[#475569] font-orb font-bold">No policies added yet</p>
                      <p className="text-xs text-[#475569] mt-1">Click &quot;+ Add Policy&quot; to define your key promises</p>
                    </div>
                  )}

                  {filteredIdx.map(({ f, i }) => {
                    const priority = (watch(`keyPolicies.${i}.priority`) ?? 'MEDIUM') as keyof typeof PRIORITY_CONFIG
                    const pc = PRIORITY_CONFIG[priority]
                    return (
                      <div key={f.id} className="p-5 bg-[#0a0a1a] rounded-xl border border-[rgba(0,212,255,0.1)] hover:border-[rgba(0,212,255,0.2)] transition-all">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[#7c3aed]">POLICY #{i + 1}</span>
                            {watch(`keyPolicies.${i}.category`) && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(0,212,255,0.06)] text-[#475569] border border-[rgba(0,212,255,0.1)] font-mono">
                                {watch(`keyPolicies.${i}.category`)}
                              </span>
                            )}
                            {priority && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${pc.bg} ${pc.color}`}>
                                {pc.label} Priority
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {i > 0 && (
                              <button type="button" onClick={() => move(i, i - 1)}
                                className="text-xs text-[#475569] hover:text-[#94a3b8] transition-colors" title="Move up">↑</button>
                            )}
                            {i < fields.length - 1 && (
                              <button type="button" onClick={() => move(i, i + 1)}
                                className="text-xs text-[#475569] hover:text-[#94a3b8] transition-colors" title="Move down">↓</button>
                            )}
                            <button type="button" onClick={() => remove(i)}
                              className="text-xs px-2 py-1 rounded border border-[rgba(255,45,106,0.2)] text-[#ff2d6a] hover:border-[#ff2d6a] transition-all">
                              Remove
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <Field label="Policy Title" error={errors.keyPolicies?.[i]?.title?.message}>
                              <input {...register(`keyPolicies.${i}.title`)}
                                placeholder="e.g. Universal Healthcare Coverage" className={inputCls} />
                            </Field>
                          </div>
                          <Field label="Category" error={errors.keyPolicies?.[i]?.category?.message}>
                            <select {...register(`keyPolicies.${i}.category`)} className={selectCls}>
                              <option value="">Select</option>
                              {POLICY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </Field>
                          <Field label="Priority">
                            <select {...register(`keyPolicies.${i}.priority`)} className={selectCls}>
                              <option value="HIGH">High Priority</option>
                              <option value="MEDIUM">Medium Priority</option>
                              <option value="LOW">Low Priority</option>
                            </select>
                          </Field>
                          <div className="sm:col-span-2">
                            <Field label="Policy Summary" error={errors.keyPolicies?.[i]?.summary?.message}>
                              <textarea {...register(`keyPolicies.${i}.summary`)} rows={2} className={textareaCls}
                                placeholder="Specific, measurable, time-bound commitment to voters…" />
                            </Field>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Policy category breakdown */}
                  {allPolicies.length > 0 && (
                    <div className="mt-2 p-4 bg-[rgba(0,212,255,0.03)] border border-[rgba(0,212,255,0.1)] rounded-xl">
                      <p className="text-xs font-orb font-bold text-[#475569] uppercase tracking-wider mb-3">Policy Breakdown by Category</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(
                          allPolicies.reduce((acc: Record<string, number>, p) => {
                            if (p.category) acc[p.category] = (acc[p.category] ?? 0) + 1
                            return acc
                          }, {})
                        ).map(([cat, count]) => (
                          <span key={cat} className="text-xs px-3 py-1 rounded-full bg-[rgba(0,212,255,0.08)] text-[#00d4ff] border border-[rgba(0,212,255,0.15)] font-mono">
                            {cat} ({count})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Save bar */}
              <div className="sticky bottom-0 bg-[rgba(10,10,26,0.95)] backdrop-blur border-t border-[rgba(0,212,255,0.15)] -mx-6 px-6 py-4 flex items-center justify-between">
                <p className="text-xs text-[#475569] font-mono">
                  {isDirty ? '⚠️ Unsaved changes' : '✓ All saved'}
                  {' · '}{fields.length} policies · {manifestoText.split(/\s+/).filter(Boolean).length} words
                </p>
                <div className="flex gap-3">
                  <Btn variant="outline" type="button" size="sm" onClick={() => reset()}>Discard</Btn>
                  <Btn type="button" size="sm" variant="ghost" onClick={() => setPreview(true)}>Preview →</Btn>
                  <Btn type="submit" size="sm" loading={saveMutation.isPending} disabled={!isDirty}>
                    💾 Save Manifesto
                  </Btn>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}