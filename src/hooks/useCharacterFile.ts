import { useCallback, useEffect, useRef, useState } from 'react'
import { createBlankCharacter, type Character } from '../types/character'
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

export type FileActionResult =
  | { status: 'saved'; fileName: string }
  | { status: 'opened'; fileName: string }
  | { status: 'cancelled' }
  | { status: 'error' }

export function useCharacterFile(initial?: Character) {
  const [character, setCharacter] = useState<Character>(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) return { ...(initial ?? createBlankCharacter()), ...JSON.parse(raw) }
    } catch {
      // ignore malformed draft
    }
    return initial ?? createBlankCharacter()
  })
  const [fileName, setFileName] = useState<string>(() => localStorage.getItem(DRAFT_NAME_KEY) || 'nova-ficha.json')
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

  const saveToHandle = useCallback(async (handle: FileSystemFileHandleLike) => {
    setStatus('salvando')
    try {
      await writeToHandle(handle, JSON.stringify(character, null, 2))
      setStatus('salvo')
      return true
    } catch {
      setStatus('erro')
      return false
    }
  }, [character])

  const saveFileAs = useCallback(async (): Promise<FileActionResult> => {
    if (supportsFileSystemAccess) {
      const handle = await pickAndCreateFile(fileName || 'personagem.json')
      if (!handle) return { status: 'cancelled' }
      handleRef.current = handle
      setFileName(handle.name)
      const ok = await saveToHandle(handle)
      return ok ? { status: 'saved', fileName: handle.name } : { status: 'error' }
    }
    const name = fileName || 'personagem.json'
    try {
      downloadFile(name, JSON.stringify(character, null, 2))
      setStatus('salvo')
      return { status: 'saved', fileName: name }
    } catch {
      setStatus('erro')
      return { status: 'error' }
    }
  }, [character, fileName, saveToHandle])

  const saveFile = useCallback(async (): Promise<FileActionResult> => {
    if (handleRef.current) {
      const name = handleRef.current.name
      const ok = await saveToHandle(handleRef.current)
      return ok ? { status: 'saved', fileName: name } : { status: 'error' }
    }
    return saveFileAs()
  }, [saveFileAs, saveToHandle])

  const openFile = useCallback(async (): Promise<FileActionResult> => {
    if (supportsFileSystemAccess) {
      const result = await pickAndReadFile()
      if (!result) return { status: 'cancelled' }
      try {
        const parsed = JSON.parse(result.text)
        handleRef.current = result.handle
        setFileName(result.handle.name)
        setCharacter((prev) => ({ ...prev, ...parsed }))
        setStatus('salvo')
        return { status: 'opened', fileName: result.handle.name }
      } catch {
        setStatus('erro')
        return { status: 'error' }
      }
    }
    const result = await readFileViaInput()
    if (!result) return { status: 'cancelled' }
    try {
      const parsed = JSON.parse(result.text)
      handleRef.current = null
      setFileName(result.name)
      setCharacter((prev) => ({ ...prev, ...parsed }))
      setStatus('salvo')
      return { status: 'opened', fileName: result.name }
    } catch {
      setStatus('erro')
      return { status: 'error' }
    }
  }, [])

  const newFile = useCallback((blank: Character) => {
    handleRef.current = null
    setFileName('nova-ficha.json')
    setCharacter(blank)
  }, [])

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
