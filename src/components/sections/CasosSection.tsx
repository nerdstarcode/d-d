import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Download, Eye, FolderSearch, Link2, Plus, Search, Trash2, Upload, UserRoundSearch, X } from 'lucide-react'
import {
  createCase,
  createSuspect,
  createTestimony,
  createWitness,
  FILTERABLE_TRAIT_FIELDS,
  TRAIT_FIELD_LABELS,
  type BankCharacter,
  type CaseStatus,
  type Character,
  type InvestigationCase,
  type PhysicalTraits,
  type Suspect,
  type Testimony,
  type TraitField,
  type Witness,
} from '../../types/character'
import {
  BLANK_TRAIT_FILTERS,
  collectTraitSuggestions,
  hasActiveTraitFilter,
  matchesTraitFilters,
  traitSuggestionsListId,
  type TraitFilters,
} from '../../lib/traitFilter'
import { BankLinkControl } from '../BankLinkControl'
import { FilterField } from '../FilterField'
import { RelatedCasesControl } from '../RelatedCasesControl'
import { Panel, TextAreaField, TextField } from '../ui'
import { useInvestigationData } from '../../hooks/useInvestigationData'

const STATUS_OPTIONS: { value: CaseStatus; label: string; classes: string }[] = [
  { value: 'aberto', label: 'Aberto', classes: 'border-amber-700/50 bg-amber-950/50 text-amber-400' },
  { value: 'resolvido', label: 'Resolvido', classes: 'border-emerald-700/50 bg-emerald-950/50 text-emerald-400' },
  { value: 'arquivado', label: 'Arquivado', classes: 'border-stone-700 bg-stone-900 text-stone-400' },
]

interface PersonMatch {
  caseId: string
  caseTitle: string
  kind: 'witness' | 'suspect'
  id: string
  name: string
  traits: PhysicalTraits
}

function stripTestimonyFromSuspects(investigation: InvestigationCase, testimonyIds: string[]): InvestigationCase {
  if (testimonyIds.length === 0) return investigation
  const idSet = new Set(testimonyIds)
  return {
    ...investigation,
    suspects: investigation.suspects?.map((s) => {
      let changed = false
      const sources = { ...s.sources }
      for (const key of Object.keys(sources) as TraitField[]) {
        const arr = sources[key]
        if (!arr) continue
        const filtered = arr.filter((id) => !idSet.has(id))
        if (filtered.length !== arr.length) {
          sources[key] = filtered
          changed = true
        }
      }
      return changed ? { ...s, sources } : s
    }),
  }
}

/** Badge colors for a testimony's 0-10 reliability rating: red (unreliable) through emerald (trustworthy). */
function reliabilityBadgeClasses(value: number): string {
  if (value <= 3) return 'border-red-700/50 bg-red-950/50 text-red-400'
  if (value <= 6) return 'border-amber-700/50 bg-amber-950/50 text-amber-400'
  return 'border-emerald-700/50 bg-emerald-950/50 text-emerald-400'
}

