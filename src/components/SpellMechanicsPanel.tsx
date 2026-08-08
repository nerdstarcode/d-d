import type { CompendiumSpell } from '../types/spellCompendium'
import { getHealingInfo } from '../lib/spellEffects'

export function MechanicBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-stone-800 bg-stone-950/50 p-2.5">
      <div className="text-[9px] font-bold tracking-wider text-stone-500 uppercase">{label}</div>
      <div className="text-xs font-semibold text-stone-200">{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-stone-500 italic">{sub}</div>}
    </div>
  )
}

/** Compact Ação/Alcance/Duração row for a linked compendium spell. */
export function SpellQuickFacts({ spell }: { spell: CompendiumSpell }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-[11px]">
      <div>
        <div className="text-[10px] font-medium tracking-wide text-stone-500 uppercase">Ação</div>
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
  )
}

/** Cura / Dano / Resistência / Alvo-Área / Escalonamento grid, shown only for spells with mechanics (or healing) data. */
export function SpellMechanicsGrid({ spell }: { spell: CompendiumSpell }) {
  const heal = getHealingInfo(spell)
  const { damage, damageType, save, areaOrTarget, scaling } = spell.mechanics ?? {}
  if (!heal && !damage && !save && !areaOrTarget && !scaling) return null
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {heal && (
        <MechanicBox label="Cura" value={heal.dice} sub={heal.modifier ? `+ ${heal.modifier}` : undefined} />
      )}
      {damage && <MechanicBox label="Dano" value={damage} sub={damageType} />}
      {save && <MechanicBox label="Resistência" value={save} />}
      {areaOrTarget && <MechanicBox label="Alvo / Área" value={areaOrTarget} />}
      {scaling && <MechanicBox label="Escalonamento" value={scaling} />}
    </div>
  )
}
