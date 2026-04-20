import { createDomainContext } from '@os/layout'

export type GmailCategory = 'primary' | 'social' | 'promotions'

export interface GmailContextValue {
  selectedFolderId: string
  selectedMailId: string | null
  selectedMailIds: ReadonlySet<string>
  activeCategory: GmailCategory
  page: number
  composeOpen: boolean
  commands: {
    selectFolder: (id: string) => void
    selectMail: (id: string) => void
    toggleSelect: (id: string) => void
    selectAll: (ids: string[]) => void
    clearSelection: () => void
    setCategory: (c: GmailCategory) => void
    setPage: (n: number) => void
    openCompose: () => void
    closeCompose: () => void
    gotoPrev: () => void
    gotoNext: () => void
  }
}

export const [GmailProvider, useGmail] = createDomainContext<GmailContextValue>('Gmail')
