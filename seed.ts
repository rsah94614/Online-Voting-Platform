// seed.ts - Run with: npx prisma db seed
import { PrismaClient, Role, ElectionType, ElectionStatus, AuditAction } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding VOTEX database...");

  const DEMO_PASSWORD = await bcrypt.hash("Demo@1234", 12);

  // ── Admin ──────────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@votex.io" },
    update: {},
    create: {
      email: "admin@votex.io",
      passwordHash: DEMO_PASSWORD,
      name: "System Admin",
      role: Role.ADMIN,
      isVerified: true,
      isApproved: true,
    },
  });

  // ── Parties ────────────────────────────────────────────────────────────────
  const partyA = await prisma.party.upsert({
    where: { name: "National Progress Alliance" },
    update: {},
    create: {
      name: "National Progress Alliance",
      abbreviation: "NPA",
      color: "#00d4ff",
      description: "Forward-thinking governance for the digital age.",
      isActive: true,
    },
  });

  const partyB = await prisma.party.upsert({
    where: { name: "Liberty First Coalition" },
    update: {},
    create: {
      name: "Liberty First Coalition",
      abbreviation: "LFC",
      color: "#7c3aed",
      description: "Individual freedoms and limited government.",
      isActive: true,
    },
  });

  const partyC = await prisma.party.upsert({
    where: { name: "Green Futures Party" },
    update: {},
    create: {
      name: "Green Futures Party",
      abbreviation: "GFP",
      color: "#10b981",
      description: "Sustainable development and environmental stewardship.",
      isActive: true,
    },
  });

  // ── Party Admin ────────────────────────────────────────────────────────────
  const partyAdminUser = await prisma.user.upsert({
    where: { email: "party@votex.io" },
    update: {},
    create: {
      email: "party@votex.io",
      passwordHash: DEMO_PASSWORD,
      name: "Alex Morgan",
      role: Role.PARTY_ADMIN,
      isVerified: true,
      isApproved: true,
    },
  });
  await prisma.partyAdmin.upsert({
    where: { userId: partyAdminUser.id },
    update: {},
    create: { userId: partyAdminUser.id, partyId: partyA.id },
  });

  // ── Candidates ─────────────────────────────────────────────────────────────
  const candidateUser1 = await prisma.user.upsert({
    where: { email: "candidate@votex.io" },
    update: {},
    create: {
      email: "candidate@votex.io",
      passwordHash: DEMO_PASSWORD,
      name: "Jordan Rivera",
      role: Role.CANDIDATE,
      isVerified: true,
      isApproved: true,
    },
  });
  const candidate1 = await prisma.candidate.upsert({
    where: { userId: candidateUser1.id },
    update: {},
    create: {
      userId: candidateUser1.id,
      partyId: partyA.id,
      bio: "Experienced policy maker with 12 years in public service.",
      manifesto: "Digital infrastructure, healthcare reform, and education access for all.",
      isApproved: true,
    },
  });

  const candidateUser2 = await prisma.user.upsert({
    where: { email: "candidate2@votex.io" },
    update: {},
    create: {
      email: "candidate2@votex.io",
      passwordHash: DEMO_PASSWORD,
      name: "Sam Westbrook",
      role: Role.CANDIDATE,
      isVerified: true,
      isApproved: true,
    },
  });
  const candidate2 = await prisma.candidate.upsert({
    where: { userId: candidateUser2.id },
    update: {},
    create: {
      userId: candidateUser2.id,
      partyId: partyB.id,
      bio: "Entrepreneur and fiscal conservative.",
      manifesto: "Lower taxes, deregulation, and free-market solutions.",
      isApproved: true,
    },
  });

  const candidateUser3 = await prisma.user.upsert({
    where: { email: "candidate3@votex.io" },
    update: {},
    create: {
      email: "candidate3@votex.io",
      passwordHash: DEMO_PASSWORD,
      name: "Taylor Chen",
      role: Role.CANDIDATE,
      isVerified: true,
      isApproved: true,
    },
  });
  const candidate3 = await prisma.candidate.upsert({
    where: { userId: candidateUser3.id },
    update: {},
    create: {
      userId: candidateUser3.id,
      partyId: partyC.id,
      bio: "Environmental scientist and community organizer.",
      manifesto: "100% renewable energy, climate resilience, and green jobs.",
      isApproved: true,
    },
  });

  // Pending candidate (not yet approved)
  const pendingUser = await prisma.user.upsert({
    where: { email: "pending@votex.io" },
    update: {},
    create: {
      email: "pending@votex.io",
      passwordHash: DEMO_PASSWORD,
      name: "Dana Park",
      role: Role.CANDIDATE,
      isVerified: true,
      isApproved: false,
    },
  });
  await prisma.candidate.upsert({
    where: { userId: pendingUser.id },
    update: {},
    create: {
      userId: pendingUser.id,
      partyId: partyA.id,
      bio: "Civil rights attorney running for Senate.",
      isApproved: false,
    },
  });

  // ── Voters ─────────────────────────────────────────────────────────────────
  const voter = await prisma.user.upsert({
    where: { email: "voter@votex.io" },
    update: {},
    create: {
      email: "voter@votex.io",
      passwordHash: DEMO_PASSWORD,
      name: "Chris Nakamura",
      role: Role.VOTER,
      isVerified: true,
      isApproved: true,
    },
  });

  // Create some extra voters
  for (let i = 1; i <= 20; i++) {
    await prisma.user.upsert({
      where: { email: `voter${i}@votex.io` },
      update: {},
      create: {
        email: `voter${i}@votex.io`,
        passwordHash: DEMO_PASSWORD,
        name: `Voter ${i}`,
        role: Role.VOTER,
        isVerified: true,
        isApproved: true,
      },
    });
  }

  // ── Elections ──────────────────────────────────────────────────────────────
  const now = new Date();
  const liveElection = await prisma.election.upsert({
    where: { id: "election-live-001" },
    update: {},
    create: {
      id: "election-live-001",
      title: "2026 Presidential Election",
      description: "National presidential election. All registered voters are eligible.",
      type: ElectionType.PRESIDENTIAL,
      status: ElectionStatus.LIVE,
      startDate: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2h ago
      endDate: new Date(now.getTime() + 22 * 60 * 60 * 1000),  // 22h from now
      totalVoters: 21,
    },
  });

  const upcomingElection = await prisma.election.upsert({
    where: { id: "election-upcoming-001" },
    update: {},
    create: {
      id: "election-upcoming-001",
      title: "Senate District 7 By-Election",
      description: "Special by-election for the vacant Senate seat in District 7.",
      type: ElectionType.SENATE,
      status: ElectionStatus.UPCOMING,
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
      totalVoters: 0,
    },
  });

  const endedElection = await prisma.election.upsert({
    where: { id: "election-ended-001" },
    update: {},
    create: {
      id: "election-ended-001",
      title: "Municipal Council 2025",
      description: "City municipal council elections.",
      type: ElectionType.MUNICIPAL,
      status: ElectionStatus.ENDED,
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000),
      totalVoters: 850,
    },
  });

  // ── Election Candidates ────────────────────────────────────────────────────
  const ec1 = await prisma.electionCandidate.upsert({
    where: { electionId_candidateId: { electionId: liveElection.id, candidateId: candidate1.id } },
    update: {},
    create: { electionId: liveElection.id, candidateId: candidate1.id },
  });
  const ec2 = await prisma.electionCandidate.upsert({
    where: { electionId_candidateId: { electionId: liveElection.id, candidateId: candidate2.id } },
    update: {},
    create: { electionId: liveElection.id, candidateId: candidate2.id },
  });
  const ec3 = await prisma.electionCandidate.upsert({
    where: { electionId_candidateId: { electionId: liveElection.id, candidateId: candidate3.id } },
    update: {},
    create: { electionId: liveElection.id, candidateId: candidate3.id },
  });

  // Ended election candidates
  const ec4 = await prisma.electionCandidate.upsert({
    where: { electionId_candidateId: { electionId: endedElection.id, candidateId: candidate1.id } },
    update: {},
    create: { electionId: endedElection.id, candidateId: candidate1.id },
  });
  const ec5 = await prisma.electionCandidate.upsert({
    where: { electionId_candidateId: { electionId: endedElection.id, candidateId: candidate2.id } },
    update: {},
    create: { electionId: endedElection.id, candidateId: candidate2.id },
  });

  // ── Sample Votes (live election) ───────────────────────────────────────────
  const allVoters = await prisma.user.findMany({ where: { role: Role.VOTER, isApproved: true } });
  const ecIds = [ec1.id, ec2.id, ec3.id];
  
  for (let i = 0; i < Math.min(allVoters.length - 1, 15); i++) {
    const v = allVoters[i];
    const pick = ecIds[i % 3];
    try {
      await prisma.vote.upsert({
        where: { voterId_electionId: { voterId: v.id, electionId: liveElection.id } },
        update: {},
        create: {
          voterId: v.id,
          electionId: liveElection.id,
          electionCandidateId: pick,
          receiptHash: `hash-${v.id}-${liveElection.id}`,
        },
      });
    } catch {}
  }

  // Ended election votes
  const endedVoters = allVoters.slice(0, 8);
  for (let i = 0; i < endedVoters.length; i++) {
    const v = endedVoters[i];
    const pick = i < 5 ? ec4.id : ec5.id;
    try {
      await prisma.vote.upsert({
        where: { voterId_electionId: { voterId: v.id, electionId: endedElection.id } },
        update: {},
        create: {
          voterId: v.id,
          electionId: endedElection.id,
          electionCandidateId: pick,
          receiptHash: `hash-ended-${v.id}`,
        },
      });
    } catch {}
  }

  // ── Audit Logs ─────────────────────────────────────────────────────────────
  const auditEntries = [
    { userId: admin.id, action: AuditAction.ELECTION_CREATED, resource: "election", resourceId: liveElection.id, details: { title: liveElection.title } },
    { userId: admin.id, action: AuditAction.ELECTION_LAUNCHED, resource: "election", resourceId: liveElection.id, details: {} },
    { userId: admin.id, action: AuditAction.CANDIDATE_APPROVED, resource: "candidate", resourceId: candidate1.id, details: { name: "Jordan Rivera" } },
    { userId: admin.id, action: AuditAction.CANDIDATE_APPROVED, resource: "candidate", resourceId: candidate2.id, details: { name: "Sam Westbrook" } },
    { userId: voter.id, action: AuditAction.USER_LOGIN, resource: "auth", details: {} },
    { userId: voter.id, action: AuditAction.VOTE_CAST, resource: "vote", resourceId: liveElection.id, details: { electionTitle: liveElection.title } },
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.create({ data: entry });
  }

  // ── System Settings ────────────────────────────────────────────────────────
  const settings = [
    { key: "platform_name", value: { text: "VOTEX" } },
    { key: "registration_open", value: { enabled: true } },
    { key: "email_verification_required", value: { enabled: true } },
    { key: "voter_approval_required", value: { enabled: false } },
    { key: "candidate_approval_required", value: { enabled: true } },
    { key: "results_public", value: { enabled: true } },
    { key: "maintenance_mode", value: { enabled: false } },
  ];
  for (const s of settings) {
    await prisma.systemSettings.upsert({ where: { key: s.key }, update: {}, create: s });
  }

  console.log("✅ Seed complete!");
  console.log(`   Admin:       admin@votex.io / Demo@1234`);
  console.log(`   Voter:       voter@votex.io / Demo@1234`);
  console.log(`   Candidate:   candidate@votex.io / Demo@1234`);
  console.log(`   Party Admin: party@votex.io / Demo@1234`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());