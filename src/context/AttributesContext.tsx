import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { DeDAttributes } from '../lib/DeDAttributes'
import type { AbilityKey, Character } from '../types/character'

type UpdateCharacter = (patch: Partial<Character> | ((c: Character) => Character)) => void

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
      toggleSavingThrow: (key) =>
        update((c) => ({
          ...c,
          savingThrowProficiencies: c.savingThrowProficiencies.includes(key)
            ? c.savingThrowProficiencies.filter((k) => k !== key)
            : [...c.savingThrowProficiencies, key],
        })),
      toggleSkillProficiency: (skillKey) =>
        update((c) => ({
          ...c,
          skillProficiencies: c.skillProficiencies.includes(skillKey)
            ? c.skillProficiencies.filter((k) => k !== skillKey)
            : [...c.skillProficiencies, skillKey],
        })),
      toggleSkillExpertise: (skillKey) =>
        update((c) => ({
          ...c,
          skillExpertise: c.skillExpertise.includes(skillKey)
            ? c.skillExpertise.filter((k) => k !== skillKey)
            : [...c.skillExpertise, skillKey],
        })),
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
