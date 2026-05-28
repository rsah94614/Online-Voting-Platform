'use client'
// app/(dashboard)/candidate/assets/page.tsx

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { Card, CardHeader, Field, Btn, inputCls, selectCls, textareaCls } from '@/components/dashboard/ui'

// ── Schemas ───────────────────────────────────────────────────────────────────
const assetSchema = z.object({
  type:        z.string().min(1, 'Select type'),
  description: z.string().min(5, 'Required'),
  value:       z.coerce.number().min(0, 'Must be ≥ 0'),
  currency:    z.string().default('INR'),
  year:        z.string().optional(),
})

const fundingSchema = z.object({
  source:   z.string().min(2, 'Required'),
  amount:   z.coerce.number().min(0, 'Must be ≥ 0'),
  currency: z.string().default('INR'),
  date:     z.string().min(1, 'Required'),
  purpose:  z.string().optional(),
})

const formSchema = z.object({
  assets:   z.array(assetSchema),
  funding:  z.array(fundingSchema),
})
type FormData = z.infer<typeof formSchema>

const ASSET_TYPES = [
  'Residential Property', 'Commercial Property', 'Agricultural Land',
  'Motor Vehicle', 'Investments & Stocks', 'Fixed Deposits',
  'Jewellery & Valuables', 'Business Assets', 'Other Assets',
]
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD']

const apiFetch = (u: string) => fetch(u, { credentials: 'include' }).then(r => r.json())

