import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Eye, FolderSearch, Link2, Plus, Trash2, UserRoundSearch } from 'lucide-react'
import {
  createCase,
  createSuspect,
  createTestimony,
  createWitness,
  SUSPECT_FIELD_LABELS,
  type CaseStatus,
  type Character,
  type InvestigationCase,
  type Suspect,
  type SuspectField,
  type Testimony,
  type Witness,
} from '../../types/character'
import { TextAreaField } from '../ui'

const STATUS_OPTIONS: { value: CaseStatus; label: string; classes: string }[] = [
  { value: 'aberto', label: 'Aberto', classes: 'border-amber-700/50 bg-amber-950/50 text-amber-400' },
  { value: 'resolvido', label: 'Resolvido', classes: 'border-emerald-700/50 bg-emerald-950/50 text-emerald-400' },
  { value: 'arquivado', label: 'Arquivado', classes: 'border-stone-700 bg-stone-900 text-stone-400' },
]

const SUSPECT_FIELDS: SuspectField[] = ['size', 'gender', 'hairColor', 'hairType', 'eyeColor']

function stripTestimonyFromSuspects(investigation: InvestigationCase, testimonyIds: string[]): InvestigationCase {
  if (testimonyIds.length === 0) return investigation
  const idSet = new Set(testimonyIds)
  return {
    ...investigation,
    suspects: investigation.suspects.map((s) => {
      let changed = false
      const sources = { ...s.sources }
      for (const key of Object.keys(sources) as SuspectField[]) {
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

export function CasosSection({
  character,
  update,
}: {
  character: Character
  update: (patch: Partial<Character> | ((c: Character) => Character)) => void
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [subTab, setSubTabState] = useState<Record<string, 'testemunhas' | 'suspeitos'>>({})
  const toggleCollapsed = (id: string) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))
  const getSubTab = (id: string) => subTab[id] ?? 'testemunhas'
  const setSubTab = (id: string, tab: 'testemunhas' | 'suspeitos') => setSubTabState((prev) => ({ ...prev, [id]: tab }))

  const updateCase = (
    caseId: string,
    patch: Partial<InvestigationCase> | ((cs: InvestigationCase) => InvestigationCase),
  ) =>
    update((c) => ({
      ...c,
      cases: c.cases.map((cs) => (cs.id === caseId ? (typeof patch === 'function' ? patch(cs) : { ...cs, ...patch }) : cs)),
    }))

  const addCase = () => {
    const next = createCase()
    update((c) => ({ ...c, cases: [...c.cases, next] }))
    setCollapsed((prev) => ({ ...prev, [next.id]: false }))
  }

  const removeCase = (id: string) => {
    if (!confirm('Remover este caso, suas testemunhas e suspeitos?')) return
    update((c) => ({ ...c, cases: c.cases.filter((cs) => cs.id !== id) }))
  }

  const addWitness = (caseId: string) => updateCase(caseId, (cs) => ({ ...cs, witnesses: [...cs.witnesses, createWitness()] }))

  const updateWitness = (caseId: string, witnessId: string, patch: Partial<Witness>) =>
    updateCase(caseId, (cs) => ({
      ...cs,
      witnesses: cs.witnesses.map((w) => (w.id === witnessId ? { ...w, ...patch } : w)),
    }))

  const removeWitness = (caseId: string, witnessId: string) =>
    updateCase(caseId, (cs) => {
      const witness = cs.witnesses.find((w) => w.id === witnessId)
      const stripped = stripTestimonyFromSuspects(cs, witness?.testimonies.map((t) => t.id) ?? [])
      return { ...stripped, witnesses: stripped.witnesses.filter((w) => w.id !== witnessId) }
    })

  const addTestimony = (caseId: string, witnessId: string) =>
    updateCase(caseId, (cs) => ({
      ...cs,
      witnesses: cs.witnesses.map((w) => (w.id === witnessId ? { ...w, testimonies: [...w.testimonies, createTestimony()] } : w)),
    }))

  const updateTestimony = (caseId: string, witnessId: string, testimonyId: string, patch: Partial<Testimony>) =>
    updateCase(caseId, (cs) => ({
      ...cs,
      witnesses: cs.witnesses.map((w) =>
        w.id === witnessId
          ? { ...w, testimonies: w.testimonies.map((t) => (t.id === testimonyId ? { ...t, ...patch } : t)) }
          : w,
      ),
    }))

  const removeTestimony = (caseId: string, witnessId: string, testimonyId: string) =>
    updateCase(caseId, (cs) => {
      const stripped = stripTestimonyFromSuspects(cs, [testimonyId])
      return {
        ...stripped,
        witnesses: stripped.witnesses.map((w) =>
          w.id === witnessId ? { ...w, testimonies: w.testimonies.filter((t) => t.id !== testimonyId) } : w,
        ),
      }
    })

  const addSuspect = (caseId: string) => updateCase(caseId, (cs) => ({ ...cs, suspects: [...cs.suspects, createSuspect()] }))

  const updateSuspect = (caseId: string, suspectId: string, patch: Partial<Suspect>) =>
    updateCase(caseId, (cs) => ({
      ...cs,
      suspects: cs.suspects.map((s) => (s.id === suspectId ? { ...s, ...patch } : s)),
    }))

  const removeSuspect = (caseId: string, suspectId: string) =>
    updateCase(caseId, (cs) => ({ ...cs, suspects: cs.suspects.filter((s) => s.id !== suspectId) }))

  const toggleSource = (caseId: string, suspectId: string, field: SuspectField, testimonyId: string) =>
    updateCase(caseId, (cs) => ({
      ...cs,
      suspects: cs.suspects.map((s) => {
        if (s.id !== suspectId) return s
        const current = s.sources[field] ?? []
        const next = current.includes(testimonyId) ? current.filter((id) => id !== testimonyId) : [...current, testimonyId]
        return { ...s, sources: { ...s.sources, [field]: next } }
      }),
    }))

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
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={addCase}
          className="flex items-center gap-1.5 rounded-md border border-amber-600/50 bg-amber-600/15 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-600/25"
        >
          <Plus size={14} /> Novo caso
        </motion.button>
      </div>

      {character.cases.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-stone-800 bg-stone-950/40 px-6 py-14 text-center">
          <FolderSearch size={28} className="text-stone-700" />
          <p className="text-sm text-stone-500">
            Registre casos de investigação: as testemunhas e o que contaram, e os suspeitos com os dados levantados sobre eles.
          </p>
        </div>
      )}

      <AnimatePresence initial={false}>
        {character.cases.map((investigation) => {
          const isCollapsed = !!collapsed[investigation.id]
          const status = STATUS_OPTIONS.find((s) => s.value === investigation.status) ?? STATUS_OPTIONS[0]
          const activeSubTab = getSubTab(investigation.id)
          return (
            <motion.div
              key={investigation.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="overflow-hidden rounded-xl border border-stone-800 bg-stone-900/60 shadow-lg shadow-black/20 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 border-b border-stone-800 px-4 py-2.5">
                <button
                  onClick={() => toggleCollapsed(investigation.id)}
                  className="flex items-center text-stone-500 hover:text-stone-300"
                >
                  <motion.span animate={{ rotate: isCollapsed ? -90 : 0 }} transition={{ duration: 0.15 }}>
                    <ChevronDown size={16} />
                  </motion.span>
                </button>
                <input
                  value={investigation.title}
                  onChange={(e) => updateCase(investigation.id, { title: e.target.value })}
                  placeholder="Nome do caso"
                  className="flex-1 bg-transparent font-serif text-sm font-semibold text-stone-100 outline-none placeholder:font-sans placeholder:font-normal placeholder:text-stone-600"
                />
                <select
                  value={investigation.status}
                  onChange={(e) => updateCase(investigation.id, { status: e.target.value as CaseStatus })}
                  className={`rounded-md border px-2 py-1 text-[11px] font-medium outline-none ${status.classes}`}
                >
                  {STATUS_OPTIONS.map((opt) => (
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

                      <div className="flex gap-1 border-b border-stone-800">
                        {(['testemunhas', 'suspeitos'] as const).map((key) => {
                          const active = activeSubTab === key
                          const count = key === 'testemunhas' ? investigation.witnesses.length : investigation.suspects.length
                          return (
                            <button
                              key={key}
                              onClick={() => setSubTab(investigation.id, key)}
                              className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                                active ? 'text-amber-400' : 'text-stone-500 hover:text-stone-300'
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
                          {investigation.witnesses.map((witness) => (
                            <WitnessCard
                              key={witness.id}
                              witness={witness}
                              onChangeName={(name) => updateWitness(investigation.id, witness.id, { name })}
                              onAddTestimony={() => addTestimony(investigation.id, witness.id)}
                              onChangeTestimony={(tid, patch) => updateTestimony(investigation.id, witness.id, tid, patch)}
                              onRemoveTestimony={(tid) => removeTestimony(investigation.id, witness.id, tid)}
                              onRemove={() => removeWitness(investigation.id, witness.id)}
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
                          {investigation.suspects.map((suspect) => (
                            <SuspectCard
                              key={suspect.id}
                              suspect={suspect}
                              witnesses={investigation.witnesses}
                              onChange={(patch) => updateSuspect(investigation.id, suspect.id, patch)}
                              onToggleSource={(field, tid) => toggleSource(investigation.id, suspect.id, field, tid)}
                              onRemove={() => removeSuspect(investigation.id, suspect.id)}
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
  onChangeName,
  onAddTestimony,
  onChangeTestimony,
  onRemoveTestimony,
  onRemove,
}: {
  witness: Witness
  onChangeName: (name: string) => void
  onAddTestimony: () => void
  onChangeTestimony: (testimonyId: string, patch: Partial<Testimony>) => void
  onRemoveTestimony: (testimonyId: string) => void
  onRemove: () => void
}) {
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
          onChange={(e) => onChangeName(e.target.value)}
          placeholder="Nome da testemunha"
          className="min-w-0 flex-1 rounded-md border border-stone-700 bg-stone-900 px-2 py-1.5 text-sm font-medium text-stone-100 outline-none focus:border-amber-600/60"
        />
        <button onClick={onRemove} className="shrink-0 text-stone-600 hover:text-red-500">
          <Trash2 size={13} />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {witness.testimonies.map((t) => (
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
  onChange,
  onToggleSource,
  onRemove,
}: {
  suspect: Suspect
  witnesses: Witness[]
  onChange: (patch: Partial<Suspect>) => void
  onToggleSource: (field: SuspectField, testimonyId: string) => void
  onRemove: () => void
}) {
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
          placeholder="Nome (ou &quot;desconhecido&quot;)"
          className="min-w-0 flex-1 rounded-md border border-stone-700 bg-stone-900 px-2 py-1.5 text-sm font-medium text-stone-100 outline-none focus:border-amber-600/60"
        />
        <button onClick={onRemove} className="shrink-0 text-stone-600 hover:text-red-500">
          <Trash2 size={13} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {SUSPECT_FIELDS.map((field) => (
          <SourcedField
            key={field}
            label={SUSPECT_FIELD_LABELS[field]}
            value={suspect[field]}
            onChange={(v) => onChange({ [field]: v } as Partial<Suspect>)}
            witnesses={witnesses}
            selected={suspect.sources[field] ?? []}
            onToggle={(tid) => onToggleSource(field, tid)}
          />
        ))}
      </div>

      <SourcedField
        label={SUSPECT_FIELD_LABELS.description}
        textarea
        value={suspect.description}
        onChange={(v) => onChange({ description: v })}
        witnesses={witnesses}
        selected={suspect.sources.description ?? []}
        onToggle={(tid) => onToggleSource('description', tid)}
        className="mt-2.5"
      />
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
          className="resize-none rounded-md border border-stone-700 bg-stone-950/70 px-2.5 py-1.5 text-sm leading-relaxed text-stone-100 outline-none focus:border-amber-600/60"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
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
  const allTestimonies = witnesses.flatMap((w) => w.testimonies.map((t) => ({ witnessName: w.name || 'Sem nome', testimony: t })))
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
        className={`flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
          selected.length > 0
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
                  {allTestimonies.map(({ witnessName, testimony }) => (
                    <label
                      key={testimony.id}
                      className="flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 hover:bg-stone-800/60"
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(testimony.id)}
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
