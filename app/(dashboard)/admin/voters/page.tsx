"use client";
// app/(dashboard)/admin/voters/page.tsx

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isApproved: boolean;
  isVerified: boolean;
  isSuspended: boolean;
  createdAt: string;
  avatarUrl: string | null;
}

async function fetchUsers(role: string, q: string, page: number) {
  const params = new URLSearchParams({ page: String(page), ...(role !== "all" ? { role } : {}), ...(q ? { q } : {}) });
  const res = await fetch(`/api/users?${params}`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json() as Promise<{ users: User[]; total: number; pages: number }>;
}

async function updateUser(id: string, updates: Partial<User>) {
  const res = await fetch("/api/users", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...updates }),
  });
  if (!res.ok) throw new Error("Update failed");
  return res.json();
}

export default function VotersPage() {
  const [role, setRole] = useState("VOTER");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", role, q, page],
    queryFn: () => fetchUsers(role, q, page),
  });

  const mutation = useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<User>) => updateUser(id, updates),
    onSuccess: () => { toast.success("User updated"); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: () => toast.error("Update failed"),
  });

  const roles = [
    { key: "VOTER", label: "Voters" },
    { key: "CANDIDATE", label: "Candidates" },
    { key: "PARTY_ADMIN", label: "Party Admins" },
    { key: "all", label: "All Users" },
  ];

  const statColors: Record<string, string> = {
    VOTER: "text-cyan-400",
    CANDIDATE: "text-purple-400",
    PARTY_ADMIN: "text-pink-400",
    ADMIN: "text-amber-400",
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const res = await fetch("/api/users/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvData: text }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Import failed");
      
      toast.success(`Successfully imported ${data.successCount} users.`);
      if (data.errors?.length > 0) {
        toast.error(`Skipped ${data.errors.length} records. Check console for details.`);
        console.warn("Import Errors:", data.errors);
      }
      setIsImportModalOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to import CSV");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-mono">User Management</h1>
          <p className="text-sm text-slate-400 mt-1">Manage voter registrations and account statuses</p>
        </div>
        <button
          onClick={() => setIsImportModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-mono text-sm font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all"
        >
          + Import CSV
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: data?.total ?? "—", color: "cyan" },
          { label: "Active", value: (data?.users ?? []).filter((u) => !u.isSuspended).length, color: "emerald" },
          { label: "Pending", value: (data?.users ?? []).filter((u) => !u.isApproved).length, color: "amber" },
          { label: "Suspended", value: (data?.users ?? []).filter((u) => u.isSuspended).length, color: "red" },
        ].map((s) => (
          <div key={s.label} className="bg-[#0d1421] border border-slate-700/30 rounded-xl p-4">
            <div className={`text-2xl font-mono font-bold text-${s.color}-400`}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex bg-[#0d1421] border border-slate-700/50 rounded-lg p-1 gap-1 flex-wrap">
          {roles.map((r) => (
            <button
              key={r.key}
              onClick={() => { setRole(r.key); setPage(1); }}
              className={`px-3 py-2 rounded-md text-sm font-mono transition-all ${
                role === r.key
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search name or email..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          className="flex-1 bg-[#0d1421] border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
        />
      </div>

      {/* Table */}
      <div className="bg-[#0d1421] border border-slate-700/30 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-slate-400">
            <div className="animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full mr-3" />
            Loading users...
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-6 py-4">User</th>
                <th className="text-left px-6 py-4">Role</th>
                <th className="text-left px-6 py-4 hidden md:table-cell">Status</th>
                <th className="text-left px-6 py-4 hidden lg:table-cell">Joined</th>
                <th className="text-right px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {(data?.users ?? []).map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-white font-medium flex items-center gap-2">
                          {u.name}
                          {u.isVerified && (
                            <span className="text-cyan-400 text-xs" title="Verified">✓</span>
                          )}
                        </div>
                        <div className="text-slate-400 text-xs">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-mono font-semibold ${statColors[u.role] ?? "text-slate-400"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {u.isSuspended ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">Suspended</span>
                      ) : u.isApproved ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30">Pending</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs hidden lg:table-cell">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {!u.isApproved && !u.isSuspended && (
                        <button
                          onClick={() => mutation.mutate({ id: u.id, isApproved: true })}
                          className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded text-xs font-mono hover:bg-emerald-500/30 transition-all"
                        >
                          Approve
                        </button>
                      )}
                      {!u.isSuspended ? (
                        <button
                          onClick={() => mutation.mutate({ id: u.id, isSuspended: true })}
                          className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-xs font-mono hover:bg-red-500/20 transition-all"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => mutation.mutate({ id: u.id, isSuspended: false })}
                          className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded text-xs font-mono hover:bg-cyan-500/20 transition-all"
                        >
                          Reinstate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/30">
            <span className="text-xs text-slate-500">
              Page {page} of {data.pages} · {data.total} users
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-mono bg-slate-800 border border-slate-700 text-slate-300 rounded disabled:opacity-40 hover:bg-slate-700 transition-all"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="px-3 py-1.5 text-xs font-mono bg-slate-800 border border-slate-700 text-slate-300 rounded disabled:opacity-40 hover:bg-slate-700 transition-all"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1421] border border-slate-700/50 rounded-xl p-6 max-w-md w-full shadow-2xl relative">
            <h2 className="text-lg font-bold text-white font-mono mb-2">Bulk Import Voters</h2>
            <p className="text-sm text-slate-400 mb-6">
              Upload a CSV file with the following columns: <code className="text-cyan-400">Name, Email, Password (Optional)</code>.
            </p>

            <div className="border-2 border-dashed border-slate-700/50 rounded-lg p-8 text-center hover:border-cyan-500/50 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileUpload}
                disabled={importing}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="text-4xl mb-3">📄</div>
              <div className="text-sm font-mono text-slate-300">
                {importing ? "Importing..." : "Click or drag CSV here"}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsImportModalOpen(false)}
                disabled={importing}
                className="px-4 py-2 text-sm font-mono text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}