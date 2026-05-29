// app/(dashboard)/voter/profile/page.tsx
'use client'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { Card } from '@/components/dashboard/ui'
import { useAuthStore } from '@/stores/authStore'

export default function VoterProfilePage() {
  const user = useAuthStore((s) => s.user)
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="My Profile" subtitle="Manage your voter account" />
      <main className="flex-1 p-6 space-y-5">
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00ff88] to-[#00d4ff] flex items-center justify-center text-xl font-bold text-white">
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) ?? '?'}
            </div>
            <div>
              <h2 className="font-orb font-bold text-white text-xl">{user?.name}</h2>
              <p className="text-sm text-[#94a3b8] font-mono">{user?.email}</p>
              <span className="text-xs text-[#00ff88] bg-[rgba(0,255,136,0.1)] border border-[rgba(0,255,136,0.2)] px-2 py-0.5 rounded-full font-mono">
                VOTER
              </span>
            </div>
          </div>
          <div className="border-t border-[rgba(0,212,255,0.1)] pt-6">
            <p className="text-sm text-[#475569] text-center">
              Profile editing coming soon. Contact your administrator to update your details.
            </p>
          </div>
        </Card>
      </main>
    </div>
  )
}
