const candidates = [
  {
    initials: 'AC',
    name: 'Aria Chen',
    role: 'Candidate for Secretary · Green Society',
    party: 'Green Society',
    votes: '42.5%',
    voteCount: '124',
    exp: '4',
    policies: '5',
    desc: 'Community organizer for 4 years. Focused on sustainability initiatives.',
    tags: ['Sustainability', 'Community Events', 'Fundraising'],
    gradient: 'from-[#00d4ff] to-[#7c3aed]',
    bgGradient: 'from-[rgba(0,212,255,0.1)] to-[rgba(124,58,237,0.1)]',
    borderColor: 'border-[rgba(0,212,255,0.2)]',
  },
  {
    initials: 'MR',
    name: 'Marcus Reed',
    role: 'Candidate for Treasurer · Tech Club',
    party: 'Tech Club',
    votes: '35.2%',
    voteCount: '98',
    exp: '2',
    policies: '3',
    desc: 'Accounting major. Wants to increase club budget transparency.',
    tags: ['Budget', 'Transparency', 'Tech Workshops'],
    gradient: 'from-[#7c3aed] to-[#ff2d6a]',
    bgGradient: 'from-[rgba(124,58,237,0.1)] to-[rgba(255,45,106,0.1)]',
    borderColor: 'border-[rgba(124,58,237,0.2)]',
  },
  {
    initials: 'SV',
    name: 'Sofia Vega',
    role: 'Candidate for President · Student Union',
    party: 'Student Union',
    votes: '18.1%',
    voteCount: '53',
    exp: '3',
    policies: '4',
    desc: 'Former Vice President. Advocating for better student welfare.',
    tags: ['Student Welfare', 'Campus Life', 'Inclusivity'],
    gradient: 'from-[#ff2d6a] to-[#f59e0b]',
    bgGradient: 'from-[rgba(255,45,106,0.1)] to-[rgba(245,158,11,0.1)]',
    borderColor: 'border-[rgba(255,45,106,0.2)]',
  },
  {
    initials: 'JO',
    name: 'James Okafor',
    role: 'Board Member · Oakwood HOA',
    party: 'Oakwood HOA',
    votes: '15.0%',
    voteCount: '45',
    exp: '5',
    policies: '2',
    desc: 'Resident for 10 years. Wants to upgrade the community park.',
    tags: ['Maintenance', 'Security', 'Community Park'],
    gradient: 'from-[#00ff88] to-[#00d4ff]',
    bgGradient: 'from-[rgba(0,255,136,0.1)] to-[rgba(0,212,255,0.1)]',
    borderColor: 'border-[rgba(0,255,136,0.2)]',
  },
]

export default function Candidates() {
  return (
    <section className="py-24 px-[5%]" id="candidates">
      <div className="text-center mb-16">
        <div className="inline-block font-mono text-xs text-[#00d4ff] tracking-wider uppercase mb-4 px-3.5 py-1 border border-[rgba(0,212,255,0.2)] rounded bg-[rgba(0,212,255,0.04)] fade-in">
          Radical Transparency
        </div>
        <h2 className="font-orb text-4xl lg:text-5xl font-bold text-white leading-tight mb-4 fade-in stagger-1">
          Know Every<br />
          <span className="bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] bg-clip-text text-transparent">Candidate</span>
        </h2>
        <p className="text-base text-[#94a3b8] max-w-2xl mx-auto leading-relaxed fade-in stagger-2">
          Full disclosure, publicly verifiable records. Every candidate&apos;s biography, qualifications, and manifestos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {candidates.map((cand) => (
          <div key={cand.initials} className={`bg-[rgba(0,212,255,0.04)] border border-[rgba(0,212,255,0.18)] rounded-2xl overflow-hidden hover:-translate-y-1.5 hover:border-[rgba(0,212,255,0.4)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_30px_rgba(0,212,255,0.1)] transition-all duration-300 fade-in`}>
            <div className="p-6 pb-4">
              <div className={`text-xs font-bold tracking-widest uppercase mb-3 px-2.5 py-1 rounded bg-gradient-to-br ${cand.bgGradient} border ${cand.borderColor} w-fit`}>
                {cand.party}
              </div>
              <div className={`w-[72px] h-[72px] rounded-full border-2 border-[rgba(0,212,255,0.18)] flex items-center justify-center text-2xl font-bold mb-3.5 bg-gradient-to-br ${cand.bgGradient}`}>
                {cand.initials}
              </div>
              <h3 className="font-orb text-lg font-bold text-white mb-1">{cand.name}</h3>
              <p className="text-xs text-[#94a3b8]">{cand.role}</p>
            </div>

            <div className="px-6 pb-4">
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#94a3b8]">Vote Share</span>
                  <span className={`font-orb font-bold bg-gradient-to-r ${cand.gradient} bg-clip-text text-transparent`}>{cand.votes}</span>
                </div>
                <div className="h-1.5 bg-[#0e0e24] rounded-full overflow-hidden border border-[rgba(0,212,255,0.18)]">
                  <div className={`h-full bg-gradient-to-r ${cand.gradient} w-2/3`}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-[#0e0e24] border border-[rgba(0,212,255,0.18)] rounded p-2 text-center">
                  <div className="font-orb font-bold text-[#00d4ff] text-sm">{cand.exp}</div>
                  <div className="text-xs text-[#475569] uppercase tracking-wider">Yrs Exp</div>
                </div>
                <div className="bg-[#0e0e24] border border-[rgba(0,212,255,0.18)] rounded p-2 text-center">
                  <div className="font-orb font-bold text-[#00d4ff] text-sm">{cand.policies}</div>
                  <div className="text-xs text-[#475569] uppercase tracking-wider">Policies</div>
                </div>
              </div>

              <p className="text-xs text-[#94a3b8] leading-relaxed mb-3">{cand.desc}</p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {cand.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-1 bg-[rgba(124,58,237,0.1)] text-[#7c3aed] border border-[rgba(124,58,237,0.2)] rounded font-mono">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-[rgba(0,212,255,0.18)] px-6 py-4 bg-[rgba(0,0,0,0.2)] flex gap-2">
              <button className="flex-1 px-2 py-1.5 text-xs font-bold border border-[rgba(0,212,255,0.18)] text-[#94a3b8] rounded hover:border-[#00d4ff] hover:text-[#00d4ff] transition-all">
                View Profile
              </button>
              <button className="flex-1 px-2 py-1.5 text-xs font-bold border border-[rgba(0,212,255,0.18)] text-[#94a3b8] rounded hover:border-[#00d4ff] hover:text-[#00d4ff] transition-all">
                Manifesto
              </button>
              <button className="flex-1 px-2 py-1.5 text-xs font-bold bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white rounded hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all">
                Vote
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
