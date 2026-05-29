// app/(dashboard)/party/finances/page.tsx
'use client'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { Card } from '@/components/dashboard/ui'

export default function PartyFinancesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Finances" subtitle="Campaign finance transparency" />
      <main className="flex-1 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full p-12 text-center">
          <div className="text-5xl mb-4">💰</div>
          <h2 className="font-orb font-bold text-white text-xl mb-2">Finance Declarations</h2>
          <p className="text-sm text-[#475569]">
            Campaign finance tracking is coming soon. You will be able to declare funding sources,
            track expenditures, and maintain compliance records here.
          </p>
        </Card>
      </main>
    </div>
  )
}
