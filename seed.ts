// prisma/seed.ts
import { PrismaClient, Role, ElectionStatus, ElectionType, VotingMethod, CandidateStatus, PartyStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── Clean up ──────────────────────────────────────────────────────────────
  await prisma.vote.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.voterRegistration.deleteMany()
  await prisma.candidateProfile.deleteMany()
  await prisma.constituency.deleteMany()
  await prisma.election.deleteMany()
  await prisma.partyMember.deleteMany()
  await prisma.party.deleteMany()
  await prisma.session.deleteMany()
  await prisma.otpCode.deleteMany()
  await prisma.user.deleteMany()

  const HASH = await bcrypt.hash('Demo@1234', 12)

  // ── Admin ─────────────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      email: 'admin@votex.io',
      name: 'System Administrator',
      password: HASH,
      role: Role.ADMIN,
      isVerified: true,
      nationality: 'Indian',
    },
  })

  // ── Parties ───────────────────────────────────────────────────────────────
  const [npParty, laParty, ufParty, gfParty] = await Promise.all([
    prisma.party.create({
      data: {
        name: 'National Progress Party',
        abbreviation: 'NPP',
        color: '#00d4ff',
        description: 'A progressive party focused on technology, education, and sustainable growth.',
        ideology: ['Progressive', 'Social Democracy', 'Tech Policy'],
        foundedYear: 1998,
        website: 'https://npp.example.com',
        status: PartyStatus.ACTIVE,
      },
    }),
    prisma.party.create({
      data: {
        name: 'Liberty Alliance',
        abbreviation: 'LA',
        color: '#7c3aed',
        description: 'Champions of constitutional rights, economic liberalism, and judicial reform.',
        ideology: ['Liberalism', 'Constitutional Rights', 'Free Market'],
        foundedYear: 2002,
        website: 'https://la.example.com',
        status: PartyStatus.ACTIVE,
      },
    }),
    prisma.party.create({
      data: {
        name: 'United Front',
        abbreviation: 'UF',
        color: '#ff2d6a',
        description: 'Coalition for housing reform, social equity, and workers rights.',
        ideology: ['Social Justice', 'Labour Rights', 'Housing Reform'],
        foundedYear: 2010,
        status: PartyStatus.ACTIVE,
      },
    }),
    prisma.party.create({
      data: {
        name: 'Green Future Party',
        abbreviation: 'GFP',
        color: '#00ff88',
        description: 'Environmental science meets bold policy for a sustainable planet.',
        ideology: ['Environmentalism', 'Net-Zero', 'Clean Energy'],
        foundedYear: 2015,
        status: PartyStatus.ACTIVE,
      },
    }),
  ])

  // ── Candidate Users ────────────────────────────────────────────────────────
  const [uAria, uMarcus, uSofia, uJames] = await Promise.all([
    prisma.user.create({ data: { email: 'aria@votex.io',   name: 'Aria Chen',    password: HASH, role: Role.CANDIDATE, isVerified: true } }),
    prisma.user.create({ data: { email: 'marcus@votex.io', name: 'Marcus Reed',  password: HASH, role: Role.CANDIDATE, isVerified: true } }),
    prisma.user.create({ data: { email: 'sofia@votex.io',  name: 'Sofia Vega',   password: HASH, role: Role.CANDIDATE, isVerified: true } }),
    prisma.user.create({ data: { email: 'james@votex.io',  name: 'James Okafor', password: HASH, role: Role.CANDIDATE, isVerified: true } }),
  ])

  // ── Party Admins ──────────────────────────────────────────────────────────
  const partyAdminUser = await prisma.user.create({
    data: { email: 'party@votex.io', name: 'Ray Nakamura', password: HASH, role: Role.PARTY_ADMIN, isVerified: true },
  })
  await prisma.partyMember.create({ data: { userId: partyAdminUser.id, partyId: npParty.id, role: 'ADMIN' } })

  // ── Voter Users ───────────────────────────────────────────────────────────
  const voter = await prisma.user.create({
    data: { email: 'voter@votex.io', name: 'Alex Johnson', password: HASH, role: Role.VOTER, isVerified: true },
  })

  // Create extra demo voters
  const extraVoterData = Array.from({ length: 20 }, (_, i) => ({
    email: `voter${i + 2}@votex.io`,
    name: `Demo Voter ${i + 2}`,
    password: HASH,
    role: Role.VOTER as Role,
    isVerified: true,
  }))
  await prisma.user.createMany({ data: extraVoterData })

  // ── Main Election ─────────────────────────────────────────────────────────
  const now = new Date()
  const election = await prisma.election.create({
    data: {
      title: 'National Presidential Election 2024',
      description: 'The quadrennial presidential election to elect the next President of the Republic.',
      type: ElectionType.PRESIDENTIAL,
      status: ElectionStatus.LIVE,
      votingMethod: VotingMethod.FPTP,
      startDate: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2h ago
      endDate:   new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4h from now
      registrationDeadline: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      anonymizeVoters: true,
      launchedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      createdById: admin.id,
    },
  })

  // Upcoming election
  const upcomingElection = await prisma.election.create({
    data: {
      title: 'Senate District 7 By-Election 2024',
      description: 'By-election to fill the vacant Senate seat for District 7.',
      type: ElectionType.PARLIAMENTARY,
      status: ElectionStatus.UPCOMING,
      votingMethod: VotingMethod.FPTP,
      startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      endDate:   new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      createdById: admin.id,
    },
  })

  // Draft election
  await prisma.election.create({
    data: {
      title: 'University Student Council Elections 2025',
      description: 'Annual student council elections for all departments.',
      type: ElectionType.UNIVERSITY,
      status: ElectionStatus.DRAFT,
      votingMethod: VotingMethod.RANKED_CHOICE,
      startDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      endDate:   new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000),
      createdById: admin.id,
    },
  })

  // ── Candidates for main election ─────────────────────────────────────────
  const [cAria, cMarcus, cSofia, cJames] = await Promise.all([
    prisma.candidateProfile.create({
      data: {
        userId: uAria.id,
        electionId: election.id,
        partyId: npParty.id,
        status: CandidateStatus.APPROVED,
        biography: 'Former Minister of Digital Affairs, PhD in Public Policy from MIT. 22 years in democratic governance with a focus on technology-driven civic reform.',
        education: JSON.stringify([{ institution: 'MIT', degree: 'PhD', field: 'Public Policy', year: '2002' }, { institution: 'IIT Delhi', degree: 'B.Tech', field: 'Computer Science', year: '1998' }]),
        achievements: ['Digital India Award 2019', 'UN Governance Fellowship 2015', '3x Best Legislator Award'],
        manifesto: 'A digitally empowered, equitable India where every citizen has access to quality healthcare, education, and economic opportunities through smart governance and technology-first policy.',
        keyPolicies: JSON.stringify([
          { title: 'Digital Healthcare for All', summary: 'Universal digital health records and telemedicine access for rural areas', category: 'Healthcare' },
          { title: 'Education 2030', summary: '100% school enrollment with AI-powered personalized learning', category: 'Education' },
        ]),
        assetDeclarations: JSON.stringify([{ type: 'Property', description: 'Residential Apartment, Delhi', value: 12000000, currency: 'INR' }]),
        socialLinks: JSON.stringify({ twitter: '@aria_chen_np', linkedin: 'aria-chen' }),
        constituency: 'New Delhi Central',
      },
    }),
    prisma.candidateProfile.create({
      data: {
        userId: uMarcus.id,
        electionId: election.id,
        partyId: laParty.id,
        status: CandidateStatus.APPROVED,
        biography: 'Senator for 12 years, Harvard Law graduate. Champion of constitutional rights, economic liberalism, and judicial reform.',
        education: JSON.stringify([{ institution: 'Harvard Law School', degree: 'JD', field: 'Law', year: '2004' }]),
        achievements: ['Best Senator Award 2020', 'Civil Rights Commission Member', 'Author of Liberty Bill 2018'],
        manifesto: 'A free, fair, and just society built on constitutional principles, economic freedom, and an independent judiciary that serves every citizen equally.',
        keyPolicies: JSON.stringify([
          { title: 'Judicial Independence Act', summary: 'Ensure judicial appointments free from political influence', category: 'Legal' },
          { title: 'Economic Freedom Charter', summary: 'Reduce regulatory burden on small businesses', category: 'Economy' },
        ]),
        assetDeclarations: JSON.stringify([{ type: 'Investments', description: 'Stock portfolio', value: 5000000, currency: 'INR' }]),
        constituency: 'Mumbai South',
      },
    }),
    prisma.candidateProfile.create({
      data: {
        userId: uSofia.id,
        electionId: election.id,
        partyId: ufParty.id,
        status: CandidateStatus.APPROVED,
        biography: 'Grassroots activist turned national leader. Two-term city mayor, renowned for housing reform and social equity programs.',
        achievements: ['Housing Reform Award 2021', 'Forbes 40 Under 40', '200,000 families helped through Affordable Housing Initiative'],
        manifesto: 'Fair housing for every family. Living wages for every worker. Quality public services in every neighborhood. The United Front believes prosperity must be shared.',
        constituency: 'Chennai Central',
      },
    }),
    prisma.candidateProfile.create({
      data: {
        userId: uJames.id,
        electionId: election.id,
        partyId: gfParty.id,
        status: CandidateStatus.APPROVED,
        biography: 'Environmental scientist and first-time presidential candidate with a bold agenda for net-zero by 2035.',
        achievements: ['UN Climate Award 2022', 'Founder — Clean India Initiative', 'TED Speaker: "The Green Revolution"'],
        manifesto: 'The planet cannot wait. We commit to net-zero by 2035, 100% renewable energy by 2030, and a Green Jobs Guarantee for every displaced worker.',
        constituency: 'Bangalore South',
      },
    }),
  ])

  // ── Voter Registrations ───────────────────────────────────────────────────
  await prisma.voterRegistration.create({
    data: { userId: voter.id, electionId: election.id, isVerified: true, verifiedAt: new Date() },
  })

  // ── Votes ─────────────────────────────────────────────────────────────────
  const allUsers = await prisma.user.findMany({ where: { role: Role.VOTER } })
  const candidateIds = [cAria.id, cMarcus.id, cSofia.id, cJames.id]
  const weights = [0.342, 0.287, 0.221, 0.15] // vote distribution

  for (const u of allUsers.slice(0, 20)) {
    const rand = Math.random()
    let cumulative = 0
    let chosen = candidateIds[0]
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i]
      if (rand <= cumulative) { chosen = candidateIds[i]; break }
    }
    await prisma.vote.create({
      data: {
        electionId: election.id,
        candidateId: chosen,
        voterId: u.id,
        receipt: `RCPT-${u.id.slice(0, 8).toUpperCase()}`,
      },
    }).catch(() => {}) // ignore duplicates
  }

  // ── Audit Logs ────────────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, electionId: election.id, action: 'ELECTION_CREATED', entity: 'Election', entityId: election.id },
      { userId: admin.id, electionId: election.id, action: 'ELECTION_LAUNCHED', entity: 'Election', entityId: election.id },
      { userId: admin.id, action: 'CANDIDATE_APPROVED', entity: 'Candidate', entityId: cAria.id },
    ],
  })

  console.log('✅ Seeding complete!')
  console.log('\n📋 Demo Accounts:')
  console.log('  Admin:      admin@votex.io     / Demo@1234')
  console.log('  Candidate:  aria@votex.io      / Demo@1234')
  console.log('  Party:      party@votex.io     / Demo@1234')
  console.log('  Voter:      voter@votex.io     / Demo@1234')
}

main().catch(console.error).finally(() => prisma.$disconnect())