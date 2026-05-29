import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#060611] text-white">
      <Navbar />
      <section className="pt-32 pb-24 px-[5%] max-w-4xl mx-auto">
        <div className="text-center mb-16 fade-in">
          <div className="inline-block font-mono text-xs text-[#00d4ff] tracking-wider uppercase mb-4 px-3.5 py-1 border border-[rgba(0,212,255,0.2)] rounded bg-[rgba(0,212,255,0.04)]">
            Contact Sales
          </div>
          <h1 className="font-orb text-4xl lg:text-5xl font-bold leading-tight mb-4">
            Let&apos;s Build the Future of<br />
            <span className="bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] bg-clip-text text-transparent">Enterprise Voting</span>
          </h1>
          <p className="text-[#94a3b8] max-w-2xl mx-auto leading-relaxed">
            Interested in our Enterprise plan, custom integrations, or on-premise deployment? Fill out the form below and our team will get back to you within 24 hours.
          </p>
        </div>

        <div className="bg-[#0a0a1a] border border-[rgba(0,212,255,0.18)] rounded-2xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] fade-in stagger-1">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs text-[#94a3b8] tracking-widest uppercase font-mono">First Name</label>
                <input type="text" className="w-full bg-[#0e0e24] border border-[rgba(0,212,255,0.18)] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00d4ff] transition-colors" placeholder="John" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#94a3b8] tracking-widest uppercase font-mono">Last Name</label>
                <input type="text" className="w-full bg-[#0e0e24] border border-[rgba(0,212,255,0.18)] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00d4ff] transition-colors" placeholder="Doe" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs text-[#94a3b8] tracking-widest uppercase font-mono">Work Email</label>
              <input type="email" className="w-full bg-[#0e0e24] border border-[rgba(0,212,255,0.18)] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00d4ff] transition-colors" placeholder="john@company.com" />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-[#94a3b8] tracking-widest uppercase font-mono">Organization Type</label>
              <select className="w-full bg-[#0e0e24] border border-[rgba(0,212,255,0.18)] rounded-lg px-4 py-3 text-sm text-[#94a3b8] focus:outline-none focus:border-[#00d4ff] transition-colors appearance-none">
                <option value="">Select organization type...</option>
                <option value="government">Government / Municipality</option>
                <option value="corporate">Corporate</option>
                <option value="education">Educational Institution</option>
                <option value="ngo">Non-Profit / NGO</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-[#94a3b8] tracking-widest uppercase font-mono">Message</label>
              <textarea rows={4} className="w-full bg-[#0e0e24] border border-[rgba(0,212,255,0.18)] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00d4ff] transition-colors resize-none" placeholder="Tell us about your election needs..."></textarea>
            </div>

            <button type="button" className="w-full py-3.5 rounded-lg font-bold text-sm tracking-widest uppercase bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white shadow-[0_0_30px_rgba(0,212,255,0.25)] hover:shadow-[0_0_40px_rgba(0,212,255,0.5)] transition-all">
              Send Message
            </button>
          </form>
        </div>
      </section>
      <Footer />
    </main>
  )
}
