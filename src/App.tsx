import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BookOpen, ScrollText, Sparkles, Swords } from 'lucide-react'
import { TopBar } from './components/TopBar'
import { Tabs, type TabDef } from './components/Tabs'
import { PrincipalSection } from './components/sections/PrincipalSection'
import { CombateSection } from './components/sections/CombateSection'
import { ConjuracaoSection } from './components/sections/ConjuracaoSection'
import { AntecedenteSection } from './components/sections/AntecedenteSection'
import { useCharacterFile } from './hooks/useCharacterFile'
import { sthiven } from './data/sthiven'
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
    useCharacterFile(sthiven)

  const handleNew = () => {
    if (confirm('Criar uma nova ficha em branco? As alterações não salvas da ficha atual serão perdidas.')) {
      newFile(createBlankCharacter())
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#1c1917_0%,_#0b0c10_60%)] text-stone-200">
      <TopBar
        characterName={character.name}
        fileName={fileName}
        status={status}
        onOpen={openFile}
        onSave={saveFile}
        onSaveAs={saveFileAs}
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
