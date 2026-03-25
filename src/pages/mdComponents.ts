import type { ComponentType } from 'react'
import AxisSpec from './AxisSpec'
import NavigateDemo from './axis/NavigateDemo'
import SelectDemo from './axis/SelectDemo'
import ActivateDemo from './axis/ActivateDemo'
import ExpandDemo from './axis/ExpandDemo'
import DismissDemo from './axis/DismissDemo'
import EditDemo from './axis/EditDemo'
import { ShowcaseDemo } from './ShowcaseDemo'
import { ApgKeyboardTable } from './ApgKeyboardTable'
import AriaListboxDemo from './AriaListboxDemo'
import CellGridDemo from './CellGridDemo'
import HooksListDemo from './HooksListDemo'
import EngineCommandDemo from './EngineCommandDemo'
import EngineDiffDemo from './EngineDiffDemo'
import CrudDemo from './CrudDemo'
import ClipboardDemo from './ClipboardDemo'
import HistoryDemo from './HistoryDemo'
import DndDemo from './DndDemo'
import RenameDemo from './RenameDemo'
import TypeaheadDemo from './TypeaheadDemo'
import StoreInspectorDemo from '../devtools/inspector/StoreInspectorDemo'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mdComponents: Record<string, ComponentType<any>> = {
  AxisSpec,
  NavigateDemo,
  SelectDemo,
  ActivateDemo,
  ExpandDemo,
  DismissDemo,
  EditDemo,
  ShowcaseDemo,
  ApgKeyboardTable,
  AriaListboxDemo,
  CellGridDemo,
  HooksListDemo,
  EngineCommandDemo,
  EngineDiffDemo,
  CrudDemo,
  ClipboardDemo,
  HistoryDemo,
  DndDemo,
  RenameDemo,
  TypeaheadDemo,
  StoreInspectorDemo,
}
