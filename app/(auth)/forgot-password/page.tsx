'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
})

const resetSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
  newPassword: z.string()
    .min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type EmailForm = z.infer<typeof emailSchema>
type ResetForm = z.infer<typeof resetSchema>

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email')
  const [email, setEmail] = useState('')
  const [showPass, setShowPass] = useState(false)

  // Step 1: Request OTP
  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) })
  const requestOtp = useMutation({
    mutationFn: async (data: EmailForm) => {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed')
      return result
    },
    onSuccess: (_, data) => {
      setEmail(data.email)
      setStep('reset')
      toast.success('Reset code sent! Check your email (or server console).')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // Step 2: Reset password
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema) })
  const resetPassword = useMutation({
    mutationFn: async (data: ResetForm) => {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: data.code, newPassword: data.newPassword }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed')
      return result
    },
    onSuccess: () => {
      setStep('done')
      toast.success('Password reset successfully!')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]
        bg-radial-[ellipse] from-[rgba(0,212,255,0.06)] via-[rgba(124,58,237,0.04)] to-transparent
        pointer-events-none rounded-full" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 no-underline mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00d4ff] to-[#7c3aed] rounded-xl
              flex items-center justify-center shadow-[0_0_24px_rgba(0,212,255,0.4)]">
              <span className="font-orb font-black text-base text-white">VX</span>
            </div>
            <span className="font-orb font-bold text-2xl bg-gradient-to-r from-[#00d4ff] to-[#7c3aed]
              bg-clip-text text-transparent tracking-widest">VOTEX</span>
          </Link>
          <h1 className="font-orb text-2xl font-bold text-white mt-4 mb-2">
            {step === 'done' ? 'Password Reset ✓' : 'Reset Password'}
          </h1>
          <p className="text-sm text-[#94a3b8]">
            {step === 'email' && 'Enter your email to receive a reset code'}
            {step === 'reset' && `Enter the 6-digit code sent to ${email}`}
            {step === 'done' && 'Your password has been updated successfully'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[rgba(0,212,255,0.03)] border border-[rgba(0,212,255,0.18)] rounded-2xl p-8
          backdrop-blur-md shadow-[0_0_60px_rgba(0,0,0,0.5)]">

          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={emailForm.handleSubmit((d) => requestOtp.mutate(d))} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  {...emailForm.register('email')}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full bg-[#0a0a1a] border border-[rgba(0,212,255,0.18)] rounded-lg px-4 py-3
                    text-sm text-white placeholder-[#475569] focus:outline-none
                    focus:border-[#00d4ff] focus:shadow-[0_0_20px_rgba(0,212,255,0.1)]
                    transition-all font-mono"
                />
                {emailForm.formState.errors.email && (
                  <p className="text-xs text-[#ff2d6a] mt-1.5">{emailForm.formState.errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={requestOtp.isPending}
                className="w-full py-3.5 rounded-lg font-orb font-bold text-sm tracking-widest uppercase
                  bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white
                  shadow-[0_0_30px_rgba(0,212,255,0.25)] hover:shadow-[0_0_40px_rgba(0,212,255,0.5)]
                  transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {requestOtp.isPending ? 'Sending...' : 'Send Reset Code →'}
              </button>
            </form>
          )}

          {/* Step 2: OTP + New Password */}
          {step === 'reset' && (
            <form onSubmit={resetForm.handleSubmit((d) => resetPassword.mutate(d))} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">
                  Reset Code
                </label>
                <input
                  {...resetForm.register('code')}
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  className="w-full bg-[#0a0a1a] border border-[rgba(0,212,255,0.18)] rounded-lg px-4 py-3
                    text-sm text-white placeholder-[#475569] focus:outline-none
                    focus:border-[#00d4ff] focus:shadow-[0_0_20px_rgba(0,212,255,0.1)]
                    transition-all font-mono text-center text-xl tracking-[0.5em]"
                />
                {resetForm.formState.errors.code && (
                  <p className="text-xs text-[#ff2d6a] mt-1.5">{resetForm.formState.errors.code.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    {...resetForm.register('newPassword')}
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full bg-[#0a0a1a] border border-[rgba(0,212,255,0.18)] rounded-lg px-4 py-3
                      text-sm text-white placeholder-[#475569] focus:outline-none
                      focus:border-[#00d4ff] focus:shadow-[0_0_20px_rgba(0,212,255,0.1)]
                      transition-all pr-11 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#00d4ff] transition-colors text-xs"
                  >
                    {showPass ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
                {resetForm.formState.errors.newPassword && (
                  <p className="text-xs text-[#ff2d6a] mt-1.5">{resetForm.formState.errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <input
                  {...resetForm.register('confirmPassword')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-[#0a0a1a] border border-[rgba(0,212,255,0.18)] rounded-lg px-4 py-3
                    text-sm text-white placeholder-[#475569] focus:outline-none
                    focus:border-[#00d4ff] focus:shadow-[0_0_20px_rgba(0,212,255,0.1)]
                    transition-all font-mono"
                />
                {resetForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-[#ff2d6a] mt-1.5">{resetForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="flex-1 py-3 rounded-lg font-orb font-bold text-xs tracking-widest uppercase
                    border border-[rgba(0,212,255,0.18)] text-[#94a3b8]
                    hover:border-[#00d4ff] hover:text-[#00d4ff] transition-all"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={resetPassword.isPending}
                  className="flex-[2] py-3 rounded-lg font-orb font-bold text-sm tracking-widest uppercase
                    bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white
                    shadow-[0_0_30px_rgba(0,212,255,0.25)] hover:shadow-[0_0_40px_rgba(0,212,255,0.5)]
                    transition-all disabled:opacity-60"
                >
                  {resetPassword.isPending ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Done */}
          {step === 'done' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-[rgba(0,255,136,0.1)] border border-[rgba(0,255,136,0.3)] rounded-full flex items-center justify-center text-3xl">
                ✅
              </div>
              <p className="text-sm text-[#94a3b8]">Your password has been updated. You can now sign in with your new password.</p>
              <Link href="/login">
                <button className="w-full py-3.5 rounded-lg font-orb font-bold text-sm tracking-widest uppercase
                  bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white
                  shadow-[0_0_30px_rgba(0,212,255,0.25)] hover:shadow-[0_0_40px_rgba(0,212,255,0.5)] transition-all">
                  Sign In →
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Back to login */}
        <div className="text-center mt-6">
          <Link href="/login" className="text-xs text-[#94a3b8] hover:text-[#00d4ff] transition-colors font-mono">
            ← Back to Sign In
          </Link>
        </div>

        {/* Security notice */}
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-[#475569] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] shadow-[0_0_6px_#00ff88] inline-block" />
          Secured with AES-256 encryption
        </div>
      </div>
    </main>
  )
}
