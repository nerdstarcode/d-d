export type AbilityKey = 'for' | 'des' | 'con' | 'int' | 'sab' | 'car'

export interface Ability {
  score: number
}

export const ABILITY_LABELS: Record<AbilityKey, string> = {
  for: 'Força',
  des: 'Destreza',
  con: 'Constituição',
  int: 'Inteligência',
  sab: 'Sabedoria',
  car: 'Carisma',
}

export interface SkillDef {
  key: string
  label: string
  ability: AbilityKey
}

export const SKILL_DEFS: SkillDef[] = [
  { key: 'acrobacia', label: 'Acrobacia', ability: 'des' },
  { key: 'arcanismo', label: 'Arcanismo', ability: 'int' },
  { key: 'atletismo', label: 'Atletismo', ability: 'for' },
  { key: 'atuacao', label: 'Atuação', ability: 'car' },
  { key: 'enganacao', label: 'Enganação', ability: 'car' },
  { key: 'furtividade', label: 'Furtividade', ability: 'des' },
  { key: 'historia', label: 'História', ability: 'int' },
  { key: 'intimidacao', label: 'Intimidação', ability: 'car' },
  { key: 'intuicao', label: 'Intuição', ability: 'sab' },
  { key: 'investigacao', label: 'Investigação', ability: 'int' },
  { key: 'lidarComAnimais', label: 'Lidar com Animais', ability: 'sab' },
  { key: 'medicina', label: 'Medicina', ability: 'sab' },
  { key: 'natureza', label: 'Natureza', ability: 'int' },
  { key: 'percepcao', label: 'Percepção', ability: 'sab' },
  { key: 'persuasao', label: 'Persuasão', ability: 'car' },
  { key: 'prestidigitacao', label: 'Prestidigitação', ability: 'des' },
  { key: 'religiao', label: 'Religião', ability: 'int' },
  { key: 'sobrevivencia', label: 'Sobrevivência', ability: 'sab' },
]

export interface Attack {
  name: string
  bonus: string
  damage: string
}

export interface EquipmentItem {
  name: string
  qty?: number
}

export interface Currency {
  pc: number
  pp: number
  pe: number
  po: number
  pl: number
}

export interface Spell {
  name: string
  prepared: boolean
  domain?: boolean
  description?: string
}

export interface SpellLevel {
  totalSlots: number | null
  usedSlots: number | null
  spells: Spell[]
}

export interface Spellcasting {
  class: string
  ability: AbilityKey | ''
  saveDC: number | null
  attackBonus: number | null
  cantrips: Spell[]
  levels: Record<'1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9', SpellLevel>
}

export interface DeathSaves {
  successes: number
  failures: number
}

export interface Testimony {
  id: string
  where: string
  when: string
  what: string
}

export interface Witness {
  id: string
  name: string
  testimonies: Testimony[]
}

export type SuspectField = 'size' | 'gender' | 'hairColor' | 'hairType' | 'eyeColor' | 'description'

export const SUSPECT_FIELD_LABELS: Record<SuspectField, string> = {
  size: 'Tamanho',
  gender: 'Gênero',
  hairColor: 'Cor do cabelo',
  hairType: 'Tipo de cabelo',
  eyeColor: 'Cor dos olhos',
  description: 'Descrição',
}

export interface Suspect {
  id: string
  name: string
  size: string
  gender: string
  hairColor: string
  hairType: string
  eyeColor: string
  description: string
  /** IDs of testimonies (from this case's witnesses) that back up each field's value. */
  sources: Partial<Record<SuspectField, string[]>>
}

export type CaseStatus = 'aberto' | 'resolvido' | 'arquivado'

export interface InvestigationCase {
  id: string
  title: string
  summary: string
  status: CaseStatus
  witnesses: Witness[]
  suspects: Suspect[]
}

export function createTestimony(): Testimony {
  return { id: crypto.randomUUID(), where: '', when: '', what: '' }
}

export function createWitness(): Witness {
  return { id: crypto.randomUUID(), name: '', testimonies: [] }
}

export function createSuspect(): Suspect {
  return {
    id: crypto.randomUUID(),
    name: '',
    size: '',
    gender: '',
    hairColor: '',
    hairType: '',
    eyeColor: '',
    description: '',
    sources: {},
  }
}

export function createCase(): InvestigationCase {
  return {
    id: crypto.randomUUID(),
    title: '',
    summary: '',
    status: 'aberto',
    witnesses: [],
    suspects: [],
  }
}

export interface Character {
  name: string
  class: string
  level: number
  background: string
  playerName: string
  race: string
  alignment: string
  experiencePoints: number

  abilities: Record<AbilityKey, Ability>
  inspiration: number
  proficiencyBonus: number
  savingThrowProficiencies: AbilityKey[]
  skillProficiencies: string[]
  skillExpertise: string[]

  armorClass: number
  initiativeBonus: number
  speed: string

  hpMax: number
  hpCurrent: number
  hpTemp: number
  hitDiceTotal: string
  hitDiceType: string
  deathSaves: DeathSaves

  attacks: Attack[]
  equipment: EquipmentItem[]
  currency: Currency

  otherProficienciesAndLanguages: string
  featuresAndTraits: string

  personalityTraits: string
  ideals: string
  bonds: string
  flaws: string

  spellcasting: Spellcasting

  appearance: {
    age: string
    height: string
    weight: string
    eyes: string
    skin: string
    hair: string
    description: string
  }
  alliesAndOrganizations: string
  symbolName: string
  additionalFeatures: string
  backstory: string
  treasure: string

  cases: InvestigationCase[]
}

export function emptySpellLevel(): SpellLevel {
  return { totalSlots: null, usedSlots: null, spells: [] }
}

export function createBlankCharacter(): Character {
  return {
    name: '',
    class: '',
    level: 1,
    background: '',
    playerName: '',
    race: '',
    alignment: '',
    experiencePoints: 0,
    abilities: {
      for: { score: 10 },
      des: { score: 10 },
      con: { score: 10 },
      int: { score: 10 },
      sab: { score: 10 },
      car: { score: 10 },
    },
    inspiration: 0,
    proficiencyBonus: 2,
    savingThrowProficiencies: [],
    skillProficiencies: [],
    skillExpertise: [],
    armorClass: 10,
    initiativeBonus: 0,
    speed: '9m',
    hpMax: 10,
    hpCurrent: 10,
    hpTemp: 0,
    hitDiceTotal: '1',
    hitDiceType: 'd8',
    deathSaves: { successes: 0, failures: 0 },
    attacks: [],
    equipment: [],
    currency: { pc: 0, pp: 0, pe: 0, po: 0, pl: 0 },
    otherProficienciesAndLanguages: '',
    featuresAndTraits: '',
    personalityTraits: '',
    ideals: '',
    bonds: '',
    flaws: '',
    spellcasting: {
      class: '',
      ability: '',
      saveDC: null,
      attackBonus: null,
      cantrips: [],
      levels: {
        '1': emptySpellLevel(),
        '2': emptySpellLevel(),
        '3': emptySpellLevel(),
        '4': emptySpellLevel(),
        '5': emptySpellLevel(),
        '6': emptySpellLevel(),
        '7': emptySpellLevel(),
        '8': emptySpellLevel(),
        '9': emptySpellLevel(),
      },
    },
    appearance: {
      age: '',
      height: '',
      weight: '',
      eyes: '',
      skin: '',
      hair: '',
      description: '',
    },
    alliesAndOrganizations: '',
    symbolName: '',
    additionalFeatures: '',
    backstory: '',
    treasure: '',
    cases: [],
  }
}
