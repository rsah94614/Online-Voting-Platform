'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface HeroStats {
  voterCount: string;
  electionCount: string;
  voteCount: string;
  candidateCount: string;
  voterTurnout: string;
}

export default function Hero({ stats: dynamicStats }: { stats?: HeroStats }) {
  const stats = [
    { num: dynamicStats?.voteCount || '127M+', label: 'Votes Cast' },
    { num: dynamicStats?.electionCount || '4,800+', label: 'Elections Run' },
    { num: '98+', label: 'Countries' },
    { num: '99.98%', label: 'Uptime SLA' },
    { num: '∞', label: 'Scalability' },
  ]

  useEffect(() => {
    // Animate hero bars
    function animateHeroBars() {
      const bars = [
        { id: 'bar1', h: '65%' },
        { id: 'bar2', h: '55%' },
        { id: 'bar3', h: '42%' },
        { id: 'bar4', h: '29%' }
      ]
      bars.forEach((b, i) => {
        setTimeout(() => {
          const el = document.getElementById(b.id)
          if (el) el.style.height = b.h
        }, 800 + i * 200)
      })
    }
    setTimeout(animateHeroBars, 500)
  }, [])

  return (
    <section className="min-h-screen flex flex-col items-center justify-center py-24 px-[5%] relative overflow-hidden">
      <div className="absolute top-1/5 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-radial-gradient from-[rgba(0,212,255,0.08)] via-[rgba(124,58,237,0.06)] to-transparent pointer-events-none"></div>

      <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-[rgba(0,212,255,0.3)] rounded-full bg-[rgba(0,212,255,0.05)] mb-7 fade-in">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88] inline-block animate-pulse"></span>
        <span className="text-xs text-[#00d4ff] font-mono tracking-wider">Now live — v2.4 with real-time sync & biometric auth</span>
      </div>

      <h1 className="font-orb text-4xl sm:text-5xl lg:text-7xl font-black text-center leading-tight mb-6 fade-in stagger-1">
        <span className="block text-white">The Future of</span>
        <span className="block bg-gradient-to-r from-[#00d4ff] via-[#7c3aed] to-[#ff2d6a] bg-clip-text text-transparent">Democratic Voting</span>
      </h1>

      <p className="text-base sm:text-lg text-[#94a3b8] text-center max-w-2xl mb-10 fade-in stagger-2">
        Enterprise-grade election management — from class-president polls to national referendums. Unlimited voters, candidates, parties, and elections. Secure, transparent, and tamper-proof by design.
      </p>

      <div className="flex gap-4 flex-wrap justify-center mb-12 fade-in stagger-3">
        <Link href="/login">
          <button className="px-8 py-3.5 rounded-lg font-bold text-base tracking-wider bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white shadow-[0_0_30px_rgba(0,212,255,0.25)] hover:shadow-[0_0_40px_rgba(0,212,255,0.5)] transition-all">
            🚀 Access Platform
          </button>
        </Link>
        <a href="#how-it-works">
          <button className="px-8 py-3.5 rounded-lg font-bold text-base tracking-wider border border-[#00d4ff] text-[#00d4ff] bg-transparent hover:bg-[rgba(0,212,255,0.08)] shadow-[0_0_15px_rgba(0,212,255,0.1)] hover:shadow-[0_0_30px_rgba(0,212,255,0.25)] transition-all">
            ▶ Watch Demo
          </button>
        </a>
      </div>

      <div className="flex gap-10 flex-wrap justify-center mb-14 fade-in stagger-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="font-orb text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] bg-clip-text text-transparent">
              {stat.num}
            </div>
            <div className="text-xs text-[#475569] tracking-wider uppercase mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="w-full max-w-4xl border border-[rgba(0,212,255,0.18)] rounded-2xl overflow-hidden bg-[#0a0a1a] shadow-[0_0_60px_rgba(0,212,255,0.1),0_0_120px_rgba(124,58,237,0.08)] fade-in stagger-5">
        <div className="h-10 bg-[#0e0e24] border-b border-[rgba(0,212,255,0.18)] flex items-center px-4 gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]"></div>
          <div className="flex-1 mx-3 h-5.5 bg-[#060611] rounded border border-[rgba(0,212,255,0.18)] flex items-center px-2.5">
            <span className="text-xs text-[#475569] font-mono">🔒 app.votex.io/admin/dashboard</span>
          </div>
          <div className="text-xs text-[#00ff88] font-mono flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-[#00ff88] shadow-[0_0_6px_#00ff88] inline-block"></span>
            LIVE
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 p-6">
          {[
            { val: dynamicStats?.voterCount || '1.24M', label: 'Total Voters', delta: '↑ Live' },
            { val: dynamicStats?.voteCount || '847K', label: 'Votes Cast', delta: '↑ Live' },
            { val: dynamicStats?.voterTurnout || '68.3%', label: 'Voter Turnout', delta: '↑ Active' },
            { val: dynamicStats?.candidateCount || '24', label: 'Candidates', delta: 'Active on platform' }
          ].map((card, i) => (
            <div key={i} className="bg-[#0e0e24] border border-[rgba(0,212,255,0.18)] rounded-lg p-3.5 relative before:content-[''] before:absolute before:bottom-0 before:left-0 before:right-0 before:h-0.5 before:rounded-b before:bg-[#00d4ff]">
              <div className="font-orb text-lg font-bold text-white mb-1">{card.val}</div>
              <div className="text-xs text-[#475569]">{card.label}</div>
              <div className="text-xs text-[#00ff88] mt-1">{card.delta}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
