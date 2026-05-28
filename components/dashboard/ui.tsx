'use client'
// components/dashboard/ui.tsx — tiny shared primitives

import { type ReactNode } from 'react'

// ── Section card wrapper ──────────────────────────────────────────────────────
export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`bg-[#0e0e24] border border-[rgba(0,212,255,0.15)] rounded-xl ${className}`}
    >
      {children}
    </div>
  )
}

// ── Section card with title bar ───────────────────────────────────────────────
export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(0,212,255,0.1)]">
      <div>
        <h3 className="font-orb font-bold text-white text-sm tracking-wide">{title}</h3>
        {subtitle && <p className="text-xs text-[#475569] mt-0.5 font-mono">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  LIVE:       'bg-[rgba(0,255,136,0.12)] text-[#00ff88] border-[rgba(0,255,136,0.25)]',
  UPCOMING:   'bg-[rgba(245,158,11,0.12)] text-[#f59e0b] border-[rgba(245,158,11,0.25)]',
  DRAFT:      'bg-[rgba(71,85,105,0.2)] text-[#94a3b8] border-[rgba(71,85,105,0.3)]',
  ENDED:      'bg-[rgba(71,85,105,0.2)] text-[#475569] border-[rgba(71,85,105,0.2)]',
  PAUSED:     'bg-[rgba(245,158,11,0.12)] text-[#f59e0b] border-[rgba(245,158,11,0.25)]',
  CANCELLED:  'bg-[rgba(255,45,106,0.1)] text-[#ff2d6a] border-[rgba(255,45,106,0.2)]',
  APPROVED:   'bg-[rgba(0,255,136,0.12)] text-[#00ff88] border-[rgba(0,255,136,0.25)]',
  PENDING:    'bg-[rgba(245,158,11,0.12)] text-[#f59e0b] border-[rgba(245,158,11,0.25)]',
  REJECTED:   'bg-[rgba(255,45,106,0.1)] text-[#ff2d6a] border-[rgba(255,45,106,0.2)]',
  DISQUALIFIED:'bg-[rgba(255,45,106,0.1)] text-[#ff2d6a] border-[rgba(255,45,106,0.2)]',
  ACTIVE:     'bg-[rgba(0,212,255,0.1)] text-[#00d4ff] border-[rgba(0,212,255,0.25)]',
}

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status.toUpperCase()] ?? STATUS_STYLES.DRAFT
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${cls}`}>
      {['LIVE', 'ACTIVE'].includes(status.toUpperCase()) && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse inline-block" />
      )}
      {status.toUpperCase()}
    </span>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function Empty({ icon = '📭', title, subtitle }: { icon?: string; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4 opacity-40">{icon}</div>
      <p className="font-orb font-bold text-white text-sm mb-1">{title}</p>
      {subtitle && <p className="text-xs text-[#475569]">{subtitle}</p>}
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-[rgba(0,212,255,0.06)] animate-pulse rounded-lg ${className}`} />
  )
}

export function PageLoader() {
  return (
    <div className="flex-1 p-6 space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-64" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  )
}

// ── Table ─────────────────────────────────────────────────────────────────────
export function Table({ headers, children, empty }: { headers: string[]; children: ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-[#0a0a1a]">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#475569] uppercase tracking-wider font-mono whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {empty ? (
            <tr><td colSpan={headers.length}><Empty title="No records found" /></td></tr>
          ) : children}
        </tbody>
      </table>
    </div>
  )
}

export function TR({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className="border-t border-[rgba(0,212,255,0.06)] hover:bg-[rgba(0,212,255,0.03)] transition-colors cursor-pointer"
    >
      {children}
    </tr>
  )
}

export function TD({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-sm ${className}`}>{children}</td>
}

// ── Input ─────────────────────────────────────────────────────────────────────
export const inputCls =
  'w-full bg-[#0a0a1a] border border-[rgba(0,212,255,0.18)] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#00d4ff] focus:shadow-[0_0_16px_rgba(0,212,255,0.1)] transition-all font-mono'

export const selectCls = `${inputCls} cursor-pointer`
export const textareaCls = `${inputCls} resize-none`

export function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string
  error?: string
  children: ReactNode
  hint?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
      {hint  && !error && <p className="text-[10px] text-[#475569] mt-1">{hint}</p>}
      {error && <p className="text-[10px] text-[#ff2d6a] mt-1">{error}</p>}
    </div>
  )
}

// ── Button ────────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'outline' | 'ghost' | 'danger'

const BTN_VARIANTS: Record<BtnVariant, string> = {
  primary: 'bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white hover:shadow-[0_0_24px_rgba(0,212,255,0.4)] disabled:opacity-50',
  outline: 'border border-[rgba(0,212,255,0.3)] text-[#94a3b8] hover:border-[#00d4ff] hover:text-[#00d4ff]',
  ghost:   'text-[#94a3b8] hover:text-white hover:bg-[rgba(255,255,255,0.04)]',
  danger:  'border border-[rgba(255,45,106,0.3)] text-[#ff2d6a] hover:border-[#ff2d6a] hover:bg-[rgba(255,45,106,0.06)]',
}

export function Btn({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}) {
  const sizeMap = { sm: 'px-3 py-1.5 text-xs', md: 'px-5 py-2.5 text-sm', lg: 'px-7 py-3 text-base' }
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center gap-2 font-orb font-bold rounded-lg tracking-wider transition-all disabled:cursor-not-allowed
        ${sizeMap[size]} ${BTN_VARIANTS[variant]} ${className}`}
    >
      {loading && (
        <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      )}
      {children}
    </button>
  )
}

// ── Avatar initials ───────────────────────────────────────────────────────────
export function Avatar({
  name,
  size = 8,
  gradient = 'from-[#00d4ff] to-[#7c3aed]',
}: {
  name: string
  size?: number
  gradient?: string
}) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      className={`w-${size} h-${size} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ fontSize: size * 2 }}
    >
      {initials}
    </div>
  )
}

// ── Progress bar ──────────────────────────────────────────────────────────────
export function Progress({
  value,
  color = '#00d4ff',
  className = '',
}: {
  value: number
  color?: string
  className?: string
}) {
  return (
    <div className={`h-1.5 bg-[#060611] rounded-full overflow-hidden border border-[rgba(0,212,255,0.08)] ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  )
}