import { SKILL_DEFS, type AbilityKey, type Character } from '../types/character'

/** Expertise doesn't add a second proficiency bonus, it doubles the one you already have. */
const EXPERTISE_PROFICIENCY_MULTIPLIER = 2

/**
 * The proficiency bonus a skill contributes to its modifier: doubled when the
 * "expertise" checkbox is on, applied once otherwise. Only call this once you
 * already know the skill gets the bonus at all (proficient or expert) —
 * it doesn't know how to return "no bonus".
 */
function doubleProficiencyIfIsChecked(proficiencyBonus: number, isExpertiseChecked: boolean): number {
  return isExpertiseChecked ? proficiencyBonus * EXPERTISE_PROFICIENCY_MULTIPLIER : proficiencyBonus
}

/**
 * Encapsulates every D&D 5e rule that derives from a character's six ability
 * scores: ability modifiers, saving throw bonuses, skill bonuses (including
 * expertise) and passive skill scores. Wraps a `Character` snapshot — create
 * a new instance whenever the character changes instead of mutating one.
 */
export class DeDAttributes {
  private readonly character: Character

  constructor(character: Character) {
    this.character = character
  }

  score(key: AbilityKey): number {
    return this.character.abilities[key].score
  }

  modifier(key: AbilityKey): number {
    return DeDAttributes.abilityModifier(this.score(key))
  }

  get proficiencyBonus(): number {
    return this.character.proficiencyBonus
  }

  get inspiration(): number {
    return this.character.inspiration
  }

  isSavingThrowProficient(key: AbilityKey): boolean {
    return this.character.savingThrowProficiencies?.includes(key)
  }

  savingThrowModifier(key: AbilityKey): number {
    return this.modifier(key) + (this.isSavingThrowProficient(key) ? this.proficiencyBonus : 0)
  }

  isSkillProficient(skillKey: string): boolean {
    return this.character.skillProficiencies?.includes(skillKey)
  }

  isSkillExpert(skillKey: string): boolean {
    return this.character.skillExpertise?.includes(skillKey)
  }

  /** The ability a skill is keyed off of (e.g. Medicina -> Sabedoria), or null for an unknown skill. */
  skillAbility(skillKey: string): AbilityKey | null {
    return SKILL_DEFS.find((s) => s.key === skillKey)?.ability ?? null
  }

  skillModifier(skillKey: string): number {
    const ability = this.skillAbility(skillKey)
    if (!ability) return 0
    const base = this.modifier(ability)
    const isExpert = this.isSkillExpert(skillKey)
    const getsProficiencyBonus = isExpert || this.isSkillProficient(skillKey)
    if (!getsProficiencyBonus) return base
    return base + doubleProficiencyIfIsChecked(this.proficiencyBonus, isExpert)
  }

  /** 10 + the skill's total modifier — what D&D calls a "passive" score (e.g. passive Perception). */
  passiveSkillScore(skillKey: string): number {
    return 10 + this.skillModifier(skillKey)
  }

  get passivePerception(): number {
    return this.passiveSkillScore('percepcao')
  }

  static abilityModifier(score: number): number {
    return Math.floor((score - 10) / 2)
  }

  static formatModifier(mod: number): string {
    return mod >= 0 ? `+${mod}` : `${mod}`
  }
}
