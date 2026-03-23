import type { ComponentType } from 'react'
import AxisSpec from './AxisSpec'
import NavigateDemo from './axis/NavigateDemo'
import SelectDemo from './axis/SelectDemo'
import ActivateDemo from './axis/ActivateDemo'
import ExpandDemo from './axis/ExpandDemo'
import TrapDemo from './axis/TrapDemo'
import EditDemo from './axis/EditDemo'

export const mdComponents: Record<string, ComponentType<Record<string, unknown>>> = {
  AxisSpec,
  NavigateDemo,
  SelectDemo,
  ActivateDemo,
  ExpandDemo,
  TrapDemo,
  EditDemo,
}
