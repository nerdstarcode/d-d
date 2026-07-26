// Thin wrapper around the File System Access API, with a download/upload
// fallback for browsers that don't support it (Firefox, Safari).

export interface FileSystemFileHandleLike {
  getFile: () => Promise<File>
  createWritable: () => Promise<{
    write: (data: string) => Promise<void>
    close: () => Promise<void>
  }>
  name: string
}

declare global {
  interface Window {
    showOpenFilePicker?: (options?: unknown) => Promise<FileSystemFileHandleLike[]>
    showSaveFilePicker?: (options?: unknown) => Promise<FileSystemFileHandleLike>
  }
}

export const supportsFileSystemAccess =
  typeof window !== 'undefined' && 'showOpenFilePicker' in window && 'showSaveFilePicker' in window

const JSON_PICKER_OPTIONS = {
  types: [
    {
      description: 'Ficha de personagem (JSON)',
      accept: { 'application/json': ['.json'] },
    },
  ],
}

export async function pickAndReadFile(): Promise<{ handle: FileSystemFileHandleLike; text: string } | null> {
  if (!window.showOpenFilePicker) return null
  try {
    const [handle] = await window.showOpenFilePicker(JSON_PICKER_OPTIONS)
    const file = await handle.getFile()
    const text = await file.text()
    return { handle, text }
  } catch (err) {
    if ((err as DOMException)?.name === 'AbortError') return null
    throw err
  }
}

export async function writeToHandle(handle: FileSystemFileHandleLike, text: string): Promise<void> {
  const writable = await handle.createWritable()
  await writable.write(text)
  await writable.close()
}

export async function pickAndCreateFile(suggestedName: string): Promise<FileSystemFileHandleLike | null> {
  if (!window.showSaveFilePicker) return null
  try {
    return await window.showSaveFilePicker({ ...JSON_PICKER_OPTIONS, suggestedName })
  } catch (err) {
    if ((err as DOMException)?.name === 'AbortError') return null
    throw err
  }
}

export function readFileViaInput(): Promise<{ name: string; text: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      const text = await file.text()
      resolve({ name: file.name, text })
    }
    input.click()
  })
}

export function downloadFile(name: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}
