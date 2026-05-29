"use client";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ImportVotersPage() {
  const [csvText, setCsvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{successCount: number; errors: string[]} | null>(null);

  const handleImport = async () => {
    if (!csvText.trim()) return toast.error("Please enter CSV data");
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/users/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvData: csvText }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to import");
      
      setResult(data);
      if (data.successCount > 0) {
        toast.success(`Successfully imported ${data.successCount} voters!`);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setCsvText(event.target?.result as string);
    reader.readAsText(file);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white font-mono">Bulk Import Voters</h1>
      <p className="text-sm text-slate-400">
        Upload a CSV file or paste comma-separated data. Format: <code className="text-cyan-400 bg-cyan-900/30 px-1 py-0.5 rounded">Name, Email, Password</code>
      </p>

      <div className="space-y-4 max-w-3xl">
        <div>
          <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">Upload CSV File</label>
          <input type="file" accept=".csv" onChange={handleFileUpload} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">Or Paste CSV Data</label>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="John Doe, john@example.com, SecurePass123!&#10;Jane Smith, jane@example.com, SecurePass123!"
            className="w-full h-64 bg-[#0a0a1a] border border-[rgba(0,212,255,0.18)] rounded-lg p-4 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#00d4ff] font-mono"
          />
        </div>

        <button
          onClick={handleImport}
          disabled={loading}
          className="px-6 py-3 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 rounded-xl text-sm font-mono font-semibold hover:bg-cyan-500/30 transition-all disabled:opacity-50"
        >
          {loading ? "Importing..." : "Run Import"}
        </button>

        {result && (
          <div className="mt-6 p-4 border rounded-xl border-slate-700/50 bg-[#0d1421]">
            <h3 className="text-emerald-400 font-bold mb-2">✅ Imported {result.successCount} voters</h3>
            {result.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="text-rose-400 font-semibold mb-2">⚠ Errors ({result.errors.length}):</h4>
                <ul className="text-sm text-slate-400 list-disc pl-5 space-y-1">
                  {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
