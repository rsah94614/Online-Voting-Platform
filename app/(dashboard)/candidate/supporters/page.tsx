// app/(dashboard)/candidate/supporters/page.tsx
'use client'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { Card } from '@/components/dashboard/ui'

export default function CandidateSupportersPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Supporters" subtitle="Your voter engagement" />
      <main className="flex-1 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full p-12 text-center">
          <div className="text-5xl mb-4">👥</div>
          <h2 className="font-orb font-bold text-white text-xl mb-2">Supporter Analytics</h2>
          <p className="text-sm text-[#475569]">
            Detailed supporter analytics are coming soon.
            Check <strong className="text-white">Live Standings</strong> for your current vote counts.
          </p>
        </Card>
      </main>
    </div>
  )
}
