import { useCallback, useRef, useState } from 'react'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  message: string
  variant: ToastVariant
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message: string, variant: ToastVariant = 'info', duration = 3200) => {
      const id = ++idRef.current
      setToasts((prev) => [...prev, { id, message, variant }])
      window.setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss],
  )

  return { toasts, push, dismiss }
}
