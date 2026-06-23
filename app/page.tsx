import Navbar from '@/components/Navbar'
import Hero from '@/components/sections/Hero'
import Features from '@/components/sections/Features'
import Dashboards from '@/components/sections/Dashboards'
import Candidates from '@/components/sections/Candidates'
import Results from '@/components/sections/Results'
import HowItWorks from '@/components/sections/HowItWorks'
import Pricing from '@/components/sections/Pricing'
import Footer from '@/components/Footer'
import { prisma } from '@/lib/prisma'

const formatCompact = (num: number) => {
  if (num === 0) return '0';
  return Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(num);
};

export default async function Home() {
  const [voterCount, electionCount, voteCount, candidateCount] = await Promise.all([
    prisma.user.count({ where: { role: 'VOTER' } }),
    prisma.election.count(),
    prisma.vote.count(),
    prisma.candidate.count()
  ])

  const stats = {
    voterCount: formatCompact(voterCount),
    electionCount: formatCompact(electionCount),
    voteCount: formatCompact(voteCount),
    candidateCount: formatCompact(candidateCount),
    voterTurnout: voterCount > 0 ? ((voteCount / voterCount) * 100).toFixed(1) + '%' : '0%',
  }

  return (
    <main>
      <Navbar />
      <Hero stats={stats} />
      <Features />
      <Dashboards stats={stats} />
      <Candidates />
      <Results />
      <HowItWorks />
      <Pricing />
      <Footer />
    </main>
  )
}
