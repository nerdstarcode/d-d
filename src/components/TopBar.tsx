import { motion } from 'motion/react'
import { FileDown, FileUp, Save, ScrollText, Sparkles } from 'lucide-react'
import type { SaveStatus } from '../hooks/useCharacterFile'

const STATUS_LABEL: Record<SaveStatus, string> = {
  salvo: 'Salvo',
  'nao-salvo': 'Alterações não salvas',
  salvando: 'Salvando…',
  erro: 'Erro ao salvar',
}

const STATUS_DOT: Record<SaveStatus, string> = {
  salvo: 'bg-emerald-500',
  'nao-salvo': 'bg-amber-500',
  salvando: 'bg-sky-500 animate-pulse',
  erro: 'bg-red-500',
}

export function TopBar({
  characterName,
  fileName,
  status,
  onOpen,
  onSave,
  onSaveAs,
  onNew,
}: {
  characterName: string
  fileName: string
  status: SaveStatus
  onOpen: () => void
  onSave: () => void
  onSaveAs: () => void
  onNew: () => void
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-800 bg-stone-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <motion.div
            initial={{ rotate: -8, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-700/40 bg-gradient-to-br from-amber-900/40 to-stone-900 text-amber-500"
          >
            <ScrollText size={18} />
          </motion.div>
          <div className="leading-tight">
            <h1 className="font-serif text-base font-semibold text-stone-100">
              {characterName || 'Nova Ficha'}
            </h1>
            <p className="flex items-center gap-1.5 text-[11px] text-stone-500">
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
              {STATUS_LABEL[status]} · {fileName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <ToolbarButton onClick={onNew} icon={<Sparkles size={14} />} label="Nova" />
          <ToolbarButton onClick={onOpen} icon={<FileUp size={14} />} label="Abrir" />
          <ToolbarButton onClick={onSaveAs} icon={<FileDown size={14} />} label="Salvar como" />
          <ToolbarButton onClick={onSave} icon={<Save size={14} />} label="Salvar" primary />
        </div>
      </div>
    </header>
  )
}

function ToolbarButton({
  onClick,
  icon,
  label,
  primary,
}: {
  onClick: () => void
  icon: React.ReactNode
  label: string
  primary?: boolean
}) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
        primary
          ? 'border-amber-600/50 bg-amber-600/15 text-amber-400 hover:bg-amber-600/25'
          : 'border-stone-700 bg-stone-900 text-stone-300 hover:border-stone-600 hover:text-stone-100'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  )
}
