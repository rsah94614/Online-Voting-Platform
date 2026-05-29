'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation } from '@tanstack/react-query'

interface ElectionResult {
  found: boolean
  election?: {
    title: string
    type: string
    status: string
    searchCode: string
    startDate: string
    endDate: string
    candidateCount: number
    voterCount: number
    totalVotes: number | null
  }
}

interface ReceiptResult {
  valid: boolean
  castAt?: string
  electionTitle?: string
  electionStatus?: string
  message: string
}

export default function VerifyPage() {
  const [tab, setTab] = useState<'election' | 'receipt'>('election')
  const [code, setCode] = useState('')
  const [hash, setHash] = useState('')

  const electionLookup = useMutation({
    mutationFn: async (searchCode: string) => {
      const res = await fetch(`/api/verify?type=election&code=${searchCode}`)
      return res.json() as Promise<ElectionResult>
    },
  })

  const receiptLookup = useMutation({
    mutationFn: async (receiptHash: string) => {
      const res = await fetch(`/api/verify?type=receipt&hash=${receiptHash}`)
      return res.json() as Promise<ReceiptResult>
    },
  })

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    UPCOMING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    LIVE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    ENDED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-20 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px]
        bg-radial-[ellipse] from-[rgba(0,212,255,0.06)] via-[rgba(124,58,237,0.04)] to-transparent
        pointer-events-none rounded-full" />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 no-underline mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00d4ff] to-[#7c3aed] rounded-xl
              flex items-center justify-center shadow-[0_0_24px_rgba(0,212,255,0.4)]">
              <span className="font-orb font-black text-base text-white">VX</span>
            </div>
            <span className="font-orb font-bold text-2xl bg-gradient-to-r from-[#00d4ff] to-[#7c3aed]
              bg-clip-text text-transparent tracking-widest">VOTEX</span>
          </Link>
          <h1 className="font-orb text-2xl font-bold text-white mt-4 mb-2">Public Verification</h1>
          <p className="text-sm text-[#94a3b8]">Independently verify elections and vote receipts</p>
        </div>

        {/* Card */}
        <div className="bg-[rgba(0,212,255,0.03)] border border-[rgba(0,212,255,0.18)] rounded-2xl
          backdrop-blur-md shadow-[0_0_60px_rgba(0,0,0,0.5)] overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-[rgba(0,212,255,0.18)]">
            <button
              onClick={() => { setTab('election'); electionLookup.reset() }}
              className={`flex-1 py-3.5 text-xs font-orb font-bold tracking-widest uppercase transition-all ${
                tab === 'election'
                  ? 'text-[#00d4ff] bg-[rgba(0,212,255,0.06)] border-b-2 border-[#00d4ff]'
                  : 'text-[#475569] hover:text-[#94a3b8]'
              }`}
            >
              🗳️ Election Lookup
            </button>
            <button
              onClick={() => { setTab('receipt'); receiptLookup.reset() }}
              className={`flex-1 py-3.5 text-xs font-orb font-bold tracking-widest uppercase transition-all ${
                tab === 'receipt'
                  ? 'text-[#00d4ff] bg-[rgba(0,212,255,0.06)] border-b-2 border-[#00d4ff]'
                  : 'text-[#475569] hover:text-[#94a3b8]'
              }`}
            >
              🔍 Vote Receipt
            </button>
          </div>

          <div className="p-8">
            {/* Election Lookup */}
            {tab === 'election' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">
                    Election Code
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="e.g. AB1234"
                      maxLength={10}
                      className="flex-1 bg-[#0a0a1a] border border-[rgba(0,212,255,0.18)] rounded-lg px-4 py-3
                        text-sm text-white placeholder-[#475569] focus:outline-none
                        focus:border-[#00d4ff] focus:shadow-[0_0_20px_rgba(0,212,255,0.1)]
                        transition-all font-mono text-center text-lg tracking-[0.3em]"
                    />
                    <button
                      onClick={() => code.length >= 6 && electionLookup.mutate(code)}
                      disabled={code.length < 6 || electionLookup.isPending}
                      className="px-6 py-3 rounded-lg font-orb font-bold text-xs tracking-widest uppercase
                        bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white
                        shadow-[0_0_20px_rgba(0,212,255,0.2)] hover:shadow-[0_0_30px_rgba(0,212,255,0.4)]
                        transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {electionLookup.isPending ? '...' : 'Verify'}
                    </button>
                  </div>
                </div>

                {/* Election result */}
                {electionLookup.data && (
                  <div className="mt-4">
                    {electionLookup.data.found && electionLookup.data.election ? (
                      <div className="bg-[#060611] border border-[rgba(0,255,136,0.2)] rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[#00ff88] text-lg">✅</span>
                          <span className="text-sm text-[#00ff88] font-semibold">Election Found</span>
                        </div>
                        <h3 className="text-white font-bold text-lg">{electionLookup.data.election.title}</h3>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-[#475569] block">Status</span>
                            <span className={`inline-block px-2 py-0.5 rounded-full border text-xs font-mono mt-1 ${statusColors[electionLookup.data.election.status] || ''}`}>
                              {electionLookup.data.election.status}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#475569] block">Type</span>
                            <span className="text-[#94a3b8] font-mono mt-1 block">{electionLookup.data.election.type}</span>
                          </div>
                          <div>
                            <span className="text-[#475569] block">Candidates</span>
                            <span className="text-[#00d4ff] font-mono font-bold mt-1 block">{electionLookup.data.election.candidateCount}</span>
                          </div>
                          <div>
                            <span className="text-[#475569] block">Enrolled Voters</span>
                            <span className="text-[#00d4ff] font-mono font-bold mt-1 block">{electionLookup.data.election.voterCount}</span>
                          </div>
                          <div>
                            <span className="text-[#475569] block">Start</span>
                            <span className="text-[#94a3b8] font-mono mt-1 block">{new Date(electionLookup.data.election.startDate).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-[#475569] block">End</span>
                            <span className="text-[#94a3b8] font-mono mt-1 block">{new Date(electionLookup.data.election.endDate).toLocaleDateString()}</span>
                          </div>
                          {electionLookup.data.election.totalVotes !== null && (
                            <div className="col-span-2">
                              <span className="text-[#475569] block">Total Votes</span>
                              <span className="text-[#00ff88] font-mono font-bold text-lg mt-1 block">{electionLookup.data.election.totalVotes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#060611] border border-[rgba(255,45,106,0.2)] rounded-xl p-5 flex items-center gap-3">
                        <span className="text-[#ff2d6a] text-lg">❌</span>
                        <span className="text-sm text-[#ff2d6a]">No election found with code &quot;{code}&quot;</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Receipt Verification */}
            {tab === 'receipt' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">
                    Vote Receipt Hash
                  </label>
                  <input
                    type="text"
                    value={hash}
                    onChange={(e) => setHash(e.target.value.trim())}
                    placeholder="Paste your receipt hash here..."
                    className="w-full bg-[#0a0a1a] border border-[rgba(0,212,255,0.18)] rounded-lg px-4 py-3
                      text-sm text-white placeholder-[#475569] focus:outline-none
                      focus:border-[#00d4ff] focus:shadow-[0_0_20px_rgba(0,212,255,0.1)]
                      transition-all font-mono text-xs"
                  />
                </div>
                <button
                  onClick={() => hash.length >= 10 && receiptLookup.mutate(hash)}
                  disabled={hash.length < 10 || receiptLookup.isPending}
                  className="w-full py-3.5 rounded-lg font-orb font-bold text-sm tracking-widest uppercase
                    bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white
                    shadow-[0_0_30px_rgba(0,212,255,0.25)] hover:shadow-[0_0_40px_rgba(0,212,255,0.5)]
                    transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {receiptLookup.isPending ? 'Verifying...' : 'Verify Receipt →'}
                </button>

                {/* Receipt result */}
                {receiptLookup.data && (
                  <div className="mt-2">
                    {receiptLookup.data.valid ? (
                      <div className="bg-[#060611] border border-[rgba(0,255,136,0.2)] rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[#00ff88] text-lg">✅</span>
                          <span className="text-sm text-[#00ff88] font-semibold">Vote Verified</span>
                        </div>
                        <p className="text-sm text-[#94a3b8]">{receiptLookup.data.message}</p>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-[#475569] block">Election</span>
                            <span className="text-white font-semibold mt-1 block">{receiptLookup.data.electionTitle}</span>
                          </div>
                          <div>
                            <span className="text-[#475569] block">Cast At</span>
                            <span className="text-[#94a3b8] font-mono mt-1 block">{new Date(receiptLookup.data.castAt!).toLocaleString()}</span>
                          </div>
                        </div>
                        <p className="text-xs text-[#475569] italic mt-2">
                          Note: For voter privacy, we do not reveal which candidate received this vote.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-[#060611] border border-[rgba(255,45,106,0.2)] rounded-xl p-5 flex items-center gap-3">
                        <span className="text-[#ff2d6a] text-lg">❌</span>
                        <span className="text-sm text-[#ff2d6a]">{receiptLookup.data.message}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-[#475569] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] shadow-[0_0_6px_#00ff88] inline-block" />
          Independent verification — no login required
        </div>
      </div>
    </main>
  )
}
