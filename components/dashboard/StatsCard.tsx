interface StatsCardProps {
  label: string
  value: string | number
  trend?: string
  trendUp?: boolean
  icon?: string
  accent?: 'cyan' | 'purple' | 'green' | 'amber' | 'pink'
  sublabel?: string
}

const ACCENTS = {
  cyan:   { bar: 'bg-[#00d4ff]',   text: 'text-[#00d4ff]',   glow: 'shadow-[0_0_20px_rgba(0,212,255,0.1)]' },
  purple: { bar: 'bg-[#7c3aed]',   text: 'text-[#7c3aed]',   glow: 'shadow-[0_0_20px_rgba(124,58,237,0.1)]' },
  green:  { bar: 'bg-[#00ff88]',   text: 'text-[#00ff88]',   glow: 'shadow-[0_0_20px_rgba(0,255,136,0.1)]' },
  amber:  { bar: 'bg-[#f59e0b]',   text: 'text-[#f59e0b]',   glow: 'shadow-[0_0_20px_rgba(245,158,11,0.1)]' },
  pink:   { bar: 'bg-[#ff2d6a]',   text: 'text-[#ff2d6a]',   glow: 'shadow-[0_0_20px_rgba(255,45,106,0.1)]' },
}

export default function StatsCard({
  label, value, trend, trendUp, icon, accent = 'cyan', sublabel,
}: StatsCardProps) {
  const a = ACCENTS[accent]
  return (
    <div className={`bg-[#0e0e24] border border-[rgba(0,212,255,0.15)] rounded-xl p-5 relative overflow-hidden
      ${a.glow} transition-all hover:border-[rgba(0,212,255,0.3)]`}>
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${a.bar}`} />

      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-[#475569] uppercase tracking-wider font-mono">{label}</span>
        {icon && <span className="text-lg opacity-60">{icon}</span>}
      </div>

      <div className={`font-orb text-2xl font-bold ${a.text} mb-1`}>{value}</div>

      {sublabel && <div className="text-xs text-[#475569] mb-1">{sublabel}</div>}

      {trend && (
        <div className={`text-xs font-mono ${trendUp !== false ? 'text-[#00ff88]' : 'text-[#ff2d6a]'}`}>
          {trendUp !== false ? '↑' : '↓'} {trend}
        </div>
      )}
    </div>
  )
}