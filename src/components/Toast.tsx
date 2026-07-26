import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import type { ToastItem, ToastVariant } from '../hooks/useToasts'

const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const STYLES: Record<ToastVariant, string> = {
  success: 'border-emerald-700/50 bg-emerald-950/90 text-emerald-300',
  error: 'border-red-700/50 bg-red-950/90 text-red-300',
  info: 'border-stone-700 bg-stone-900/95 text-stone-200',
}

const ICON_COLOR: Record<ToastVariant, string> = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-amber-500',
}

export function ToastViewport({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4 sm:left-auto sm:right-4 sm:items-end">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.variant]
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-lg border px-3.5 py-2.5 text-sm shadow-lg shadow-black/30 backdrop-blur-sm ${STYLES[t.variant]}`}
            >
              <Icon size={16} className={`mt-0.5 shrink-0 ${ICON_COLOR[t.variant]}`} />
              <span className="flex-1 leading-snug">{t.message}</span>
              <button onClick={() => onDismiss(t.id)} className="text-stone-500 transition-colors hover:text-stone-300">
                <X size={13} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
