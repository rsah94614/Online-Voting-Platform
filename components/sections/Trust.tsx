export default function Trust() {
  return (
    <section className="py-24 px-[5%]" id="trust">
      <div className="text-center mb-16">
        <div className="inline-block font-mono text-xs text-[#00d4ff] tracking-wider uppercase mb-4 px-3.5 py-1 border border-[rgba(0,212,255,0.2)] rounded bg-[rgba(0,212,255,0.04)] fade-in">
          Trusted Worldwide
        </div>
        <h2 className="font-orb text-4xl lg:text-5xl font-bold text-white leading-tight mb-4 fade-in stagger-1">
          Built for the World&apos;s<br />
          <span className="bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] bg-clip-text text-transparent">Most Critical Decisions</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="grid grid-cols-2 gap-4 fade-in-left">
          {[
            { num: '127M+', label: 'Votes Secured' },
            { num: '4,800+', label: 'Elections Conducted' },
            { num: '98', label: 'Countries Active' },
            { num: '0', label: 'Security Breaches' }
          ].map((stat) => (
            <div key={stat.label} className="bg-[#0a0a1a] border border-[rgba(0,212,255,0.18)] rounded-2xl p-7 text-center relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-[#00d4ff] before:to-[#7c3aed]">
              <div className="font-orb text-3xl lg:text-4xl font-black bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] bg-clip-text text-transparent mb-1.5">
                {stat.num}
              </div>
              <div className="text-xs text-[#475569] tracking-widest uppercase">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-4 fade-in-right">
          {[
            {
              text: 'VOTEX handled our 2.4 million-voter national referendum without a single glitch. The real-time results dashboard gave our commission full visibility.',
              author: 'Dr. Ramona Osei',
              role: 'Chief Electoral Commissioner, Ghana Electoral Commission',
            },
            {
              text: 'We switched from paper ballots to VOTEX for our 80,000-student university elections. Turnout went from 18% to 67% in the first year.',
              author: 'Prof. Kavita Sharma',
              role: 'Dean of Student Affairs, IIT Bombay',
            },
          ].map((testimonial) => (
            <div key={testimonial.author} className="bg-[rgba(0,212,255,0.04)] border border-[rgba(0,212,255,0.18)] rounded-2xl p-6 relative">
              <div className="absolute top-4 right-6 text-5xl text-[rgba(0,212,255,0.08)] font-orb leading-none">&quot;</div>
              <p className="text-sm text-[#94a3b8] mb-4 leading-relaxed italic">{testimonial.text}</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#7c3aed] flex items-center justify-center text-xs font-bold text-white">
                  {testimonial.author.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{testimonial.author}</div>
                  <div className="text-xs text-[#475569]">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-2.5 pt-2">
            {[
              { icon: '🔒', text: 'SOC 2 Type II' },
              { icon: '🌐', text: 'ISO 27001' },
              { icon: '🔐', text: 'GDPR Compliant' },
              { icon: '⛓️', text: 'Blockchain Audited' },
              { icon: '🛡️', text: 'Zero-Knowledge Proof' },
              { icon: '✅', text: 'EAC Certified' },
            ].map((badge) => (
              <div key={badge.text} className="flex items-center gap-2 px-4 py-2 border border-[rgba(0,212,255,0.18)] rounded-lg bg-[rgba(0,212,255,0.04)] hover:border-[#00d4ff] hover:text-[#00d4ff] transition-all">
                <span>{badge.icon}</span>
                <span className="text-xs font-medium">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
