import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BookOpenText, ChevronDown, Plus, Sparkle, Trash2 } from 'lucide-react'
import { ABILITY_LABELS, type AbilityKey, type Character, type Spell } from '../../types/character'
import { Checkbox, NumberField, Panel, TextField } from '../ui'

const LEVELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const
type LevelKey = (typeof LEVELS)[number]

export function ConjuracaoSection({
  character,
  update,
}: {
  character: Character
  update: (patch: Partial<Character> | ((c: Character) => Character)) => void
}) {
  const sc = character.spellcasting

  const updateSpellcasting = (patch: Partial<Character['spellcasting']>) =>
    update((c) => ({ ...c, spellcasting: { ...c.spellcasting, ...patch } }))

  const updateCantrip = (index: number, patch: Partial<Spell>) =>
    updateSpellcasting({
      cantrips: sc.cantrips.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    })
  const addCantrip = () => updateSpellcasting({ cantrips: [...sc.cantrips, { name: '', prepared: true }] })
  const removeCantrip = (index: number) => updateSpellcasting({ cantrips: sc.cantrips.filter((_, i) => i !== index) })

  const updateLevel = (level: LevelKey, patch: Partial<Character['spellcasting']['levels']['1']>) =>
    updateSpellcasting({ levels: { ...sc.levels, [level]: { ...sc.levels[level], ...patch } } })

  const updateSpell = (level: LevelKey, index: number, patch: Partial<Spell>) =>
    updateLevel(level, {
      spells: sc.levels[level].spells.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    })
  const addSpell = (level: LevelKey) =>
    updateLevel(level, { spells: [...sc.levels[level].spells, { name: '', prepared: false }] })
  const removeSpell = (level: LevelKey, index: number) =>
    updateLevel(level, { spells: sc.levels[level].spells.filter((_, i) => i !== index) })

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <Panel title="Conjuração" className="lg:col-span-12" icon={<Sparkle size={13} className="text-amber-600" />}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <TextField label="Classe conjuradora" value={sc.class} onChange={(v) => updateSpellcasting({ class: v })} />
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-medium tracking-wide text-stone-500 uppercase">Atributo</span>
            <select
              value={sc.ability}
              onChange={(e) => updateSpellcasting({ ability: e.target.value as AbilityKey | '' })}
              className="rounded-md border border-stone-700 bg-stone-950/70 px-2.5 py-1.5 text-sm text-stone-100 outline-none focus:border-amber-600/60"
            >
              <option value="">—</option>
              {(Object.keys(ABILITY_LABELS) as AbilityKey[]).map((k) => (
                <option key={k} value={k}>
                  {ABILITY_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <NumberField
            label="CD para resistir"
            value={sc.saveDC ?? 0}
            onChange={(v) => updateSpellcasting({ saveDC: v })}
          />
          <NumberField
            label="Modificador de ataque"
            value={sc.attackBonus ?? 0}
            onChange={(v) => updateSpellcasting({ attackBonus: v })}
          />
        </div>
      </Panel>

      <Panel title="Truques" className="lg:col-span-4">
        <SpellList
          spells={sc.cantrips}
          showPrepared={false}
          onUpdate={updateCantrip}
          onRemove={removeCantrip}
          onAdd={addCantrip}
        />
      </Panel>

      {LEVELS.map((level) => {
        const lvl = sc.levels[level]
        return (
          <Panel key={level} title={`Círculo ${level}`} className="lg:col-span-4">
            <div className="mb-2 grid grid-cols-2 gap-2">
              <NumberField
                label="Espaços totais"
                value={lvl.totalSlots ?? 0}
                onChange={(v) => updateLevel(level, { totalSlots: v })}
              />
              <NumberField
                label="Espaços usados"
                value={lvl.usedSlots ?? 0}
                onChange={(v) => updateLevel(level, { usedSlots: v })}
              />
            </div>
            <SpellList
              spells={lvl.spells}
              showPrepared
              onUpdate={(i, patch) => updateSpell(level, i, patch)}
              onRemove={(i) => removeSpell(level, i)}
              onAdd={() => addSpell(level)}
            />
          </Panel>
        )
      })}
    </div>
  )
}

function SpellList({
  spells,
  showPrepared,
  onUpdate,
  onRemove,
  onAdd,
}: {
  spells: Spell[]
  showPrepared: boolean
  onUpdate: (index: number, patch: Partial<Spell>) => void
  onRemove: (index: number) => void
  onAdd: () => void
}) {
  return (
    <div>
      <div className="flex flex-col gap-1.5">
        {spells.map((spell, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
            {showPrepared && (
              <Checkbox checked={spell.prepared} onChange={(v) => onUpdate(i, { prepared: v })} />
            )}
            <input
              value={spell.name}
              onChange={(e) => onUpdate(i, { name: e.target.value })}
              placeholder="Nome da magia"
              className={`flex-1 rounded-md border border-stone-700 bg-stone-950/70 px-2 py-1.5 text-sm outline-none focus:border-amber-600/60 ${
                spell.domain ? 'text-sky-300' : 'text-stone-100'
              }`}
            />
            <button onClick={() => onRemove(i)} className="text-stone-600 hover:text-red-500">
              <Trash2 size={13} />
            </button>
          </motion.div>
        ))}
      </div>
      <button onClick={onAdd} className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-500 hover:text-amber-400">
        <Plus size={13} /> Magia
      </button>
    </div>
  )
}
