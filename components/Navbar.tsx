'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[1000] px-[5%] h-[72px] flex items-center justify-between bg-[rgba(6,6,17,0.85)] backdrop-blur-[20px] border-b border-[rgba(0,212,255,0.18)] transition-all duration-200"
      style={{
        borderBottomColor: scrollY > 80 ? 'rgba(0,212,255,.25)' : 'rgba(0,212,255,.18)',
        background: scrollY > 80 ? 'rgba(6,6,17,.95)' : 'rgba(6,6,17,.85)',
      }}
    >
      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <div className="w-[34px] h-[34px] bg-gradient-to-br from-[#00d4ff] to-[#7c3aed] rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.4)]">
          <span className="font-orb font-black text-sm text-white">VX</span>
        </div>
        <div>
          <div className="font-orb font-bold text-lg bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] bg-clip-text text-transparent tracking-wider">
            VOTEX
          </div>
          <span className="text-xs text-[#00d4ff] tracking-widest uppercase font-mono block -mt-1">
            Election Platform
          </span>
        </div>
      </Link>

      <div className="hidden md:flex items-center gap-8">
        <a href="#features" className="text-[#94a3b8] hover:text-[#00d4ff] transition-colors text-sm font-medium tracking-wider">Features</a>
        <a href="#dashboards" className="text-[#94a3b8] hover:text-[#00d4ff] transition-colors text-sm font-medium tracking-wider">Dashboards</a>
        <a href="#candidates" className="text-[#94a3b8] hover:text-[#00d4ff] transition-colors text-sm font-medium tracking-wider">Candidates</a>
        <a href="#results" className="text-[#94a3b8] hover:text-[#00d4ff] transition-colors text-sm font-medium tracking-wider">Results</a>
        <a href="#how-it-works" className="text-[#94a3b8] hover:text-[#00d4ff] transition-colors text-sm font-medium tracking-wider">How It Works</a>
        <a href="#pricing" className="text-[#94a3b8] hover:text-[#00d4ff] transition-colors text-sm font-medium tracking-wider">Pricing</a>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/login">
          <button className="px-[22px] py-2.5 rounded-lg font-semibold text-sm tracking-wider border border-[rgba(0,212,255,0.18)] text-[#94a3b8] hover:border-[#00d4ff] hover:text-[#00d4ff] hover:shadow-[0_0_20px_rgba(0,212,255,0.1)] transition-all">
            Sign In
          </button>
        </Link>
        <Link href="/register">
          <button className="px-[22px] py-2.5 rounded-lg font-semibold text-sm tracking-wider bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white shadow-[0_0_30px_rgba(0,212,255,0.25)] hover:shadow-[0_0_40px_rgba(0,212,255,0.5)] transition-all">
            Launch Election →
          </button>
        </Link>
      </div>
    </nav>
  )
}
