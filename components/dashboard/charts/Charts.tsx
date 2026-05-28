'use client'

import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'

// ─── Shared theme ──────────────────────────────────────────────────────────────
const COLORS = {
  cyan:   '#00d4ff',
  purple: '#7c3aed',
  pink:   '#ff2d6a',
  green:  '#00ff88',
  amber:  '#f59e0b',
  blue:   '#3b82f6',
}

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#0e0e24',
    border: '1px solid rgba(0,212,255,0.2)',
    borderRadius: '10px',
    color: '#e2e8f0',
    fontSize: '12px',
    fontFamily: 'Share Tech Mono, monospace',
  },
  itemStyle: { color: '#94a3b8' },
  labelStyle: { color: '#00d4ff', fontWeight: 700 },
}

const AXIS_STYLE = {
  tick: { fill: '#475569', fontSize: 11, fontFamily: 'Share Tech Mono, monospace' },
  axisLine: { stroke: 'rgba(0,212,255,0.1)' },
  tickLine: { stroke: 'rgba(0,212,255,0.1)' },
}

// ─── Area Chart ────────────────────────────────────────────────────────────────
interface AreaProps {
  data: Record<string, unknown>[]
  xKey: string
  lines: { key: string; color?: keyof typeof COLORS; name?: string }[]
  height?: number
}

export function VotexAreaChart({ data, xKey, lines, height = 260 }: AreaProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
        <defs>
          {lines.map(({ key, color = 'cyan' }) => (
            <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS[color]} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS[color]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)" />
        <XAxis dataKey={xKey} {...AXIS_STYLE} />
        <YAxis {...AXIS_STYLE} />
        <Tooltip {...TOOLTIP_STYLE} />
        {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />}
        {lines.map(({ key, color = 'cyan', name }) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            name={name ?? key}
            stroke={COLORS[color]}
            strokeWidth={2}
            fill={`url(#grad-${key})`}
            dot={false}
            activeDot={{ r: 4, fill: COLORS[color], stroke: '#0e0e24', strokeWidth: 2 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── Bar Chart ──────────────────────────────────────────────────────────────────
interface BarProps {
  data: Record<string, unknown>[]
  xKey: string
  bars: { key: string; color?: keyof typeof COLORS; name?: string }[]
  height?: number
  stacked?: boolean
}

export function VotexBarChart({ data, xKey, bars, height = 260, stacked }: BarProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -10 }} barSize={stacked ? 20 : 14}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)" vertical={false} />
        <XAxis dataKey={xKey} {...AXIS_STYLE} />
        <YAxis {...AXIS_STYLE} />
        <Tooltip {...TOOLTIP_STYLE} />
        {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />}
        {bars.map(({ key, color = 'cyan', name }) => (
          <Bar
            key={key}
            dataKey={key}
            name={name ?? key}
            fill={COLORS[color]}
            stackId={stacked ? 'stack' : undefined}
            radius={stacked ? undefined : [4, 4, 0, 0]}
            opacity={0.9}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Line Chart ─────────────────────────────────────────────────────────────────
interface LineProps {
  data: Record<string, unknown>[]
  xKey: string
  lines: { key: string; color?: keyof typeof COLORS; name?: string }[]
  height?: number
}

export function VotexLineChart({ data, xKey, lines, height = 260 }: LineProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)" />
        <XAxis dataKey={xKey} {...AXIS_STYLE} />
        <YAxis {...AXIS_STYLE} />
        <Tooltip {...TOOLTIP_STYLE} />
        {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />}
        {lines.map(({ key, color = 'cyan', name }) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={name ?? key}
            stroke={COLORS[color]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: COLORS[color], stroke: '#0e0e24', strokeWidth: 2 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─── Donut Chart ────────────────────────────────────────────────────────────────
interface DonutProps {
  data: { name: string; value: number; color?: keyof typeof COLORS }[]
  height?: number
  innerRadius?: number
}

export function VotexDonutChart({ data, height = 220, innerRadius = 60 }: DonutProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={innerRadius + 30}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={COLORS[entry.color ?? 'cyan']} opacity={0.9} />
          ))}
        </Pie>
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ─── Radial Bar Chart ────────────────────────────────────────────────────────────
interface RadialProps {
  data: { name: string; value: number; fill?: string }[]
  height?: number
}

export function VotexRadialChart({ data, height = 240 }: RadialProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadialBarChart
        cx="50%"
        cy="50%"
        innerRadius={30}
        outerRadius={100}
        data={data}
        startAngle={180}
        endAngle={0}
      >
        <RadialBar background={{ fill: 'rgba(0,212,255,0.04)' }} dataKey="value" cornerRadius={6} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend
          iconSize={8}
          wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: '8px' }}
        />
      </RadialBarChart>
    </ResponsiveContainer>
  )
}

export { COLORS }