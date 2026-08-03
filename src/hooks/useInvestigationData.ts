import { useCallback } from 'react'
import type { Character } from '../types/character'
import { buildInvestigationExport, parseInvestigationImport } from '../lib/investigationData'
import {
  downloadFile,
  pickAndCreateFile,
  pickAndReadFile,
  readFileViaInput,
  supportsFileSystemAccess,
  writeToHandle,
} from '../lib/fileStorage'

const PICKER_DESCRIPTION = 'Casos e Personagens (JSON)'
const SUGGESTED_NAME = 'casos-e-personagens.json'

type Notify = (message: string, variant: 'success' | 'error' | 'info') => void

/** Export/import for just the investigation-game slice of the character (Casos + Personagens), independent of the D&D sheet. */
export function useInvestigationData(
  character: Character,
  update: (patch: Partial<Character> | ((c: Character) => Character)) => void,
  notify?: Notify,
) {
  const exportData = useCallback(async () => {
    const payload = JSON.stringify(buildInvestigationExport(character.cases, character.characterBank), null, 2)
    try {
      if (supportsFileSystemAccess) {
        const handle = await pickAndCreateFile(SUGGESTED_NAME, PICKER_DESCRIPTION)
        if (!handle) return
        await writeToHandle(handle, payload)
      } else {
        downloadFile(SUGGESTED_NAME, payload)
      }
      notify?.('Casos e personagens exportados.', 'success')
    } catch {
      notify?.('Erro ao exportar casos e personagens.', 'error')
    }
  }, [character.cases, character.characterBank, notify])

  const importData = useCallback(async () => {
    const result = supportsFileSystemAccess ? await pickAndReadFile(PICKER_DESCRIPTION) : await readFileViaInput()
    if (!result) return
    try {
      const { cases, characterBank } = parseInvestigationImport(result.text)
      update((c) => ({
        ...c,
        cases: [...c.cases, ...cases],
        characterBank: [...c.characterBank, ...characterBank],
      }))
      notify?.(
        `${cases.length} caso${cases.length === 1 ? '' : 's'} e ${characterBank.length} personagem${characterBank.length === 1 ? '' : 'ns'} importado(s).`,
        'success',
      )
    } catch {
      notify?.('Não foi possível importar — verifique se é um arquivo exportado daqui.', 'error')
    }
  }, [update, notify])

  return { exportData, importData }
}
