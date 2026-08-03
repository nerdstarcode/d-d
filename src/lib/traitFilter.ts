import { FILTERABLE_TRAIT_FIELDS, type PhysicalTraits } from '../types/character'

export type FilterableTraitField = (typeof FILTERABLE_TRAIT_FIELDS)[number]
export type TraitFilters = Record<FilterableTraitField, string>

export const BLANK_TRAIT_FILTERS: TraitFilters = {
  size: '',
  gender: '',
  hairColor: '',
  hairType: '',
  eyeColor: '',
}

/** id of the `<datalist>` that offers autocomplete suggestions for a given trait filter field. */
export const traitSuggestionsListId = (field: FilterableTraitField) => `trait-suggestions-${field}`

export function hasActiveTraitFilter(filters: TraitFilters): boolean {
  return Object.values(filters).some((v) => v?.trim() !== '')
}

/** Whether every non-empty filter field is a case-insensitive substring match of the corresponding trait. */
export function matchesTraitFilters(traits: PhysicalTraits, filters: TraitFilters): boolean {
  return FILTERABLE_TRAIT_FIELDS.every((field) => {
    const query = filters[field]?.trim().toLowerCase()
    return query === '' || traits[field].toLowerCase()?.includes(query)
  })
}

/** Every distinct, non-empty value already typed into each trait field, across the given people. */
export function collectTraitSuggestions(peopleTraits: PhysicalTraits[]): Record<FilterableTraitField, string[]> {
  const seen: Record<FilterableTraitField, Set<string>> = {
    size: new Set(),
    gender: new Set(),
    hairColor: new Set(),
    hairType: new Set(),
    eyeColor: new Set(),
  }
  for (const traits of peopleTraits) {
    for (const field of FILTERABLE_TRAIT_FIELDS) {
      const value = traits[field]?.trim()
      if (value) seen[field].add(value)
    }
  }
  const sortPt = (a: string, b: string) => a.localeCompare(b, 'pt-BR')
  return {
    size: [...seen.size].sort(sortPt),
    gender: [...seen.gender].sort(sortPt),
    hairColor: [...seen.hairColor].sort(sortPt),
    hairType: [...seen.hairType].sort(sortPt),
    eyeColor: [...seen.eyeColor].sort(sortPt),
  }
}
