var e=`import { useState } from 'react'
import type { NormalizedData } from './types'

export function useStore(
  initialData: NormalizedData | (() => NormalizedData),
): [NormalizedData, React.Dispatch<React.SetStateAction<NormalizedData>>] {
  return useState(initialData)
}
`;export{e as default};