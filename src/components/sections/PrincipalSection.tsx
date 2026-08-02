import { motion } from 'motion/react'
import { Heart, Shield, Skull, Zap } from 'lucide-react'
import { ABILITY_LABELS, SKILL_DEFS, type AbilityKey, type Character } from '../../types/character'
import { useAttributes } from '../../context/AttributesContext'
import { DeDAttributes } from '../../lib/DeDAttributes'
import { Checkbox, ModifierBadge, NumberField, Panel, StatCircle, TextAreaField, TextField } from '../ui'

const ABILITY_ORDER: AbilityKey[] = ['for', 'des', 'con', 'int', 'sab', 'car']

export function PrincipalSection({
  character,
  update,
}: {
  character: Character
  update: (patch: Partial<Character> | ((c: Character) => Character)) => void
}) {
  const { attrs, setAbilityScore, setProficiencyBonus, setInspiration, toggleSavingThrow, toggleSkillProficiency } =
    useAttributes()

  const hpPct = character.hpMax > 0 ? Math.max(0, Math.min(100, (character.hpCurrent / character.hpMax) * 100)) : 0

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Identity */}
      <Panel title="Identidade" className="lg:col-span-12">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <TextField label="Nome" value={character.name} onChange={(v) => update({ name: v })} />
          <TextField label="Classe" value={character.class} onChange={(v) => update({ class: v })} />
          <NumberField label="Nível" value={character.level} onChange={(v) => update({ level: v })} />
          <TextField label="Antecedente" value={character.background} onChange={(v) => update({ background: v })} />
          <TextField label="Raça" value={character.race} onChange={(v) => update({ race: v })} />
          <TextField label="Alinhamento" value={character.alignment} onChange={(v) => update({ alignment: v })} />
          <NumberField
            label="Pontos de experiência"
            value={character.experiencePoints}
            onChange={(v) => update({ experiencePoints: v })}
          />
        </div>
      </Panel>

      {/* Abilities */}
      <Panel title="Atributos" className="lg:col-span-3">
        <div className="grid grid-cols-3 gap-2 lg:grid-cols-2">
          {ABILITY_ORDER?.map((key) => {
            const score = attrs.score(key)
            const mod = attrs.modifier(key)
            return (
              <motion.div
                key={key}
                whileHover={{ y: -2 }}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-stone-800 bg-stone-950/60 p-3"
              >
                <span className="text-[10px] font-semibold tracking-wide text-stone-500 uppercase">
                  {ABILITY_LABELS[key]}
                </span>
                <span className="font-mono text-lg font-bold text-amber-400">{DeDAttributes.formatModifier(mod)}</span>
                <input
                  type="number"
                  value={score}
                  onChange={(e) => setAbilityScore(key, e.target.valueAsNumber || 0)}
                  className="w-12 rounded-md border border-stone-700 bg-stone-900 px-1 py-0.5 text-center text-xs text-stone-200 outline-none focus:border-amber-600/60"
                />
              </motion.div>
            )
          })}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <NumberField label="Inspiração" value={attrs.inspiration} onChange={setInspiration} />
          <NumberField label="Bônus de proficiência" value={attrs.proficiencyBonus} onChange={setProficiencyBonus} />
        </div>
      </Panel>

      {/* Saving throws */}
      <Panel title="Salvaguardas" className="lg:col-span-3">
        <div className="flex flex-col gap-2">
          {ABILITY_ORDER?.map((key) => {
            const prof = attrs.isSavingThrowProficient(key)
            const mod = attrs.savingThrowModifier(key)
            return (
              <Checkbox
                key={key}
                checked={prof}
                onChange={() => toggleSavingThrow(key)}
                label={
                  <span className="flex flex-1 items-center justify-between gap-2 text-sm text-stone-300">
                    <span>{ABILITY_LABELS[key]}</span>
                    <ModifierBadge value={mod} />
                  </span>
                }
              />
            )
          })}
        </div>
      </Panel>

      {/* Skills */}
      <Panel title="Perícias" className="lg:col-span-6">
        <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
          {SKILL_DEFS?.map((skill) => {
            const prof = attrs.isSkillProficient(skill.key)
            const mod = attrs.skillModifier(skill.key)
            return (
              <Checkbox
                key={skill.key}
                checked={prof}
                onChange={() => toggleSkillProficiency(skill.key)}
                label={
                  <span className="flex flex-1 items-center justify-between gap-2 text-sm text-stone-300">
                    <span>
                      {skill.label} <span className="text-stone-600">({ABILITY_LABELS[skill.ability].slice(0, 3)})</span>
                    </span>
                    <ModifierBadge value={mod} />
                  </span>
                }
              />
            )
          })}
        </div>
        <div className="mt-3 flex items-center gap-2 border-t border-stone-800 pt-3 text-sm text-stone-400">
          <span className="text-[10px] font-medium tracking-wide text-stone-500 uppercase">
            Sabedoria passiva (Percepção)
          </span>
          <span className="font-mono text-base font-bold text-amber-400">{attrs.passivePerception}</span>
        </div>
      </Panel>

      {/* Combat stats */}
      <Panel title="Combate" className="lg:col-span-12">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <StatCircle
            label="Classe de armadura"
            value={
              <input
                type="number"
                value={character.armorClass}
                onChange={(e) => update({ armorClass: e.target.valueAsNumber || 0 })}
                className="w-12 bg-transparent text-center outline-none"
              />
            }
          />
          <StatCircle
            label="Iniciativa"
            value={
              <input
                type="number"
                value={character.initiativeBonus}
                onChange={(e) => update({ initiativeBonus: e.target.valueAsNumber || 0 })}
                className="w-12 bg-transparent text-center outline-none"
              />
            }
          />
          <StatCircle
            label="Deslocamento"
            value={
              <input
                type="text"
                value={character.speed}
                onChange={(e) => update({ speed: e.target.value })}
                className="w-14 bg-transparent text-center outline-none"
              />
            }
          />
          <StatCircle
            label="Dado de vida"
            value={
              <span className="flex items-center gap-1">
                <input
                  type="text"
                  value={character.hitDiceTotal}
                  onChange={(e) => update({ hitDiceTotal: e.target.value })}
                  className="w-8 bg-transparent text-center outline-none"
                />
                <input
                  type="text"
                  value={character.hitDiceType}
                  onChange={(e) => update({ hitDiceType: e.target.value })}
                  className="w-8 bg-transparent text-center text-stone-500 outline-none"
                />
              </span>
            }
          />
          <div className="col-span-2 flex flex-col justify-center gap-1 rounded-xl border border-stone-800 bg-stone-950/60 px-3 py-2 sm:col-span-2">
            <span className="flex items-center gap-1.5 text-[10px] font-medium tracking-wide text-stone-500 uppercase">
              <Skull size={12} /> Testes de morte
            </span>
            <div className="flex items-center justify-between gap-3">
              <DeathPips
                label="Sucessos"
                count={character.deathSaves.successes}
                onChange={(n) => update((c) => ({ ...c, deathSaves: { ...c.deathSaves, successes: n } }))}
                color="bg-emerald-500 border-emerald-400"
              />
              <DeathPips
                label="Falhas"
                count={character.deathSaves.failures}
                onChange={(n) => update((c) => ({ ...c, deathSaves: { ...c.deathSaves, failures: n } }))}
                color="bg-red-500 border-red-400"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-stone-800 bg-stone-950/60 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10px] font-medium tracking-wide text-stone-500 uppercase">
              <Heart size={12} className="text-red-500" /> Pontos de vida
            </span>
            <span className="font-mono text-sm text-stone-300">
              {character.hpCurrent} / {character.hpMax}
              {character.hpTemp > 0 && <span className="text-sky-400"> (+{character.hpTemp})</span>}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-stone-900">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-red-700 via-red-600 to-red-500"
              animate={{ width: `${hpPct}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <NumberField label="Atuais" value={character.hpCurrent} onChange={(v) => update({ hpCurrent: v })} />
            <NumberField label="Máximos" value={character.hpMax} onChange={(v) => update({ hpMax: v })} />
            <NumberField label="Temporários" value={character.hpTemp} onChange={(v) => update({ hpTemp: v })} />
          </div>
        </div>
      </Panel>

      {/* Personality */}
      <Panel title="Traços de personalidade" className="lg:col-span-6" icon={<Shield size={13} className="text-amber-600" />}>
        <TextAreaField label="Traços" value={character.personalityTraits} onChange={(v) => update({ personalityTraits: v })} />
      </Panel>
      <Panel title="Ideais" className="lg:col-span-6" icon={<Zap size={13} className="text-amber-600" />}>
        <TextAreaField label="Ideais" value={character.ideals} onChange={(v) => update({ ideals: v })} />
      </Panel>
      <Panel title="Vínculos" className="lg:col-span-6">
        <TextAreaField label="Vínculos" value={character.bonds} onChange={(v) => update({ bonds: v })} />
      </Panel>
      <Panel title="Fraquezas" className="lg:col-span-6">
        <TextAreaField label="Fraquezas" value={character.flaws} onChange={(v) => update({ flaws: v })} />
      </Panel>
    </div>
  )
}

function DeathPips({
  label,
  count,
  onChange,
  color,
}: {
  label: string
  count: number
  onChange: (n: number) => void
  color: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] text-stone-500">{label}</span>
      <div className="flex gap-1">
        {[0, 1, 2]?.map((i) => {
          const filled = i < count
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(filled && i === count - 1 ? i : i + 1)}
              className={`h-3.5 w-3.5 rounded-full border transition-colors ${filled ? color : 'border-stone-600 bg-stone-900'}`}
            />
          )
        })}
      </div>
    </div>
  )
}
