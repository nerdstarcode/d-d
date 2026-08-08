import { useEffect, useMemo, useState } from 'react'
import type { CompendiumSpell } from '../types/spellCompendium'

/** Loads the bundled spell compendium (src/data/spells.json) once and indexes it for lookups. */
export function useSpellCompendium() {
  const [spells, setSpells] = useState<CompendiumSpell[] | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false
    import('../data/spells.json')
      .then((mod) => {
        if (!cancelled) setSpells(mod.default as unknown as CompendiumSpell[])
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const bySlug = useMemo(() => {
    const map = new Map<string, CompendiumSpell>()
    for (const spell of spells ?? []) map.set(spell.slug, spell)
    return map
  }, [spells])

  return { spells, loadError, bySlug }
}

/** Finds a compendium spell whose Portuguese or English name matches `name` (case/accent-insensitive). */
export function resolveSpellSlugByName(spells: CompendiumSpell[], name: string): string | undefined {
  const normalize = (s: string) => s.trim().toLowerCase()
  const target = normalize(name)
  if (!target) return undefined
  const match = spells.find((s) => normalize(s.namePt) === target || normalize(s.nameEn) === target)
  return match?.slug
}
