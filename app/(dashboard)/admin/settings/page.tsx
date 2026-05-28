'use client'
// app/(dashboard)/admin/settings/page.tsx

import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { Card, CardHeader, Field, Btn, inputCls, selectCls } from '@/components/dashboard/ui'
import toast from 'react-hot-toast'

export default function AdminSettingsPage() {
  const user = useAuthStore((s) => s.user)
  const [saving, setSaving] = useState(false)

  const handleSave = async (section: string) => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    setSaving(false)
    toast.success(`${section} settings saved`)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Platform Settings" subtitle="Configure global platform behaviour" />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Profile */}
          <Card>
            <CardHeader title="Admin Profile" />
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#7c3aed] flex items-center justify-center text-xl font-bold text-white">
                  {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="font-orb font-bold text-white">{user?.name}</p>
                  <p className="text-sm text-[#475569]">{user?.email}</p>
                  <span className="text-xs bg-[rgba(0,212,255,0.1)] text-[#00d4ff] border border-[rgba(0,212,255,0.2)] px-2 py-0.5 rounded font-mono">ADMIN</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name"><input defaultValue={user?.name ?? ''} className={inputCls} /></Field>
                <Field label="Email"><input defaultValue={user?.email ?? ''} type="email" className={inputCls} /></Field>
              </div>
              <Btn size="sm" loading={saving} onClick={() => handleSave('Profile')}>Save Profile</Btn>
            </div>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader title="Security Settings" />
            <div className="p-6 space-y-4">
              <Field label="Current Password"><input type="password" placeholder="••••••••" className={inputCls} /></Field>
              <Field label="New Password"><input type="password" placeholder="••••••••" className={inputCls} /></Field>
              <Field label="Confirm New Password"><input type="password" placeholder="••••••••" className={inputCls} /></Field>
              <Btn size="sm" loading={saving} onClick={() => handleSave('Security')}>Update Password</Btn>
            </div>
          </Card>

          {/* Platform-wide */}
          <Card>
            <CardHeader title="Platform Configuration" />
            <div className="p-6 space-y-4">
              <Field label="Platform Name" hint="Displayed across all user interfaces">
                <input defaultValue="VOTEX" className={inputCls} />
              </Field>
              <Field label="Default Timezone">
                <select className={selectCls}>
                  <option>UTC</option>
                  <option>Asia/Kolkata</option>
                  <option>America/New_York</option>
                  <option>Europe/London</option>
                </select>
              </Field>
              <Field label="Voter Registration Mode">
                <select className={selectCls}>
                  <option value="open">Open — anyone can register</option>
                  <option value="admin">Admin-only approval</option>
                  <option value="invite">Invite-only</option>
                </select>
              </Field>
              <Field label="Admin Registration Code" hint="Share only with trusted administrators">
                <input defaultValue="VOTEX-ADMIN-2024" className={inputCls} />
              </Field>
              {/* Toggles */}
              <div className="space-y-3 pt-2">
                {[
                  { label: 'Enable Public Live Results Dashboard', desc: 'Anyone can view live results without login', defaultChecked: true },
                  { label: 'Enable Voter Self-Registration',       desc: 'Voters can register without admin approval', defaultChecked: true },
                  { label: 'Enable Email Notifications',           desc: 'Send emails for OTP, confirmations, results', defaultChecked: true },
                  { label: 'Maintenance Mode',                     desc: 'Block all non-admin access temporarily',      defaultChecked: false },
                ].map((t) => (
                  <label key={t.label} className="flex items-center gap-3 p-3 rounded-lg border border-[rgba(0,212,255,0.12)] hover:border-[rgba(0,212,255,0.25)] cursor-pointer">
                    <input type="checkbox" defaultChecked={t.defaultChecked} className="w-4 h-4 accent-[#00d4ff]" />
                    <div>
                      <p className="text-sm font-semibold text-white">{t.label}</p>
                      <p className="text-xs text-[#475569]">{t.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <Btn size="sm" loading={saving} onClick={() => handleSave('Platform')}>Save Platform Settings</Btn>
            </div>
          </Card>

          {/* Danger zone */}
          <Card className="border-[rgba(255,45,106,0.2)]">
            <CardHeader title="⚠️ Danger Zone" />
            <div className="p-6 space-y-3">
              {[
                { label: 'Export All Data', desc: 'Download a full backup of all elections, votes, and users (JSON)' },
                { label: 'Purge Ended Elections', desc: 'Permanently delete elections older than 1 year along with their data' },
                { label: 'Reset Platform', desc: 'Wipe all data and return to factory state — IRREVERSIBLE' },
              ].map((a) => (
                <div key={a.label} className="flex items-center justify-between p-4 rounded-lg border border-[rgba(255,45,106,0.15)] bg-[rgba(255,45,106,0.03)]">
                  <div>
                    <p className="text-sm font-semibold text-white">{a.label}</p>
                    <p className="text-xs text-[#475569]">{a.desc}</p>
                  </div>
                  <Btn variant="danger" size="sm" onClick={() => toast.error('Requires confirmation — not implemented in demo')}>
                    {a.label.split(' ')[0]}
                  </Btn>
                </div>
              ))}
            </div>
          </Card>

        </div>
      </main>
    </div>
  )
}