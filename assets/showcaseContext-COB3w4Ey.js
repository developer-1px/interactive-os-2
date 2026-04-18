var e=`import { createDomainContext } from '@os/layout'
import type { NormalizedData } from '@os/store/types'

export interface ShowcaseContextValue {
  sidebarData: NormalizedData
  activeSlug: string
  handleActivate: (slug: string) => void
  mdFile: string | undefined
}

export const [ShowcaseProvider, useShowcase] = createDomainContext<ShowcaseContextValue>('Showcase')
`;export{e as default};