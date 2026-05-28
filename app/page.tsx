import Navbar from '@/components/Navbar'
import Hero from '@/components/sections/Hero'
import Features from '@/components/sections/Features'
import Dashboards from '@/components/sections/Dashboards'
import Candidates from '@/components/sections/Candidates'
import Results from '@/components/sections/Results'
import HowItWorks from '@/components/sections/HowItWorks'
import Trust from '@/components/sections/Trust'
import Pricing from '@/components/sections/Pricing'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Features />
      <Dashboards />
      <Candidates />
      <Results />
      <HowItWorks />
      <Trust />
      <Pricing />
      <Footer />
    </main>
  )
}