export function CasosSection({
  character,
  update,
  onNotify,
}: {
  character: Character
  update: (patch: Partial<Character> | ((c: Character) => Character)) => void
  onNotify?: (message: string, variant: 'success' | 'error' | 'info') => void
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [subTab, setSubTabState] = useState<Record<string, 'testemunhas' | 'suspeitos'>>({})
  const [filters, setFilters] = useState<TraitFilters>(BLANK_TRAIT_FILTERS)
  const { exportData, importData } = useInvestigationData(character, update, onNotify)
  const caseRefs = useRef(new Map<string, HTMLDivElement>())

  const toggleCollapsed = (id: string) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))
  const getSubTab = (id: string) => subTab[id] ?? 'testemunhas'
  const setSubTab = (id: string, tab: 'testemunhas' | 'suspeitos') => setSubTabState((prev) => ({ ...prev, [id]: tab }))

  const traitSuggestions = useMemo(
    () => collectTraitSuggestions(character.cases.flatMap((cs) => [...cs.witnesses, ...cs.suspects])?.map((p) => p.traits)),
    [character.cases],
  )

  const updateCase = (
    caseId: string,
    patch: Partial<InvestigationCase> | ((cs: InvestigationCase) => InvestigationCase),
  ) =>
    update((c) => ({
      ...c,
      cases: c.cases?.map((cs) => (cs.id === caseId ? (typeof patch === 'function' ? patch(cs) : { ...cs, ...patch }) : cs)),
    }))

  const addCase = () => {
    const next = createCase()
    update((c) => ({ ...c, cases: [...c.cases, next] }))
    setCollapsed((prev) => ({ ...prev, [next.id]: false }))
  }

  const removeCase = (id: string) => {
    if (!confirm('Remover este caso, suas testemunhas e suspeitos?')) return
    update((c) => ({
      ...c,
      cases: c.cases
        .filter((cs) => cs.id !== id)
        ?.map((cs) => ({ ...cs, relatedCaseIds: cs.relatedCaseIds.filter((rid) => rid !== id) })),
    }))
  }

  // Relations are always symmetric: linking/unlinking A<->B touches both cases' lists.
  const linkRelatedCase = (caseId: string, otherCaseId: string) =>
    update((c) => ({
      ...c,
      cases: c.cases?.map((cs) => {
        if (cs.id === caseId && !cs.relatedCaseIds?.includes(otherCaseId)) {
          return { ...cs, relatedCaseIds: [...(cs.relatedCaseIds ?? []), otherCaseId] }
        }
        if (cs.id === otherCaseId && !cs.relatedCaseIds?.includes(caseId)) {
          return { ...cs, relatedCaseIds: [...(cs.relatedCaseIds ?? []), caseId] }
        }
        return cs
      }),
    }))

  const unlinkRelatedCase = (caseId: string, otherCaseId: string) =>
    update((c) => ({
      ...c,
      cases: c.cases?.map((cs) => {
        if (cs.id === caseId) return { ...cs, relatedCaseIds: cs.relatedCaseIds.filter((rid) => rid !== otherCaseId) }
        if (cs.id === otherCaseId) return { ...cs, relatedCaseIds: cs.relatedCaseIds.filter((rid) => rid !== caseId) }
        return cs
      }),
    }))

  const addWitness = (caseId: string) => updateCase(caseId, (cs) => ({ ...cs, witnesses: [...cs.witnesses, createWitness()] }))

  const updateWitness = (caseId: string, witnessId: string, patch: Partial<Witness>) =>
    updateCase(caseId, (cs) => ({
      ...cs,
      witnesses: cs.witnesses?.map((w) => (w.id === witnessId ? { ...w, ...patch } : w)),
    }))

  const removeWitness = (caseId: string, witnessId: string) =>
    updateCase(caseId, (cs) => {
      const witness = cs.witnesses.find((w) => w.id === witnessId)
      const stripped = stripTestimonyFromSuspects(cs, witness?.testimonies?.map((t) => t.id) ?? [])
      return { ...stripped, witnesses: stripped.witnesses.filter((w) => w.id !== witnessId) }
    })

  const addTestimony = (caseId: string, witnessId: string) =>
    updateCase(caseId, (cs) => ({
      ...cs,
      witnesses: cs.witnesses?.map((w) => (w.id === witnessId ? { ...w, testimonies: [...w.testimonies, createTestimony()] } : w)),
    }))

  const updateTestimony = (caseId: string, witnessId: string, testimonyId: string, patch: Partial<Testimony>) =>
    updateCase(caseId, (cs) => ({
      ...cs,
      witnesses: cs.witnesses?.map((w) =>
        w.id === witnessId
          ? { ...w, testimonies: w.testimonies?.map((t) => (t.id === testimonyId ? { ...t, ...patch } : t)) }
          : w,
      ),
    }))

  const removeTestimony = (caseId: string, witnessId: string, testimonyId: string) =>
    updateCase(caseId, (cs) => {
      const stripped = stripTestimonyFromSuspects(cs, [testimonyId])
      return {
        ...stripped,
        witnesses: stripped.witnesses?.map((w) =>
          w.id === witnessId ? { ...w, testimonies: w.testimonies.filter((t) => t.id !== testimonyId) } : w,
        ),
      }
    })

  const addSuspect = (caseId: string) => updateCase(caseId, (cs) => ({ ...cs, suspects: [...cs.suspects, createSuspect()] }))

  const updateSuspect = (caseId: string, suspectId: string, patch: Partial<Suspect>) =>
    updateCase(caseId, (cs) => ({
      ...cs,
      suspects: cs.suspects?.map((s) => (s.id === suspectId ? { ...s, ...patch } : s)),
    }))

  const removeSuspect = (caseId: string, suspectId: string) =>
    updateCase(caseId, (cs) => ({ ...cs, suspects: cs.suspects.filter((s) => s.id !== suspectId) }))

  const toggleSource = (caseId: string, suspectId: string, field: TraitField, testimonyId: string) =>
    updateCase(caseId, (cs) => ({
      ...cs,
      suspects: cs.suspects?.map((s) => {
        if (s.id !== suspectId) return s
        const current = s.sources[field] ?? []
        const next = current?.includes(testimonyId) ? current.filter((id) => id !== testimonyId) : [...current, testimonyId]
        return { ...s, sources: { ...s.sources, [field]: next } }
      }),
    }))

  const linkWitnessToBank = (caseId: string, witnessId: string, bankId: string) => {
    const bankChar = character.characterBank.find((b) => b.id === bankId)
    if (!bankChar) return
    updateWitness(caseId, witnessId, { name: bankChar.name, traits: bankChar.traits, linkedCharacterId: bankId })
  }
  const unlinkWitnessFromBank = (caseId: string, witnessId: string) =>
    updateWitness(caseId, witnessId, { linkedCharacterId: undefined })

  const linkSuspectToBank = (caseId: string, suspectId: string, bankId: string) => {
    const bankChar = character.characterBank.find((b) => b.id === bankId)
    if (!bankChar) return
    updateSuspect(caseId, suspectId, { name: bankChar.name, traits: bankChar.traits, linkedCharacterId: bankId })
  }
  const unlinkSuspectFromBank = (caseId: string, suspectId: string) =>
    updateSuspect(caseId, suspectId, { linkedCharacterId: undefined })

  const hasActiveFilter = hasActiveTraitFilter(filters)

  const filterResults: PersonMatch[] = hasActiveFilter
    ? character.cases.flatMap((cs) => {
      const caseTitle = cs.title || 'Caso sem título'
      const people: PersonMatch[] = [
        ...cs.witnesses?.map((w) => ({ caseId: cs.id, caseTitle, kind: 'witness' as const, id: w.id, name: w.name, traits: w.traits })),
        ...cs.suspects?.map((s) => ({ caseId: cs.id, caseTitle, kind: 'suspect' as const, id: s.id, name: s.name, traits: s.traits })),
      ]
      return people.filter((p) => matchesTraitFilters(p.traits, filters))
    })
    : []

  const jumpToCase = (caseId: string) => {
    setCollapsed((prev) => ({ ...prev, [caseId]: false }))
    requestAnimationFrame(() => {
      caseRefs.current.get(caseId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const jumpToPerson = (match: PersonMatch) => {
    setSubTab(match.caseId, match.kind === 'witness' ? 'testemunhas' : 'suspeitos')
    jumpToCase(match.caseId)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-stone-400">
          <FolderSearch size={16} className="text-amber-600" />
          <span className="text-xs font-medium tracking-wide uppercase">
            {character.cases.length === 0
              ? 'Nenhum caso registrado'
              : `${character.cases.length} caso${character.cases.length > 1 ? 's' : ''}`}
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
            onClick={addCase}
            className="flex items-center gap-1.5 rounded-md border border-amber-600/50 bg-amber-600/15 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-600/25"
          >
            <Plus size={14} /> Novo caso
          </motion.button>
        </div>
      </div>

      {character.cases.length > 0 && (
        <Panel title="Buscar por traços físicos" icon={<Search size={13} className="text-amber-600" />}>
          <div className="mb-2.5 flex items-start justify-between gap-3">
            <p className="text-xs text-stone-500">
              Busca testemunhas e suspeitos de todos os casos por qualquer combinação de traços — útil pra achar a mesma pessoa
              descrita em lugares diferentes. Comece a digitar pra ver sugestões do que já foi cadastrado.
            </p>
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
          {FILTERABLE_TRAIT_FIELDS?.map((field) => (
            <datalist key={field} id={traitSuggestionsListId(field)}>
              {traitSuggestions[field]?.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          ))}

          {hasActiveFilter && (
            <div className="mt-3 border-t border-stone-800 pt-3">
              <p className="mb-2 text-[11px] font-medium tracking-wide text-stone-500 uppercase">
                {filterResults.length} pessoa{filterResults.length === 1 ? '' : 's'} encontrada
                {filterResults.length === 1 ? '' : 's'}
              </p>
              {filterResults.length === 0 ? (
                <p className="text-sm text-stone-600">Nenhuma testemunha ou suspeito bate com esses traços.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {filterResults?.map((m) => (
                    <button
                      key={`${m.caseId}-${m.id}`}
                      onClick={() => jumpToPerson(m)}
                      className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-stone-800 bg-stone-950/50 px-2.5 py-2 text-left text-xs transition-colors hover:border-amber-600/50"
                    >
                      {m.kind === 'witness' ? (
                        <Eye size={12} className="shrink-0 text-stone-500" />
                      ) : (
                        <UserRoundSearch size={12} className="shrink-0 text-stone-500" />
                      )}
                      <span className="font-medium text-stone-200">{m.name || 'Sem nome'}</span>
                      <span className="text-stone-600">· {m.caseTitle}</span>
                      <span className="text-stone-500">
                        {FILTERABLE_TRAIT_FIELDS.filter((f) => m.traits[f])
                          ?.map((f) => `${TRAIT_FIELD_LABELS[f]}: ${m.traits[f]}`)
                          .join(' · ')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </Panel>
      )}

      {character.cases.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-stone-800 bg-stone-950/40 px-6 py-14 text-center">
          <FolderSearch size={28} className="text-stone-700" />
          <p className="text-sm text-stone-500">
            Registre casos de investigação: as testemunhas e o que contaram, e os suspeitos com os dados levantados sobre eles.
          </p>
        </div>
      )}

      <AnimatePresence initial={false}>
        {character.cases?.map((investigation) => {
          const isCollapsed = !!collapsed[investigation.id]
          const status = STATUS_OPTIONS.find((s) => s.value === investigation.status) ?? STATUS_OPTIONS[0]
          const activeSubTab = getSubTab(investigation.id)
          return (
            <motion.div
              key={investigation.id}
              ref={(el) => {
                if (el) caseRefs.current.set(investigation.id, el)
                else caseRefs.current.delete(investigation.id)
              }}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="overflow-hidden rounded-xl border border-stone-800 bg-stone-900/60 shadow-lg shadow-black/20 backdrop-blur-sm"
            >
              <div className="flex flex-wrap items-center gap-2 border-b border-stone-800 px-4 py-2.5">
                <button
                  onClick={() => toggleCollapsed(investigation.id)}
                  className="flex items-center text-stone-500 hover:text-stone-300"
                >
                  <motion.span animate={{ rotate: isCollapsed ? -90 : 0 }} transition={{ duration: 0.15 }}>
                    <ChevronDown size={16} />
                  </motion.span>
                </button>
                <div className="flex min-w-32 flex-1 items-baseline gap-2">
                  <input
                    value={investigation.title}
                    onChange={(e) => updateCase(investigation.id, { title: e.target.value })}
                    placeholder="Nome do caso"
                    className=" w-fit bg-transparent font-serif text-sm font-semibold text-stone-100 outline-none placeholder:font-sans placeholder:font-normal placeholder:text-stone-600"
                  />
                  <input
                    value={investigation.date}
                    onChange={(e) => updateCase(investigation.id, { date: e.target.value })}
                    placeholder="Data"
                    className="w-28 shrink-0 bg-transparent text-xs text-stone-500 outline-none placeholder:text-stone-600 focus:text-stone-300"
                  />
                </div>
                <input
                  value={investigation.location}
                  onChange={(e) => updateCase(investigation.id, { location: e.target.value })}
                  placeholder="Local"
                  className="w-32 shrink-0 bg-transparent text-sm text-stone-300 outline-none placeholder:font-normal placeholder:text-stone-600"
                />
                <select
                  value={investigation.status}
                  onChange={(e) => updateCase(investigation.id, { status: e.target.value as CaseStatus })}
                  className={`rounded-md border px-2 py-1 text-[11px] font-medium outline-none ${status.classes}`}
                >
                  {STATUS_OPTIONS?.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-stone-900 text-stone-200">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span className="hidden text-[11px] text-stone-600 sm:inline">
                  {investigation.witnesses.length} test. · {investigation.suspects.length} susp.
                </span>
                <button onClick={() => removeCase(investigation.id)} className="text-stone-600 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>

              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-3 p-4">
                      <TextAreaField
                        label="Resumo do caso"
                        rows={3}
                        value={investigation.summary}
                        onChange={(v) => updateCase(investigation.id, { summary: v })}
                      />

                      <RelatedCasesControl
                        allCases={character.cases?.map((cs) => ({ id: cs.id, title: cs.title }))}
                        currentCaseId={investigation.id}
                        relatedIds={investigation.relatedCaseIds}
                        onLink={(otherId) => linkRelatedCase(investigation.id, otherId)}
                        onUnlink={(otherId) => unlinkRelatedCase(investigation.id, otherId)}
                        onJump={jumpToCase}
                      />

                      <div className="flex gap-1 border-b border-stone-800">
                        {(['testemunhas', 'suspeitos'] as const)?.map((key) => {
                          const active = activeSubTab === key
                          const count = key === 'testemunhas' ? investigation.witnesses.length : investigation.suspects.length
                          return (
                            <button
                              key={key}
                              onClick={() => setSubTab(investigation.id, key)}
                              className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${active ? 'text-amber-400' : 'text-stone-500 hover:text-stone-300'
                                }`}
                            >
                              {key === 'testemunhas' ? <Eye size={13} /> : <UserRoundSearch size={13} />}
                              {key === 'testemunhas' ? 'Testemunhas' : 'Suspeitos'}
                              {count > 0 && <span className="text-stone-600">({count})</span>}
                              {active && (
                                <motion.div
                                  layoutId={`case-subtab-${investigation.id}`}
                                  className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-amber-500"
                                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                />
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {activeSubTab === 'testemunhas' ? (
                        <div className="flex flex-col gap-3">
                          {investigation.witnesses?.map((witness) => (
                            <WitnessCard
                              key={witness.id}
                              witness={witness}
                              characterBank={character.characterBank}
                              onChange={(patch) => updateWitness(investigation.id, witness.id, patch)}
                              onAddTestimony={() => addTestimony(investigation.id, witness.id)}
                              onChangeTestimony={(tid, patch) => updateTestimony(investigation.id, witness.id, tid, patch)}
                              onRemoveTestimony={(tid) => removeTestimony(investigation.id, witness.id, tid)}
                              onRemove={() => removeWitness(investigation.id, witness.id)}
                              onLinkBank={(bankId) => linkWitnessToBank(investigation.id, witness.id, bankId)}
                              onUnlinkBank={() => unlinkWitnessFromBank(investigation.id, witness.id)}
                            />
                          ))}
                          <button
                            onClick={() => addWitness(investigation.id)}
                            className="flex items-center gap-1.5 self-start text-xs font-medium text-amber-500 hover:text-amber-400"
                          >
                            <Plus size={13} /> Testemunha
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {investigation.suspects?.map((suspect) => (
                            <SuspectCard
                              key={suspect.id}
                              suspect={suspect}
                              witnesses={investigation.witnesses}
                              characterBank={character.characterBank}
                              onChange={(patch) => updateSuspect(investigation.id, suspect.id, patch)}
                              onToggleSource={(field, tid) => toggleSource(investigation.id, suspect.id, field, tid)}
                              onRemove={() => removeSuspect(investigation.id, suspect.id)}
                              onLinkBank={(bankId) => linkSuspectToBank(investigation.id, suspect.id, bankId)}
                              onUnlinkBank={() => unlinkSuspectFromBank(investigation.id, suspect.id)}
                            />
                          ))}
                          <button
                            onClick={() => addSuspect(investigation.id)}
                            className="flex items-center gap-1.5 self-start text-xs font-medium text-amber-500 hover:text-amber-400"
                          >
                            <Plus size={13} /> Suspeito
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

function WitnessCard({
  witness,
  characterBank,
  onChange,
  onAddTestimony,
  onChangeTestimony,
  onRemoveTestimony,
  onRemove,
  onLinkBank,
  onUnlinkBank,
}: {
  witness: Witness
  characterBank: BankCharacter[]
  onChange: (patch: Partial<Witness>) => void
  onAddTestimony: () => void
  onChangeTestimony: (testimonyId: string, patch: Partial<Testimony>) => void
  onRemoveTestimony: (testimonyId: string) => void
  onRemove: () => void
  onLinkBank: (bankId: string) => void
  onUnlinkBank: () => void
}) {
  const onTraitChange = (field: TraitField, value: string) => onChange({ traits: { ...witness.traits, [field]: value } })
  const isLinked = !!witness.linkedCharacterId

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="rounded-lg border border-stone-800 bg-stone-950/50 p-3"
    >
      <div className="mb-2.5 flex items-center gap-2">
        <Eye size={14} className="shrink-0 text-stone-600" />
        <input
          value={witness.name}
          onChange={(e) => onChange({ name: e.target.value })}
          disabled={isLinked}
          placeholder="Nome da testemunha"
          className="min-w-0 flex-1 rounded-md border border-stone-700 bg-stone-900 px-2 py-1.5 text-sm font-medium text-stone-100 outline-none focus:border-amber-600/60 disabled:text-stone-400"
        />
        <BankLinkControl bank={characterBank} linkedId={witness.linkedCharacterId} onLink={onLinkBank} onUnlink={onUnlinkBank} />
        <button onClick={onRemove} className="shrink-0 text-stone-600 hover:text-red-500">
          <Trash2 size={13} />
        </button>
      </div>

      {isLinked ? (
        <div className="mb-3 rounded-md border border-sky-900/40 bg-sky-950/20 px-3 py-2 text-xs text-stone-400">
          <p className="mb-1 text-[10px] font-medium tracking-wide text-sky-500 uppercase">Traços do personagem vinculado</p>
          <p>
            {FILTERABLE_TRAIT_FIELDS.filter((f) => witness.traits[f])
              ?.map((f) => `${TRAIT_FIELD_LABELS[f]}: ${witness.traits[f]}`)
              .join(' · ') || 'Nenhum traço definido ainda.'}
          </p>
          {witness.traits.description && <p className="mt-1 italic text-stone-500">{witness.traits.description}</p>}
          <p className="mt-1.5 text-[10px] text-stone-600">
            Edite esses dados na aba Personagens — a mudança aparece em todo lugar onde ele está vinculado.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {FILTERABLE_TRAIT_FIELDS?.map((field) => (
              <TextField
                key={field}
                label={TRAIT_FIELD_LABELS[field]}
                value={witness.traits[field]}
                onChange={(v) => onTraitChange(field, v)}
              />
            ))}
          </div>
          <TextAreaField
            label={TRAIT_FIELD_LABELS.description}
            rows={2}
            value={witness.traits.description}
            onChange={(v) => onTraitChange('description', v)}
            className="mb-3"
          />
        </>
      )}

      <div className="flex flex-col gap-2">
        {witness.testimonies?.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-md border border-stone-800 bg-stone-900/50 p-2.5"
          >
            <div className="mb-2 flex items-center gap-2">
              <input
                value={t.where}
                onChange={(e) => onChangeTestimony(t.id, { where: e.target.value })}
                placeholder="Onde"
                className="min-w-0 flex-1 rounded-md border border-stone-700 bg-stone-950 px-2 py-1 text-xs text-stone-200 outline-none focus:border-amber-600/60"
              />
              <input
                value={t.when}
                onChange={(e) => onChangeTestimony(t.id, { when: e.target.value })}
                placeholder="Quando"
                className="min-w-0 flex-1 rounded-md border border-stone-700 bg-stone-950 px-2 py-1 text-xs text-stone-200 outline-none focus:border-amber-600/60"
              />
              <button onClick={() => onRemoveTestimony(t.id)} className="shrink-0 text-stone-600 hover:text-red-500">
                <Trash2 size={12} />
              </button>
            </div>
            <textarea
              value={t.what}
              onChange={(e) => onChangeTestimony(t.id, { what: e.target.value })}
              placeholder="O que a testemunha viu ou ouviu?"
              rows={2}
              className="w-full resize-none rounded-md border border-stone-700 bg-stone-950 px-2 py-1.5 text-xs leading-relaxed text-stone-200 outline-none focus:border-amber-600/60"
            />
            <div className="mt-2 flex items-center gap-2">
              <span className="shrink-0 text-[10px] font-medium tracking-wide text-stone-500 uppercase">Confiabilidade</span>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={t.reliability ?? 5}
                onChange={(e) => onChangeTestimony(t.id, { reliability: e.target.valueAsNumber })}
                className="h-1.5 flex-1 accent-amber-500"
              />
              <span
                className={`shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-semibold ${reliabilityBadgeClasses(t.reliability ?? 5)}`}
              >
                {t.reliability ?? 5}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
      <button onClick={onAddTestimony} className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-500 hover:text-amber-400">
        <Plus size={12} /> Testemunho
      </button>
    </motion.div>
  )
}

function SuspectCard({
  suspect,
  witnesses,
  characterBank,
  onChange,
  onToggleSource,
  onRemove,
  onLinkBank,
  onUnlinkBank,
}: {
  suspect: Suspect
  witnesses: Witness[]
  characterBank: BankCharacter[]
  onChange: (patch: Partial<Suspect>) => void
  onToggleSource: (field: TraitField, testimonyId: string) => void
  onRemove: () => void
  onLinkBank: (bankId: string) => void
  onUnlinkBank: () => void
}) {
  const onTraitChange = (field: TraitField, value: string) => onChange({ traits: { ...suspect.traits, [field]: value } })
  const isLinked = !!suspect.linkedCharacterId

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="rounded-lg border border-stone-800 bg-stone-950/50 p-3"
    >
      <div className="mb-2.5 flex items-center gap-2">
        <UserRoundSearch size={14} className="shrink-0 text-stone-600" />
        <input
          value={suspect.name}
          onChange={(e) => onChange({ name: e.target.value })}
          disabled={isLinked}
          placeholder="Nome (ou &quot;desconhecido&quot;)"
          className="min-w-0 flex-1 rounded-md border border-stone-700 bg-stone-900 px-2 py-1.5 text-sm font-medium text-stone-100 outline-none focus:border-amber-600/60 disabled:text-stone-400"
        />
        <BankLinkControl bank={characterBank} linkedId={suspect.linkedCharacterId} onLink={onLinkBank} onUnlink={onUnlinkBank} />
        <button onClick={onRemove} className="shrink-0 text-stone-600 hover:text-red-500">
          <Trash2 size={13} />
        </button>
      </div>

      {isLinked ? (
        <div className="rounded-md border border-sky-900/40 bg-sky-950/20 px-3 py-2 text-xs text-stone-400">
          <p className="mb-1 text-[10px] font-medium tracking-wide text-sky-500 uppercase">Traços do personagem vinculado</p>
          <p>
            {FILTERABLE_TRAIT_FIELDS.filter((f) => suspect.traits[f])
              ?.map((f) => `${TRAIT_FIELD_LABELS[f]}: ${suspect.traits[f]}`)
              .join(' · ') || 'Nenhum traço definido ainda.'}
          </p>
          {suspect.traits.description && <p className="mt-1 italic text-stone-500">{suspect.traits.description}</p>}
          <p className="mt-1.5 text-[10px] text-stone-600">
            Edite esses dados na aba Personagens — a mudança aparece em todo lugar onde ele está vinculado. Fontes por campo
            ficam disponíveis de novo ao desvincular.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {FILTERABLE_TRAIT_FIELDS?.map((field) => (
              <SourcedField
                key={field}
                label={TRAIT_FIELD_LABELS[field]}
                value={suspect.traits[field]}
                onChange={(v) => onTraitChange(field, v)}
                witnesses={witnesses}
                selected={suspect.sources[field] ?? []}
                onToggle={(tid) => onToggleSource(field, tid)}
              />
            ))}
          </div>

          <SourcedField
            label={TRAIT_FIELD_LABELS.description}
            textarea
            value={suspect.traits.description}
            onChange={(v) => onTraitChange('description', v)}
            witnesses={witnesses}
            selected={suspect.sources.description ?? []}
            onToggle={(tid) => onToggleSource('description', tid)}
            className="mt-2.5"
          />
        </>
      )}
    </motion.div>
  )
}

function SourcedField({
  label,
  value,
  onChange,
  witnesses,
  selected,
  onToggle,
  textarea,
  className = '',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  witnesses: Witness[]
  selected: string[]
  onToggle: (testimonyId: string) => void
  textarea?: boolean
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-medium tracking-wide text-stone-500 uppercase">{label}</span>
        <SourceLinker witnesses={witnesses} selected={selected} onToggle={onToggle} />
      </div>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          aria-label={label}
          className="resize-none rounded-md border border-stone-700 bg-stone-950/70 px-2.5 py-1.5 text-sm leading-relaxed text-stone-100 outline-none focus:border-amber-600/60"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="rounded-md border border-stone-700 bg-stone-950/70 px-2.5 py-1.5 text-sm text-stone-100 outline-none focus:border-amber-600/60"
        />
      )}
    </div>
  )
}

function SourceLinker({
  witnesses,
  selected,
  onToggle,
}: {
  witnesses: Witness[]
  selected: string[]
  onToggle: (testimonyId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const allTestimonies = witnesses.flatMap((w) => w.testimonies?.map((t) => ({ witnessName: w.name || 'Sem nome', testimony: t })))
  const MENU_WIDTH = 256

  const openMenu = () => {
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) {
      setCoords({
        top: rect.bottom + 6,
        left: Math.min(Math.max(rect.right - MENU_WIDTH, 8), window.innerWidth - MENU_WIDTH - 8),
      })
    }
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const handleScroll = () => setOpen(false)
    window.addEventListener('keydown', handleKey)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleScroll)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll)
    }
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        title="Testemunhos que confirmam este dado"
        className={`flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition-colors ${selected.length > 0
            ? 'border-sky-700/50 bg-sky-950/50 text-sky-400'
            : 'border-stone-700 text-stone-500 hover:text-stone-300'
          }`}
      >
        <Link2 size={11} />
        {selected.length > 0 ? selected.length : 'Fonte'}
      </button>
      {open &&
        coords &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.12 }}
              style={{ position: 'fixed', top: coords.top, left: coords.left, width: MENU_WIDTH }}
              className="z-50 rounded-lg border border-stone-700 bg-stone-900 p-2 shadow-xl shadow-black/40"
            >
              <p className="mb-1.5 px-1 text-[10px] font-medium tracking-wide text-stone-500 uppercase">
                Testemunhos que confirmam este dado
              </p>
              {allTestimonies.length === 0 ? (
                <p className="px-1 py-2 text-xs text-stone-600">Nenhum testemunho registrado neste caso ainda.</p>
              ) : (
                <div className="flex max-h-52 flex-col gap-0.5 overflow-y-auto">
                  {allTestimonies?.map(({ witnessName, testimony }) => (
                    <label
                      key={testimony.id}
                      className="flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 hover:bg-stone-800/60"
                    >
                      <input
                        type="checkbox"
                        checked={selected?.includes(testimony.id)}
                        onChange={() => onToggle(testimony.id)}
                        className="mt-0.5 shrink-0"
                      />
                      <span className="text-xs leading-snug text-stone-300">
                        <span className="font-medium text-stone-200">{witnessName}</span>
                        {(testimony.where || testimony.when) && (
                          <span className="text-stone-500"> · {[testimony.where, testimony.when].filter(Boolean).join(', ')}</span>
                        )}
                        {testimony.what && <span className="block italic text-stone-500">&quot;{testimony.what}&quot;</span>}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </motion.div>
          </>,
          document.body,
        )}
    </>
  )
}
