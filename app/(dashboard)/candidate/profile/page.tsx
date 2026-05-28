'use client'
// app/(dashboard)/candidate/profile/page.tsx

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { Card, CardHeader, Field, Btn, inputCls, selectCls, textareaCls, Progress, Avatar } from '@/components/dashboard/ui'

// ── Schema ────────────────────────────────────────────────────────────────────
const educationSchema = z.object({
  institution: z.string().min(2, 'Required'),
  degree:      z.string().min(2, 'Required'),
  field:       z.string().min(2, 'Required'),
  year:        z.string().min(4, 'Required'),
  grade:       z.string().optional(),
})

const workSchema = z.object({
  organization: z.string().min(2, 'Required'),
  position:     z.string().min(2, 'Required'),
  startYear:    z.string().min(4, 'Required'),
  endYear:      z.string().optional(),
  description:  z.string().optional(),
})

const politicalSchema = z.object({
  position:     z.string().min(2, 'Required'),
  organization: z.string().min(2, 'Required'),
  year:         z.string().min(4, 'Required'),
  description:  z.string().optional(),
})

const formSchema = z.object({
  biography:       z.string().min(50, 'At least 50 characters'),
  constituency:    z.string().min(2, 'Required'),
  education:       z.array(educationSchema),
  workExperience:  z.array(workSchema),
  politicalHistory:z.array(politicalSchema),
  achievements:    z.array(z.object({ value: z.string().min(2, 'Required') })),
  website:         z.string().url('Must be a valid URL').optional().or(z.literal('')),
  twitter:         z.string().optional(),
  linkedin:        z.string().optional(),
  instagram:       z.string().optional(),
  youtube:         z.string().optional(),
})
type FormData = z.infer<typeof formSchema>

const apiFetch = (u: string) => fetch(u, { credentials: 'include' }).then(r => r.json())

