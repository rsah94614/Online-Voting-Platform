"use client";
// app/(dashboard)/admin/parties/page.tsx

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

interface Party {
  id: string;
  name: string;
  abbreviation: string | null;
  color: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { candidates: number; partyAdmins: number };
}

const COLOR_PRESETS = [
  "#00d4ff", "#7c3aed", "#ff2d6a", "#10b981",
  "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6",
];

const EMPTY_FORM = { name: "", abbreviation: "", color: "#00d4ff", description: "" };

async function fetchParties(): Promise<{ parties: Party[] }> {
  // Normally: fetch('/api/parties')
  // For now returning a mock since parties API isn't separate — pulled via Prisma in a real impl
  return {
    parties: [
      { id: "p1", name: "National Progress Alliance", abbreviation: "NPA", color: "#00d4ff", description: "Forward-thinking governance.", isActive: true, createdAt: new Date().toISOString(), _count: { candidates: 3, partyAdmins: 1 } },
      { id: "p2", name: "Liberty First Coalition", abbreviation: "LFC", color: "#7c3aed", description: "Individual freedoms and limited government.", isActive: true, createdAt: new Date().toISOString(), _count: { candidates: 2, partyAdmins: 1 } },
      { id: "p3", name: "Green Futures Party", abbreviation: "GFP", color: "#10b981", description: "Sustainable development.", isActive: true, createdAt: new Date().toISOString(), _count: { candidates: 1, partyAdmins: 0 } },
    ],
  };
}

export default function PartiesPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editParty, setEditParty] = useState<Party | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ["parties"],
    queryFn: fetchParties,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof EMPTY_FORM) => {
      const url = editParty ? `/api/parties/${editParty.id}` : "/api/parties";
      const method = editParty ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success(editParty ? "Party updated" : "Party created");
      qc.invalidateQueries({ queryKey: ["parties"] });
      setShowModal(false);
      setForm(EMPTY_FORM);
      setEditParty(null);
    },
    onError: () => toast.error("Operation failed"),
  });

  const openCreate = () => {
    setEditParty(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (p: Party) => {
    setEditParty(p);
    setForm({
      name: p.name,
      abbreviation: p.abbreviation ?? "",
      color: p.color ?? "#00d4ff",
      description: p.description ?? "",
    });
    setShowModal(true);
  };

  const inputCls = "w-full bg-[#060b14] border border-slate-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-mono">Party Registry</h1>
          <p className="text-sm text-slate-400 mt-1">Manage registered political parties</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 rounded-lg text-sm font-mono hover:bg-cyan-500/30 transition-all"
        >
          + New Party
        </button>
      </div>

      {/* Party grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <div className="animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full mr-3" />
          Loading parties...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.parties ?? []).map((p) => (
            <div
              key={p.id}
              className="bg-[#0d1421] border border-slate-700/30 rounded-xl overflow-hidden hover:border-slate-600/50 transition-all"
            >
              {/* Color stripe */}
              <div className="h-1.5" style={{ backgroundColor: p.color ?? "#888" }} />

              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold">{p.name}</h3>
                      {p.abbreviation && (
                        <span
                          className="text-xs font-mono px-1.5 py-0.5 rounded font-bold"
                          style={{ backgroundColor: `${p.color}22`, color: p.color ?? "#888" }}
                        >
                          {p.abbreviation}
                        </span>
                      )}
                    </div>
                    <span className={`mt-1 inline-block text-xs font-mono px-2 py-0.5 rounded-full border ${
                      p.isActive
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <button
                    onClick={() => openEdit(p)}
                    className="text-xs text-slate-500 hover:text-cyan-400 transition-colors px-2 py-1 rounded hover:bg-cyan-500/10"
                  >
                    Edit
                  </button>
                </div>

                {p.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>
                )}

                <div className="flex gap-4 pt-2 border-t border-slate-700/30">
                  <div>
                    <div className="text-lg font-mono font-bold" style={{ color: p.color ?? "#888" }}>
                      {p._count?.candidates ?? 0}
                    </div>
                    <div className="text-xs text-slate-500">Candidates</div>
                  </div>
                  <div>
                    <div className="text-lg font-mono font-bold text-slate-300">
                      {p._count?.partyAdmins ?? 0}
                    </div>
                    <div className="text-xs text-slate-500">Admins</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1421] border border-slate-700/50 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-700/30">
              <h2 className="text-lg font-bold text-white font-mono">
                {editParty ? "Edit Party" : "New Party"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-white transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">Party Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="National Progress Alliance"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">Abbreviation</label>
                <input
                  value={form.abbreviation}
                  onChange={(e) => setForm((f) => ({ ...f, abbreviation: e.target.value.toUpperCase().slice(0, 6) }))}
                  placeholder="NPA"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">Party Color</label>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setForm((f) => ({ ...f, color: c }))}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
                          form.color === c ? "border-white scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Party description..."
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 text-sm font-mono text-slate-400 border border-slate-700/50 rounded-lg hover:border-slate-500 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => saveMutation.mutate(form)}
                disabled={saveMutation.isPending || !form.name}
                className="flex-1 py-2.5 text-sm font-mono bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saveMutation.isPending && (
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                )}
                {editParty ? "Save Changes" : "Create Party"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}