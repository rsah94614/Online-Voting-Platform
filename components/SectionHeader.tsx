interface SectionHeaderProps {
  eyebrow: string
  title: string
  titleHighlight?: string
  description: string
}

export default function SectionHeader({
  eyebrow,
  title,
  titleHighlight,
  description,
}: SectionHeaderProps) {
  return (
    <div className="text-center mb-16">
      <div className="inline-block font-mono text-xs text-[#00d4ff] tracking-wider uppercase mb-4 px-3.5 py-1 border border-[rgba(0,212,255,0.2)] rounded bg-[rgba(0,212,255,0.04)] fade-in">
        {eyebrow}
      </div>
      <h2 className="font-orb text-2xl sm:text-3xl lg:text-5xl font-bold text-white leading-tight mb-4 fade-in stagger-1">
        {title}
        {titleHighlight && (
          <span className="block bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] bg-clip-text text-transparent">
            {titleHighlight}
          </span>
        )}
      </h2>
      <p className="text-sm sm:text-base text-[#94a3b8] max-w-2xl mx-auto leading-relaxed fade-in stagger-2">
        {description}
      </p>
    </div>
  )
}
