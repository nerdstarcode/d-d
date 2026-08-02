import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, FolderSearch, Plus, Trash2, UserRound } from 'lucide-react'
import {
  createCase,
  createPerson,
  type Character,
  type CaseStatus,
  type InvestigationCase,
  type PersonOfInterest,
} from '../../types/character'
import { TextAreaField, TextField } from '../ui'

const STATUS_OPTIONS: { value: CaseStatus; label: string; classes: string }[] = [
  { value: 'aberto', label: 'Aberto', classes: 'border-amber-700/50 bg-amber-950/50 text-amber-400' },
  { value: 'resolvido', label: 'Resolvido', classes: 'border-emerald-700/50 bg-emerald-950/50 text-emerald-400' },
  { value: 'arquivado', label: 'Arquivado', classes: 'border-stone-700 bg-stone-900 text-stone-400' },
]

export function CasosSection({
  character,
  update,
}: {
  character: Character
  update: (patch: Partial<Character> | ((c: Character) => Character)) => void
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const toggleCollapsed = (id: string) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))

  const updateCase = (id: string, patch: Partial<InvestigationCase>) =>
    update((c) => ({
      ...c,
      cases: c.cases.map((cs) => (cs.id === id ? { ...cs, ...patch } : cs)),
    }))

  const addCase = () => {
    const next = createCase()
    update((c) => ({ ...c, cases: [...c.cases, next] }))
    setCollapsed((prev) => ({ ...prev, [next.id]: false }))
  }

  const removeCase = (id: string) => {
    if (!confirm('Remover este caso e todas as pessoas registradas nele?')) return
    update((c) => ({ ...c, cases: c.cases.filter((cs) => cs.id !== id) }))
  }

  const addPerson = (caseId: string) =>
    updateCase(caseId, {
      people: [...(character.cases.find((cs) => cs.id === caseId)?.people ?? []), createPerson()],
    })

  const updatePerson = (caseId: string, personId: string, patch: Partial<PersonOfInterest>) => {
    const target = character.cases.find((cs) => cs.id === caseId)
    if (!target) return
    updateCase(caseId, {
      people: target.people.map((p) => (p.id === personId ? { ...p, ...patch } : p)),
    })
  }

  const removePerson = (caseId: string, personId: string) => {
    const target = character.cases.find((cs) => cs.id === caseId)
    if (!target) return
    updateCase(caseId, { people: target.people.filter((p) => p.id !== personId) })
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
            Registre casos de investigação e as pessoas envolvidas: suspeitos, testemunhas, vítimas.
          </p>
        </div>
      )}

      <AnimatePresence initial={false}>
        {character.cases.map((investigation) => {
          const isCollapsed = !!collapsed[investigation.id]
          const status = STATUS_OPTIONS.find((s) => s.value === investigation.status) ?? STATUS_OPTIONS[0]
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
                  className="flex-1 bg-transparent font-serif text-sm font-semibold text-stone-100 outline-none placeholder:text-stone-600 placeholder:font-sans placeholder:font-normal"
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
                <span className="text-[11px] text-stone-600">
                  {investigation.people.length} pessoa{investigation.people.length === 1 ? '' : 's'}
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
                    <div className="flex flex-col gap-4 p-4">
                      <TextAreaField
                        label="Resumo do caso"
                        rows={3}
                        value={investigation.summary}
                        onChange={(v) => updateCase(investigation.id, { summary: v })}
                      />

                      <div className="flex flex-col gap-3">
                        {investigation.people.map((person) => (
                          <PersonCard
                            key={person.id}
                            person={person}
                            onChange={(patch) => updatePerson(investigation.id, person.id, patch)}
                            onRemove={() => removePerson(investigation.id, person.id)}
                          />
                        ))}
                      </div>

                      <button
                        onClick={() => addPerson(investigation.id)}
                        className="flex items-center gap-1.5 self-start text-xs font-medium text-amber-500 hover:text-amber-400"
                      >
                        <Plus size={13} /> Pessoa de interesse
                      </button>
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

function PersonCard({
  person,
  onChange,
  onRemove,
}: {
  person: PersonOfInterest
  onChange: (patch: Partial<PersonOfInterest>) => void
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
        <UserRound size={14} className="shrink-0 text-stone-600" />
        <input
          value={person.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Nome"
          className="min-w-0 flex-1 rounded-md border border-stone-700 bg-stone-900 px-2 py-1.5 text-sm font-medium text-stone-100 outline-none focus:border-amber-600/60"
        />
        <input
          value={person.role}
          onChange={(e) => onChange({ role: e.target.value })}
          placeholder="Papel (suspeito, testemunha…)"
          className="w-44 shrink-0 rounded-md border border-stone-700 bg-stone-900 px-2 py-1.5 text-xs text-stone-300 outline-none focus:border-amber-600/60"
        />
        <button onClick={onRemove} className="shrink-0 text-stone-600 hover:text-red-500">
          <Trash2 size={13} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <TextField label="Tamanho" value={person.size} onChange={(v) => onChange({ size: v })} />
        <TextField label="Gênero" value={person.gender} onChange={(v) => onChange({ gender: v })} />
        <TextField label="Cor do cabelo" value={person.hairColor} onChange={(v) => onChange({ hairColor: v })} />
        <TextField label="Tipo de cabelo" value={person.hairType} onChange={(v) => onChange({ hairType: v })} />
        <TextField label="Cor dos olhos" value={person.eyeColor} onChange={(v) => onChange({ eyeColor: v })} />
      </div>

      <TextAreaField
        label="Descrição"
        rows={3}
        value={person.description}
        onChange={(v) => onChange({ description: v })}
        className="mt-2.5"
      />
    </motion.div>
  )
}
