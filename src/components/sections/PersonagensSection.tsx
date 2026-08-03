import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Download, Eye, Plus, Search, Skull, Trash2, Upload, UserRoundSearch, Users, X } from 'lucide-react'
import {
  createBankCharacter,
  FILTERABLE_TRAIT_FIELDS,
  LIFE_STATUS_LABELS,
  TRAIT_FIELD_LABELS,
  type BankCharacter,
  type Character,
  type InvestigationCase,
  type LifeStatus,
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
import { useInvestigationData } from '../../hooks/useInvestigationData'

const LIFE_STATUS_OPTIONS: { value: LifeStatus; classes: string }[] = [
  { value: 'vivo', classes: 'border-emerald-700/50 bg-emerald-950/50 text-emerald-400' },
  { value: 'morto', classes: 'border-red-700/50 bg-red-950/50 text-red-400' },
  { value: 'desconhecido', classes: 'border-stone-700 bg-stone-900 text-stone-400' },
]

interface CaseLink {
  caseId: string
  caseTitle: string
  role: 'testemunha' | 'suspeito' | 'vítima'
}

const ROLE_ICONS = { testemunha: Eye, suspeito: UserRoundSearch, vítima: Skull }

/** Every case where this bank character is linked as a witness, suspect, or victim. */
function findCaseLinks(cases: InvestigationCase[], bankCharacterId: string): CaseLink[] {
  const links: CaseLink[] = []
  for (const cs of cases) {
    const caseTitle = cs.title || 'Caso sem título'
    if (cs.witnesses?.some((w) => w.linkedCharacterId === bankCharacterId)) links.push({ caseId: cs.id, caseTitle, role: 'testemunha' })
    if (cs.suspects?.some((s) => s.linkedCharacterId === bankCharacterId)) links.push({ caseId: cs.id, caseTitle, role: 'suspeito' })
    if (cs.victims?.some((v) => v.linkedCharacterId === bankCharacterId)) links.push({ caseId: cs.id, caseTitle, role: 'vítima' })
  }
  return links
}

export function PersonagensSection({
  character,
  update,
  onNotify,
}: {
  character: Character
  update: (patch: Partial<Character> | ((c: Character) => Character)) => void
  onNotify?: (message: string, variant: 'success' | 'error' | 'info') => void
}) {
  const [filters, setFilters] = useState<TraitFilters>(BLANK_TRAIT_FILTERS)
  const [nameFilter, setNameFilter] = useState('')
  const [organizationFilter, setOrganizationFilter] = useState('')
  const { exportData, importData } = useInvestigationData(character, update, onNotify)
  const hasActiveFilter = hasActiveTraitFilter(filters) || nameFilter?.trim() !== '' || organizationFilter?.trim() !== ''
  const traitSuggestions = useMemo(
    () => collectTraitSuggestions(character.characterBank?.map((b) => b.traits)),
    [character.characterBank],
  )
  const nameSuggestions = useMemo(
    () => Array.from(new Set(character.characterBank.map((b) => b.name?.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [character.characterBank],
  )
  const organizationSuggestions = useMemo(
    () => Array.from(new Set(character.characterBank.map((b) => b.organization?.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [character.characterBank],
  )

  const clearAllFilters = () => {
    setFilters(BLANK_TRAIT_FILTERS)
    setNameFilter('')
    setOrganizationFilter('')
  }

  // Newest-added character first.
  const visibleBank = character.characterBank
    .filter((b) => {
      const nameQuery = nameFilter?.trim().toLowerCase()
      const orgQuery = organizationFilter?.trim().toLowerCase()
      const nameMatch = nameQuery === '' || b.name.toLowerCase().includes(nameQuery)
      const orgMatch = orgQuery === '' || b.organization.toLowerCase().includes(orgQuery)
      return nameMatch && orgMatch && matchesTraitFilters(b.traits, filters)
    })
    .reverse()

  const addCharacter = () => update((c) => ({ ...c, characterBank: [...c.characterBank, createBankCharacter()] }))

  const updateCharacter = (id: string, patch: Partial<BankCharacter>) =>
    update((c) => {
      const characterBank = c.characterBank?.map((b) => (b.id === id ? { ...b, ...patch } : b))
      const updated = characterBank.find((b) => b.id === id)
      if (!updated) return { ...c, characterBank }
      // Every witness/suspect/victim linked to this character mirrors its name and traits.
      const cases = c.cases?.map((cs) => ({
        ...cs,
        witnesses: cs.witnesses?.map((w) =>
          w.linkedCharacterId === id ? { ...w, name: updated.name, traits: updated.traits } : w,
        ),
        suspects: cs.suspects?.map((s) =>
          s.linkedCharacterId === id ? { ...s, name: updated.name, traits: updated.traits } : s,
        ),
        victims: cs.victims?.map((v) =>
          v.linkedCharacterId === id ? { ...v, name: updated.name, traits: updated.traits } : v,
        ),
      }))
      return { ...c, characterBank, cases }
    })

  const removeCharacter = (id: string) => {
    if (
      !confirm(
        'Remover este personagem do banco? Testemunhas, suspeitos e vítimas que o usam mantêm os dados atuais, mas deixam de estar vinculados.',
      )
    )
      return
    update((c) => ({
      ...c,
      characterBank: c.characterBank.filter((b) => b.id !== id),
      cases: c.cases?.map((cs) => ({
        ...cs,
        witnesses: cs.witnesses?.map((w) => (w.linkedCharacterId === id ? { ...w, linkedCharacterId: undefined } : w)),
        suspects: cs.suspects?.map((s) => (s.linkedCharacterId === id ? { ...s, linkedCharacterId: undefined } : s)),
        victims: cs.victims?.map((v) => (v.linkedCharacterId === id ? { ...v, linkedCharacterId: undefined } : v)),
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
            {character.characterBank?.length === 0
              ? 'Nenhum personagem salvo'
              : `${character.characterBank?.length} ${character.characterBank?.length > 1 ? 'personagens' : 'personagem'}`}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={importData}
            title="Importar casos e personagens de um arquivo"
            className="flex items-center gap-1.5 rounded-md border border-stone-700 bg-stone-900 px-2.5 py-1.5 text-xs font-medium text-stone-400 hover:border-stone-600 hover:text-stone-200"
          >
            <Upload size={13} /> Importar
          </button>
          <button
            onClick={exportData}
            title="Exportar casos e personagens para um arquivo"
            className="flex items-center gap-1.5 rounded-md border border-stone-700 bg-stone-900 px-2.5 py-1.5 text-xs font-medium text-stone-400 hover:border-stone-600 hover:text-stone-200"
          >
            <Download size={13} /> Exportar
          </button>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={addCharacter}
            className="flex items-center gap-1.5 rounded-md border border-amber-600/50 bg-amber-600/15 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-600/25"
          >
            <Plus size={14} /> Novo personagem
          </motion.button>
        </div>
      </div>

      <p className="text-xs text-stone-500">
        Personagens salvos aqui podem ser vinculados a testemunhas, suspeitos e vítimas em qualquer caso (botão "Vincular" ao
        lado do nome). Editar um personagem aqui atualiza automaticamente todos os lugares onde ele está vinculado.
      </p>

      {character.characterBank?.length > 0 && (
        <Panel title="Buscar personagens" icon={<Search size={13} className="text-amber-600" />}>
          <div className="mb-2.5 flex items-start justify-between gap-3">
            <p className="text-xs text-stone-500">Filtra os personagens abaixo por nome, organização ou traços físicos.</p>
            {hasActiveFilter && (
              <button
                onClick={clearAllFilters}
                className="flex shrink-0 items-center gap-1 text-xs font-medium text-stone-500 hover:text-amber-400"
              >
                <X size={12} /> Limpar filtros
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            <FilterField
              label="Nome"
              value={nameFilter}
              onChange={setNameFilter}
              onClear={() => setNameFilter('')}
              listId="character-name-suggestions"
            />
            <FilterField
              label="Organização"
              value={organizationFilter}
              onChange={setOrganizationFilter}
              onClear={() => setOrganizationFilter('')}
              listId="character-organization-suggestions"
            />
            {FILTERABLE_TRAIT_FIELDS?.map((field) => (
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
          <datalist id="character-name-suggestions">
            {nameSuggestions.map((value) => (
              <option key={value} value={value} />
            ))}
          </datalist>
          <datalist id="character-organization-suggestions">
            {organizationSuggestions.map((value) => (
              <option key={value} value={value} />
            ))}
          </datalist>
          {FILTERABLE_TRAIT_FIELDS?.map((field) => (
            <datalist key={field} id={traitSuggestionsListId(field)}>
              {traitSuggestions[field]?.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          ))}
        </Panel>
      )}

      {character.characterBank?.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-stone-800 bg-stone-950/40 px-6 py-14 text-center">
          <Users size={28} className="text-stone-700" />
          <p className="text-sm text-stone-500">
            Crie personagens reutilizáveis pra não ter que redigitar os traços físicos toda vez que alguém aparecer em mais
            de um caso.
          </p>
        </div>
      )}

      {hasActiveFilter && visibleBank?.length === 0 && character.characterBank?.length > 0 && (
        <p className="text-sm text-stone-600">Nenhum personagem bate com esse filtro.</p>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {visibleBank?.map((bankChar) => {
          const lifeStatus = LIFE_STATUS_OPTIONS.find((o) => o.value === bankChar.lifeStatus) ?? LIFE_STATUS_OPTIONS[2]
          const caseLinks = findCaseLinks(character.cases, bankChar.id)
          return (
            <Panel key={bankChar.id}>
              <div className="mb-2.5 flex items-center gap-2">
                <input
                  value={bankChar.name}
                  onChange={(e) => updateCharacter(bankChar.id, { name: e.target.value })}
                  placeholder="Nome do personagem"
                  className="min-w-0 flex-1 rounded-md border border-stone-700 bg-stone-900 px-2 py-1.5 text-sm font-medium text-stone-100 outline-none focus:border-amber-600/60"
                />
                <select
                  value={bankChar.lifeStatus}
                  onChange={(e) => updateCharacter(bankChar.id, { lifeStatus: e.target.value as LifeStatus })}
                  className={`shrink-0 rounded-md border px-2 py-1 text-[11px] font-medium outline-none ${lifeStatus.classes}`}
                >
                  {LIFE_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-stone-900 text-stone-200">
                      {LIFE_STATUS_LABELS[opt.value]}
                    </option>
                  ))}
                </select>
                <button onClick={() => removeCharacter(bankChar.id)} className="shrink-0 text-stone-600 hover:text-red-500">
                  <Trash2 size={13} />
                </button>
              </div>
              <TextField
                label="Organização"
                value={bankChar.organization}
                onChange={(v) => updateCharacter(bankChar.id, { organization: v })}
                list="character-organization-suggestions"
                className="mb-2.5"
              />
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {FILTERABLE_TRAIT_FIELDS?.map((field) => (
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

              {caseLinks.length > 0 && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-stone-800 pt-2.5">
                  <span className="shrink-0 text-[10px] font-medium tracking-wide text-stone-500 uppercase">Vinculado em</span>
                  {caseLinks.map((link) => {
                    const RoleIcon = ROLE_ICONS[link.role]
                    return (
                      <span
                        key={`${link.caseId}-${link.role}`}
                        className="flex items-center gap-1 rounded-md border border-stone-700 bg-stone-900 px-1.5 py-0.5 text-[11px] text-stone-400"
                      >
                        <RoleIcon size={11} className="shrink-0 text-stone-500" />
                        {link.caseTitle} <span className="text-stone-600">· {link.role}</span>
                      </span>
                    )
                  })}
                </div>
              )}
            </Panel>
          )
        })}
      </div>
    </div>
  )
}
