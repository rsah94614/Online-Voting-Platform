'use client'
// app/(dashboard)/voter/vote/[electionId]/page.tsx

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { Card, PageLoader, Progress, Avatar } from '@/components/dashboard/ui'
import toast from 'react-hot-toast'

const apiFetch = (u: string) => fetch(u, { credentials: 'include' }).then(r => r.json())

type Step = 'select' | 'confirm' | 'success'

export default function VotePage({ params }: { params: Promise<{ electionId: string }> }) {
  const { electionId } = use(params)
  const router = useRouter()
  const [selected, setSelected]   = useState<string | null>(null)
  const [step, setStep]           = useState<Step>('select')
  const [receipt, setReceipt]     = useState('')

  const { data: elData, isLoading: elLoading } = useQuery({
    queryKey: ['election', electionId],
    queryFn: () => apiFetch(`/api/elections/${electionId}`),
  })

  const { data: statusData } = useQuery({
    queryKey: ['vote-status', electionId],
    queryFn: () => apiFetch(`/api/votes/status/${electionId}`),
  })

  const castMutation = useMutation({
    mutationFn: () =>
      fetch('/api/votes/cast', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        // API expects electionCandidateId (the ElectionCandidate join-table id)
        body: JSON.stringify({ electionId, electionCandidateId: selected }),
      }).then(r => r.json()),
    onSuccess: (res) => {
      if (res.success) {
        setReceipt(res.data.receipt)   // created() wraps in { success, data }
        setStep('success')
        toast.success('🎉 Vote cast successfully!')
      } else {
        toast.error(res.error ?? 'Failed to cast vote')
      }
    },
    onError: () => toast.error('Network error — please try again'),
  })

  const election   = elData?.data
  const candidates = election?.candidates ?? []
  const voteStatus = statusData?.data          // {hasVoted, receipt, castAt} from ok() wrapper
  const selectedCandidate = candidates.find((c: any) => c.id === selected)

  if (elLoading) return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Cast Your Vote" />
      <PageLoader />
    </div>
  )

  // Already voted
  if (voteStatus?.hasVoted) return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Cast Your Vote" />
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="font-orb font-bold text-white text-xl mb-2">You Already Voted!</h2>
          <p className="text-sm text-[#94a3b8] mb-4">You have already cast your vote in this election.</p>
          <div className="bg-[rgba(0,255,136,0.06)] border border-[rgba(0,255,136,0.2)] rounded-lg p-3 mb-6">
            <p className="text-[10px] text-[#475569] font-mono mb-1">Your receipt</p>
            <p className="text-sm text-[#00ff88] font-mono break-all">{voteStatus.receipt}</p>
            <p className="text-[10px] text-[#475569] font-mono mt-1">Cast at: {voteStatus.castAt ? new Date(voteStatus.castAt).toLocaleString() : '—'}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push('/voter/results')}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white text-sm font-orb font-bold">
              View Results →
            </button>
            <button onClick={() => router.push('/voter')}
              className="px-5 py-2.5 rounded-lg border border-[rgba(0,212,255,0.2)] text-sm text-[#94a3b8] hover:text-[#00d4ff] font-orb">
              Dashboard
            </button>
          </div>
        </Card>
      </main>
    </div>
  )

  // Election not live
  if (election && election.status !== 'LIVE') return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Cast Your Vote" />
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="font-orb font-bold text-white text-lg mb-2">Voting Not Open</h2>
          <p className="text-sm text-[#94a3b8]">
            This election is currently <strong className="text-white">{election.status}</strong>.
            {election.status === 'UPCOMING' && ` Voting opens on ${new Date(election.startDate).toLocaleString()}.`}
          </p>
          <button onClick={() => router.back()} className="mt-6 px-5 py-2.5 rounded-lg border border-[rgba(0,212,255,0.2)] text-sm text-[#94a3b8] font-orb hover:text-[#00d4ff]">
            ← Go Back
          </button>
        </Card>
      </main>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title={step === 'success' ? 'Vote Submitted!' : 'Cast Your Vote'}
        subtitle={election?.title ?? ''}
        actions={
          step === 'select' && (
            <div className="flex items-center gap-2 text-xs text-[#00ff88] bg-[rgba(0,255,136,0.06)] border border-[rgba(0,255,136,0.2)] px-3 py-1.5 rounded-lg font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse inline-block" />
              ELECTION LIVE
            </div>
          )
        }
      />

      <main className="flex-1 p-6 flex items-start justify-center overflow-y-auto">
        <div className="w-full max-w-2xl space-y-5">

          {/* Progress stepper */}
          <div className="flex items-center gap-2 mb-2">
            {(['select', 'confirm', 'success'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-orb flex-shrink-0 border ${
                  step === s ? 'bg-[rgba(0,212,255,0.2)] border-[#00d4ff] text-[#00d4ff]' :
                  (['confirm','success'].indexOf(s) <= ['select','confirm','success'].indexOf(step))
                    ? 'bg-[rgba(0,255,136,0.15)] border-[#00ff88] text-[#00ff88]'
                    : 'border-[#475569] text-[#475569]'
                }`}>
                  {(['confirm','success'].indexOf(s) < ['select','confirm','success'].indexOf(step)) ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-mono capitalize hidden sm:block ${step === s ? 'text-[#00d4ff]' : 'text-[#475569]'}`}>{s}</span>
                {i < 2 && <div className={`flex-1 h-px ${(['confirm','success'].indexOf(s) < ['select','confirm','success'].indexOf(step)) ? 'bg-[#00ff88]' : 'bg-[#1e293b]'}`} />}
              </div>
            ))}
          </div>

          {/* ── Step 1: Select candidate ── */}
          {step === 'select' && (
            <Card>
              <div className="p-6 border-b border-[rgba(0,212,255,0.1)]">
                <h2 className="font-orb font-bold text-white text-lg">Select Your Candidate</h2>
                <p className="text-xs text-[#475569] mt-1">
                  {candidates.length} candidates on the ballot · {election?.votingMethod?.replace(/_/g, ' ')}
                </p>
              </div>

              <div className="p-5 space-y-3">
                {candidates.map((c: any) => (
                  <button key={c.id} type="button" onClick={() => setSelected(c.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selected === c.id
                        ? 'border-[#00d4ff] bg-[rgba(0,212,255,0.08)] shadow-[0_0_20px_rgba(0,212,255,0.1)]'
                        : 'border-[rgba(0,212,255,0.12)] bg-[#0a0a1a] hover:border-[rgba(0,212,255,0.25)] hover:bg-[rgba(0,212,255,0.03)]'
                    }`}>
                    <div className="flex items-center gap-4">
                      {/* Radio */}
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        selected === c.id
                          ? 'border-[#00d4ff] bg-[#00d4ff] shadow-[0_0_10px_rgba(0,212,255,0.5)]'
                          : 'border-[#475569]'
                      }`}>
                        {selected === c.id && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>

                      <Avatar name={c.user?.name ?? '?'} size={11}
                        gradient={c.party ? undefined : 'from-[#475569] to-[#334155]'}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-orb font-bold text-white text-base">{c.user?.name}</p>
                          {c.isLeading && (
                            <span className="text-[10px] bg-[rgba(0,255,136,0.12)] text-[#00ff88] border border-[rgba(0,255,136,0.2)] px-1.5 py-0.5 rounded font-mono">
                              LEADING
                            </span>
                          )}
                        </div>
                        {c.party ? (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full" style={{ background: c.party.color }} />
                            <span className="text-xs text-[#94a3b8]">{c.party.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#475569]">Independent</span>
                        )}
                        {c.constituency && (
                          <p className="text-[10px] text-[#475569] font-mono mt-0.5">{c.constituency}</p>
                        )}
                      </div>

                      {/* Vote share if available */}
                      {c.votePercentage > 0 && (
                        <div className="text-right flex-shrink-0 hidden sm:block">
                          <p className="font-orb font-bold text-lg text-[#00d4ff]">{c.votePercentage}%</p>
                          <p className="text-[10px] text-[#475569] font-mono">{c.voteCount?.toLocaleString()} votes</p>
                        </div>
                      )}
                    </div>

                    {/* Biography preview */}
                    {c.biography && selected === c.id && (
                      <div className="mt-3 pt-3 border-t border-[rgba(0,212,255,0.1)]">
                        <p className="text-xs text-[#94a3b8] leading-relaxed line-clamp-3">{c.biography}</p>
                      </div>
                    )}
                  </button>
                ))}

                {candidates.length === 0 && (
                  <div className="text-center py-10">
                    <div className="text-4xl mb-3 opacity-40">👤</div>
                    <p className="text-sm text-[#475569]">No approved candidates for this election yet.</p>
                  </div>
                )}
              </div>

              {/* Security notice */}
              <div className="mx-5 mb-5 p-3 bg-[rgba(0,212,255,0.04)] border border-[rgba(0,212,255,0.12)] rounded-lg">
                <div className="flex gap-2 text-xs text-[#475569]">
                  <span className="text-[#00d4ff] flex-shrink-0">🔐</span>
                  <span>Your vote is end-to-end encrypted and anonymised. No one — including administrators — can link your identity to your vote choice. You will receive a verifiable receipt after voting.</span>
                </div>
              </div>

              <div className="px-5 pb-5">
                <button
                  disabled={!selected}
                  onClick={() => setStep('confirm')}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white font-orb font-bold text-base tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all">
                  {selected ? `Review Selection →` : 'Select a Candidate First'}
                </button>
              </div>
            </Card>
          )}

          {/* ── Step 2: Confirm ── */}
          {step === 'confirm' && selectedCandidate && (
            <Card>
              <div className="p-6 border-b border-[rgba(0,212,255,0.1)]">
                <h2 className="font-orb font-bold text-white text-lg">Confirm Your Vote</h2>
                <p className="text-xs text-[#f59e0b] mt-1">⚠️ This action is final and cannot be undone</p>
              </div>

              <div className="p-6 space-y-5">
                {/* Selected candidate summary */}
                <div className="p-5 bg-[rgba(0,212,255,0.05)] border-2 border-[rgba(0,212,255,0.3)] rounded-xl">
                  <p className="text-xs text-[#475569] font-mono uppercase tracking-wider mb-3">Your Selection</p>
                  <div className="flex items-center gap-4">
                    <Avatar name={selectedCandidate.user?.name ?? '?'} size={14}
                      gradient="from-[#00d4ff] to-[#7c3aed]" />
                    <div>
                      <p className="font-orb font-bold text-white text-xl">{selectedCandidate.user?.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {selectedCandidate.party && (
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: selectedCandidate.party.color }} />
                        )}
                        <span className="text-sm text-[#94a3b8]">
                          {selectedCandidate.party?.name ?? 'Independent'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Election summary */}
                <div className="space-y-2">
                  {[
                    { label: 'Election',       value: election.title },
                    { label: 'Type',           value: election.type?.replace(/_/g, ' ') },
                    { label: 'Voting Method',  value: election.votingMethod?.replace(/_/g, ' ') },
                    { label: 'Your Voter ID',  value: '…encrypted…' },
                    { label: 'Timestamp',      value: new Date().toLocaleString() },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between py-2 border-b border-[rgba(0,212,255,0.06)]">
                      <span className="text-xs text-[#475569] font-mono">{label}</span>
                      <span className="text-xs text-[#94a3b8] text-right max-w-xs truncate">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.2)] rounded-xl">
                  <p className="text-xs text-[#f59e0b] leading-relaxed">
                    By clicking &quot;Confirm Vote&quot; you confirm that this is your free and voluntary choice.
                    Your vote will be encrypted and permanently recorded. This action cannot be reversed.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep('select')}
                    className="flex-1 py-3 rounded-xl border border-[rgba(0,212,255,0.2)] text-[#94a3b8] text-sm font-orb font-bold hover:border-[#00d4ff] hover:text-[#00d4ff] transition-all">
                    ← Change Selection
                  </button>
                  <button
                    disabled={castMutation.isPending}
                    onClick={() => castMutation.mutate()}
                    className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white text-sm font-orb font-bold hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                    {castMutation.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Encrypting & Submitting…
                      </span>
                    ) : '🔐 Confirm Vote'}
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* ── Step 3: Success ── */}
          {step === 'success' && (
            <Card className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00ff88] to-[#00d4ff] flex items-center justify-center text-3xl mx-auto mb-6 shadow-[0_0_40px_rgba(0,255,136,0.4)]">
                ✓
              </div>
              <h2 className="font-orb font-bold text-white text-2xl mb-2">Vote Recorded!</h2>
              <p className="text-sm text-[#94a3b8] mb-6 max-w-sm mx-auto">
                Your encrypted vote has been permanently and anonymously recorded on the platform.
                Save your receipt to verify your vote was counted.
              </p>

              {/* Receipt */}
              <div className="bg-[rgba(0,255,136,0.05)] border border-[rgba(0,255,136,0.2)] rounded-xl p-5 mb-6">
                <p className="text-xs text-[#475569] font-mono uppercase tracking-wider mb-2">Vote Receipt</p>
                <p className="font-mono text-[#00ff88] text-lg font-bold tracking-widest break-all">{receipt}</p>
                <p className="text-[10px] text-[#475569] font-mono mt-2">
                  Use this receipt at /voter/verify to confirm your vote was counted
                </p>
              </div>

              {/* Security indicators */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  { icon: '🔐', label: 'Encrypted',   desc: 'AES-256' },
                  { icon: '🎭', label: 'Anonymised',  desc: 'ZKP' },
                  { icon: '⛓️', label: 'Immutable',   desc: 'Audit trail' },
                ].map(s => (
                  <div key={s.label} className="bg-[#0a0a1a] border border-[rgba(0,212,255,0.1)] rounded-xl p-3">
                    <div className="text-xl mb-1">{s.icon}</div>
                    <p className="text-xs font-orb font-bold text-white">{s.label}</p>
                    <p className="text-[10px] text-[#475569] font-mono">{s.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 justify-center">
                <button onClick={() => router.push(`/voter/results?election=${electionId}`)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white text-sm font-orb font-bold hover:shadow-[0_0_24px_rgba(0,212,255,0.3)] transition-all">
                  📊 Watch Live Results
                </button>
                <button onClick={() => router.push('/voter')}
                  className="px-6 py-3 rounded-xl border border-[rgba(0,212,255,0.2)] text-sm font-orb text-[#94a3b8] hover:text-[#00d4ff] hover:border-[#00d4ff] transition-all">
                  Back to Dashboard
                </button>
              </div>
            </Card>
          )}

        </div>
      </main>
    </div>
  )
}