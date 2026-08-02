import { motion } from 'motion/react'

export interface TabDef {
  key: string
  label: string
  icon: React.ReactNode
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef[]
  active: string
  onChange: (key: string) => void
}) {
  return (
    <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pt-3">
      {tabs?.map((tab) => {
        const isActive = tab.key === active
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`relative flex shrink-0 items-center gap-1.5 rounded-t-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              isActive ? 'text-amber-400' : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            {tab.icon}
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="tab-underline"
                className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-amber-500"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
