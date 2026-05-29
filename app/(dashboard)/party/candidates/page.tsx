// app/(dashboard)/party/candidates/page.tsx
'use client'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { Card, PageLoader } from '@/components/dashboard/ui'
import { useQuery } from '@tanstack/react-query'
import { candidateApi } from '@/lib/api'

export default function PartyCandidatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['candidates', 'party'],
    queryFn: () => candidateApi.list({ approved: true }),
  })

  if (isLoading) return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Our Candidates" subtitle="Party candidate roster" />
      <PageLoader />
    </div>
  )

  const candidates = (data as any)?.candidates ?? []

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Our Candidates" subtitle={`${candidates.length} candidates`} />
      <main className="flex-1 p-6">
        {candidates.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-5xl mb-4 opacity-40">👤</div>
            <p className="text-[#475569] text-sm">No candidates registered under your party yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {candidates.map((c: any) => (
              <Card key={c.id} className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff2d6a] to-[#f59e0b] flex items-center justify-center text-sm font-bold text-white">
                    {c.user?.name?.charAt(0) ?? '?'}
                  </div>
                  <div>
                    <p className="font-orb font-bold text-white">{c.user?.name}</p>
                    <p className="text-xs text-[#94a3b8] font-mono">
                      {c.isApproved ? '✅ Approved' : '⏳ Pending'}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
