import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { Link2, Plus, X } from 'lucide-react'

const MENU_WIDTH = 240

export interface CaseOption {
  id: string
  title: string
}

export function RelatedCasesControl({
  allCases,
  currentCaseId,
  relatedIds,
  onLink,
  onUnlink,
  onJump,
}: {
  allCases: CaseOption[]
  currentCaseId: string
  relatedIds: string[]
  onLink: (caseId: string) => void
  onUnlink: (caseId: string) => void
  onJump: (caseId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const relatedCases = relatedIds?.map((id) => allCases.find((c) => c.id === id)).filter((c): c is CaseOption => !!c)
  const candidates = allCases.filter((c) => c.id !== currentCaseId && !relatedIds?.includes(c.id))

  const openMenu = () => {
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) {
      setCoords({
        top: rect.bottom + 6,
        left: Math.min(Math.max(rect.right - MENU_WIDTH, 8), window.innerWidth - MENU_WIDTH - 8),
      })
    }
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const handleScroll = () => setOpen(false)
    window.addEventListener('keydown', handleKey)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleScroll)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll)
    }
  }, [open])

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium tracking-wide text-stone-500 uppercase">
        <Link2 size={11} /> Casos relacionados
      </span>
      {relatedCases?.map((rc) => (
        <span
          key={rc.id}
          className="flex items-center gap-1 rounded-md border border-sky-700/50 bg-sky-950/40 px-2 py-1 text-[11px] text-sky-300"
        >
          <button type="button" onClick={() => onJump(rc.id)} className="hover:underline">
            {rc.title || 'Caso sem título'}
          </button>
          <button type="button" onClick={() => onUnlink(rc.id)} title="Desvincular" className="text-sky-500 hover:text-sky-200">
            <X size={11} />
          </button>
        </span>
      ))}
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        title="Vincular a outro caso"
        className="flex shrink-0 items-center gap-1 rounded-md border border-stone-700 px-2 py-1 text-[11px] font-medium text-stone-500 transition-colors hover:text-stone-300"
      >
        <Plus size={11} /> Vincular
      </button>
      {open &&
        coords &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.12 }}
              style={{ position: 'fixed', top: coords.top, left: coords.left, width: MENU_WIDTH }}
              className="z-50 rounded-lg border border-stone-700 bg-stone-900 p-2 shadow-xl shadow-black/40"
            >
              <p className="mb-1.5 px-1 text-[10px] font-medium tracking-wide text-stone-500 uppercase">Vincular a</p>
              {candidates?.length === 0 ? (
                <p className="px-1 py-2 text-xs text-stone-600">Nenhum outro caso disponível pra vincular ainda.</p>
              ) : (
                <div className="flex max-h-52 flex-col gap-0.5 overflow-y-auto">
                  {candidates?.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onLink(c.id)
                        setOpen(false)
                      }}
                      className="rounded-md px-1.5 py-1.5 text-left text-xs text-stone-300 hover:bg-stone-800/60"
                    >
                      {c.title || 'Caso sem título'}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </>,
          document.body,
        )}
    </div>
  )
}
