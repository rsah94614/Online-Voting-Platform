'use client'

import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/lib/api'

export default function AdBanner() {
  const { data, isLoading } = useQuery({
    queryKey: ['auth-user'],
    queryFn: authApi.me,
    retry: false,
    staleTime: Infinity,
  })

  // If user is loaded and they are pro, don't show the ad
  const isPro = data?.user?.isPro || false

  if (isLoading) {
    return <div className="h-[90px] w-full bg-slate-800/30 animate-pulse rounded-xl my-4" />
  }

  if (isPro) {
    return null
  }

  return (
    <div className="w-full bg-[#0a0f18] border border-cyan-500/10 rounded-xl my-4 overflow-hidden relative group p-2 flex justify-center items-center min-h-[90px]">
      <div className="absolute top-0 right-0 bg-slate-900/80 text-[10px] text-slate-500 px-2 rounded-bl-lg border-b border-l border-slate-800">
        Ad
      </div>
      
      {/* Fallback visual for dev environment since real ads won't show on localhost usually */}
      <div className="absolute inset-0 flex items-center justify-center text-slate-700 font-mono text-sm pointer-events-none -z-10">
        Google AdSense Placeholder
      </div>

      <ins className="adsbygoogle"
           style={{ display: 'block', minWidth: '300px', width: '100%', height: '90px' }}
           data-ad-client="ca-pub-0000000000000000"
           data-ad-slot="1234567890"
           data-ad-format="auto"
           data-full-width-responsive="true" />
           
      <script dangerouslySetInnerHTML={{ __html: '(adsbygoogle = window.adsbygoogle || []).push({});' }} />
    </div>
  )
}
