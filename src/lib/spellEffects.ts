/** Visual style for a spell "effect" badge (Cura/Buff/Debuff/etc.), derived from its compendium tags. */
export interface SpellEffectBadge {
  label: string
  className: string
}

const EFFECT_STYLES: Record<string, SpellEffectBadge> = {
  Cura: { label: 'Cura', className: 'border-emerald-700/50 bg-emerald-950/40 text-emerald-400' },
  Buff: { label: 'Buff', className: 'border-indigo-700/50 bg-indigo-950/40 text-indigo-400' },
  Debuff: { label: 'Debuff', className: 'border-fuchsia-800/50 bg-fuchsia-950/40 text-fuchsia-400' },
  'Remover Condicao': { label: 'Remove condição', className: 'border-emerald-700/50 bg-emerald-950/40 text-emerald-400' },
  'Pv Temporario': { label: 'PV temporário', className: 'border-emerald-700/50 bg-emerald-950/40 text-emerald-400' },
}

/** Reads the compendium spell's tags and returns the badges (Cura/Buff/Debuff/...) that apply, in a stable order. */
export function getSpellEffectBadges(tags: string[] | undefined): SpellEffectBadge[] {
  const out: SpellEffectBadge[] = []
  const seen = new Set<string>()
  for (const tag of tags ?? []) {
    const style = EFFECT_STYLES[tag]
    if (style && !seen.has(style.label)) {
      seen.add(style.label)
      out.push(style)
    }
  }
  return out
}