export default function CandidateAssetsPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'assets' | 'funding'>('assets')

  const { data: meData, isLoading } = useQuery({
    queryKey: ['candidate-me'],
    queryFn: () => apiFetch('/api/auth/me'),
  })
  const profile = meData?.data?.candidateProfile

  const { register, handleSubmit, control, reset, watch, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { assets: [], funding: [] },
  })

  const { fields: assetFields, append: addAsset, remove: rmAsset } = useFieldArray({ control, name: 'assets' })
  const { fields: fundingFields, append: addFunding, remove: rmFunding } = useFieldArray({ control, name: 'funding' })

  useEffect(() => {
    if (!profile) return
    const assets  = Array.isArray(profile.assetDeclarations)  ? profile.assetDeclarations  : []
    const funding = Array.isArray(profile.fundingDeclarations) ? profile.fundingDeclarations : []
    reset({ assets, funding })
  }, [profile, reset])

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch(`/api/candidates/${profile?.id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.json()),
    onSuccess: (res) => {
      if (res.success) { toast.success('Declarations saved ✓'); qc.invalidateQueries({ queryKey: ['candidate-me'] }) }
      else toast.error(res.error)
    },
  })

  const onSubmit = (data: FormData) => {
    const totalDeclaredAssets = data.assets.reduce((sum, a) => {
      if (a.currency === 'INR') return sum + a.value
      return sum + a.value * 85 // rough USD→INR conversion for display
    }, 0)
    saveMutation.mutate({
      assetDeclarations:   data.assets,
      fundingDeclarations: data.funding,
      totalDeclaredAssets,
    })
  }

  // Computed totals
  const allAssets  = watch('assets')  ?? []
  const allFunding = watch('funding') ?? []
  const totalAssetValueINR = allAssets.reduce((sum, a) => {
    const fx = a.currency === 'USD' ? 85 : a.currency === 'EUR' ? 92 : a.currency === 'GBP' ? 107 : 1
    return sum + (Number(a.value) || 0) * fx
  }, 0)
  const totalFundingINR = allFunding.reduce((sum, f) => {
    const fx = f.currency === 'USD' ? 85 : f.currency === 'EUR' ? 92 : f.currency === 'GBP' ? 107 : 1
    return sum + (Number(f.amount) || 0) * fx
  }, 0)

  const formatINR = (v: number) => `₹${(v / 100000).toFixed(2)} L`

  const TABS = [
    { key: 'assets',  label: `Assets (${assetFields.length})` },
    { key: 'funding', label: `Campaign Funding (${fundingFields.length})` },
  ] as const

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="Asset & Funding Declarations"
        subtitle="Required by the Election Commission — publicly visible to voters"
        actions={
          <Btn size="sm" loading={saveMutation.isPending} disabled={!isDirty}
            onClick={handleSubmit(onSubmit)}>
            💾 Save Declarations
          </Btn>
        }
      />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Compliance notice */}
          <div className="bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.2)] rounded-xl px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">⚖️</span>
              <div>
                <p className="text-sm font-semibold text-[#f59e0b] font-orb">Legal Compliance Requirement</p>
                <p className="text-xs text-[#94a3b8] mt-0.5 leading-relaxed">
                  Under the Election Commission Act, all candidates must declare assets worth ₹1 lakh or more and
                  any campaign funding received. False declarations may result in disqualification. All information
                  is publicly accessible to voters.
                </p>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Declared Assets', value: formatINR(totalAssetValueINR), icon: '🏦', color: '#00d4ff' },
              { label: 'Campaign Funding',       value: formatINR(totalFundingINR),   icon: '💰', color: '#00ff88' },
              { label: 'Declaration Status',
                value: (assetFields.length > 0 && fundingFields.length > 0) ? 'Complete' : 'Incomplete',
                icon: (assetFields.length > 0 && fundingFields.length > 0) ? '✅' : '⚠️',
                color: (assetFields.length > 0 && fundingFields.length > 0) ? '#00ff88' : '#f59e0b' },
            ].map((s) => (
              <div key={s.label} className="bg-[#0e0e24] border border-[rgba(0,212,255,0.15)] rounded-xl p-5">
                <div className="text-xl mb-2">{s.icon}</div>
                <div className="font-orb font-bold text-xl" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px] text-[#475569] uppercase tracking-wider mt-1">{s.label}</div>
              </div>
            ))}
          </div>

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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* ── Assets tab ── */}
            {tab === 'assets' && (
              <Card>
                <CardHeader title="Asset Declarations"
                  subtitle="All assets valued at ₹1 lakh or above must be declared"
                  action={
                    <Btn type="button" size="sm" onClick={() => addAsset({ type: '', description: '', value: 0, currency: 'INR', year: '' })}>
                      + Add Asset
                    </Btn>
                  }
                />
                <div className="p-6 space-y-4">
                  {assetFields.length === 0 && (
                    <div className="text-center py-10">
                      <div className="text-4xl mb-3 opacity-40">🏦</div>
                      <p className="text-sm text-[#475569] font-orb font-bold">No assets declared yet</p>
                      <p className="text-xs text-[#475569] mt-1">Click "+ Add Asset" to start your declaration</p>
                    </div>
                  )}
                  {assetFields.map((field, i) => (
                    <div key={field.id} className="p-5 bg-[#0a0a1a] rounded-xl border border-[rgba(0,212,255,0.12)]">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-mono font-bold text-[#00d4ff]">ASSET #{i + 1}</span>
                        <button type="button" onClick={() => rmAsset(i)}
                          className="text-xs px-2 py-1 rounded border border-[rgba(255,45,106,0.2)] text-[#ff2d6a] hover:border-[#ff2d6a] transition-all">
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <Field label="Asset Type" error={errors.assets?.[i]?.type?.message}>
                          <select {...register(`assets.${i}.type`)} className={selectCls}>
                            <option value="">Select type</option>
                            {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </Field>
                        <Field label="Year Acquired">
                          <input {...register(`assets.${i}.year`)} type="number" placeholder="2018" className={inputCls} />
                        </Field>
                        <Field label="Currency">
                          <select {...register(`assets.${i}.currency`)} className={selectCls}>
                            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </Field>
                        <Field label="Declared Value" error={errors.assets?.[i]?.value?.message}>
                          <input {...register(`assets.${i}.value`)} type="number" min={0} step={1000} placeholder="0" className={inputCls} />
                        </Field>
                        <div className="sm:col-span-2">
                          <Field label="Description" error={errors.assets?.[i]?.description?.message}>
                            <input {...register(`assets.${i}.description`)}
                              placeholder="e.g. 3BHK Apartment in South Delhi, Survey No. 42…" className={inputCls} />
                          </Field>
                        </div>
                      </div>
                      {/* Value display */}
                      {watch(`assets.${i}.value`) > 0 && (
                        <div className="mt-3 text-xs text-[#00d4ff] font-mono bg-[rgba(0,212,255,0.06)] rounded-lg px-3 py-2">
                          Declared value: {watch(`assets.${i}.currency`)} {Number(watch(`assets.${i}.value`)).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}

                  {assetFields.length > 0 && (
                    <div className="flex justify-between items-center p-4 bg-[rgba(0,212,255,0.04)] border border-[rgba(0,212,255,0.15)] rounded-xl">
                      <span className="text-sm font-semibold text-white">Total Declared Value (INR equivalent)</span>
                      <span className="font-orb font-bold text-xl text-[#00d4ff]">{formatINR(totalAssetValueINR)}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* ── Funding tab ── */}
            {tab === 'funding' && (
              <Card>
                <CardHeader title="Campaign Funding Declarations"
                  subtitle="All campaign contributions must be disclosed to the Election Commission"
                  action={
                    <Btn type="button" size="sm" onClick={() => addFunding({ source: '', amount: 0, currency: 'INR', date: '', purpose: '' })}>
                      + Add Funding
                    </Btn>
                  }
                />
                <div className="p-6 space-y-4">
                  {fundingFields.length === 0 && (
                    <div className="text-center py-10">
                      <div className="text-4xl mb-3 opacity-40">💰</div>
                      <p className="text-sm text-[#475569] font-orb font-bold">No campaign funding declared</p>
                      <p className="text-xs text-[#475569] mt-1">Declare all donations and self-funding above ₹10,000</p>
                    </div>
                  )}
                  {fundingFields.map((field, i) => (
                    <div key={field.id} className="p-5 bg-[#0a0a1a] rounded-xl border border-[rgba(0,212,255,0.12)]">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-mono font-bold text-[#7c3aed]">FUNDING #{i + 1}</span>
                        <button type="button" onClick={() => rmFunding(i)}
                          className="text-xs px-2 py-1 rounded border border-[rgba(255,45,106,0.2)] text-[#ff2d6a] hover:border-[#ff2d6a] transition-all">
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <Field label="Source / Donor" error={errors.funding?.[i]?.source?.message}>
                            <input {...register(`funding.${i}.source`)}
                              placeholder="Self, Party Fund, Individual Donor Name…" className={inputCls} />
                          </Field>
                        </div>
                        <Field label="Date Received" error={errors.funding?.[i]?.date?.message}>
                          <input {...register(`funding.${i}.date`)} type="date" className={inputCls} />
                        </Field>
                        <Field label="Amount" error={errors.funding?.[i]?.amount?.message}>
                          <input {...register(`funding.${i}.amount`)} type="number" min={0} step={1000} placeholder="0" className={inputCls} />
                        </Field>
                        <Field label="Currency">
                          <select {...register(`funding.${i}.currency`)} className={selectCls}>
                            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </Field>
                        <Field label="Purpose">
                          <input {...register(`funding.${i}.purpose`)} placeholder="Campaign events, advertising…" className={inputCls} />
                        </Field>
                      </div>
                    </div>
                  ))}

                  {fundingFields.length > 0 && (
                    <div className="flex justify-between items-center p-4 bg-[rgba(124,58,237,0.04)] border border-[rgba(124,58,237,0.15)] rounded-xl">
                      <span className="text-sm font-semibold text-white">Total Campaign Funding (INR equivalent)</span>
                      <span className="font-orb font-bold text-xl text-[#7c3aed]">{formatINR(totalFundingINR)}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Save bar */}
            <div className="sticky bottom-0 bg-[rgba(10,10,26,0.95)] backdrop-blur border-t border-[rgba(0,212,255,0.15)] -mx-6 px-6 py-4 flex items-center justify-between">
              <p className="text-xs text-[#475569] font-mono">
                {isDirty ? '⚠️ Unsaved changes' : '✓ Declarations up to date'}
              </p>
              <div className="flex gap-3">
                <Btn variant="outline" type="button" size="sm" onClick={() => reset()}>Discard</Btn>
                <Btn type="submit" size="sm" loading={saveMutation.isPending} disabled={!isDirty}>
                  💾 Submit Declarations
                </Btn>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}