'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/lib/api'
import type { UserRole } from '@/types'

// ─── Step schemas ──────────────────────────────────────────────────────────────

const step0Schema = z.object({
  role: z.enum(['voter', 'candidate', 'party_admin', 'admin'] as const),
})

const step1Schema = z.object({
  firstName: z.string().min(2, 'Required'),
  lastName: z.string().min(2, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Enter valid phone'),
  dateOfBirth: z.string().min(1, 'Required'),
  nationality: z.string().min(2, 'Required'),
})

const step2Schema = z.object({
  password: z.string()
    .min(8, 'At least 8 chars')
    .regex(/[A-Z]/, 'Needs uppercase')
    .regex(/[0-9]/, 'Needs number')
    .regex(/[^A-Za-z0-9]/, 'Needs special char'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
})

const step3Schema = z.object({
  nationalId: z.string().min(5, 'Required'),
  idType: z.enum(['passport', 'national_id', 'drivers_license', 'voter_card']),
  otp: z.string().length(6, 'Enter 6-digit OTP'),
  acceptTerms: z.boolean().refine((v) => v, 'You must accept the terms'),
})

// Voter-specific
const voterExtraSchema = z.object({
  address: z.string().min(5, 'Required'),
  constituency: z.string().min(2, 'Required'),
  voterIdNumber: z.string().optional(),
})

// Candidate-specific
const candidateExtraSchema = z.object({
  party: z.string().min(1, 'Select a party or Independent'),
  electionId: z.string().min(1, 'Select an election'),
  constituency: z.string().min(1, 'Required'),
  biography: z.string().min(100, 'Minimum 100 characters'),
  education: z.string().min(10, 'Required'),
  manifesto: z.string().min(50, 'Minimum 50 characters'),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
})

// Party admin
const partyExtraSchema = z.object({
  partyName: z.string().min(2, 'Required'),
  partyAbbreviation: z.string().min(2, 'Required').max(6),
  partyColor: z.string().min(4, 'Required'),
  partyDescription: z.string().min(50, 'Minimum 50 characters'),
  partyWebsite: z.string().url().optional().or(z.literal('')),
  foundedYear: z.string().min(4, 'Required'),
  authorizedDocuments: z.string().optional(),
})

// ─── Types ─────────────────────────────────────────────────────────────────────

type Role = z.infer<typeof step0Schema>['role']

interface FormState {
  role: Role
  personal: z.infer<typeof step1Schema>
  security: z.infer<typeof step2Schema>
  verification: z.infer<typeof step3Schema>
  voterExtra: z.infer<typeof voterExtraSchema>
  candidateExtra: z.infer<typeof candidateExtraSchema>
  partyExtra: z.infer<typeof partyExtraSchema>
}

const ROLE_LABELS: Record<Role, { label: string; icon: string; desc: string; color: string }> = {
  voter:       { label: 'Voter',       icon: '🗳️', desc: 'Cast your vote in elections you\'re eligible for',            color: 'from-[#00d4ff] to-[#7c3aed]' },
  candidate:   { label: 'Candidate',   icon: '🏛️', desc: 'Register as a candidate and showcase your profile',          color: 'from-[#7c3aed] to-[#ff2d6a]' },
  party_admin: { label: 'Party Admin', icon: '🎯', desc: 'Manage your political party and its candidates',            color: 'from-[#ff2d6a] to-[#f59e0b]' },
  admin:       { label: 'Admin',       icon: '⚡', desc: 'Create and manage elections (requires authorization code)', color: 'from-[#f59e0b] to-[#00d4ff]' },
}

// ─── Step titles ───────────────────────────────────────────────────────────────

function getSteps(role: Role | null) {
  const base = ['Role', 'Personal Info', 'Security', 'Verification']
  if (role === 'voter') return [...base, 'Voter Details']
  if (role === 'candidate') return [...base, 'Candidate Profile']
  if (role === 'party_admin') return [...base, 'Party Details']
  return base
}

// ─── Input helper ──────────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">{label}</label>
      {children}
      {error && <p className="text-xs text-[#ff2d6a] mt-1.5">{error}</p>}
    </div>
  )
}

