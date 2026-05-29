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

const schema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const [showPass, setShowPass] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const registerMutation = useMutation({
    mutationFn: (data: FormData) => 
      fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          role: 'ADMIN',
        }),
      }).then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Registration failed')
        return json
      }),
    onSuccess: (response) => {
      setUser(response.user)
      toast.success(`Welcome to VOTEX, ${response.user.name}! Your admin tenant is ready.`)
      router.push('/admin')
    },
    onError: (err: Error) => toast.error(err.message || 'Registration failed'),
  })

  const onSubmit = (data: FormData) => registerMutation.mutate(data)

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
          <h1 className="font-orb text-2xl font-bold text-white mt-4 mb-2">Create Admin Account</h1>
          <p className="text-sm text-[#94a3b8]">Create a dedicated tenant to host your own elections</p>
        </div>

        {/* Card */}
        <div className="bg-[rgba(0,212,255,0.03)] border border-[rgba(0,212,255,0.18)] rounded-2xl p-8
          backdrop-blur-md shadow-[0_0_60px_rgba(0,0,0,0.5)]">

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                {...register('name')}
                type="text"
                placeholder="Jane Doe"
                className="w-full bg-[#0a0a1a] border border-[rgba(0,212,255,0.18)] rounded-lg px-4 py-3
                  text-sm text-white placeholder-[#475569] focus:outline-none
                  focus:border-[#00d4ff] focus:shadow-[0_0_20px_rgba(0,212,255,0.1)]
                  transition-all font-mono"
              />
              {errors.name && (
                <p className="text-xs text-[#ff2d6a] mt-1.5">{errors.name.message}</p>
              )}
            </div>

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

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <input
                {...register('confirmPassword')}
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full bg-[#0a0a1a] border border-[rgba(0,212,255,0.18)] rounded-lg px-4 py-3
                  text-sm text-white placeholder-[#475569] focus:outline-none
                  focus:border-[#00d4ff] focus:shadow-[0_0_20px_rgba(0,212,255,0.1)]
                  transition-all font-mono"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-[#ff2d6a] mt-1.5">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full py-3.5 mt-4 rounded-lg font-orb font-bold text-sm tracking-widest uppercase
                bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white
                shadow-[0_0_30px_rgba(0,212,255,0.25)] hover:shadow-[0_0_40px_rgba(0,212,255,0.5)]
                transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {registerMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Creating Account...
                </span>
              ) : 'Sign Up →'}
            </button>
          </form>

          {/* Links */}
          <div className="mt-8 text-center">
            <p className="text-xs text-[#94a3b8]">
              Already have an admin account?{' '}
              <Link href="/login" className="text-[#00d4ff] hover:underline font-semibold">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
