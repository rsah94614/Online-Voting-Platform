// app/(dashboard)/party/settings/page.tsx
'use client'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { Card } from '@/components/dashboard/ui'

export default function PartySettingsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Party Settings" subtitle="Configure your party profile" />
      <main className="flex-1 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full p-12 text-center">
          <div className="text-5xl mb-4">⚙️</div>
          <h2 className="font-orb font-bold text-white text-xl mb-2">Party Settings</h2>
          <p className="text-sm text-[#475569]">
            Party profile settings are coming soon. Contact your system administrator
            to update party details such as name, description, and branding.
          </p>
        </Card>
      </main>
    </div>
  )
}
