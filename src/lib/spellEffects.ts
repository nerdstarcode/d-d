/** Visual style for a spell "effect" badge (Cura/Buff/Debuff/etc.), derived from its compendium tags. */
export interface SpellEffectBadge {
  label: string
  className: string
}

const HEAL_BADGE_CLASS = 'border-emerald-700/50 bg-emerald-950/40 text-emerald-400'

const EFFECT_STYLES: Record<string, SpellEffectBadge> = {
  Cura: { label: 'Cura', className: HEAL_BADGE_CLASS },
  Buff: { label: 'Buff', className: 'border-indigo-700/50 bg-indigo-950/40 text-indigo-400' },
  Debuff: { label: 'Debuff', className: 'border-fuchsia-800/50 bg-fuchsia-950/40 text-fuchsia-400' },
  'Remover Condicao': { label: 'Remove condição', className: HEAL_BADGE_CLASS },
  'Pv Temporario': { label: 'PV temporário', className: HEAL_BADGE_CLASS },
}

const DICE_PATTERN = /\d+d\d+(?:\s*\+\s*\d+)?/gi
const MODIFIER_PATTERN = /modificador de [a-zà-ú]+(?:\s+de\s+[a-zà-ú]+)*/i

export interface HealingInfo {
  /** The dice expression itself, e.g. "1d4" or "2d4+2". */
  dice: string
  /** The accompanying ability-modifier phrase, e.g. "modificador de habilidade de conjuração", if the text mentions one. */
  modifier?: string
}

/**
 * Best-effort extraction of the healing dice from a spell's summary/description text — the compendium data has no
 * structured healing field (unlike damage), so this scans for a dice expression sitting near "pontos de vida"/"PV"
 * that isn't actually describing damage (e.g. "sofre 3d6 de dano" or "o dano aumenta em 1d6").
 */
export function getHealingInfo(spell: { tags?: string[]; summary?: string; description?: string }): HealingInfo | undefined {
  if (!spell.tags?.includes('Cura')) return undefined
  const text = `${spell.summary ?? ''} ${spell.description ?? ''}`
  DICE_PATTERN.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = DICE_PATTERN.exec(text))) {
    const around = text.slice(Math.max(0, match.index - 20), match.index + match[0].length + 20).toLowerCase()
    const wideContext = text.slice(Math.max(0, match.index - 60), match.index + match[0].length + 60).toLowerCase()
    if (!/dano/.test(around) && /pontos? de vida|\bpv\b/.test(wideContext)) {
      const modifier = wideContext.match(MODIFIER_PATTERN)?.[0]
      return { dice: match[0].replace(/\s+/g, ''), modifier }
    }
  }
  return undefined
}

/** Reads a compendium spell's tags (and, for Cura, its text) and returns the badges (Cura/Buff/Debuff/...) that apply. */
export function getSpellEffectBadges(spell: { tags?: string[]; summary?: string; description?: string }): SpellEffectBadge[] {
  const out: SpellEffectBadge[] = []
  const seen = new Set<string>()
  const heal = getHealingInfo(spell)
  for (const tag of spell.tags ?? []) {
    const badge = tag === 'Cura' && heal ? { label: `${heal.dice} de cura`, className: HEAL_BADGE_CLASS } : EFFECT_STYLES[tag]
    if (badge && !seen.has(badge.label)) {
      seen.add(badge.label)
      out.push(badge)
    }
  }
  return out
}
