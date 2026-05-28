'use client'

import { useState } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'

interface DashboardHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function DashboardHeader({ title, subtitle, actions }: DashboardHeaderProps) {
  const { toggleMobileSidebar, notifications, unreadCount, markAllRead } = useUIStore()
  const user = useAuthStore((s) => s.user)
  const [showNotifs, setShowNotifs] = useState(false)

  return (
    <header className="h-[68px] flex items-center justify-between px-6 flex-shrink-0
      bg-[rgba(10,10,26,0.95)] backdrop-blur border-b border-[rgba(0,212,255,0.12)] relative z-30">

      {/* Left: hamburger + title */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden w-9 h-9 rounded-lg border border-[rgba(0,212,255,0.18)] flex items-center justify-center text-[#94a3b8] hover:text-[#00d4ff] hover:border-[#00d4ff] transition-all"
        >
          ☰
        </button>
        <div>
          <h1 className="font-orb font-bold text-white text-base leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-[#475569] font-mono">{subtitle}</p>}
        </div>
      </div>

      {/* Right: actions + notifs + avatar */}
      <div className="flex items-center gap-3">
        {actions}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllRead() }}
            className="relative w-9 h-9 rounded-lg border border-[rgba(0,212,255,0.18)] flex items-center justify-center text-[#94a3b8] hover:text-[#00d4ff] hover:border-[#00d4ff] transition-all"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff2d6a] rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 bg-[#0a0a1a] border border-[rgba(0,212,255,0.2)] rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.6)] z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-[rgba(0,212,255,0.12)] flex justify-between items-center">
                <span className="text-xs font-orb font-bold text-white uppercase tracking-wider">Notifications</span>
                <button onClick={() => useUIStore.getState().clearNotifications()} className="text-xs text-[#475569] hover:text-[#ff2d6a]">Clear all</button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-[#475569]">No notifications</div>
                ) : notifications.map((n) => (
                  <div key={n.id} className={`px-4 py-3 border-b border-[rgba(0,212,255,0.06)] ${n.read ? 'opacity-60' : ''}`}>
                    <div className="text-xs font-semibold text-white mb-0.5">{n.title}</div>
                    <div className="text-xs text-[#94a3b8]">{n.message}</div>
                    <div className="text-[10px] text-[#475569] mt-1 font-mono">{new Date(n.timestamp).toLocaleTimeString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#7c3aed] flex items-center justify-center text-xs font-bold text-white">
            {user?.name.split(' ').map(n => n[0]).join('').slice(0, 2) ?? 'U'}
          </div>
          <span className="hidden sm:block text-sm font-medium text-[#94a3b8]">{user?.name.split(' ')[0]}</span>
        </div>
      </div>
    </header>
  )
}