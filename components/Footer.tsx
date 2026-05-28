import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#0e0e24] border-t border-[rgba(0,212,255,0.18)] py-[60px_5%_32px] relative z-10">
      <div className="grid grid-cols-5 gap-10 mb-12 px-[5%]">
        <div>
          <Link href="/" className="flex items-center gap-2.5 no-underline mb-1">
            <div className="w-[34px] h-[34px] bg-gradient-to-br from-[#00d4ff] to-[#7c3aed] rounded-lg flex items-center justify-center">
              <span className="font-orb font-black text-sm text-white">VX</span>
            </div>
            <div>
              <div className="font-orb font-bold text-lg bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] bg-clip-text text-transparent">VOTEX</div>
              <span className="text-xs text-[#00d4ff] tracking-widest uppercase font-mono block -mt-1">Election Platform</span>
            </div>
          </Link>
          <p className="text-sm text-[#94a3b8] mt-3 max-w-xs leading-relaxed">
            The world&apos;s most trusted digital election platform. Powering democracy at every scale — from classrooms to nations.
          </p>
          <div className="flex gap-2.5 mt-5">
            {['𝕏', 'in', 'gh', 'yt'].map((icon) => (
              <a key={icon} href="#" className="w-9 h-9 rounded-lg border border-[rgba(0,212,255,0.18)] flex items-center justify-center text-[#94a3b8] hover:border-[#00d4ff] hover:text-[#00d4ff] hover:shadow-[0_0_12px_rgba(0,212,255,0.2)] transition-all">
                {icon}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-orb text-xs font-bold text-white tracking-wider uppercase mb-4">Product</h4>
          <nav className="flex flex-col gap-2">
            {['Features', 'Pricing', 'Changelog', 'Roadmap', 'API Reference'].map((link) => (
              <a key={link} href="#" className="text-sm text-[#94a3b8] hover:text-[#00d4ff] transition-colors">
                {link}
              </a>
            ))}
          </nav>
        </div>

        <div>
          <h4 className="font-orb text-xs font-bold text-white tracking-wider uppercase mb-4">Use Cases</h4>
          <nav className="flex flex-col gap-2">
            {['National Elections', 'Corporate Voting', 'Student Elections', 'Community Polls', 'Union Elections'].map((link) => (
              <a key={link} href="#" className="text-sm text-[#94a3b8] hover:text-[#00d4ff] transition-colors">
                {link}
              </a>
            ))}
          </nav>
        </div>

        <div>
          <h4 className="font-orb text-xs font-bold text-white tracking-wider uppercase mb-4">Developers</h4>
          <nav className="flex flex-col gap-2">
            {['Documentation', 'GitHub', 'SDK & Libraries', 'Webhooks', 'Status Page'].map((link) => (
              <a key={link} href="#" className="text-sm text-[#94a3b8] hover:text-[#00d4ff] transition-colors">
                {link}
              </a>
            ))}
          </nav>
        </div>

        <div>
          <h4 className="font-orb text-xs font-bold text-white tracking-wider uppercase mb-4">Company</h4>
          <nav className="flex flex-col gap-2">
            {['About Us', 'Blog', 'Careers', 'Security', 'Contact'].map((link) => (
              <a key={link} href="#" className="text-sm text-[#94a3b8] hover:text-[#00d4ff] transition-colors">
                {link}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 px-[5%] border-t border-[rgba(0,212,255,0.18)] flex-wrap gap-3">
        <p className="text-xs text-[#475569]">© 2024 VOTEX Technologies Inc. All rights reserved.</p>
        <div className="flex items-center gap-1.5 text-xs text-[#00ff88] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] shadow-[0_0_6px_#00ff88] inline-block"></span>
          All systems operational
        </div>
        <div className="flex gap-5">
          {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Security'].map((link) => (
            <a key={link} href="#" className="text-xs text-[#475569] hover:text-[#00d4ff] transition-colors no-underline">
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
