// ② flatlayout-nav-catalog-prd.md
import { createContext } from 'react'

export const NavLayoutContext = createContext<{
  activeIndex: number
  setActiveIndex: (index: number) => void
}>({ activeIndex: 0, setActiveIndex: () => {} })
