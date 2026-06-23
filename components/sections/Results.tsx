'use client'

import { useEffect } from 'react'

export default function Results() {
  useEffect(() => {
    // Animate result bars on scroll
    const resultsSection = document.getElementById('results')
    if (resultsSection) {
      const resObs = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          (document.querySelectorAll('.rbar-fill') as NodeListOf<HTMLElement>).forEach(el => {
            el.style.width = (el.getAttribute('data-pct') || '0') + '%'
          })
          resObs.disconnect()
        }
      }, { threshold: 0.2 })
      resObs.observe(resultsSection)
    }
  }, [])

  return (
    <section className="py-24 px-[5%]" id="results">
      <div className="text-center mb-16">
        <div className="inline-block font-mono text-xs text-[#00d4ff] tracking-wider uppercase mb-4 px-3.5 py-1 border border-[rgba(0,212,255,0.2)] rounded bg-[rgba(0,212,255,0.04)] fade-in">
          Real-Time Intelligence
        </div>
        <h2 className="font-orb text-4xl lg:text-5xl font-bold text-white leading-tight mb-4 fade-in stagger-1">
          Live Election<br />
          <span className="bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] bg-clip-text text-transparent">Results</span>
        </h2>
        <p className="text-base text-[#94a3b8] max-w-2xl mx-auto leading-relaxed fade-in stagger-2">
          Watch votes roll in the moment they&apos;re cast. Zero-delay live feeds powered by WebSocket connections.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 fade-in">
        <div className="bg-[#0a0a1a] border border-[rgba(0,212,255,0.18)] rounded-2xl p-7">
          <h3 className="font-orb text-lg font-bold text-white mb-2">🗳️ Annual General Body Election</h3>
          <p className="text-sm text-[#94a3b8] mb-4">Live vote count as ballots are being cast by members.</p>
          <div className="flex items-center gap-2 text-xs text-[#00ff88] bg-[rgba(0,255,136,0.08)] px-3 py-2 rounded mb-4 font-mono">
            <span className="w-1 h-1 rounded-full bg-[#00ff88] shadow-[0_0_6px_#00ff88] inline-block animate-pulse"></span>
            ELECTION IN PROGRESS
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-xs mb-2 text-[#94a3b8]">
              <span>Votes Counted</span>
              <span className="font-orb font-bold text-[#00d4ff]">68.3% complete</span>
            </div>
            <div className="h-2 bg-[#0e0e24] rounded-full overflow-hidden border border-[rgba(0,212,255,0.18)]">
              <div className="h-full bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] w-[68.3%]"></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { num: '320', label: 'Votes Cast' },
              { num: '450', label: 'Total Voters' },
              { num: '71.1%', label: 'Turnout' },
              { num: '130', label: 'Yet to Vote' }
            ].map((item) => (
              <div key={item.label} className="bg-[#0e0e24] border border-[rgba(0,212,255,0.18)] rounded p-3 text-center">
                <div className="font-orb font-bold text-[#00d4ff] text-sm">{item.num}</div>
                <div className="text-xs text-[#475569] uppercase tracking-wider">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-[#0a0a1a] border border-[rgba(0,212,255,0.18)] rounded-2xl p-7">
          <h3 className="font-orb text-base font-bold text-white mb-6 flex items-center gap-3">
            Live Vote Distribution
            <span className="inline-flex items-center gap-1.5 text-xs text-[#00ff88] bg-[rgba(0,255,136,0.1)] px-2.5 py-1 rounded-full border border-[rgba(0,255,136,0.2)] font-mono">
              <span className="w-1 h-1 rounded-full bg-[#00ff88] shadow-[0_0_6px_#00ff88] inline-block animate-pulse"></span>
              LIVE
            </span>
          </h3>

          <div className="space-y-4">
            {[
              { initials: 'AC', name: 'Aria Chen', party: 'Green Society', pct: 42.5, votes: '136', color: 'from-[#00d4ff] to-[#7c3aed]', leader: true },
              { initials: 'MR', name: 'Marcus Reed', party: 'Tech Club', pct: 35.2, votes: '112', color: 'from-[#7c3aed] to-[#ff2d6a]' },
              { initials: 'SV', name: 'Sofia Vega', party: 'Student Union', pct: 18.1, votes: '58', color: 'from-[#ff2d6a] to-[#f59e0b]' },
              { initials: 'JO', name: 'James Okafor', party: 'Oakwood HOA', pct: 4.2, votes: '14', color: 'from-[#00ff88] to-[#00d4ff]' },
            ].map((result) => (
              <div key={result.initials} className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 bg-gradient-to-br ${result.color}`}>
                  {result.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {result.name}
                        {result.leader && <span className="text-xs bg-[rgba(0,255,136,0.12)] text-[#00ff88] px-1.5 py-0.5 rounded ml-2 border border-[rgba(0,255,136,0.2)]">LEADING</span>}
                      </p>
                      <p className="text-xs text-[#475569] font-mono">{result.votes} votes · {result.party}</p>
                    </div>
                    <div className={`font-orb font-bold bg-gradient-to-r ${result.color} bg-clip-text text-transparent`}>
                      {(result.pct).toFixed(1)}%
                    </div>
                  </div>
                  <div className="h-2 bg-[#0e0e24] rounded-full overflow-hidden border border-[rgba(0,212,255,0.18)]">
                    <div
                      className={`rbar-fill h-full bg-gradient-to-r ${result.color} transition-all duration-2000`}
                      style={{ width: '0%' }}
                      data-pct={result.pct}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