const inputCls = `w-full bg-[#0a0a1a] border border-[rgba(0,212,255,0.18)] rounded-lg px-4 py-3
  text-sm text-white placeholder-[#475569] focus:outline-none
  focus:border-[#00d4ff] focus:shadow-[0_0_20px_rgba(0,212,255,0.1)] transition-all`

const selectCls = `${inputCls} cursor-pointer`
const textareaCls = `${inputCls} resize-none`

// ─── Main Component ────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const [step, setStep] = useState(0)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [otpSent, setOtpSent] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const steps = getSteps(selectedRole)
  const totalSteps = steps.length

  // ── Forms per step ──
  const step1Form = useForm<z.infer<typeof step1Schema>>({ resolver: zodResolver(step1Schema) })
  const step2Form = useForm<z.infer<typeof step2Schema>>({ resolver: zodResolver(step2Schema) })
  const step3Form = useForm<z.infer<typeof step3Schema>>({ resolver: zodResolver(step3Schema) })
  const voterForm = useForm<z.infer<typeof voterExtraSchema>>({ resolver: zodResolver(voterExtraSchema) })
  const candidateForm = useForm<z.infer<typeof candidateExtraSchema>>({ resolver: zodResolver(candidateExtraSchema) })
  const partyForm = useForm<z.infer<typeof partyExtraSchema>>({ resolver: zodResolver(partyExtraSchema) })

  // ── Collected data ──
  const [formData, setFormData] = useState<Partial<FormState>>({})

  const registerMutation = useMutation({
    mutationFn: (data: { name: string; email: string; password: string; role?: string; phone?: string }) =>
      authApi.register(data),
    onSuccess: (response) => {
      setUser(response.user)
      if (response.requiresApproval) {
        toast.success('Account created! Awaiting admin approval before you can log in.')
        router.push('/login')
      } else {
        toast.success('Account created successfully!')
        const redirects: Record<string, string> = {
          ADMIN: '/admin', CANDIDATE: '/candidate', PARTY_ADMIN: '/party', VOTER: '/voter',
        }
        router.push(redirects[response.user.role] || '/')
      }
    },
    onError: (err: Error) => toast.error(err.message || 'Registration failed'),
  })

  const next = () => setStep((s) => Math.min(s + 1, totalSteps - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const handleStep1 = step1Form.handleSubmit((data) => {
    setFormData((f) => ({ ...f, personal: data }))
    next()
  })

  const handleStep2 = step2Form.handleSubmit((data) => {
    setFormData((f) => ({ ...f, security: data }))
    next()
  })

  const handleStep3 = step3Form.handleSubmit((data) => {
    setFormData((f) => ({ ...f, verification: data }))
    if (totalSteps > 4) { next() } else { submitRegistration({ ...formData, verification: data }) }
  })

  const handleVoterExtra = voterForm.handleSubmit((data) => {
    submitRegistration({ ...formData, voterExtra: data })
  })

  const handleCandidateExtra = candidateForm.handleSubmit((data) => {
    submitRegistration({ ...formData, candidateExtra: data })
  })

  const handlePartyExtra = partyForm.handleSubmit((data) => {
    submitRegistration({ ...formData, partyExtra: data })
  })

  const submitRegistration = (data: Partial<FormState>) => {
    // Flatten multi-step form state into the API payload
    const payload = {
      name:  `${data.personal?.firstName ?? ''} ${data.personal?.lastName ?? ''}`.trim(),
      email: data.personal?.email ?? '',
      password: data.security?.password ?? '',
      phone: data.personal?.phone,
      role: selectedRole?.toUpperCase().replace('-', '_') ?? 'VOTER',
    }
    registerMutation.mutate(payload)
  }

  const sendOtp = () => {
    const email = step1Form.getValues('email')
    if (!email) { toast.error('Enter your email in step 2 first'); return }
    setOtpSent(true)
    toast.success(`OTP sent to ${email}`)
  }

  // ── Progress bar ──
  const progress = ((step + 1) / totalSteps) * 100

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px]
        bg-radial-[ellipse] from-[rgba(124,58,237,0.05)] via-[rgba(0,212,255,0.03)] to-transparent
        pointer-events-none rounded-full" />

      <div className="w-full max-w-2xl relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 no-underline">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00d4ff] to-[#7c3aed] rounded-xl
              flex items-center justify-center shadow-[0_0_24px_rgba(0,212,255,0.4)]">
              <span className="font-orb font-black text-base text-white">VX</span>
            </div>
            <span className="font-orb font-bold text-2xl bg-gradient-to-r from-[#00d4ff] to-[#7c3aed]
              bg-clip-text text-transparent tracking-widest">VOTEX</span>
          </Link>
          <h1 className="font-orb text-2xl font-bold text-white mt-4 mb-2">Create Your Account</h1>
          <p className="text-sm text-[#94a3b8]">Join the most trusted election platform</p>
        </div>

        {/* Step indicator */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-[#475569] font-mono mb-2">
            <span>Step {step + 1} of {totalSteps}: {steps[step]}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-1 bg-[#0a0a1a] rounded-full overflow-hidden border border-[rgba(0,212,255,0.1)]">
            <div
              className="h-full bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((s, i) => (
              <div key={s} className={`flex flex-col items-center gap-1 ${i <= step ? 'opacity-100' : 'opacity-30'}`}>
                <div className={`w-2 h-2 rounded-full transition-all ${
                  i < step ? 'bg-[#00ff88]' : i === step ? 'bg-[#00d4ff] shadow-[0_0_8px_#00d4ff]' : 'bg-[#475569]'
                }`} />
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-[rgba(0,212,255,0.03)] border border-[rgba(0,212,255,0.18)] rounded-2xl p-8
          backdrop-blur-md shadow-[0_0_60px_rgba(0,0,0,0.5)]">

          {/* ── STEP 0: Role ── */}
          {step === 0 && (
            <div>
              <h2 className="font-orb text-lg font-bold text-white mb-2">Choose Your Role</h2>
              <p className="text-sm text-[#94a3b8] mb-6">Select how you&apos;ll use VOTEX</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(Object.entries(ROLE_LABELS) as [Role, typeof ROLE_LABELS[Role]][]).map(([role, info]) => (
                  <button
                    key={role}
                    onClick={() => { setSelectedRole(role); setFormData((f) => ({ ...f, role })) }}
                    className={`p-5 rounded-xl border text-left transition-all ${
                      selectedRole === role
                        ? 'border-[#00d4ff] bg-[rgba(0,212,255,0.08)] shadow-[0_0_20px_rgba(0,212,255,0.15)]'
                        : 'border-[rgba(0,212,255,0.18)] hover:border-[rgba(0,212,255,0.35)]'
                    }`}
                  >
                    <div className="text-3xl mb-3">{info.icon}</div>
                    <div className="font-orb font-bold text-white text-sm mb-1">{info.label}</div>
                    <div className="text-xs text-[#94a3b8] leading-relaxed">{info.desc}</div>
                    {selectedRole === role && (
                      <div className="mt-3 text-xs text-[#00d4ff] font-mono">✓ Selected</div>
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { if (selectedRole) next(); else toast.error('Please select a role') }}
                className="w-full mt-6 py-3.5 rounded-lg font-orb font-bold text-sm tracking-widest uppercase
                  bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white
                  hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all"
              >
                Continue →
              </button>
            </div>
          )}

          {/* ── STEP 1: Personal Info ── */}
          {step === 1 && (
            <form onSubmit={handleStep1}>
              <h2 className="font-orb text-lg font-bold text-white mb-2">Personal Information</h2>
              <p className="text-sm text-[#94a3b8] mb-6">Basic details for your account</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name" error={step1Form.formState.errors.firstName?.message}>
                  <input {...step1Form.register('firstName')} placeholder="John" className={inputCls} />
                </Field>
                <Field label="Last Name" error={step1Form.formState.errors.lastName?.message}>
                  <input {...step1Form.register('lastName')} placeholder="Doe" className={inputCls} />
                </Field>
                <div className="col-span-2">
                  <Field label="Email Address" error={step1Form.formState.errors.email?.message}>
                    <input {...step1Form.register('email')} type="email" placeholder="you@example.com" className={inputCls} />
                  </Field>
                </div>
                <Field label="Phone Number" error={step1Form.formState.errors.phone?.message}>
                  <input {...step1Form.register('phone')} type="tel" placeholder="+91 98765 43210" className={inputCls} />
                </Field>
                <Field label="Date of Birth" error={step1Form.formState.errors.dateOfBirth?.message}>
                  <input {...step1Form.register('dateOfBirth')} type="date" className={inputCls} />
                </Field>
                <div className="col-span-2">
                  <Field label="Nationality" error={step1Form.formState.errors.nationality?.message}>
                    <select {...step1Form.register('nationality')} className={selectCls}>
                      <option value="">Select nationality</option>
                      {['Indian', 'American', 'British', 'Canadian', 'Australian', 'Other'].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={back} className="flex-1 py-3 rounded-lg border border-[rgba(0,212,255,0.18)] text-[#94a3b8] text-sm font-bold font-orb tracking-wider hover:border-[#00d4ff] hover:text-[#00d4ff] transition-all">
                  ← Back
                </button>
                <button type="submit" className="flex-2 flex-grow-[2] py-3 rounded-lg bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white text-sm font-bold font-orb tracking-widest uppercase hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all">
                  Continue →
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 2: Security ── */}
          {step === 2 && (
            <form onSubmit={handleStep2}>
              <h2 className="font-orb text-lg font-bold text-white mb-2">Secure Your Account</h2>
              <p className="text-sm text-[#94a3b8] mb-6">Create a strong password</p>
              <div className="space-y-4">
                <Field label="Password" error={step2Form.formState.errors.password?.message}>
                  <div className="relative">
                    <input {...step2Form.register('password')} type={showPass ? 'text' : 'password'}
                      placeholder="••••••••" className={`${inputCls} pr-12`} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#475569] hover:text-[#00d4ff]">
                      {showPass ? 'HIDE' : 'SHOW'}
                    </button>
                  </div>
                </Field>
                <Field label="Confirm Password" error={step2Form.formState.errors.confirmPassword?.message}>
                  <input {...step2Form.register('confirmPassword')} type="password"
                    placeholder="••••••••" className={inputCls} />
                </Field>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {[
                    { label: 'Min. 8 characters', check: (step2Form.watch('password') || '').length >= 8 },
                    { label: 'Uppercase letter',  check: /[A-Z]/.test(step2Form.watch('password') || '') },
                    { label: 'Number digit',      check: /[0-9]/.test(step2Form.watch('password') || '') },
                    { label: 'Special character', check: /[^A-Za-z0-9]/.test(step2Form.watch('password') || '') },
                  ].map(({ label, check }) => (
                    <div key={label} className={`flex items-center gap-2 ${check ? 'text-[#00ff88]' : 'text-[#475569]'}`}>
                      <span>{check ? '✓' : '○'}</span>{label}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={back} className="flex-1 py-3 rounded-lg border border-[rgba(0,212,255,0.18)] text-[#94a3b8] text-sm font-bold font-orb tracking-wider hover:border-[#00d4ff] hover:text-[#00d4ff] transition-all">← Back</button>
                <button type="submit" className="flex-[2] py-3 rounded-lg bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white text-sm font-bold font-orb tracking-widest uppercase hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all">Continue →</button>
              </div>
            </form>
          )}

          {/* ── STEP 3: Verification ── */}
          {step === 3 && (
            <form onSubmit={handleStep3}>
              <h2 className="font-orb text-lg font-bold text-white mb-2">Identity Verification</h2>
              <p className="text-sm text-[#94a3b8] mb-6">Verify your identity to ensure election integrity</p>
              <div className="space-y-4">
                <Field label="ID Type" error={step3Form.formState.errors.idType?.message}>
                  <select {...step3Form.register('idType')} className={selectCls}>
                    <option value="">Select ID type</option>
                    <option value="national_id">National ID Card</option>
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver&apos;s License</option>
                    <option value="voter_card">Voter ID Card</option>
                  </select>
                </Field>
                <Field label="ID Number" error={step3Form.formState.errors.nationalId?.message}>
                  <input {...step3Form.register('nationalId')} placeholder="Enter your ID number" className={inputCls} />
                </Field>
                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">Email OTP Verification</label>
                  <div className="flex gap-3">
                    <input {...step3Form.register('otp')} placeholder="6-digit OTP" maxLength={6}
                      className={`${inputCls} flex-1 text-center tracking-[0.5em] text-lg font-mono`} />
                    <button type="button" onClick={sendOtp}
                      className={`px-4 py-3 rounded-lg text-sm font-bold font-orb tracking-wider transition-all flex-shrink-0 ${
                        otpSent
                          ? 'bg-[rgba(0,255,136,0.1)] border border-[rgba(0,255,136,0.2)] text-[#00ff88]'
                          : 'bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white hover:shadow-[0_0_20px_rgba(0,212,255,0.3)]'
                      }`}>
                      {otpSent ? 'Resend' : 'Send OTP'}
                    </button>
                  </div>
                  {step3Form.formState.errors.otp && (
                    <p className="text-xs text-[#ff2d6a] mt-1.5">{step3Form.formState.errors.otp.message}</p>
                  )}
                </div>
                {selectedRole === 'admin' && (
                  <Field label="Admin Authorization Code" error={undefined}>
                    <input placeholder="Enter authorization code from VOTEX team" className={inputCls} />
                  </Field>
                )}
                <label className="flex items-start gap-3 cursor-pointer mt-2">
                  <input {...step3Form.register('acceptTerms')} type="checkbox" className="w-4 h-4 accent-[#00d4ff] mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-[#94a3b8] leading-relaxed">
                    I agree to VOTEX&apos;s{' '}
                    <Link href="/terms" className="text-[#00d4ff] hover:underline">Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-[#00d4ff] hover:underline">Privacy Policy</Link>.
                    I confirm that the information provided is accurate and I consent to identity verification.
                  </span>
                </label>
                {step3Form.formState.errors.acceptTerms && (
                  <p className="text-xs text-[#ff2d6a]">{step3Form.formState.errors.acceptTerms.message}</p>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={back} className="flex-1 py-3 rounded-lg border border-[rgba(0,212,255,0.18)] text-[#94a3b8] text-sm font-bold font-orb tracking-wider hover:border-[#00d4ff] hover:text-[#00d4ff] transition-all">← Back</button>
                <button type="submit" className="flex-[2] py-3 rounded-lg bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white text-sm font-bold font-orb tracking-widest uppercase hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all">
                  {totalSteps > 4 ? 'Continue →' : 'Create Account →'}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 4: Voter Extra ── */}
          {step === 4 && selectedRole === 'voter' && (
            <form onSubmit={handleVoterExtra}>
              <h2 className="font-orb text-lg font-bold text-white mb-2">Voter Registration Details</h2>
              <p className="text-sm text-[#94a3b8] mb-6">Provide your voting jurisdiction information</p>
              <div className="space-y-4">
                <Field label="Home Address" error={voterForm.formState.errors.address?.message}>
                  <textarea {...voterForm.register('address')} rows={3} placeholder="Full residential address" className={textareaCls} />
                </Field>
                <Field label="Constituency / District" error={voterForm.formState.errors.constituency?.message}>
                  <input {...voterForm.register('constituency')} placeholder="e.g. North District Ward 7" className={inputCls} />
                </Field>
                <Field label="Existing Voter ID (if any)" error={voterForm.formState.errors.voterIdNumber?.message}>
                  <input {...voterForm.register('voterIdNumber')} placeholder="Optional" className={inputCls} />
                </Field>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={back} className="flex-1 py-3 rounded-lg border border-[rgba(0,212,255,0.18)] text-[#94a3b8] text-sm font-bold font-orb tracking-wider hover:border-[#00d4ff] hover:text-[#00d4ff] transition-all">← Back</button>
                <button type="submit" disabled={registerMutation.isPending} className="flex-[2] py-3 rounded-lg bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white text-sm font-bold font-orb tracking-widest uppercase hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all disabled:opacity-60">
                  {registerMutation.isPending ? 'Creating Account...' : '🚀 Create Account'}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 4: Candidate Extra ── */}
          {step === 4 && selectedRole === 'candidate' && (
            <form onSubmit={handleCandidateExtra}>
              <h2 className="font-orb text-lg font-bold text-white mb-2">Candidate Profile</h2>
              <p className="text-sm text-[#94a3b8] mb-6">This information will be publicly visible to all voters</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Election" error={candidateForm.formState.errors.electionId?.message}>
                    <select {...candidateForm.register('electionId')} className={selectCls}>
                      <option value="">Select election</option>
                      <option value="presidential-2024">Presidential Election 2024</option>
                      <option value="senate-dist7">Senate District 7</option>
                      <option value="city-council">City Council 2024</option>
                    </select>
                  </Field>
                  <Field label="Party Affiliation" error={candidateForm.formState.errors.party?.message}>
                    <select {...candidateForm.register('party')} className={selectCls}>
                      <option value="">Select party</option>
                      <option value="national-progress">National Progress</option>
                      <option value="liberty-alliance">Liberty Alliance</option>
                      <option value="united-front">United Front</option>
                      <option value="green-future">Green Future</option>
                      <option value="independent">Independent</option>
                    </select>
                  </Field>
                </div>
                <Field label="Constituency" error={candidateForm.formState.errors.constituency?.message}>
                  <input {...candidateForm.register('constituency')} placeholder="Your contesting constituency" className={inputCls} />
                </Field>
                <Field label="Biography (min. 100 chars)" error={candidateForm.formState.errors.biography?.message}>
                  <textarea {...candidateForm.register('biography')} rows={4}
                    placeholder="Tell voters about your background, experience, and public service..." className={textareaCls} />
                </Field>
                <Field label="Education & Qualifications" error={candidateForm.formState.errors.education?.message}>
                  <textarea {...candidateForm.register('education')} rows={3}
                    placeholder="Degrees, certifications, institutions..." className={textareaCls} />
                </Field>
                <Field label="Manifesto & Key Promises (min. 50 chars)" error={candidateForm.formState.errors.manifesto?.message}>
                  <textarea {...candidateForm.register('manifesto')} rows={4}
                    placeholder="Your promises, policies, and vision for the constituents..." className={textareaCls} />
                </Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Website" error={candidateForm.formState.errors.website?.message}>
                    <input {...candidateForm.register('website')} type="url" placeholder="https://..." className={inputCls} />
                  </Field>
                  <Field label="Twitter / X" error={undefined}>
                    <input {...candidateForm.register('twitter')} placeholder="@handle" className={inputCls} />
                  </Field>
                  <Field label="LinkedIn" error={undefined}>
                    <input {...candidateForm.register('linkedin')} placeholder="LinkedIn URL" className={inputCls} />
                  </Field>
                </div>
                <div className="bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] rounded-lg p-4">
                  <p className="text-xs text-[#f59e0b] leading-relaxed">
                    <strong>Note:</strong> Your candidate application will be reviewed by the Election Commission within 24–48 hours.
                    You&apos;ll also be required to submit asset declarations and supporting documents after registration.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={back} className="flex-1 py-3 rounded-lg border border-[rgba(0,212,255,0.18)] text-[#94a3b8] text-sm font-bold font-orb tracking-wider hover:border-[#00d4ff] hover:text-[#00d4ff] transition-all">← Back</button>
                <button type="submit" disabled={registerMutation.isPending} className="flex-[2] py-3 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#ff2d6a] text-white text-sm font-bold font-orb tracking-widest uppercase hover:shadow-[0_0_30px_rgba(124,58,237,0.3)] transition-all disabled:opacity-60">
                  {registerMutation.isPending ? 'Submitting Application...' : '🏛️ Submit Application'}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 4: Party Admin Extra ── */}
          {step === 4 && selectedRole === 'party_admin' && (
            <form onSubmit={handlePartyExtra}>
              <h2 className="font-orb text-lg font-bold text-white mb-2">Party Registration Details</h2>
              <p className="text-sm text-[#94a3b8] mb-6">Register your political party on the VOTEX platform</p>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Field label="Party Name" error={partyForm.formState.errors.partyName?.message}>
                      <input {...partyForm.register('partyName')} placeholder="Full party name" className={inputCls} />
                    </Field>
                  </div>
                  <Field label="Abbreviation" error={partyForm.formState.errors.partyAbbreviation?.message}>
                    <input {...partyForm.register('partyAbbreviation')} placeholder="e.g. NPP" maxLength={6} className={inputCls} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Party Color" error={partyForm.formState.errors.partyColor?.message}>
                    <input {...partyForm.register('partyColor')} type="color" defaultValue="#00d4ff"
                      className={`${inputCls} h-12 cursor-pointer px-2`} />
                  </Field>
                  <Field label="Founded Year" error={partyForm.formState.errors.foundedYear?.message}>
                    <input {...partyForm.register('foundedYear')} type="number" placeholder="e.g. 1998" className={inputCls} />
                  </Field>
                </div>
                <Field label="Party Description & Ideology (min. 50 chars)" error={partyForm.formState.errors.partyDescription?.message}>
                  <textarea {...partyForm.register('partyDescription')} rows={4}
                    placeholder="Describe your party's ideology, mission, and goals..." className={textareaCls} />
                </Field>
                <Field label="Party Website" error={partyForm.formState.errors.partyWebsite?.message}>
                  <input {...partyForm.register('partyWebsite')} type="url" placeholder="https://yourparty.org" className={inputCls} />
                </Field>
                <Field label="Authorization Documents (upload link or description)" error={undefined}>
                  <input {...partyForm.register('authorizedDocuments')} placeholder="Describe authorization or provide document link" className={inputCls} />
                </Field>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={back} className="flex-1 py-3 rounded-lg border border-[rgba(0,212,255,0.18)] text-[#94a3b8] text-sm font-bold font-orb tracking-wider hover:border-[#00d4ff] hover:text-[#00d4ff] transition-all">← Back</button>
                <button type="submit" disabled={registerMutation.isPending} className="flex-[2] py-3 rounded-lg bg-gradient-to-r from-[#ff2d6a] to-[#f59e0b] text-white text-sm font-bold font-orb tracking-widest uppercase hover:shadow-[0_0_30px_rgba(255,45,106,0.3)] transition-all disabled:opacity-60">
                  {registerMutation.isPending ? 'Registering Party...' : '🎯 Register Party'}
                </button>
              </div>
            </form>
          )}

        </div>

        <p className="text-center text-xs text-[#475569] mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[#00d4ff] hover:underline font-semibold">Sign in</Link>
        </p>
      </div>
    </main>
  )
}