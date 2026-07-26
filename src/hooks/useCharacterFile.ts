import { useCallback, useEffect, useRef, useState } from 'react'
import type { Character } from '../types/character'
import {
  type FileSystemFileHandleLike,
  downloadFile,
  pickAndCreateFile,
  pickAndReadFile,
  readFileViaInput,
  supportsFileSystemAccess,
  writeToHandle,
} from '../lib/fileStorage'

const DRAFT_KEY = 'ded-ficha-draft'
const DRAFT_NAME_KEY = 'ded-ficha-draft-name'

export type SaveStatus = 'salvo' | 'nao-salvo' | 'salvando' | 'erro'

export function useCharacterFile(initial: Character) {
  const [character, setCharacter] = useState<Character>(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) return { ...initial, ...JSON.parse(raw) }
    } catch {
      // ignore malformed draft
    }
    return initial
  })
  const [fileName, setFileName] = useState<string>(() => localStorage.getItem(DRAFT_NAME_KEY) || 'sthiven.json')
  const [status, setStatus] = useState<SaveStatus>('nao-salvo')
  const handleRef = useRef<FileSystemFileHandleLike | null>(null)
  const firstRun = useRef(true)

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(character))
    localStorage.setItem(DRAFT_NAME_KEY, fileName)
    setStatus('nao-salvo')
  }, [character, fileName])

  const updateCharacter = useCallback((patch: Partial<Character> | ((c: Character) => Character)) => {
    setCharacter((prev) => (typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }))
  }, [])

  const saveToHandle = useCallback(
    async (handle: FileSystemFileHandleLike) => {
      setStatus('salvando')
      try {
        await writeToHandle(handle, JSON.stringify(character, null, 2))
        setStatus('salvo')
      } catch {
        setStatus('erro')
      }
    },
    [character],
  )

  const saveFileAs = useCallback(async () => {
    if (supportsFileSystemAccess) {
      const handle = await pickAndCreateFile(fileName || 'personagem.json')
      if (!handle) return
      handleRef.current = handle
      setFileName(handle.name)
      await saveToHandle(handle)
    } else {
      downloadFile(fileName || 'personagem.json', JSON.stringify(character, null, 2))
      setStatus('salvo')
    }
  }, [character, fileName, saveToHandle])

  const saveFile = useCallback(async () => {
    if (handleRef.current) {
      await saveToHandle(handleRef.current)
    } else {
      await saveFileAs()
    }
  }, [saveFileAs, saveToHandle])

  const openFile = useCallback(async () => {
    if (supportsFileSystemAccess) {
      const result = await pickAndReadFile()
      if (!result) return
      try {
        const parsed = JSON.parse(result.text)
        handleRef.current = result.handle
        setFileName(result.handle.name)
        setCharacter((prev) => ({ ...prev, ...parsed }))
        setStatus('salvo')
      } catch {
        setStatus('erro')
      }
    } else {
      const result = await readFileViaInput()
      if (!result) return
      try {
        const parsed = JSON.parse(result.text)
        handleRef.current = null
        setFileName(result.name)
        setCharacter((prev) => ({ ...prev, ...parsed }))
        setStatus('salvo')
      } catch {
        setStatus('erro')
      }
    }
  }, [])

  const newFile = useCallback(
    (blank: Character) => {
      handleRef.current = null
      setFileName('nova-ficha.json')
      setCharacter(blank)
    },
    [],
  )

  return {
    character,
    updateCharacter,
    setCharacter,
    fileName,
    status,
    openFile,
    saveFile,
    saveFileAs,
    newFile,
    supportsFileSystemAccess,
    hasHandle: !!handleRef.current,
  }
}
