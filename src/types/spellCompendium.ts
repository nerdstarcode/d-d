/** A class D&D 5e allows to cast a given spell, as published by the source blog. */
export interface CompendiumSpellClass {
  slug: string
  name: string
  emoji: string
}

export interface CompendiumSpellComponents {
  verbal: boolean
  somatic: boolean
  material: boolean
  materialText?: string
}

/** Structured mechanics pulled from the spell's "how it works" callout — not every spell has all of these (or any). */
export interface CompendiumSpellMechanics {
  damage?: string
  damageType?: string
  save?: string
  areaOrTarget?: string
  scaling?: string
}

export interface CompendiumSpellRevision55 {
  status: string
  note: string
}

/** A single spell from the bundled reference compendium (src/data/spells.json), scraped from critical20.com.br. */
export interface CompendiumSpell {
  slug: string
  namePt: string
  nameEn: string
  /** 0 = cantrip, 1-9 = spell level/círculo. */
  level: number
  school: string
  castingTime: string
  range: string
  duration: string
  concentration: boolean
  ritual: boolean
  components: CompendiumSpellComponents
  classes: CompendiumSpellClass[]
  /** Short 1-3 sentence blurb. */
  summary: string
  /** Full prose description, paragraphs joined by blank lines. */
  description: string
  mechanics?: CompendiumSpellMechanics
  source?: string
  revision55?: CompendiumSpellRevision55
  tags: string[]
  sourceUrl: string
}

export const SPELL_LEVEL_LABELS: Record<number, string> = {
  0: 'Truque',
  1: '1º círculo',
  2: '2º círculo',
  3: '3º círculo',
  4: '4º círculo',
  5: '5º círculo',
  6: '6º círculo',
  7: '7º círculo',
  8: '8º círculo',
  9: '9º círculo',
}

export const SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const

export const SPELL_SCHOOLS = [
  'Abjuração',
  'Adivinhação',
  'Conjuração',
  'Encantamento',
  'Evocação',
  'Ilusão',
  'Necromancia',
  'Transmutação',
] as const
