// app/(dashboard)/party/campaign/page.tsx
'use client'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { Card } from '@/components/dashboard/ui'

export default function PartyCampaignPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Campaign" subtitle="Campaign management tools" />
      <main className="flex-1 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full p-12 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="font-orb font-bold text-white text-xl mb-2">Campaign Tools</h2>
          <p className="text-sm text-[#475569]">
            Campaign management features are coming soon. You will be able to track campaign activities,
            set goals, and monitor outreach effectiveness here.
          </p>
        </Card>
      </main>
    </div>
  )
}
