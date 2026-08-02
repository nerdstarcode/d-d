import { motion } from 'motion/react'
import { Coins, Plus, Trash2 } from 'lucide-react'
import type { Character, Currency } from '../../types/character'
import { Panel, TextAreaField } from '../ui'

const CURRENCY_LABELS: Record<keyof Currency, string> = {
  pc: 'PC',
  pp: 'PP',
  pe: 'PE',
  po: 'PO',
  pl: 'PL',
}

export function CombateSection({
  character,
  update,
}: {
  character: Character
  update: (patch: Partial<Character> | ((c: Character) => Character)) => void
}) {
  const updateAttack = (index: number, field: 'name' | 'bonus' | 'damage', value: string) => {
    update((c) => {
      const attacks = [...c.attacks]
      attacks[index] = { ...attacks[index], [field]: value }
      return { ...c, attacks }
    })
  }

  const addAttack = () => update((c) => ({ ...c, attacks: [...c.attacks, { name: '', bonus: '', damage: '' }] }))
  const removeAttack = (index: number) =>
    update((c) => ({ ...c, attacks: c.attacks.filter((_, i) => i !== index) }))

  const updateEquipment = (index: number, name: string) =>
    update((c) => {
      const equipment = [...c.equipment]
      equipment[index] = { ...equipment[index], name }
      return { ...c, equipment }
    })
  const addEquipment = () => update((c) => ({ ...c, equipment: [...c.equipment, { name: '' }] }))
  const removeEquipment = (index: number) =>
    update((c) => ({ ...c, equipment: c.equipment.filter((_, i) => i !== index) }))

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <Panel title="Ataques & Conjuração" className="lg:col-span-7">
        <div className="grid grid-cols-[1fr_5rem_6rem_2rem] gap-2 pb-1.5 text-[10px] font-medium tracking-wide text-stone-500 uppercase">
          <span>Nome</span>
          <span>Bônus</span>
          <span>Dano / Tipo</span>
          <span />
        </div>
        <div className="flex flex-col gap-1.5">
          {character.attacks?.map((atk, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-[1fr_5rem_6rem_2rem] items-center gap-2"
            >
              <input
                value={atk.name}
                onChange={(e) => updateAttack(i, 'name', e.target.value)}
                className="rounded-md border border-stone-700 bg-stone-950/70 px-2 py-1.5 text-sm text-stone-100 outline-none focus:border-amber-600/60"
              />
              <input
                value={atk.bonus}
                onChange={(e) => updateAttack(i, 'bonus', e.target.value)}
                className="rounded-md border border-stone-700 bg-stone-950/70 px-2 py-1.5 text-sm text-stone-100 outline-none focus:border-amber-600/60"
              />
              <input
                value={atk.damage}
                onChange={(e) => updateAttack(i, 'damage', e.target.value)}
                className="rounded-md border border-stone-700 bg-stone-950/70 px-2 py-1.5 text-sm text-stone-100 outline-none focus:border-amber-600/60"
              />
              <button onClick={() => removeAttack(i)} className="flex justify-center text-stone-600 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </div>
        <button
          onClick={addAttack}
          className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-500 hover:text-amber-400"
        >
          <Plus size={14} /> Adicionar ataque
        </button>
      </Panel>

      <Panel title="Moedas" className="lg:col-span-5" icon={<Coins size={13} className="text-amber-600" />}>
        <div className="grid grid-cols-5 gap-2">
          {(Object.keys(CURRENCY_LABELS) as (keyof Currency)[])?.map((key) => (
            <label key={key} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-medium text-stone-500">{CURRENCY_LABELS[key]}</span>
              <input
                type="number"
                value={character.currency[key]}
                onChange={(e) =>
                  update((c) => ({ ...c, currency: { ...c.currency, [key]: e.target.valueAsNumber || 0 } }))
                }
                className="w-full rounded-md border border-stone-700 bg-stone-950/70 px-1 py-1.5 text-center text-sm text-stone-100 outline-none focus:border-amber-600/60"
              />
            </label>
          ))}
        </div>

        <div className="mt-4 border-t border-stone-800 pt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-medium tracking-wide text-stone-500 uppercase">Equipamento</span>
            <button onClick={addEquipment} className="flex items-center gap-1 text-xs font-medium text-amber-500 hover:text-amber-400">
              <Plus size={13} /> Item
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {character.equipment?.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2"
              >
                <input
                  value={item.name}
                  onChange={(e) => updateEquipment(i, e.target.value)}
                  className="flex-1 rounded-md border border-stone-700 bg-stone-950/70 px-2 py-1.5 text-sm text-stone-100 outline-none focus:border-amber-600/60"
                />
                <button onClick={() => removeEquipment(i)} className="text-stone-600 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </Panel>

      <Panel title="Outras proficiências & idiomas" className="lg:col-span-6">
        <TextAreaField
          label="Proficiências & idiomas"
          rows={5}
          value={character.otherProficienciesAndLanguages}
          onChange={(v) => update({ otherProficienciesAndLanguages: v })}
        />
      </Panel>
      <Panel title="Características & talentos" className="lg:col-span-6">
        <TextAreaField
          label="Características & talentos"
          rows={5}
          value={character.featuresAndTraits}
          onChange={(v) => update({ featuresAndTraits: v })}
        />
      </Panel>
    </div>
  )
}