// ── Completeness calculator ───────────────────────────────────────────────────
function calcCompleteness(data: Partial<FormData>): number {
  let score = 0
  if (data.biography    && data.biography.length >= 50) score += 20
  if (data.constituency)                                score += 10
  if (data.education    && data.education.length   > 0) score += 20
  if (data.workExperience && data.workExperience.length > 0) score += 15
  if (data.achievements && data.achievements.length > 0) score += 15
  if (data.website || data.twitter || data.linkedin)    score += 10
  if (data.politicalHistory && data.politicalHistory.length > 0) score += 10
  return score
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({ title, count, onAdd }: { title: string; count: number; onAdd?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <h3 className="font-orb text-sm font-bold text-white">{title}</h3>
        {count > 0 && (
          <span className="text-[10px] bg-[rgba(0,212,255,0.1)] text-[#00d4ff] border border-[rgba(0,212,255,0.2)] px-2 py-0.5 rounded-full font-mono">
            {count}
          </span>
        )}
      </div>
      {onAdd && (
        <button type="button" onClick={onAdd}
          className="text-xs px-3 py-1.5 rounded-lg border border-[rgba(0,212,255,0.2)] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.08)] transition-all font-mono">
          + Add
        </button>
      )}
    </div>
  )
}

// ── Remove button ─────────────────────────────────────────────────────────────
function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="w-7 h-7 rounded border border-[rgba(255,45,106,0.2)] text-[#ff2d6a] hover:border-[#ff2d6a] hover:bg-[rgba(255,45,106,0.06)] transition-all text-xs flex-shrink-0 mt-6">
      ✕
    </button>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CandidateProfilePage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'basic' | 'background' | 'online'>('basic')

  const { data: meData, isLoading } = useQuery({
    queryKey: ['candidate-me'],
    queryFn: () => apiFetch('/api/auth/me'),
  })

  const profile = meData?.data?.candidateProfile
  const userName = meData?.data?.name ?? ''

  const { register, handleSubmit, control, reset, watch, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      biography: '', constituency: '', education: [], workExperience: [],
      politicalHistory: [], achievements: [], website: '',
      twitter: '', linkedin: '', instagram: '', youtube: '',
    },
  })

  const { fields: eduFields,  append: addEdu,  remove: rmEdu  } = useFieldArray({ control, name: 'education' })
  const { fields: workFields, append: addWork, remove: rmWork } = useFieldArray({ control, name: 'workExperience' })
  const { fields: polFields,  append: addPol,  remove: rmPol  } = useFieldArray({ control, name: 'politicalHistory' })
  const { fields: achFields,  append: addAch,  remove: rmAch  } = useFieldArray({ control, name: 'achievements' })

  // Populate form from API
  useEffect(() => {
    if (!profile) return
    const edu  = Array.isArray(profile.education)       ? profile.education       : []
    const work = Array.isArray(profile.workExperience)  ? profile.workExperience  : []
    const pol  = Array.isArray(profile.politicalHistory)? profile.politicalHistory: []
    const links = typeof profile.socialLinks === 'object' ? profile.socialLinks as Record<string,string> : {}
    reset({
      biography:        profile.biography        ?? '',
      constituency:     profile.constituency     ?? '',
      education:        edu,
      workExperience:   work,
      politicalHistory: pol,
      achievements:     (profile.achievements ?? []).map((v: string) => ({ value: v })),
      website:          profile.website          ?? '',
      twitter:          links.twitter            ?? '',
      linkedin:         links.linkedin           ?? '',
      instagram:        links.instagram          ?? '',
      youtube:          links.youtube            ?? '',
    })
  }, [profile, reset])

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch(`/api/candidates/${profile?.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.json()),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Profile saved ✓')
        qc.invalidateQueries({ queryKey: ['candidate-me'] })
      } else toast.error(res.error ?? 'Save failed')
    },
    onError: () => toast.error('Network error — please try again'),
  })

  const onSubmit = (data: FormData) => {
    updateMutation.mutate({
      biography:        data.biography,
      constituency:     data.constituency,
      education:        data.education,
      workExperience:   data.workExperience,
      politicalHistory: data.politicalHistory,
      achievements:     data.achievements.map(a => a.value),
      website:          data.website ?? '',
      socialLinks: {
        twitter:   data.twitter   ?? '',
        linkedin:  data.linkedin  ?? '',
        instagram: data.instagram ?? '',
        youtube:   data.youtube   ?? '',
      },
    })
  }

  const completeness = calcCompleteness(watch())
  const TABS = [
    { key: 'basic',      label: 'Basic & Bio' },
    { key: 'background', label: 'Background' },
    { key: 'online',     label: 'Online Presence' },
  ] as const

  if (isLoading) return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Edit Profile" />
      <main className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#00d4ff] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#475569] font-mono">Loading profile…</p>
        </div>
      </main>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="Edit Public Profile"
        subtitle="This information is publicly visible to all voters"
        actions={
          <Btn size="sm" loading={updateMutation.isPending} disabled={!isDirty}
            onClick={handleSubmit(onSubmit)}>
            💾 Save Profile
          </Btn>
        }
      />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Profile completeness banner */}
          <Card className="p-5">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <Avatar name={userName} size={16}
                  gradient={completeness >= 80 ? 'from-[#00ff88] to-[#00d4ff]' : 'from-[#00d4ff] to-[#7c3aed]'} />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0e0e24] rounded-full border border-[rgba(0,212,255,0.3)] flex items-center justify-center text-[10px] cursor-pointer hover:border-[#00d4ff] transition-all">
                  📷
                </div>
              </div>

              {/* Completeness */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-orb font-bold text-white text-lg">{userName}</p>
                    <p className="text-xs text-[#475569] font-mono">
                      {profile?.election?.title ?? 'Candidate Profile'}
                      {profile?.party && ` · ${profile.party.name}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-orb font-bold text-2xl"
                      style={{ color: completeness >= 80 ? '#00ff88' : completeness >= 50 ? '#f59e0b' : '#ff2d6a' }}>
                      {completeness}%
                    </p>
                    <p className="text-[10px] text-[#475569] uppercase tracking-wider">Complete</p>
                  </div>
                </div>
                <Progress value={completeness}
                  color={completeness >= 80 ? '#00ff88' : completeness >= 50 ? '#f59e0b' : '#ff2d6a'} />
                <p className="text-[10px] text-[#475569] mt-1.5">
                  {completeness < 50 ? '⚠️ Low completeness — voters may not trust incomplete profiles' :
                   completeness < 80 ? '📈 Good progress — add more details to stand out' :
                   '✅ Excellent profile — voters can make an informed decision'}
                </p>
              </div>
            </div>
          </Card>

          {/* Tab bar */}
          <div className="flex gap-1 bg-[#0a0a1a] border border-[rgba(0,212,255,0.15)] rounded-xl p-1 w-fit">
            {TABS.map(t => (
              <button key={t.key} type="button" onClick={() => setTab(t.key)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold font-orb tracking-wide transition-all ${
                  tab === t.key
                    ? 'bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white shadow-[0_0_16px_rgba(0,212,255,0.2)]'
                    : 'text-[#475569] hover:text-[#94a3b8]'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* ── Tab: Basic & Bio ── */}
            {tab === 'basic' && (
              <>
                <Card>
                  <CardHeader title="Personal Information" />
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Field label="Biography" error={errors.biography?.message}
                        hint="Minimum 50 characters. Tell voters who you are, your values, and why you're running.">
                        <textarea {...register('biography')} rows={6} className={textareaCls}
                          placeholder="Born in…  I have dedicated my career to… I am running because…" />
                        <div className="text-[10px] text-[#475569] mt-1 text-right font-mono">
                          {watch('biography')?.length ?? 0} chars
                        </div>
                      </Field>
                    </div>
                    <Field label="Constituency" error={errors.constituency?.message}>
                      <input {...register('constituency')} placeholder="e.g. New Delhi Central Constituency" className={inputCls} />
                    </Field>
                  </div>
                </Card>

                {/* Achievements */}
                <Card>
                  <div className="p-6">
                    <SectionHeading title="Key Achievements" count={achFields.length}
                      onAdd={() => addAch({ value: '' })} />
                    {achFields.length === 0 && (
                      <p className="text-sm text-[#475569] italic py-4 text-center">
                        No achievements added — click + Add to begin
                      </p>
                    )}
                    <div className="space-y-3">
                      {achFields.map((field, i) => (
                        <div key={field.id} className="flex gap-3 items-start">
                          <div className="w-6 h-6 rounded-full bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] flex items-center justify-center text-[10px] text-[#00d4ff] font-orb font-bold flex-shrink-0 mt-3">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <input {...register(`achievements.${i}.value`)}
                              placeholder="e.g. Digital India Award 2019, Best Legislator 3x…"
                              className={inputCls} />
                            {errors.achievements?.[i]?.value && (
                              <p className="text-[10px] text-[#ff2d6a] mt-1">{errors.achievements[i]?.value?.message}</p>
                            )}
                          </div>
                          <RemoveBtn onClick={() => rmAch(i)} />
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </>
            )}

            {/* ── Tab: Background ── */}
            {tab === 'background' && (
              <>
                {/* Education */}
                <Card>
                  <div className="p-6">
                    <SectionHeading title="Education & Qualifications" count={eduFields.length}
                      onAdd={() => addEdu({ institution: '', degree: '', field: '', year: '', grade: '' })} />
                    <div className="space-y-4">
                      {eduFields.map((field, i) => (
                        <div key={field.id} className="p-4 bg-[#0a0a1a] rounded-xl border border-[rgba(0,212,255,0.12)] space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-mono text-[#00d4ff]">ENTRY #{i + 1}</span>
                            <RemoveBtn onClick={() => rmEdu(i)} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Institution" error={errors.education?.[i]?.institution?.message}>
                              <input {...register(`education.${i}.institution`)} placeholder="MIT, IIT Delhi…" className={inputCls} />
                            </Field>
                            <Field label="Degree" error={errors.education?.[i]?.degree?.message}>
                              <input {...register(`education.${i}.degree`)} placeholder="B.Tech, MBA, PhD…" className={inputCls} />
                            </Field>
                            <Field label="Field of Study" error={errors.education?.[i]?.field?.message}>
                              <input {...register(`education.${i}.field`)} placeholder="Computer Science, Law…" className={inputCls} />
                            </Field>
                            <Field label="Year of Completion" error={errors.education?.[i]?.year?.message}>
                              <input {...register(`education.${i}.year`)} type="number" placeholder="2002" className={inputCls} />
                            </Field>
                          </div>
                        </div>
                      ))}
                      {eduFields.length === 0 && (
                        <p className="text-sm text-[#475569] italic py-4 text-center">No education entries — click + Add</p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Work Experience */}
                <Card>
                  <div className="p-6">
                    <SectionHeading title="Work Experience" count={workFields.length}
                      onAdd={() => addWork({ organization: '', position: '', startYear: '', endYear: '', description: '' })} />
                    <div className="space-y-4">
                      {workFields.map((field, i) => (
                        <div key={field.id} className="p-4 bg-[#0a0a1a] rounded-xl border border-[rgba(0,212,255,0.12)] space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-mono text-[#7c3aed]">ENTRY #{i + 1}</span>
                            <RemoveBtn onClick={() => rmWork(i)} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Organisation" error={errors.workExperience?.[i]?.organization?.message}>
                              <input {...register(`workExperience.${i}.organization`)} placeholder="Ministry of Tech…" className={inputCls} />
                            </Field>
                            <Field label="Position / Title" error={errors.workExperience?.[i]?.position?.message}>
                              <input {...register(`workExperience.${i}.position`)} placeholder="Minister, Director…" className={inputCls} />
                            </Field>
                            <Field label="Start Year" error={errors.workExperience?.[i]?.startYear?.message}>
                              <input {...register(`workExperience.${i}.startYear`)} type="number" placeholder="2010" className={inputCls} />
                            </Field>
                            <Field label="End Year (blank = current)">
                              <input {...register(`workExperience.${i}.endYear`)} type="number" placeholder="2024" className={inputCls} />
                            </Field>
                            <div className="col-span-2">
                              <Field label="Brief Description">
                                <textarea {...register(`workExperience.${i}.description`)} rows={2}
                                  placeholder="Key responsibilities and impact…" className={textareaCls} />
                              </Field>
                            </div>
                          </div>
                        </div>
                      ))}
                      {workFields.length === 0 && (
                        <p className="text-sm text-[#475569] italic py-4 text-center">No work experience — click + Add</p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Political History */}
                <Card>
                  <div className="p-6">
                    <SectionHeading title="Political History" count={polFields.length}
                      onAdd={() => addPol({ position: '', organization: '', year: '', description: '' })} />
                    <div className="space-y-4">
                      {polFields.map((field, i) => (
                        <div key={field.id} className="p-4 bg-[#0a0a1a] rounded-xl border border-[rgba(0,212,255,0.12)] space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-mono text-[#f59e0b]">ENTRY #{i + 1}</span>
                            <RemoveBtn onClick={() => rmPol(i)} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Position" error={errors.politicalHistory?.[i]?.position?.message}>
                              <input {...register(`politicalHistory.${i}.position`)} placeholder="Senator, Mayor…" className={inputCls} />
                            </Field>
                            <Field label="Organisation / Party" error={errors.politicalHistory?.[i]?.organization?.message}>
                              <input {...register(`politicalHistory.${i}.organization`)} placeholder="National Progress Party…" className={inputCls} />
                            </Field>
                            <Field label="Year" error={errors.politicalHistory?.[i]?.year?.message}>
                              <input {...register(`politicalHistory.${i}.year`)} type="number" placeholder="2018" className={inputCls} />
                            </Field>
                            <Field label="Description">
                              <input {...register(`politicalHistory.${i}.description`)} placeholder="Brief context…" className={inputCls} />
                            </Field>
                          </div>
                        </div>
                      ))}
                      {polFields.length === 0 && (
                        <p className="text-sm text-[#475569] italic py-4 text-center">No political history — click + Add</p>
                      )}
                    </div>
                  </div>
                </Card>
              </>
            )}

            {/* ── Tab: Online Presence ── */}
            {tab === 'online' && (
              <Card>
                <CardHeader title="Online Presence & Social Links"
                  subtitle="Voters will see these on your public profile page" />
                <div className="p-6 space-y-4">
                  <Field label="Personal / Campaign Website" error={errors.website?.message}
                    hint="Include https:// e.g. https://ariachenforpresident.com">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🌐</span>
                      <input {...register('website')} placeholder="https://your-campaign-site.com"
                        className={`${inputCls} pl-9`} />
                    </div>
                  </Field>

                  {[
                    { name: 'twitter',   icon: '🐦', label: 'X / Twitter Handle',       placeholder: '@aria_chen_np' },
                    { name: 'linkedin',  icon: '💼', label: 'LinkedIn Profile URL',      placeholder: 'https://linkedin.com/in/aria-chen' },
                    { name: 'instagram', icon: '📸', label: 'Instagram Handle',          placeholder: '@aria.chen.official' },
                    { name: 'youtube',   icon: '▶️', label: 'YouTube Channel URL',       placeholder: 'https://youtube.com/@ariachenofficial' },
                  ].map(({ name, icon, label, placeholder }) => (
                    <Field key={name} label={label}>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">{icon}</span>
                        <input {...register(name as keyof FormData)} placeholder={placeholder}
                          className={`${inputCls} pl-9`} />
                      </div>
                    </Field>
                  ))}
                </div>
              </Card>
            )}

            {/* Save bar — sticky at bottom */}
            <div className="sticky bottom-0 bg-[rgba(10,10,26,0.95)] backdrop-blur border-t border-[rgba(0,212,255,0.15)] -mx-6 px-6 py-4 flex items-center justify-between">
              <p className="text-xs text-[#475569] font-mono">
                {isDirty ? '⚠️ You have unsaved changes' : '✓ All changes saved'}
              </p>
              <div className="flex gap-3">
                <Btn variant="outline" type="button" size="sm" onClick={() => reset()}>Discard</Btn>
                <Btn type="submit" size="sm" loading={updateMutation.isPending} disabled={!isDirty}>
                  💾 Save Changes
                </Btn>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}