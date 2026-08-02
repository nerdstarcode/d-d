import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { DeDAttributes } from '../lib/DeDAttributes'
import type { AbilityKey, Character } from '../types/character'

type UpdateCharacter = (patch: Partial<Character> | ((c: Character) => Character)) => void

/** A membership list (a set of proficiencies, of expertise, ...) with `key` taken out — i.e. revoking it. */
function without<T>(list: T[], key: T): T[] {
  return list.filter((item) => item !== key)
}

/** A membership list (a set of proficiencies, of expertise, ...) with `key` added — i.e. granting it. */
function withAdded<T>(list: T[], key: T): T[] {
  return [...list, key]
}

interface AttributesContextValue {
  attrs: DeDAttributes
  setAbilityScore: (key: AbilityKey, score: number) => void
  setProficiencyBonus: (value: number) => void
  setInspiration: (value: number) => void
  toggleSavingThrow: (key: AbilityKey) => void
  toggleSkillProficiency: (skillKey: string) => void
  toggleSkillExpertise: (skillKey: string) => void
}

const AttributesContext = createContext<AttributesContextValue | null>(null)

export function AttributesProvider({
  character,
  update,
  children,
}: {
  character: Character
  update: UpdateCharacter
  children: ReactNode
}) {
  const value = useMemo<AttributesContextValue>(
    () => ({
      attrs: new DeDAttributes(character),
      setAbilityScore: (key, score) => update((c) => ({ ...c, abilities: { ...c.abilities, [key]: { score } } })),
      setProficiencyBonus: (value) => update({ proficiencyBonus: value }),
      setInspiration: (value) => update({ inspiration: value }),
      // Saving throw proficiency is a flat on/off per ability: proficient
      // abilities add the proficiency bonus once (DeDAttributes.savingThrowModifier).
      // Unlike skills, 5e has no "expertise" tier for saving throws, so this
      // is a plain membership toggle with no other list to keep in sync.
      toggleSavingThrow: (key) =>
        update((c) => {
          const isProficient = c.savingThrowProficiencies.includes(key)
          return {
            ...c,
            savingThrowProficiencies: isProficient
              ? without(c.savingThrowProficiencies, key)
              : withAdded(c.savingThrowProficiencies, key),
          }
        }),
      // Skill proficiency adds the proficiency bonus once
      // (DeDAttributes.skillModifier). Per 5e rules, Expertise only applies
      // to skills you're already proficient in, so revoking proficiency here
      // also revokes expertise — otherwise skillExpertise could reference a
      // skill that's no longer proficient, a combination DeDAttributes
      // doesn't expect.
      toggleSkillProficiency: (skillKey) =>
        update((c) => {
          const isProficient = c.skillProficiencies.includes(skillKey)
          return {
            ...c,
            skillProficiencies: isProficient
              ? without(c.skillProficiencies, skillKey)
              : withAdded(c.skillProficiencies, skillKey),
            // Losing proficiency also loses whatever expertise was built on top of it.
            skillExpertise: isProficient ? without(c.skillExpertise, skillKey) : c.skillExpertise,
          }
        }),
      // Expertise doubles the proficiency bonus instead of adding it once
      // (DeDAttributes.skillModifier). Since 5e requires expertise to be
      // built on top of proficiency, granting it here also grants
      // proficiency if the skill doesn't already have it, so the two lists
      // can never drift into an invalid "expert but not proficient" state.
      toggleSkillExpertise: (skillKey) =>
        update((c) => {
          const isExpert = c.skillExpertise.includes(skillKey)
          const isAlreadyProficient = c.skillProficiencies.includes(skillKey)
          return {
            ...c,
            skillExpertise: isExpert ? without(c.skillExpertise, skillKey) : withAdded(c.skillExpertise, skillKey),
            // Granting expertise also grants proficiency if it's missing, since expertise requires it.
            skillProficiencies:
              !isExpert && !isAlreadyProficient ? withAdded(c.skillProficiencies, skillKey) : c.skillProficiencies,
          }
        }),
    }),
    [character, update],
  )

  return <AttributesContext.Provider value={value}>{children}</AttributesContext.Provider>
}

export function useAttributes(): AttributesContextValue {
  const ctx = useContext(AttributesContext)
  if (!ctx) throw new Error('useAttributes must be used within an <AttributesProvider>')
  return ctx
}
