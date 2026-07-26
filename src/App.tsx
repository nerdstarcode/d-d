import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BookOpen, ScrollText, Sparkles, Swords } from 'lucide-react'
import { TopBar } from './components/TopBar'
import { Tabs, type TabDef } from './components/Tabs'
import { ToastViewport } from './components/Toast'
import { PrincipalSection } from './components/sections/PrincipalSection'
import { CombateSection } from './components/sections/CombateSection'
import { ConjuracaoSection } from './components/sections/ConjuracaoSection'
import { AntecedenteSection } from './components/sections/AntecedenteSection'
import { useCharacterFile } from './hooks/useCharacterFile'
import { useToasts } from './hooks/useToasts'
import { createBlankCharacter } from './types/character'

const TABS: TabDef[] = [
  { key: 'principal', label: 'Principal', icon: <ScrollText size={15} /> },
  { key: 'combate', label: 'Combate & Itens', icon: <Swords size={15} /> },
  { key: 'conjuracao', label: 'Conjuração', icon: <Sparkles size={15} /> },
  { key: 'antecedente', label: 'Antecedente', icon: <BookOpen size={15} /> },
]

function App() {
  const [tab, setTab] = useState('principal')
  const { character, updateCharacter, fileName, status, openFile, saveFile, saveFileAs, newFile } =
    useCharacterFile()
  const { toasts, push, dismiss } = useToasts()

  const handleOpen = async () => {
    const result = await openFile()
    if (result.status === 'opened') push(`Ficha "${result.fileName}" carregada.`, 'success')
    else if (result.status === 'error') push('Não foi possível abrir o arquivo. Verifique se é um JSON de ficha válido.', 'error')
  }

  const handleSave = async () => {
    const result = await saveFile()
    if (result.status === 'saved') push(`Ficha salva em "${result.fileName}".`, 'success')
    else if (result.status === 'error') push('Erro ao salvar a ficha.', 'error')
  }

  const handleSaveAs = async () => {
    const result = await saveFileAs()
    if (result.status === 'saved') push(`Ficha salva em "${result.fileName}".`, 'success')
    else if (result.status === 'error') push('Erro ao salvar a ficha.', 'error')
  }

  const handleNew = () => {
    if (confirm('Criar uma nova ficha em branco? As alterações não salvas da ficha atual serão perdidas.')) {
      newFile(createBlankCharacter())
      push('Nova ficha em branco criada.', 'info')
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,#1c1917_0%,#0b0c10_60%)] text-stone-200">
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
      <TopBar
        characterName={character.name}
        fileName={fileName}
        status={status}
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onNew={handleNew}
      />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {tab === 'principal' && <PrincipalSection character={character} update={updateCharacter} />}
            {tab === 'combate' && <CombateSection character={character} update={updateCharacter} />}
            {tab === 'conjuracao' && <ConjuracaoSection character={character} update={updateCharacter} />}
            {tab === 'antecedente' && <AntecedenteSection character={character} update={updateCharacter} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
