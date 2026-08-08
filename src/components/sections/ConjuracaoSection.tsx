import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BookOpenText, Link2, Plus, Sparkle, Trash2, X } from 'lucide-react'
import { ABILITY_LABELS, type AbilityKey, type Character, type Spell } from '../../types/character'
import type { CompendiumSpell } from '../../types/spellCompendium'
import { SPELL_LEVEL_LABELS } from '../../types/spellCompendium'
import { resolveSpellSlugByName, useSpellCompendium } from '../../lib/useSpellCompendium'
import { getHealingInfo, getSpellEffectBadges } from '../../lib/spellEffects'
import { SpellMechanicsGrid, SpellQuickFacts } from '../SpellMechanicsPanel'
import { Modal } from '../Modal'
import { Badge, Checkbox, NumberField, Panel, TextField } from '../ui'

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
  const { spells: compendiumSpells, bySlug } = useSpellCompendium()

  const updateSpellcasting = (patch: Partial<Character['spellcasting']>) =>
    update((c) => ({ ...c, spellcasting: { ...c.spellcasting, ...patch } }))

  const updateCantrip = (index: number, patch: Partial<Spell>) =>
    updateSpellcasting({
      cantrips: sc.cantrips?.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    })
  const addCantrip = () => updateSpellcasting({ cantrips: [...sc.cantrips, { name: '', prepared: true }] })
  const removeCantrip = (index: number) => updateSpellcasting({ cantrips: sc.cantrips.filter((_, i) => i !== index) })

  const updateLevel = (level: LevelKey, patch: Partial<Character['spellcasting']['levels']['1']>) =>
    updateSpellcasting({ levels: { ...sc.levels, [level]: { ...sc.levels[level], ...patch } } })

  const updateSpell = (level: LevelKey, index: number, patch: Partial<Spell>) =>
    updateLevel(level, {
      spells: sc.levels[level].spells?.map((s, i) => (i === index ? { ...s, ...patch } : s)),
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
              {(Object.keys(ABILITY_LABELS) as AbilityKey[])?.map((k) => (
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
          compendiumSpells={compendiumSpells}
          bySlug={bySlug}
        />
      </Panel>

      {LEVELS?.map((level) => {
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
              compendiumSpells={compendiumSpells}
              bySlug={bySlug}
            />
          </Panel>
        )
      })}
    </div>
  )
}

let spellSuggestionsDatalistSeq = 0

function SpellList({
  spells,
  showPrepared,
  onUpdate,
  onRemove,
  onAdd,
  compendiumSpells,
  bySlug,
}: {
  spells: Spell[]
  showPrepared: boolean
  onUpdate: (index: number, patch: Partial<Spell>) => void
  onRemove: (index: number) => void
  onAdd: () => void
  compendiumSpells: CompendiumSpell[] | null
  bySlug: Map<string, CompendiumSpell>
}) {
  const [detailsIndex, setDetailsIndex] = useState<number | null>(null)
  const [linkingIndex, setLinkingIndex] = useState<number | null>(null)
  const [linkQuery, setLinkQuery] = useState('')
  const [datalistId] = useState(() => `conjuracao-spell-suggestions-${++spellSuggestionsDatalistSeq}`)

  const nameSuggestions = useMemo(
    () =>
      Array.from(new Set((compendiumSpells ?? []).flatMap((s) => [s.namePt, s.nameEn]).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, 'pt-BR'),
      ),
    [compendiumSpells],
  )

  const startLinking = (i: number, currentName: string) => {
    setLinkingIndex(i)
    setLinkQuery(currentName)
  }
  const cancelLinking = () => {
    setLinkingIndex(null)
    setLinkQuery('')
  }
  const tryLink = (i: number, query: string) => {
    setLinkQuery(query)
    const slug = resolveSpellSlugByName(compendiumSpells ?? [], query)
    if (slug) {
      onUpdate(i, { compendiumSlug: slug })
      setLinkingIndex(null)
      setLinkQuery('')
    }
  }

  return (
    <div>
      <datalist id={datalistId}>
        {nameSuggestions.map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
      <div className="flex flex-col gap-1.5">
        {spells?.map((spell, i) => {
          const linked = spell.compendiumSlug ? bySlug.get(spell.compendiumSlug) : undefined
          const hasDescription = !!spell.description?.trim() || !!linked
          const isLinking = linkingIndex === i
          const isDetailsOpen = detailsIndex === i
          return (
            <motion.div key={i} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-2">
                {showPrepared && <Checkbox checked={spell.prepared} onChange={(v) => onUpdate(i, { prepared: v })} />}
                <input
                  value={spell.name}
                  onChange={(e) => onUpdate(i, { name: e.target.value })}
                  placeholder="Nome da magia"
                  className={`flex-1 rounded-md border border-stone-700 bg-stone-950/70 px-2 py-1.5 text-sm outline-none focus:border-amber-600/60 ${
                    spell.domain ? 'text-sky-300' : 'text-stone-100'
                  }`}
                />
                <button
                  onClick={() => (isLinking ? cancelLinking() : startLinking(i, spell.name))}
                  title={linked ? `Vinculada a "${linked.namePt}" — clique para trocar` : 'Vincular ao compêndio'}
                  className={`relative flex items-center transition-colors ${
                    isLinking || linked ? 'text-amber-500' : 'text-stone-600'
                  } hover:text-amber-500`}
                >
                  <Link2 size={13} />
                </button>
                <button
                  onClick={() => setDetailsIndex(i)}
                  title="Descrição"
                  className={`relative flex items-center transition-colors ${
                    hasDescription ? 'text-stone-400' : 'text-stone-600'
                  } hover:text-amber-500`}
                >
                  <BookOpenText size={13} />
                  {hasDescription && (
                    <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                  )}
                </button>
                <button onClick={() => onRemove(i)} className="text-stone-600 hover:text-red-500">
                  <Trash2 size={13} />
                </button>
              </div>

              {linked && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-0.5">
                  <Badge className="border-stone-700 bg-stone-900 text-stone-400">{linked.range}</Badge>
                  {linked.mechanics?.damage && (
                    <Badge className="border-red-800/50 bg-red-950/40 text-red-400">
                      {linked.mechanics.damage}
                      {linked.mechanics.damageType ? ` ${linked.mechanics.damageType}` : ''}
                    </Badge>
                  )}
                  {linked.mechanics?.save && (
                    <Badge className="border-sky-800/50 bg-sky-950/40 text-sky-400">{linked.mechanics.save}</Badge>
                  )}
                  {getSpellEffectBadges(linked).map((badge) => (
                    <Badge key={badge.label} className={badge.className}>
                      {badge.label}
                    </Badge>
                  ))}
                </div>
              )}

              <AnimatePresence initial={false}>
                {isLinking && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <input
                        autoFocus
                        value={linkQuery}
                        onChange={(e) => tryLink(i, e.target.value)}
                        list={datalistId}
                        placeholder="Buscar magia no compêndio..."
                        className="flex-1 rounded-md border border-stone-700 bg-stone-950/70 px-2 py-1.5 text-xs text-stone-100 outline-none focus:border-amber-600/60"
                      />
                      {linked && (
                        <button
                          onClick={() => {
                            onUpdate(i, { compendiumSlug: undefined })
                            cancelLinking()
                          }}
                          title="Desvincular"
                          className="text-stone-500 hover:text-red-500"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Modal
                open={isDetailsOpen}
                onClose={() => setDetailsIndex(null)}
                title={
                  <div className="min-w-0">
                    <h3 className="truncate font-serif text-base font-semibold text-stone-100">
                      {spell.name || 'Magia sem nome'}
                    </h3>
                    {linked && (
                      <p className="text-[11px] text-stone-500">
                        {linked.nameEn} · {SPELL_LEVEL_LABELS[linked.level]} · {linked.school}
                      </p>
                    )}
                  </div>
                }
              >
                {linked ? (
                  <div className="flex flex-col gap-3">
                    {(linked.mechanics?.damage || getSpellEffectBadges(linked).length > 0) && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {linked.mechanics?.damage && (
                          <Badge className="border-red-800/50 bg-red-950/40 text-red-400">
                            {linked.mechanics.damage}
                            {linked.mechanics.damageType ? ` ${linked.mechanics.damageType}` : ''}
                          </Badge>
                        )}
                        {getSpellEffectBadges(linked).map((badge) => (
                          <Badge key={badge.label} className={badge.className}>
                            {badge.label}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <SpellQuickFacts spell={linked} />
                    {(linked.mechanics || getHealingInfo(linked)) && <SpellMechanicsGrid spell={linked} />}
                    <p className="text-[11px] text-stone-500">
                      <span className="font-medium text-stone-400">Componentes:</span>{' '}
                      {[linked.components.verbal && 'V', linked.components.somatic && 'S', linked.components.material && 'M']
                        .filter(Boolean)
                        .join(', ') || '—'}
                      {linked.components.materialText && ` (${linked.components.materialText})`}
                    </p>
                    <div className="text-sm leading-relaxed text-stone-300">
                      {linked.description.split('\n\n').map((paragraph, idx) => (
                        <p key={idx} className="mb-2 whitespace-pre-line last:mb-0">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    <div className="border-t border-stone-800 pt-3">
                      <span className="mb-1 block text-[10px] font-medium tracking-wide text-stone-500 uppercase">
                        Anotações pessoais
                      </span>
                      <textarea
                        value={spell.description ?? ''}
                        onChange={(e) => onUpdate(i, { description: e.target.value })}
                        placeholder="Notas extras sobre como você usa essa magia..."
                        rows={3}
                        className="w-full resize-none rounded-md border border-stone-800 bg-stone-950/40 px-2.5 py-2 text-xs leading-relaxed text-stone-300 outline-none focus:border-amber-600/50"
                      />
                    </div>
                    <p className="text-[10px] text-stone-600">
                      {linked.source && <>Fonte: {linked.source} · </>}
                      <a href={linked.sourceUrl} target="_blank" rel="noreferrer" className="hover:text-amber-500">
                        Ver no Critical20
                      </a>
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <textarea
                      value={spell.description ?? ''}
                      onChange={(e) => onUpdate(i, { description: e.target.value })}
                      placeholder="O que essa magia faz?"
                      rows={5}
                      className="w-full resize-none rounded-md border border-stone-800 bg-stone-950/40 px-2.5 py-2 text-xs leading-relaxed text-stone-300 outline-none focus:border-amber-600/50"
                    />
                    <button
                      onClick={() => {
                        setDetailsIndex(null)
                        startLinking(i, spell.name)
                      }}
                      className="flex items-center gap-1.5 self-start text-xs font-medium text-amber-500 hover:text-amber-400"
                    >
                      <Link2 size={13} /> Vincular ao compêndio
                    </button>
                  </div>
                )}
              </Modal>
            </motion.div>
          )
        })}
      </div>
      <button onClick={onAdd} className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-500 hover:text-amber-400">
        <Plus size={13} /> Magia
      </button>
    </div>
  )
}
