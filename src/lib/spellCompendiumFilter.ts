import type { CompendiumSpell } from '../types/spellCompendium'

export interface SpellCompendiumFilters {
  name: string
  level: string
  school: string
  class: string
  concentrationOnly: boolean
  ritualOnly: boolean
}

export const BLANK_SPELL_FILTERS: SpellCompendiumFilters = {
  name: '',
  level: '',
  school: '',
  class: '',
  concentrationOnly: false,
  ritualOnly: false,
}

export function hasActiveSpellFilter(filters: SpellCompendiumFilters): boolean {
  return (
    filters.name?.trim() !== '' ||
    filters.level !== '' ||
    filters.school !== '' ||
    filters.class !== '' ||
    filters.concentrationOnly ||
    filters.ritualOnly
  )
}

export function matchesSpellFilters(spell: CompendiumSpell, filters: SpellCompendiumFilters): boolean {
  const nameQuery = filters.name?.trim().toLowerCase()
  const nameMatch =
    nameQuery === '' ||
    spell.namePt?.toLowerCase().includes(nameQuery) ||
    spell.nameEn?.toLowerCase().includes(nameQuery)
  const levelMatch = filters.level === '' || String(spell.level) === filters.level
  const schoolMatch = filters.school === '' || spell.school === filters.school
  const classMatch = filters.class === '' || spell.classes?.some((c) => c.slug === filters.class)
  const concentrationMatch = !filters.concentrationOnly || spell.concentration
  const ritualMatch = !filters.ritualOnly || spell.ritual
  return !!(nameMatch && levelMatch && schoolMatch && classMatch && concentrationMatch && ritualMatch)
}

/** Every distinct class {slug,name,emoji} across the compendium, sorted by name — for the class filter's options. */
export function collectSpellClasses(spells: CompendiumSpell[]): { slug: string; name: string; emoji: string }[] {
  const seen = new Map<string, { slug: string; name: string; emoji: string }>()
  for (const spell of spells) {
    for (const cls of spell.classes ?? []) {
      if (!seen.has(cls.slug)) seen.set(cls.slug, cls)
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}
