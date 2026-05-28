"use client";
// app/(dashboard)/admin/settings/page.tsx

import { useState } from "react";
import toast from "react-hot-toast";

interface SettingToggle {
  key: string;
  label: string;
  description: string;
  value: boolean;
}

const DEFAULT_SETTINGS: SettingToggle[] = [
  { key: "registration_open", label: "Open Registration", description: "Allow new users to register on the platform", value: true },
  { key: "email_verification_required", label: "Email Verification", description: "Require email verification before allowing login", value: true },
  { key: "voter_approval_required", label: "Voter Approval Required", description: "Admin must manually approve each voter registration", value: false },
  { key: "candidate_approval_required", label: "Candidate Approval Required", description: "Admin must approve candidate profiles before they appear in elections", value: true },
  { key: "results_public", label: "Public Results", description: "Show election results publicly without login", value: true },
  { key: "maintenance_mode", label: "Maintenance Mode", description: "Block all access except admin. Shows a maintenance page to users.", value: false },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingToggle[]>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [platformName, setPlatformName] = useState("VOTEX");

  const toggle = (key: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value: !s.value } : s))
    );
  };

  const saveSettings = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800)); // simulate save
    toast.success("Settings saved successfully");
    setSaving(false);
  };

  const dangerActions = [
    { label: "Export All Data", desc: "Download a full JSON backup of all elections, votes, and users", action: () => toast("Export started…"), color: "amber" },
    { label: "Purge Audit Logs", desc: "Permanently delete audit logs older than 90 days", action: () => toast.error("Are you sure? This is irreversible."), color: "red" },
    { label: "Reset Platform", desc: "Delete all election data. User accounts are preserved.", action: () => toast.error("Contact Anthropic support for this action."), color: "red" },
  ];

  return (
    <div className="p-6 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white font-mono">Platform Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Configure global platform behavior and security policies</p>
      </div>

      {/* General */}
      <div className="bg-[#0d1421] border border-slate-700/30 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-mono text-cyan-400 uppercase tracking-wider border-b border-slate-700/50 pb-3">
          General
        </h2>
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">Platform Name</label>
          <input
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
            className="w-full bg-[#060b14] border border-slate-700/50 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="bg-[#0d1421] border border-slate-700/30 rounded-xl p-6 space-y-1">
        <h2 className="text-sm font-mono text-cyan-400 uppercase tracking-wider border-b border-slate-700/50 pb-3 mb-4">
          Feature Flags
        </h2>
        <div className="space-y-3">
          {settings.map((s) => (
            <div
              key={s.key}
              className={`flex items-start justify-between p-4 rounded-lg border transition-all ${
                s.key === "maintenance_mode" && s.value
                  ? "border-red-500/30 bg-red-500/5"
                  : "border-slate-700/30 bg-[#060b14]"
              }`}
            >
              <div className="flex-1 mr-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-medium">{s.label}</span>
                  {s.key === "maintenance_mode" && s.value && (
                    <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded font-mono">ACTIVE</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{s.description}</p>
              </div>
              <button
                onClick={() => toggle(s.key)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 transition-colors duration-200 focus:outline-none ${
                  s.value ? "bg-cyan-500 border-cyan-500" : "bg-slate-700 border-slate-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${
                    s.value ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-2.5 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 rounded-lg text-sm font-mono hover:bg-cyan-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-[#0d1421] border border-red-500/20 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-mono text-red-400 uppercase tracking-wider border-b border-red-500/20 pb-3">
          ⚠ Danger Zone
        </h2>
        <div className="space-y-3">
          {dangerActions.map((a) => (
            <div key={a.label} className="flex items-center justify-between p-4 bg-[#060b14] border border-slate-700/30 rounded-lg">
              <div>
                <div className="text-sm text-white font-medium">{a.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{a.desc}</div>
              </div>
              <button
                onClick={a.action}
                className={`px-4 py-2 rounded-lg text-xs font-mono border transition-all ml-4 flex-shrink-0
                  ${a.color === "red"
                    ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                  }`}
              >
                {a.label}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}