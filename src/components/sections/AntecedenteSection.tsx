import { BookOpen, Gem, Users } from 'lucide-react'
import type { Character } from '../../types/character'
import { Panel, TextAreaField, TextField } from '../ui'

export function AntecedenteSection({
  character,
  update,
}: {
  character: Character
  update: (patch: Partial<Character> | ((c: Character) => Character)) => void
}) {
  const updateAppearance = (patch: Partial<Character['appearance']>) =>
    update((c) => ({ ...c, appearance: { ...c.appearance, ...patch } }))

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <Panel title="Características físicas" className="lg:col-span-12">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <TextField label="Idade" value={character.appearance.age} onChange={(v) => updateAppearance({ age: v })} />
          <TextField label="Altura" value={character.appearance.height} onChange={(v) => updateAppearance({ height: v })} />
          <TextField label="Peso" value={character.appearance.weight} onChange={(v) => updateAppearance({ weight: v })} />
          <TextField label="Cor dos olhos" value={character.appearance.eyes} onChange={(v) => updateAppearance({ eyes: v })} />
          <TextField label="Cor da pele" value={character.appearance.skin} onChange={(v) => updateAppearance({ skin: v })} />
          <TextField label="Cor do cabelo" value={character.appearance.hair} onChange={(v) => updateAppearance({ hair: v })} />
        </div>
      </Panel>

      <Panel title="Aparência do personagem" className="lg:col-span-6">
        <TextAreaField
          label="Descrição"
          rows={6}
          value={character.appearance.description}
          onChange={(v) => updateAppearance({ description: v })}
        />
      </Panel>

      <Panel title="Aliados & Organizações" className="lg:col-span-6" icon={<Users size={13} className="text-amber-600" />}>
        <TextField
          label="Nome do símbolo"
          value={character.symbolName}
          onChange={(v) => update({ symbolName: v })}
          className="mb-3"
        />
        <TextAreaField
          label="Aliados & organizações"
          rows={4}
          value={character.alliesAndOrganizations}
          onChange={(v) => update({ alliesAndOrganizations: v })}
        />
      </Panel>

      <Panel title="Características e talentos adicionais" className="lg:col-span-6">
        <TextAreaField label="Adicionais" rows={7} value={character.additionalFeatures} onChange={(v) => update({ additionalFeatures: v })} />
      </Panel>

      <Panel title="História do personagem" className="lg:col-span-6" icon={<BookOpen size={13} className="text-amber-600" />}>
        <TextAreaField label="História" rows={7} value={character.backstory} onChange={(v) => update({ backstory: v })} />
      </Panel>

      <Panel title="Tesouros" className="lg:col-span-12" icon={<Gem size={13} className="text-amber-600" />}>
        <TextAreaField label="Tesouros" rows={4} value={character.treasure} onChange={(v) => update({ treasure: v })} />
      </Panel>
    </div>
  )
}
