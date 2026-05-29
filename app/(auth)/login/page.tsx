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

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  remember: z.boolean().optional(),
})
type FormData = z.infer<typeof schema>

const ROLE_REDIRECTS: Record<string, string> = {
  ADMIN:       '/admin',
  VOTER:       '/voter',
  CANDIDATE:   '/candidate',
  PARTY_ADMIN: '/party',
}

export default function LoginPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const [showPass, setShowPass] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: FormData) => authApi.login(email, password),
    onSuccess: (response) => {
      setUser(response.user)
      toast.success(`Welcome back, ${response.user.name}!`)
      router.push(ROLE_REDIRECTS[response.user.role] || '/')
    },
    onError: (err: Error) => toast.error(err.message || 'Login failed'),
  })

  const onSubmit = (data: FormData) => loginMutation.mutate(data)

  /* ── Dev quick-login helpers ── */
  const quickLogin = (role: string) => {
    const demos: Record<string, { email: string; password: string }> = {
      admin:     { email: 'admin@votex.io',     password: 'Demo@1234' },
      candidate: { email: 'candidate@votex.io', password: 'Demo@1234' },
      party:     { email: 'party@votex.io',     password: 'Demo@1234' },
      voter:     { email: 'voter@votex.io',     password: 'Demo@1234' },
    }
    const d = demos[role]
    if (d) loginMutation.mutate({ email: d.email, password: d.password })
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background glow */}
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
          <h1 className="font-orb text-2xl font-bold text-white mt-4 mb-2">Welcome Back</h1>
          <p className="text-sm text-[#94a3b8]">Sign in to access your election dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-[rgba(0,212,255,0.03)] border border-[rgba(0,212,255,0.18)] rounded-2xl p-8
          backdrop-blur-md shadow-[0_0_60px_rgba(0,0,0,0.5)]">

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="w-full bg-[#0a0a1a] border border-[rgba(0,212,255,0.18)] rounded-lg px-4 py-3
                  text-sm text-white placeholder-[#475569] focus:outline-none
                  focus:border-[#00d4ff] focus:shadow-[0_0_20px_rgba(0,212,255,0.1)]
                  transition-all font-mono"
              />
              {errors.email && (
                <p className="text-xs text-[#ff2d6a] mt-1.5">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
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
              {errors.password && (
                <p className="text-xs text-[#ff2d6a] mt-1.5">{errors.password.message}</p>
              )}
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register('remember')}
                  type="checkbox"
                  className="w-4 h-4 accent-[#00d4ff] rounded"
                />
                <span className="text-xs text-[#94a3b8]">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-xs text-[#00d4ff] hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3.5 rounded-lg font-orb font-bold text-sm tracking-widest uppercase
                bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white
                shadow-[0_0_30px_rgba(0,212,255,0.25)] hover:shadow-[0_0_40px_rgba(0,212,255,0.5)]
                transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Authenticating...
                </span>
              ) : 'Sign In →'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[rgba(0,212,255,0.1)]" />
            <span className="text-xs text-[#475569] font-mono">DEMO ACCESS</span>
            <div className="flex-1 h-px bg-[rgba(0,212,255,0.1)]" />
          </div>

          {/* Quick login */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { role: 'admin', label: 'Admin', color: 'from-[#00d4ff] to-[#7c3aed]' },
              { role: 'voter', label: 'Voter', color: 'from-[#00ff88] to-[#00d4ff]' },
              { role: 'candidate', label: 'Candidate', color: 'from-[#7c3aed] to-[#ff2d6a]' },
              { role: 'party', label: 'Party Admin', color: 'from-[#ff2d6a] to-[#f59e0b]' },
            ].map(({ role, label, color }) => (
              <button
                key={role}
                onClick={() => quickLogin(role)}
                disabled={loginMutation.isPending}
                className={`py-2.5 rounded-lg text-xs font-bold font-orb tracking-wider text-white
                  bg-gradient-to-r ${color} opacity-70 hover:opacity-100 transition-opacity
                  disabled:cursor-not-allowed`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Register link */}
          <p className="text-center text-xs text-[#475569] mt-6">
            New to VOTEX?{' '}
            <Link href="/register" className="text-[#00d4ff] hover:underline font-semibold">
              Create an account
            </Link>
          </p>
        </div>

        {/* Security notice */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-[#475569] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] shadow-[0_0_6px_#00ff88] inline-block" />
          Secured with AES-256 encryption &amp; Zero-Knowledge auth
        </div>
      </div>
    </main>
  )
}