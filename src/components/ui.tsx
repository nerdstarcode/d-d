import { type ChangeEvent, type ReactNode } from 'react'
import { motion } from 'motion/react'

export function Panel({
  title,
  icon,
  children,
  className = '',
}: {
  title?: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-xl border border-stone-800 bg-stone-900/60 shadow-lg shadow-black/20 backdrop-blur-sm ${className}`}
    >
      {title && (
        <div className="flex items-center gap-2 border-b border-stone-800 px-4 py-2.5">
          {icon}
          <h3 className="font-serif text-xs font-semibold tracking-[0.14em] text-amber-500/90 uppercase">
            {title}
          </h3>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  )
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  className = '',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[10px] font-medium tracking-wide text-stone-500 uppercase">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        className="rounded-md border border-stone-700 bg-stone-950/70 px-2.5 py-1.5 text-sm text-stone-100 outline-none transition-colors placeholder:text-stone-600 focus:border-amber-600/60 focus:ring-1 focus:ring-amber-600/30"
      />
    </label>
  )
}

export function NumberField({
  label,
  value,
  onChange,
  className = '',
}: {
  label: string
  value: number
  onChange: (v: number) => void
  className?: string
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[10px] font-medium tracking-wide text-stone-500 uppercase">{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.valueAsNumber || 0)}
        className="rounded-md border border-stone-700 bg-stone-950/70 px-2.5 py-1.5 text-sm text-stone-100 outline-none transition-colors focus:border-amber-600/60 focus:ring-1 focus:ring-amber-600/30"
      />
    </label>
  )
}

export function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
  className = '',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  rows?: number
  className?: string
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[10px] font-medium tracking-wide text-stone-500 uppercase">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="resize-none rounded-md border border-stone-700 bg-stone-950/70 px-2.5 py-1.5 text-sm leading-relaxed text-stone-100 outline-none transition-colors focus:border-amber-600/60 focus:ring-1 focus:ring-amber-600/30"
      />
    </label>
  )
}

export function ModifierBadge({ value }: { value: number }) {
  const text = value >= 0 ? `+${value}` : `${value}`
  return (
    <span className="inline-flex min-w-[2.25rem] items-center justify-center rounded-md border border-stone-700 bg-stone-950 px-1.5 py-0.5 font-mono text-xs font-semibold text-amber-400">
      {text}
    </span>
  )
}

export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-left"
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
          checked ? 'border-amber-500 bg-amber-500/90' : 'border-stone-600 bg-stone-950'
        }`}
      >
        {checked && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-1.5 w-1.5 rounded-full bg-stone-950" />}
      </span>
      {label}
    </button>
  )
}

export function StatCircle({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-stone-800 bg-stone-950/60 px-3 py-3 text-center">
      <span className="text-xl font-bold text-stone-100">{value}</span>
      <span className="text-[10px] font-medium tracking-wide text-stone-500 uppercase">{label}</span>
      {sub && <span className="text-[10px] text-stone-600">{sub}</span>}
    </div>
  )
}
