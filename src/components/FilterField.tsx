import { X } from 'lucide-react'

export function FilterField({
  label,
  value,
  onChange,
  onClear,
  listId,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onClear: () => void
  listId: string
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium tracking-wide text-stone-500 uppercase">{label}</span>
      <div className="relative">
        <input
          type="text"
          value={value}
          list={listId}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-stone-700 bg-stone-950/70 px-2.5 py-1.5 pr-7 text-sm text-stone-100 outline-none transition-colors focus:border-amber-600/60 focus:ring-1 focus:ring-amber-600/30"
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            title={`Limpar ${label}`}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-200"
          >
            <X size={13} />
          </button>
        )}
      </div>
    </label>
  )
}
