// app/(dashboard)/voter/candidates/page.tsx
'use client'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { Card, PageLoader } from '@/components/dashboard/ui'
import { useQuery } from '@tanstack/react-query'
import { candidateApi } from '@/lib/api'

export default function VoterCandidatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['candidates', 'approved'],
    queryFn: () => candidateApi.list({ approved: true }),
  })

  if (isLoading) return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Browse Candidates" subtitle="Learn about the candidates" />
      <PageLoader />
    </div>
  )

  const candidates = (data as any)?.candidates ?? []

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Browse Candidates" subtitle={`${candidates.length} approved candidates`} />
      <main className="flex-1 p-6">
        {candidates.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-5xl mb-4 opacity-40">👤</div>
            <p className="text-[#475569] text-sm">No approved candidates yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {candidates.map((c: any) => (
              <Card key={c.id} className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#7c3aed] flex items-center justify-center text-sm font-bold text-white">
                    {c.user?.name?.charAt(0) ?? '?'}
                  </div>
                  <div>
                    <p className="font-orb font-bold text-white">{c.user?.name}</p>
                    <p className="text-xs text-[#94a3b8]">{c.party?.name ?? 'Independent'}</p>
                  </div>
                </div>
                {c.bio && <p className="text-xs text-[#475569] line-clamp-3">{c.bio}</p>}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
