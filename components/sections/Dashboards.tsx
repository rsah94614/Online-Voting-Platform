'use client'

import { useState } from 'react'

export default function Dashboards() {
  const [activeTab, setActiveTab] = useState('admin')

  return (
    <section className="py-24 px-[5%]" id="dashboards">
      <div className="text-center mb-16">
        <div className="inline-block font-mono text-xs text-[#00d4ff] tracking-wider uppercase mb-4 px-3.5 py-1 border border-[rgba(0,212,255,0.2)] rounded bg-[rgba(0,212,255,0.04)] fade-in">
          Platform Interfaces
        </div>
        <h2 className="font-orb text-4xl lg:text-5xl font-bold text-white leading-tight mb-4 fade-in stagger-1">
          Four Powerful<br />
          <span className="bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] bg-clip-text text-transparent">Dashboards</span>
        </h2>
        <p className="text-base text-[#94a3b8] max-w-2xl mx-auto leading-relaxed fade-in stagger-2">
          Every stakeholder gets a purpose-built command center. Clean, intuitive, and packed with the tools they need.
        </p>
      </div>

      <div className="flex gap-1 bg-[#0a0a1a] border border-[rgba(0,212,255,0.18)] rounded-2xl p-1 w-fit mx-auto mb-9 fade-in">
        {['admin', 'voter', 'candidate', 'party'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all capitalize font-orb tracking-wider ${
              activeTab === tab
                ? 'bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white shadow-[0_0_20px_rgba(0,212,255,0.2)]'
                : 'text-[#94a3b8] hover:text-[#00d4ff]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-[#0a0a1a] border border-[rgba(0,212,255,0.18)] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <div className="h-[52px] bg-[#0e0e24] border-b border-[rgba(0,212,255,0.18)] flex items-center px-5 gap-3 justify-between">
          <div className="flex items-center gap-2.5">
            <div className="font-orb text-sm font-bold text-[#00d4ff]">VOTEX</div>
            <div className="w-px h-4 bg-[rgba(0,212,255,0.18)]"></div>
            <div className="text-xs text-[#475569]">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Dashboard</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#00ff88] bg-[rgba(0,255,136,0.08)] px-2.5 py-1 rounded font-mono">● SYSTEM ONLINE</span>
            <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-[#00d4ff] to-[#7c3aed] flex items-center justify-center text-xs font-bold text-white">
              AD
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 p-6">
          {[
            { val: '1.24M', label: 'Registered Voters', trend: '↑ +12.4%' },
            { val: '847K', label: 'Votes Recorded', trend: '↑ Real-time' },
            { val: '68.3%', label: 'Voter Turnout', trend: '↑ +4.2%' },
            { val: '99.97%', label: 'System Uptime', trend: 'Last 30 days' }
          ].map((kpi, i) => (
            <div key={i} className={`bg-[#0e0e24] border border-[rgba(0,212,255,0.18)] rounded-lg p-4 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-b ${'after:bg-[#00d4ff]'}`}>
              <div className="font-orb text-xl font-bold text-white mb-1">{kpi.val}</div>
              <div className="text-xs text-[#475569]">{kpi.label}</div>
              <div className="text-xs text-[#00ff88] mt-2">{kpi.trend}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
