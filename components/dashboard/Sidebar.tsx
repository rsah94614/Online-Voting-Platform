'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import type { UserRole } from '@/types'

interface NavItem {
  href: string
  label: string
  icon: string
  badge?: string | number
}

// Keys match the Prisma Role enum (uppercase) exactly as stored in the JWT
const NAV: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { href: '/admin',                  label: 'Overview',        icon: '◉' },
    { href: '/admin/elections',        label: 'Elections',       icon: '🗳️', badge: 3 },
    { href: '/admin/elections/create', label: 'Create Election', icon: '＋' },
    { href: '/admin/candidates',       label: 'Candidates',      icon: '👤' },
    { href: '/admin/voters',           label: 'Voters',          icon: '👥' },
    { href: '/admin/parties',          label: 'Parties',         icon: '🏛️' },
    { href: '/admin/analytics',        label: 'Analytics',       icon: '📊' },
    { href: '/admin/audit',            label: 'Audit Logs',      icon: '🔍' },
    { href: '/admin/settings',         label: 'Settings',        icon: '⚙️' },
  ],
  CANDIDATE: [
    { href: '/candidate',             label: 'My Dashboard',      icon: '◉' },
    { href: '/candidate/profile',     label: 'My Profile',        icon: '👤' },
    { href: '/candidate/manifesto',   label: 'Manifesto',         icon: '📋' },
    { href: '/candidate/standings',   label: 'Live Standings',    icon: '📊' },
  ],
  PARTY_ADMIN: [
    { href: '/party',              label: 'Overview',     icon: '◉' },
    { href: '/party/performance',  label: 'Performance',  icon: '📊' },
  ],
  VOTER: [
    { href: '/voter',            label: 'My Dashboard',    icon: '◉' },
    { href: '/voter/elections',  label: 'Active Elections', icon: '🗳️', badge: 2 },
    { href: '/voter/history',    label: 'Vote History',    icon: '📋' },
    { href: '/voter/results',    label: 'Live Results',    icon: '📊' },
  ],
}

export default function Sidebar() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, toggleMobileSidebar } = useUIStore()

  // Default to VOTER nav if no user yet — avoids blank sidebar during hydration
  const role = (user?.role ?? 'VOTER') as UserRole
  const navItems = NAV[role] ?? NAV['VOTER']

  const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string }> = {
    ADMIN:       { label: 'Admin',       color: 'text-[#00d4ff]', bg: 'bg-gradient-to-br from-[#00d4ff] to-[#7c3aed]' },
    CANDIDATE:   { label: 'Candidate',   color: 'text-[#7c3aed]', bg: 'bg-gradient-to-br from-[#7c3aed] to-[#ff2d6a]' },
    PARTY_ADMIN: { label: 'Party Admin', color: 'text-[#ff2d6a]', bg: 'bg-gradient-to-br from-[#ff2d6a] to-[#f59e0b]' },
    VOTER:       { label: 'Voter',       color: 'text-[#00ff88]', bg: 'bg-gradient-to-br from-[#00ff88] to-[#00d4ff]' },
  }
  const rc = ROLE_CONFIG[role]

  return (
    <>
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={toggleMobileSidebar} />
      )}

      <aside className={`fixed top-0 left-0 h-full z-50 flex flex-col
        bg-[#0a0a1a] border-r border-[rgba(0,212,255,0.12)] transition-all duration-300
        ${sidebarCollapsed ? 'w-[68px]' : 'w-[240px]'}
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="h-[68px] flex items-center justify-between px-4 border-b border-[rgba(0,212,255,0.12)] flex-shrink-0">
          {!sidebarCollapsed && (
            <Link href="/" className="flex items-center gap-2 no-underline">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${rc.bg}`}>
                <span className="font-orb font-black text-xs text-white">VX</span>
              </div>
              <span className="font-orb font-bold text-base bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] bg-clip-text text-transparent">VOTEX</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${rc.bg} mx-auto`}>
              <span className="font-orb font-black text-xs text-white">VX</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="w-7 h-7 rounded-md border border-[rgba(0,212,255,0.18)] items-center justify-center text-[#475569] hover:text-[#00d4ff] hover:border-[#00d4ff] transition-all text-xs hidden lg:flex"
          >
            {sidebarCollapsed ? '›' : '‹'}
          </button>
        </div>

        {/* User info */}
        {!sidebarCollapsed && user && (
          <div className="px-4 py-4 border-b border-[rgba(0,212,255,0.12)] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full ${rc.bg} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">{user.name}</div>
                <div className={`text-xs font-mono ${rc.color}`}>{rc.label}</div>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {navItems.map((item) => {
            const dashboardRoot = `/${role.toLowerCase().replace('_', '-').replace('party-admin', 'party')}`
            const active = pathname === item.href || (item.href !== dashboardRoot && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all group
                  ${active
                    ? 'bg-[rgba(0,212,255,0.1)] text-[#00d4ff] border border-[rgba(0,212,255,0.2)]'
                    : 'text-[#94a3b8] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#e2e8f0]'
                  }`}
              >
                <span className={`text-base flex-shrink-0 ${sidebarCollapsed ? 'mx-auto' : ''}`}>{item.icon}</span>
                {!sidebarCollapsed && (
                  <>
                    <span className="text-xs font-semibold flex-1 tracking-wide">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="text-xs bg-[#00d4ff] text-black font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom: logout */}
        <div className="px-2 pb-4 border-t border-[rgba(0,212,255,0.12)] pt-3 flex-shrink-0">
          <button
            onClick={() => useAuthStore.getState().logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#475569] hover:text-[#ff2d6a] hover:bg-[rgba(255,45,106,0.06)] transition-all"
          >
            <span className={`text-base ${sidebarCollapsed ? 'mx-auto' : ''}`}>🚪</span>
            {!sidebarCollapsed && <span className="text-xs font-semibold">Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  )
}