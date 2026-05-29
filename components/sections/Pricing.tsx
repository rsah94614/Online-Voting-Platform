import Link from 'next/link'

export default function Pricing() {
  const plans = [
    {
      tier: 'Starter',
      price: '0',
      cycle: 'Forever free',
      desc: 'Perfect for student elections, small communities, clubs, and organizations.',
      features: [
        { check: true, text: 'Up to 500 voters per election' },
        { check: true, text: 'Up to 10 candidates' },
        { check: true, text: '3 elections per month' },
        { check: true, text: 'Basic analytics' },
        { check: true, text: 'Email OTP verification' },
        { check: false, text: 'Real-time live results' },
        { check: false, text: 'Party dashboards' },
        { check: false, text: 'Biometric auth' },
      ],
      buttonText: 'Get Started Free',
      buttonLink: '/login',
      buttonStyle: 'border border-[rgba(0,212,255,0.18)] text-[#94a3b8] hover:border-[#00d4ff] hover:text-[#00d4ff]',
    },
    {
      tier: 'Professional',
      price: '2,999',
      cycle: 'per election · or ₹9,999/month unlimited',
      desc: 'For corporate elections, city councils, universities, and organizations.',
      features: [
        { check: true, text: 'Unlimited voters & candidates' },
        { check: true, text: 'Unlimited elections' },
        { check: true, text: 'Real-time live results' },
        { check: true, text: 'All 4 role dashboards' },
        { check: true, text: 'Advanced analytics' },
        { check: true, text: 'Biometric + National ID auth' },
        { check: true, text: 'Custom branding' },
        { check: true, text: 'API access + webhooks' },
      ],
      buttonText: 'Start Free Trial',
      buttonLink: '/login',
      buttonStyle: 'bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white shadow-[0_0_30px_rgba(0,212,255,0.25)] hover:shadow-[0_0_40px_rgba(0,212,255,0.5)]',
      featured: true,
    },
    {
      tier: 'Enterprise',
      price: 'Custom',
      cycle: 'Contact sales for pricing',
      desc: 'For government agencies, national commissions, and large-scale organizations.',
      features: [
        { check: true, text: 'Everything in Professional' },
        { check: true, text: 'Dedicated cloud infrastructure' },
        { check: true, text: 'On-premise deployment option' },
        { check: true, text: '99.99% SLA guarantee' },
        { check: true, text: 'Government compliance (EAC, VVSG)' },
        { check: true, text: '24/7 dedicated support' },
        { check: true, text: 'Custom integrations' },
        { check: true, text: 'White-label & custom domain' },
      ],
      buttonText: 'Contact Sales →',
      buttonLink: '/contact',
      buttonStyle: 'border border-[rgba(124,58,237,0.3)] text-[#7c3aed] hover:border-[#7c3aed]',
    },
  ]

  return (
    <section className="py-24 px-[5%]" id="pricing">
      <div className="text-center mb-16">
        <div className="inline-block font-mono text-xs text-[#00d4ff] tracking-wider uppercase mb-4 px-3.5 py-1 border border-[rgba(0,212,255,0.2)] rounded bg-[rgba(0,212,255,0.04)] fade-in">
          Simple Pricing
        </div>
        <h2 className="font-orb text-4xl lg:text-5xl font-bold text-white leading-tight mb-4 fade-in stagger-1">
          Scale From Free<br />
          <span className="bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] bg-clip-text text-transparent">to National</span>
        </h2>
        <p className="text-base text-[#94a3b8] max-w-2xl mx-auto leading-relaxed fade-in stagger-2">
          Start free with no credit card. Scale as you grow. Enterprise clients get dedicated infrastructure and SLA guarantees.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.tier}
            className={`bg-[rgba(0,212,255,0.04)] border rounded-2xl p-8 relative fade-in transition-all hover:-translate-y-1 ${
              plan.featured
                ? 'lg:scale-105 border-[rgba(0,212,255,0.5)] shadow-[0_0_60px_rgba(0,212,255,0.1),inset_0_0_60px_rgba(0,212,255,0.02)]'
                : 'border-[rgba(0,212,255,0.18)] hover:border-[rgba(0,212,255,0.4)] overflow-hidden'
            }`}
          >
            {plan.featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white text-xs py-1 px-4 rounded-full font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(0,212,255,0.3)]">
                MOST POPULAR
              </div>
            )}

            <div className={plan.featured ? 'mt-8' : ''}>
              <div className="text-xs text-[#94a3b8] tracking-widest uppercase font-mono mb-2">{plan.tier}</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-orb text-4xl font-black text-white">{plan.price === 'Custom' ? '' : '₹'}</span>
                <span className="font-orb text-5xl font-black text-white">{plan.price}</span>
              </div>
              <div className="text-xs text-[#475569] mb-5">{plan.cycle}</div>
              <p className="text-sm text-[#94a3b8] mb-6 leading-relaxed pb-6 border-b border-[rgba(0,212,255,0.18)]">{plan.desc}</p>

              <div className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <div key={feature.text} className="flex items-center gap-3 text-sm text-[#94a3b8]">
                    {feature.check ? (
                      <span className="w-4.5 h-4.5 rounded-full bg-[rgba(0,255,136,0.12)] border border-[rgba(0,255,136,0.2)] flex items-center justify-center text-xs text-[#00ff88] flex-shrink-0">✓</span>
                    ) : (
                      <span className="w-4.5 h-4.5 rounded-full bg-[#0e0e24] border border-[rgba(0,212,255,0.18)] flex-shrink-0"></span>
                    )}
                    <span className={feature.check ? '' : 'text-[#475569]'}>{feature.text}</span>
                  </div>
                ))}
              </div>

              <Link href={plan.buttonLink} className="block w-full">
                <button className={`w-full py-3 rounded-lg font-bold text-sm tracking-widest uppercase transition-all ${plan.buttonStyle}`}>
                  {plan.buttonText}
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
