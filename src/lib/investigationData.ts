import type { BankCharacter, InvestigationCase } from '../types/character'

const EXPORT_KIND = 'ded-investigation-data'
const EXPORT_VERSION = 1

export interface InvestigationDataExport {
  kind: typeof EXPORT_KIND
  version: number
  cases: InvestigationCase[]
  characterBank: BankCharacter[]
}

export function buildInvestigationExport(cases: InvestigationCase[], characterBank: BankCharacter[]): InvestigationDataExport {
  return { kind: EXPORT_KIND, version: EXPORT_VERSION, cases, characterBank }
}

/** Throws if `text` doesn't look like a Casos/Personagens export (or export-shaped JSON in general). */
export function parseInvestigationImport(text: string): { cases: InvestigationCase[]; characterBank: BankCharacter[] } {
  const parsed: unknown = JSON.parse(text)
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !Array.isArray((parsed as Partial<InvestigationDataExport>).cases) ||
    !Array.isArray((parsed as Partial<InvestigationDataExport>).characterBank)
  ) {
    throw new Error('Arquivo não parece ser uma exportação de Casos e Personagens válida.')
  }
  const { cases, characterBank } = parsed as InvestigationDataExport
  return { cases, characterBank }
}
