import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BookMarked, BookOpenText, Check, Plus, Search, X } from 'lucide-react'
import type { Character, Spell } from '../../types/character'
import type { CompendiumSpell } from '../../types/spellCompendium'
import { SPELL_LEVELS, SPELL_LEVEL_LABELS, SPELL_SCHOOLS } from '../../types/spellCompendium'
import {
  BLANK_SPELL_FILTERS,
  collectSpellClasses,
  hasActiveSpellFilter,
  matchesSpellFilters,
  type SpellCompendiumFilters,
} from '../../lib/spellCompendiumFilter'
import { useSpellCompendium } from '../../lib/useSpellCompendium'
import { getSpellEffectBadges } from '../../lib/spellEffects'
import { FilterField } from '../FilterField'
import { SpellMechanicsGrid } from '../SpellMechanicsPanel'
import { Badge, Checkbox, Panel } from '../ui'

type LevelKey = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'

/** The list of already-added Spells in the character's Conjuração for a given compendium level (0 = cantrips). */
function bucketFor(character: Character, level: number): Spell[] {
  return level === 0 ? character.spellcasting.cantrips : character.spellcasting.levels[String(level) as LevelKey].spells
}

export function MagiasSection({
  character,
  update,
  onNotify,
}: {
  character: Character
  update: (patch: Partial<Character> | ((c: Character) => Character)) => void
  onNotify?: (message: string, variant: 'success' | 'error' | 'info') => void
}) {
  const { spells, loadError } = useSpellCompendium()
  const [filters, setFilters] = useState<SpellCompendiumFilters>(BLANK_SPELL_FILTERS)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const classOptions = useMemo(() => collectSpellClasses(spells ?? []), [spells])
  const nameSuggestions = useMemo(
    () =>
      Array.from(new Set((spells ?? []).flatMap((s) => [s.namePt, s.nameEn]).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'pt-BR'),
      ),
    [spells],
  )

  const hasActiveFilter = hasActiveSpellFilter(filters)
  const visibleSpells = useMemo(() => (spells ?? []).filter((s) => matchesSpellFilters(s, filters)), [spells, filters])

  const clearFilters = () => setFilters(BLANK_SPELL_FILTERS)
  const toggleExpanded = (slug: string) => setExpanded((prev) => ({ ...prev, [slug]: !prev[slug] }))

  const addToConjuracao = (spell: CompendiumSpell) => {
    const alreadyAdded = bucketFor(character, spell.level)?.some(
      (s) => s.compendiumSlug === spell.slug || s.name === spell.namePt,
    )
    if (alreadyAdded) {
      onNotify?.(`"${spell.namePt}" já está na Conjuração.`, 'info')
      return
    }
    // A descrição completa vem do vínculo (compendiumSlug) — a Conjuração não precisa de uma cópia do texto.
    const newSpell: Spell = {
      name: spell.namePt,
      prepared: spell.level === 0,
      compendiumSlug: spell.slug,
    }
    update((c) => {
      if (spell.level === 0) {
        return { ...c, spellcasting: { ...c.spellcasting, cantrips: [...c.spellcasting.cantrips, newSpell] } }
      }
      const levelKey = String(spell.level) as LevelKey
      const lvl = c.spellcasting.levels[levelKey]
      return {
        ...c,
        spellcasting: {
          ...c.spellcasting,
          levels: { ...c.spellcasting.levels, [levelKey]: { ...lvl, spells: [...lvl.spells, newSpell] } },
        },
      }
    })
    onNotify?.(`"${spell.namePt}" adicionada à Conjuração.`, 'success')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-stone-400">
        <BookMarked size={16} className="text-amber-600" />
        <span className="text-xs font-medium tracking-wide uppercase">
          {spells === null
            ? 'Carregando compêndio...'
            : hasActiveFilter
              ? `${visibleSpells.length} de ${spells.length} magias`
              : `${spells.length} magias`}
        </span>
      </div>

      {loadError && (
        <p className="text-sm text-red-400">
          Não foi possível carregar o compêndio de magias. Rode <code>npm run scrape:spells</code> pra gerar
          src/data/spells.json.
        </p>
      )}

      {spells !== null && (
        <>
          <Panel title="Buscar magias" icon={<Search size={13} className="text-amber-600" />}>
            <div className="mb-2.5 flex items-start justify-between gap-3">
              <p className="text-xs text-stone-500">Filtra o compêndio por nome, nível, escola, classe, concentração ou ritual.</p>
              {hasActiveFilter && (
                <button
                  onClick={clearFilters}
                  className="flex shrink-0 items-center gap-1 text-xs font-medium text-stone-500 hover:text-amber-400"
                >
                  <X size={12} /> Limpar filtros
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              <FilterField
                label="Nome"
                value={filters.name}
                onChange={(v) => setFilters((prev) => ({ ...prev, name: v }))}
                onClear={() => setFilters((prev) => ({ ...prev, name: '' }))}
                listId="spell-name-suggestions"
              />
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-medium tracking-wide text-stone-500 uppercase">Nível</span>
                <select
                  value={filters.level}
                  onChange={(e) => setFilters((prev) => ({ ...prev, level: e.target.value }))}
                  className="rounded-md border border-stone-700 bg-stone-950/70 px-2.5 py-1.5 text-sm text-stone-100 outline-none transition-colors focus:border-amber-600/60 focus:ring-1 focus:ring-amber-600/30"
                >
                  <option value="">Todos</option>
                  {SPELL_LEVELS?.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {SPELL_LEVEL_LABELS[lvl]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-medium tracking-wide text-stone-500 uppercase">Escola</span>
                <select
                  value={filters.school}
                  onChange={(e) => setFilters((prev) => ({ ...prev, school: e.target.value }))}
                  className="rounded-md border border-stone-700 bg-stone-950/70 px-2.5 py-1.5 text-sm text-stone-100 outline-none transition-colors focus:border-amber-600/60 focus:ring-1 focus:ring-amber-600/30"
                >
                  <option value="">Todas</option>
                  {SPELL_SCHOOLS?.map((school) => (
                    <option key={school} value={school}>
                      {school}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-medium tracking-wide text-stone-500 uppercase">Classe</span>
                <select
                  value={filters.class}
                  onChange={(e) => setFilters((prev) => ({ ...prev, class: e.target.value }))}
                  className="rounded-md border border-stone-700 bg-stone-950/70 px-2.5 py-1.5 text-sm text-stone-100 outline-none transition-colors focus:border-amber-600/60 focus:ring-1 focus:ring-amber-600/30"
                >
                  <option value="">Todas</option>
                  {classOptions?.map((cls) => (
                    <option key={cls.slug} value={cls.slug}>
                      {cls.emoji} {cls.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-col justify-end gap-1.5 pb-1.5">
                <Checkbox
                  checked={filters.concentrationOnly}
                  onChange={(v) => setFilters((prev) => ({ ...prev, concentrationOnly: v }))}
                  label={<span className="text-xs text-stone-300">Concentração</span>}
                />
                <Checkbox
                  checked={filters.ritualOnly}
                  onChange={(v) => setFilters((prev) => ({ ...prev, ritualOnly: v }))}
                  label={<span className="text-xs text-stone-300">Ritual</span>}
                />
              </div>
            </div>
            <datalist id="spell-name-suggestions">
              {nameSuggestions.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </Panel>

          {visibleSpells.length === 0 && (
            <p className="text-sm text-stone-600">Nenhuma magia bate com esse filtro.</p>
          )}

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {visibleSpells.map((spell) => {
              const isOpen = !!expanded[spell.slug]
              const alreadyAdded = bucketFor(character, spell.level)?.some(
                (s) => s.compendiumSlug === spell.slug || s.name === spell.namePt,
              )
              return (
                <Panel key={spell.slug}>
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <Badge className="border-amber-700/50 bg-amber-950/50 text-amber-400">{SPELL_LEVEL_LABELS[spell.level]}</Badge>
                    <Badge>{spell.school}</Badge>
                    {spell.concentration && <Badge className="border-sky-700/50 bg-sky-950/50 text-sky-400">Conc.</Badge>}
                    {spell.ritual && <Badge className="border-violet-700/50 bg-violet-950/50 text-violet-400">Ritual</Badge>}
                    {spell.mechanics?.damage && (
                      <Badge className="border-red-800/50 bg-red-950/40 text-red-400">
                        {spell.mechanics.damage}
                        {spell.mechanics.damageType ? ` ${spell.mechanics.damageType}` : ''}
                      </Badge>
                    )}
                    {getSpellEffectBadges(spell.tags).map((badge) => (
                      <Badge key={badge.label} className={badge.className}>
                        {badge.label}
                      </Badge>
                    ))}
                    <button
                      onClick={() => toggleExpanded(spell.slug)}
                      title="Detalhes"
                      className={`ml-auto flex items-center transition-colors ${isOpen ? 'text-amber-500' : 'text-stone-500'} hover:text-amber-500`}
                    >
                      <BookOpenText size={14} />
                    </button>
                  </div>
                  <h3 className="font-serif text-base font-semibold text-stone-100">{spell.namePt}</h3>
                  <p className="mb-2 text-[11px] italic text-stone-500">{spell.nameEn}</p>
                  <p className="mb-3 text-sm leading-relaxed text-stone-400">{spell.summary}</p>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <div className="text-[10px] font-medium tracking-wide text-stone-500 uppercase">Conjuração</div>
                      <div className="text-stone-300">{spell.castingTime}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium tracking-wide text-stone-500 uppercase">Alcance</div>
                      <div className="text-stone-300">{spell.range}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium tracking-wide text-stone-500 uppercase">Duração</div>
                      <div className="text-stone-300">{spell.duration}</div>
                    </div>
                  </div>
                  {spell.classes?.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {spell.classes.map((cls) => (
                        <Badge key={cls.slug}>
                          {cls.emoji} {cls.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 border-t border-stone-800 pt-3 text-sm text-stone-300">
                          <p className="mb-2 text-[11px] text-stone-500">
                            <span className="font-medium text-stone-400">Componentes:</span>{' '}
                            {[spell.components.verbal && 'V', spell.components.somatic && 'S', spell.components.material && 'M']
                              .filter(Boolean)
                              .join(', ') || '—'}
                            {spell.components.materialText && ` (${spell.components.materialText})`}
                          </p>
                          {spell.description.split('\n\n').map((paragraph, i) => (
                            <p key={i} className="mb-2 leading-relaxed whitespace-pre-line last:mb-0">
                              {paragraph}
                            </p>
                          ))}
                          {spell.mechanics && (
                            <div className="mt-3">
                              <SpellMechanicsGrid spell={spell} />
                            </div>
                          )}
                          {spell.revision55 && (
                            <p className="mt-3 rounded-md border border-amber-800/40 bg-amber-950/20 px-2.5 py-2 text-xs text-amber-200/80">
                              <span className="font-semibold text-amber-400">{spell.revision55.status}.</span>{' '}
                              {spell.revision55.note}
                            </p>
                          )}
                          <p className="mt-3 text-[10px] text-stone-600">
                            {spell.source && <>Fonte: {spell.source} · </>}
                            <a href={spell.sourceUrl} target="_blank" rel="noreferrer" className="hover:text-amber-500">
                              Ver no Critical20
                            </a>
                          </p>
                          <button
                            onClick={() => addToConjuracao(spell)}
                            disabled={alreadyAdded}
                            className="mt-3 flex items-center gap-1.5 rounded-md border border-amber-600/50 bg-amber-600/15 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-600/25 disabled:cursor-not-allowed disabled:border-stone-700 disabled:bg-transparent disabled:text-stone-600"
                          >
                            {alreadyAdded ? (
                              <>
                                <Check size={13} /> Já está na Conjuração
                              </>
                            ) : (
                              <>
                                <Plus size={13} /> Adicionar à Conjuração
                              </>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Panel>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
