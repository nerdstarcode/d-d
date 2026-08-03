import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { Link2, Users, X } from 'lucide-react'
import type { BankCharacter } from '../types/character'

const MENU_WIDTH = 240

export function BankLinkControl({
  bank,
  linkedId,
  onLink,
  onUnlink,
}: {
  bank: BankCharacter[]
  linkedId?: string
  onLink: (bankId: string) => void
  onUnlink: () => void
}) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const linked = bank.find((b) => b.id === linkedId)

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

  if (linked) {
    return (
      <div className="flex shrink-0 items-center gap-1.5 rounded-md border border-sky-700/50 bg-sky-950/40 px-2 py-1 text-[11px] text-sky-300">
        <Link2 size={11} />
        <span className="max-w-[8rem] truncate">{linked.name || 'Sem nome'}</span>
        <button type="button" onClick={onUnlink} title="Desvincular do banco" className="text-sky-500 hover:text-sky-200">
          <X size={12} />
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        title="Vincular a um personagem do banco"
        className="flex shrink-0 items-center gap-1 rounded-md border border-stone-700 px-2 py-1 text-[11px] font-medium text-stone-500 transition-colors hover:text-stone-300"
      >
        <Users size={11} /> Vincular
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
              <p className="mb-1.5 px-1 text-[10px] font-medium tracking-wide text-stone-500 uppercase">
                Personagens do banco
              </p>
              {bank?.length === 0 ? (
                <p className="px-1 py-2 text-xs text-stone-600">Nenhum personagem salvo ainda. Crie um na aba Personagens.</p>
              ) : (
                <div className="flex max-h-52 flex-col gap-0.5 overflow-y-auto">
                  {bank?.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        onLink(b.id)
                        setOpen(false)
                      }}
                      className="rounded-md px-1.5 py-1.5 text-left text-xs text-stone-300 hover:bg-stone-800/60"
                    >
                      <span className="font-medium text-stone-200">{b.name || 'Sem nome'}</span>
                      {b.traits.hairColor && <span className="text-stone-500"> · {b.traits.hairColor}</span>}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </>,
          document.body,
        )}
    </>
  )
}
