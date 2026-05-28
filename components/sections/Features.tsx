import SectionHeader from '../SectionHeader'

const features = [
  {
    icon: '🛡️',
    title: 'Military-Grade Security',
    desc: 'End-to-end encryption, zero-knowledge vote storage, immutable audit trails, and multi-factor authentication.',
    tag: 'AES-256 · ZKP · HSM · ISO 27001',
    color: 'from-[rgba(0,212,255,0.1)]',
  },
  {
    icon: '⚡',
    title: 'Real-Time Live Results',
    desc: 'Watch votes tally in real-time with WebSocket-powered live feeds, animated progress bars, and instant notification.',
    tag: 'WebSocket · Sub-100ms latency',
    color: 'from-[rgba(0,255,136,0.1)]',
  },
  {
    icon: '🎛️',
    title: 'Multi-Role Dashboards',
    desc: 'Tailored interfaces for Admins, Candidates, Party Managers, and Voters with custom permissions.',
    tag: 'RBAC · Admin · Candidate · Voter',
    color: 'from-[rgba(124,58,237,0.1)]',
  },
  {
    icon: '👤',
    title: 'Candidate Transparency',
    desc: 'Full candidate profiles with biographies, qualifications, manifestos, and publicly verifiable credentials.',
    tag: 'Profiles · Declarations · Manifestos',
    color: 'from-[rgba(245,158,11,0.1)]',
  },
  {
    icon: '⚙️',
    title: 'Fully Customizable Workflow',
    desc: 'Define your own election rules — ranked choice, first-past-the-post, multi-round, weighted votes.',
    tag: 'FPTP · RCV · Multi-round · Weighted',
    color: 'from-[rgba(255,45,106,0.1)]',
  },
  {
    icon: '📊',
    title: 'Advanced Analytics',
    desc: 'Deep insights with geographic vote heatmaps, demographic breakdowns, turnout trends, and predictive modelling.',
    tag: 'Heatmaps · Reports · Demographics',
    color: 'from-[rgba(59,130,246,0.1)]',
  },
]

export default function Features() {
  return (
    <section className="py-24 px-[5%]" id="features">
      <SectionHeader
        eyebrow="Core Capabilities"
        title="Everything Your Election"
        titleHighlight="Demands"
        description="From small-scale community votes to national elections with millions of voters — VOTEX handles it all with military-grade security and real-time performance."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, i) => (
          <div key={i} className="bg-[rgba(0,212,255,0.04)] border border-[rgba(0,212,255,0.18)] rounded-2xl backdrop-blur-md p-8 hover:border-[rgba(0,212,255,0.4)] hover:bg-[rgba(0,212,255,0.06)] hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,212,255,0.1)] transition-all duration-300 fade-in">
            <div className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center mb-5 text-2xl bg-gradient-to-br ${feature.color}`}>
              {feature.icon}
            </div>
            <h3 className="font-orb text-base font-semibold text-white mb-2.5 tracking-wide">
              {feature.title}
            </h3>
            <p className="text-sm text-[#94a3b8] leading-relaxed mb-3.5">
              {feature.desc}
            </p>
            <div className="text-xs text-[#00d4ff] font-mono tracking-widest">
              {feature.tag}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
