// ─── User & Auth ────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'candidate' | 'party_admin' | 'voter'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  createdAt: string
  isVerified: boolean
  partyId?: string
  candidateId?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

// ─── Election ────────────────────────────────────────────────────────────────

export type ElectionStatus = 'draft' | 'upcoming' | 'live' | 'ended' | 'cancelled'
export type VotingMethod = 'fptp' | 'ranked_choice' | 'approval' | 'weighted' | 'multi_seat'
export type VerificationMethod = 'email_otp' | 'national_id' | 'biometric' | 'custom'

export interface ElectionConfig {
  id: string
  title: string
  description: string
  type: 'presidential' | 'parliamentary' | 'corporate' | 'university' | 'community' | 'custom'
  status: ElectionStatus
  votingMethod: VotingMethod
  verificationMethods: VerificationMethod[]
  startDate: string
  endDate: string
  registrationDeadline: string
  resultDisclosure: 'immediate' | 'after_close' | 'manual'
  allowSplitVoting: boolean
  requirePhotoId: boolean
  anonymizeVoters: boolean
  maxCandidates?: number
  maxVoters?: number
  constituencies?: Constituency[]
  rounds?: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Constituency {
  id: string
  name: string
  seats: number
  voterCount: number
}

// ─── Candidate ───────────────────────────────────────────────────────────────

export type CandidateStatus = 'pending' | 'approved' | 'rejected' | 'disqualified'

export interface CandidateProfile {
  id: string
  userId: string
  electionId: string
  partyId?: string
  status: CandidateStatus

  // Personal Info
  firstName: string
  lastName: string
  dateOfBirth: string
  nationality: string
  photo?: string

  // Background
  biography: string
  education: EducationEntry[]
  workExperience: WorkEntry[]
  politicalHistory: PoliticalEntry[]
  achievements: string[]

  // Platform
  manifesto: string
  keyPolicies: PolicyEntry[]

  // Financial
  assetDeclarations: AssetEntry[]
  fundingDeclarations: FundingEntry[]

  // Contact & Social
  email: string
  phone: string
  website?: string
  socialLinks: Record<string, string>

  // Voting
  voteCount: number
  votePercentage: number
  createdAt: string
}

export interface EducationEntry {
  institution: string
  degree: string
  field: string
  year: string
}

export interface WorkEntry {
  organization: string
  position: string
  startYear: string
  endYear: string
  description: string
}

export interface PoliticalEntry {
  position: string
  organization: string
  year: string
  description: string
}

export interface PolicyEntry {
  title: string
  summary: string
  category: string
}

export interface AssetEntry {
  type: string
  description: string
  value: number
  currency: string
}

export interface FundingEntry {
  source: string
  amount: number
  currency: string
  date: string
}

// ─── Party ───────────────────────────────────────────────────────────────────

export interface Party {
  id: string
  name: string
  abbreviation: string
  color: string
  logo?: string
  foundedYear: number
  description: string
  ideology: string[]
  candidates: string[]
  totalVotes: number
  voteShare: number
}

// ─── Results ─────────────────────────────────────────────────────────────────

export interface ElectionResult {
  electionId: string
  totalVoters: number
  totalVotesCast: number
  turnoutPercent: number
  lastUpdated: string
  candidateResults: CandidateResult[]
  turnoutByHour: TurnoutDataPoint[]
}

export interface CandidateResult {
  candidateId: string
  name: string
  party: string
  votes: number
  percentage: number
  isLeading: boolean
}

export interface TurnoutDataPoint {
  time: string
  votes: number
  cumulative: number
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface AdminAnalytics {
  totalElections: number
  liveElections: number
  totalVoters: number
  totalVotesCast: number
  totalCandidates: number
  averageTurnout: number
  electionsByMonth: MonthlyData[]
  votersByRegion: RegionData[]
}

export interface MonthlyData {
  month: string
  elections: number
  voters: number
  votes: number
}

export interface RegionData {
  region: string
  voters: number
  turnout: number
}

// ─── API Responses ───────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}