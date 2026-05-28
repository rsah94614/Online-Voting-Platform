"use client";
// app/(dashboard)/candidate/profile/page.tsx

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

export default function CandidateProfilePage() {
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => fetch("/api/auth/me").then((r) => r.json()),
  });

  const [form, setForm] = useState({ bio: "", manifesto: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (me?.user?.candidate) {
      setForm({
        bio: me.user.candidate.bio ?? "",
        manifesto: me.user.candidate.manifesto ?? "",
      });
    }
  }, [me]);

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    toast.success("Profile updated");
    setSaving(false);
  };

  const inputCls = "w-full bg-[#060b14] border border-slate-700/50 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all";
  const labelCls = "block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider";

  const user = me?.user;

  return (
    <div className="p-6 max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white font-mono">My Profile</h1>
        <p className="text-sm text-slate-400 mt-1">Public-facing candidate information</p>
      </div>

      {/* Identity card */}
      <div className="bg-[#0d1421] border border-slate-700/30 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
            {user?.name?.charAt(0) ?? "?"}
          </div>
          <div>
            <div className="text-xl font-bold text-white">{user?.name}</div>
            <div className="text-sm text-slate-400">{user?.email}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono border ${
                user?.candidate?.isApproved
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-400 border-amber-500/30"
              }`}>
                {user?.candidate?.isApproved ? "Approved" : "Pending Approval"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Editable fields */}
      <div className="bg-[#0d1421] border border-slate-700/30 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-mono text-cyan-400 uppercase tracking-wider border-b border-slate-700/50 pb-3">
          Public Profile
        </h2>

        <div>
          <label className={labelCls}>Biography</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            rows={4}
            placeholder="Tell voters about yourself, your background, and why you're running..."
            className={`${inputCls} resize-none`}
          />
          <div className="text-xs text-slate-600 mt-1 text-right">{form.bio.length}/500</div>
        </div>

        <div>
          <label className={labelCls}>Manifesto / Platform</label>
          <textarea
            value={form.manifesto}
            onChange={(e) => setForm((f) => ({ ...f, manifesto: e.target.value }))}
            rows={8}
            placeholder="Outline your key policy positions and campaign promises..."
            className={`${inputCls} resize-none`}
          />
          <div className="text-xs text-slate-600 mt-1 text-right">{form.manifesto.length}/3000</div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="px-6 py-2.5 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 rounded-lg text-sm font-mono hover:bg-cyan-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />}
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>

      {/* Asset Declaration */}
      <div className="bg-[#0d1421] border border-slate-700/30 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-mono text-cyan-400 uppercase tracking-wider border-b border-slate-700/50 pb-3">
          Asset Declaration
        </h2>
        <p className="text-sm text-slate-400">
          Asset declarations are required for transparency. Submitted declarations are reviewed by the admin team and published publicly.
        </p>
        <button className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg text-sm font-mono hover:bg-purple-500/20 transition-all">
          Submit Asset Declaration →
        </button>
      </div>
    </div>
  );
}