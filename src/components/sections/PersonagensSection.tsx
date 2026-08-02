import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Plus, Search, Trash2, Users, X } from 'lucide-react'
import {
  createBankCharacter,
  FILTERABLE_TRAIT_FIELDS,
  TRAIT_FIELD_LABELS,
  type BankCharacter,
  type Character,
  type TraitField,
} from '../../types/character'
import {
  BLANK_TRAIT_FILTERS,
  collectTraitSuggestions,
  hasActiveTraitFilter,
  matchesTraitFilters,
  traitSuggestionsListId,
  type TraitFilters,
} from '../../lib/traitFilter'
import { FilterField } from '../FilterField'
import { Panel, TextAreaField, TextField } from '../ui'

export function PersonagensSection({
  character,
  update,
}: {
  character: Character
  update: (patch: Partial<Character> | ((c: Character) => Character)) => void
}) {
  const [filters, setFilters] = useState<TraitFilters>(BLANK_TRAIT_FILTERS)
  const hasActiveFilter = hasActiveTraitFilter(filters)
  const traitSuggestions = useMemo(
    () => collectTraitSuggestions(character.characterBank.map((b) => b.traits)),
    [character.characterBank],
  )
  const visibleBank = hasActiveFilter
    ? character.characterBank.filter((b) => matchesTraitFilters(b.traits, filters))
    : character.characterBank

  const addCharacter = () => update((c) => ({ ...c, characterBank: [...c.characterBank, createBankCharacter()] }))

  const updateCharacter = (id: string, patch: Partial<BankCharacter>) =>
    update((c) => {
      const characterBank = c.characterBank.map((b) => (b.id === id ? { ...b, ...patch } : b))
      const updated = characterBank.find((b) => b.id === id)
      if (!updated) return { ...c, characterBank }
      // Every witness/suspect linked to this character mirrors its name and traits.
      const cases = c.cases.map((cs) => ({
        ...cs,
        witnesses: cs.witnesses.map((w) =>
          w.linkedCharacterId === id ? { ...w, name: updated.name, traits: updated.traits } : w,
        ),
        suspects: cs.suspects.map((s) =>
          s.linkedCharacterId === id ? { ...s, name: updated.name, traits: updated.traits } : s,
        ),
      }))
      return { ...c, characterBank, cases }
    })

  const removeCharacter = (id: string) => {
    if (
      !confirm(
        'Remover este personagem do banco? Testemunhas e suspeitos que o usam mantêm os dados atuais, mas deixam de estar vinculados.',
      )
    )
      return
    update((c) => ({
      ...c,
      characterBank: c.characterBank.filter((b) => b.id !== id),
      cases: c.cases.map((cs) => ({
        ...cs,
        witnesses: cs.witnesses.map((w) => (w.linkedCharacterId === id ? { ...w, linkedCharacterId: undefined } : w)),
        suspects: cs.suspects.map((s) => (s.linkedCharacterId === id ? { ...s, linkedCharacterId: undefined } : s)),
      })),
    }))
  }

  const onTraitChange = (bankChar: BankCharacter, field: TraitField, value: string) =>
    updateCharacter(bankChar.id, { traits: { ...bankChar.traits, [field]: value } })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-stone-400">
          <Users size={16} className="text-amber-600" />
          <span className="text-xs font-medium tracking-wide uppercase">
            {character.characterBank.length === 0
              ? 'Nenhum personagem salvo'
              : `${character.characterBank.length} ${character.characterBank.length > 1 ? 'personagens' : 'personagem'}`}
          </span>
        </div>
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={addCharacter}
          className="flex items-center gap-1.5 rounded-md border border-amber-600/50 bg-amber-600/15 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-600/25"
        >
          <Plus size={14} /> Novo personagem
        </motion.button>
      </div>

      <p className="text-xs text-stone-500">
        Personagens salvos aqui podem ser vinculados a testemunhas e suspeitos em qualquer caso (botão "Vincular" ao lado do
        nome). Editar um personagem aqui atualiza automaticamente todos os lugares onde ele está vinculado.
      </p>

      {character.characterBank.length > 0 && (
        <Panel title="Buscar por traços físicos" icon={<Search size={13} className="text-amber-600" />}>
          <div className="mb-2.5 flex items-start justify-between gap-3">
            <p className="text-xs text-stone-500">Filtra os personagens abaixo por qualquer combinação de traços.</p>
            {hasActiveFilter && (
              <button
                onClick={() => setFilters(BLANK_TRAIT_FILTERS)}
                className="flex shrink-0 items-center gap-1 text-xs font-medium text-stone-500 hover:text-amber-400"
              >
                <X size={12} /> Limpar filtros
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {FILTERABLE_TRAIT_FIELDS.map((field) => (
              <FilterField
                key={field}
                label={TRAIT_FIELD_LABELS[field]}
                value={filters[field]}
                onChange={(v) => setFilters((prev) => ({ ...prev, [field]: v }))}
                onClear={() => setFilters((prev) => ({ ...prev, [field]: '' }))}
                listId={traitSuggestionsListId(field)}
              />
            ))}
          </div>
          {FILTERABLE_TRAIT_FIELDS.map((field) => (
            <datalist key={field} id={traitSuggestionsListId(field)}>
              {traitSuggestions[field].map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          ))}
        </Panel>
      )}

      {character.characterBank.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-stone-800 bg-stone-950/40 px-6 py-14 text-center">
          <Users size={28} className="text-stone-700" />
          <p className="text-sm text-stone-500">
            Crie personagens reutilizáveis pra não ter que redigitar os traços físicos toda vez que alguém aparecer em mais
            de um caso.
          </p>
        </div>
      )}

      {hasActiveFilter && visibleBank.length === 0 && character.characterBank.length > 0 && (
        <p className="text-sm text-stone-600">Nenhum personagem bate com esses traços.</p>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {visibleBank.map((bankChar) => (
          <Panel key={bankChar.id}>
            <div className="mb-2.5 flex items-center gap-2">
              <input
                value={bankChar.name}
                onChange={(e) => updateCharacter(bankChar.id, { name: e.target.value })}
                placeholder="Nome do personagem"
                className="min-w-0 flex-1 rounded-md border border-stone-700 bg-stone-900 px-2 py-1.5 text-sm font-medium text-stone-100 outline-none focus:border-amber-600/60"
              />
              <button onClick={() => removeCharacter(bankChar.id)} className="shrink-0 text-stone-600 hover:text-red-500">
                <Trash2 size={13} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {FILTERABLE_TRAIT_FIELDS.map((field) => (
                <TextField
                  key={field}
                  label={TRAIT_FIELD_LABELS[field]}
                  value={bankChar.traits[field]}
                  onChange={(v) => onTraitChange(bankChar, field, v)}
                />
              ))}
            </div>
            <TextAreaField
              label={TRAIT_FIELD_LABELS.description}
              rows={2}
              value={bankChar.traits.description}
              onChange={(v) => onTraitChange(bankChar, 'description', v)}
              className="mt-2.5"
            />
          </Panel>
        ))}
      </div>
    </div>
  )
}
