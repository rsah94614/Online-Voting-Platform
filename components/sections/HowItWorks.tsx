export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      icon: '⚙️',
      title: 'Configure Election',
      desc: 'Define your election type (FPTP, ranked choice, multi-seat), set voting window, configure eligibility rules.',
      tags: ['Election type', 'Date & time', 'Eligibility rules'],
    },
    {
      num: '02',
      icon: '🏛️',
      title: 'Add Parties & Candidates',
      desc: 'Register unlimited parties and candidates. Each gets a full profile page with biography, qualifications, and manifesto.',
      tags: ['Unlimited candidates', 'Rich profiles', 'Verification'],
    },
    {
      num: '03',
      icon: '🔐',
      title: 'Verify Voters',
      desc: 'Import voter rolls via CSV or let voters self-register. Verify identities via Email OTP or Admin Approval.',
      tags: ['Email OTP', 'CSV Import', 'Admin Approval'],
    },
    {
      num: '04',
      icon: '🗳️',
      title: 'Open Voting',
      desc: 'Launch the election with one click. Voters access their personal ballot and cast encrypted votes.',
      tags: ['E2E encrypted', 'Mobile + Web', 'Embeddable'],
    },
    {
      num: '05',
      icon: '📊',
      title: 'Monitor & Publish Results',
      desc: 'Watch results update live on your admin dashboard. Export audit-ready reports with cryptographic proof.',
      tags: ['Live monitoring', 'Auto-disclosure', 'Audit export'],
    },
  ]

  return (
    <section className="py-24 px-[5%]" id="how-it-works">
      <div className="text-center mb-16">
        <div className="inline-block font-mono text-xs text-[#00d4ff] tracking-wider uppercase mb-4 px-3.5 py-1 border border-[rgba(0,212,255,0.2)] rounded bg-[rgba(0,212,255,0.04)] fade-in">
          Setup in Minutes
        </div>
        <h2 className="font-orb text-4xl lg:text-5xl font-bold text-white leading-tight mb-4 fade-in stagger-1">
          Launch Your Election<br />
          <span className="bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] bg-clip-text text-transparent">in 5 Steps</span>
        </h2>
        <p className="text-base text-[#94a3b8] max-w-2xl mx-auto leading-relaxed fade-in stagger-2">
          From idea to live election in under 30 minutes. Our guided wizard handles the complexity.
        </p>
      </div>

      <div className="space-y-12 max-w-4xl mx-auto">
        {steps.map((step, i) => (
          <div key={step.num} className={`flex gap-8 items-start ${i % 2 === 1 ? 'flex-row-reverse' : ''} fade-in`}>
            <div className="flex-1 bg-[rgba(0,212,255,0.04)] border border-[rgba(0,212,255,0.18)] rounded-2xl p-7 hover:border-[rgba(0,212,255,0.4)] hover:bg-[rgba(0,212,255,0.06)] transition-all">
              <div className="text-3xl mb-4">{step.icon}</div>
              <h3 className="font-orb text-lg font-bold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-[#94a3b8] mb-4 leading-relaxed">{step.desc}</p>
              <div className="flex flex-wrap gap-2">
                {step.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-1 bg-[rgba(124,58,237,0.1)] text-[#7c3aed] border border-[rgba(124,58,237,0.2)] rounded font-mono">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#7c3aed] flex items-center justify-center font-orb font-bold text-white shadow-[0_0_20px_rgba(0,212,255,0.4)]">
                {step.num}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
