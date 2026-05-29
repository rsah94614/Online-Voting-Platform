import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#0e0e24] border-t border-[rgba(0,212,255,0.18)] pt-[60px] pb-8 px-[5%] relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-10 mb-12">
        <div className="md:col-span-3 lg:col-span-2">
          <Link href="/" className="flex items-center gap-2.5 no-underline mb-1">
            <div className="w-[34px] h-[34px] bg-gradient-to-br from-[#00d4ff] to-[#7c3aed] rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.4)]">
              <span className="font-orb font-black text-sm text-white">VX</span>
            </div>
            <div>
              <div className="font-orb font-bold text-lg bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] bg-clip-text text-transparent tracking-wider">VOTEX</div>
              <span className="text-xs text-[#00d4ff] tracking-widest uppercase font-mono block -mt-1 font-semibold">Enterprise</span>
            </div>
          </Link>
          <p className="text-sm text-[#94a3b8] mt-4 max-w-sm leading-relaxed">
            The world&apos;s most trusted digital election platform. Powering democracy at every scale.
          </p>
        </div>

        <div>
          <h4 className="font-orb text-xs font-bold text-white tracking-wider uppercase mb-4">Platform</h4>
          <nav className="flex flex-col gap-2">
            <Link href="/login" className="text-sm text-[#94a3b8] hover:text-[#00d4ff] transition-colors">Admin Portal</Link>
            <Link href="/login" className="text-sm text-[#94a3b8] hover:text-[#00d4ff] transition-colors">Voter Access</Link>
            <Link href="/verify" className="text-sm text-[#94a3b8] hover:text-[#00d4ff] transition-colors">Verify Vote</Link>
            <Link href="/login" className="text-sm text-[#94a3b8] hover:text-[#00d4ff] transition-colors">Party Management</Link>
          </nav>
        </div>

        <div>
          <h4 className="font-orb text-xs font-bold text-white tracking-wider uppercase mb-4">Security</h4>
          <nav className="flex flex-col gap-2">
            <span className="text-sm text-[#94a3b8] cursor-default">End-to-End Encryption</span>
            <span className="text-sm text-[#94a3b8] cursor-default">Zero-Knowledge Auth</span>
            <span className="text-sm text-[#94a3b8] cursor-default">Anti-Bandwagon Systems</span>
            <span className="text-sm text-[#94a3b8] cursor-default">Audit Logs</span>
          </nav>
        </div>

        <div>
          <h4 className="font-orb text-xs font-bold text-white tracking-wider uppercase mb-4">Support</h4>
          <nav className="flex flex-col gap-2">
            <span className="text-sm text-[#94a3b8] cursor-default">Admin Guide</span>
            <span className="text-sm text-[#94a3b8] cursor-default">Voter Help Center</span>
            <span className="text-sm text-[#94a3b8] cursor-default">System Status</span>
            <span className="text-sm text-[#94a3b8] cursor-default">Contact Support</span>
          </nav>
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-[rgba(0,212,255,0.18)] flex-wrap gap-4">
        <p className="text-xs text-[#475569]">© {new Date().getFullYear()} VOTEX Technologies Inc. All rights reserved.</p>
        <div className="flex gap-6 flex-wrap">
          <Link href="#" className="text-xs text-[#475569] hover:text-[#00d4ff] transition-colors">Privacy Policy</Link>
          <Link href="#" className="text-xs text-[#475569] hover:text-[#00d4ff] transition-colors">Terms of Service</Link>
          <Link href="#" className="text-xs text-[#475569] hover:text-[#00d4ff] transition-colors">Trust & Safety</Link>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#00ff88] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] shadow-[0_0_6px_#00ff88] inline-block"></span>
          All systems operational
        </div>
      </div>
    </footer>
  )
}
