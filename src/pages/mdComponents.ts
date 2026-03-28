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
import IndicatorsDemo from './IndicatorsDemo'
import { PatternDemo } from '../interactive-os/ui/PatternDemo'
import { ListboxScrollable } from '../interactive-os/ui/examples/ListboxScrollable'
import { ListboxGrouped } from '../interactive-os/ui/examples/ListboxGrouped'
import { Accordion } from '../interactive-os/ui/examples/Accordion'
import { Disclosure } from '../interactive-os/ui/examples/Disclosure'
import { Alert } from '../interactive-os/ui/examples/Alert'
import { AlertDialog } from '../interactive-os/ui/examples/AlertDialog'
import { TabsAutomatic } from '../interactive-os/ui/examples/TabsAutomatic'
import { TabsManual } from '../interactive-os/ui/examples/TabsManual'
import { MenuActions } from '../interactive-os/ui/examples/MenuActions'
import { MenuActivedescendant } from '../interactive-os/ui/examples/MenuActivedescendant'
import { MenuNavigation } from '../interactive-os/ui/examples/MenuNavigation'
import { Toolbar } from '../interactive-os/ui/examples/Toolbar'
import { TreeFile } from '../interactive-os/ui/examples/TreeFile'
import { TreegridEmail } from '../interactive-os/ui/examples/TreegridEmail'
import { GridData } from '../interactive-os/ui/examples/GridData'
import { GridLayout } from '../interactive-os/ui/examples/GridLayout'
import { RadioGroup } from '../interactive-os/ui/examples/RadioGroup'
import { RadioGroupActivedescendant } from '../interactive-os/ui/examples/RadioGroupActivedescendant'
import { CheckboxGroup } from '../interactive-os/ui/examples/CheckboxGroup'
import { CheckboxMixed } from '../interactive-os/ui/examples/CheckboxMixed'
import { SwitchGroup } from '../interactive-os/ui/examples/SwitchGroup'
import { ButtonToggle } from '../interactive-os/ui/examples/ButtonToggle'
import { SliderColorViewer } from '../interactive-os/ui/examples/SliderColorViewer'
import { SliderRating } from '../interactive-os/ui/examples/SliderRating'
import { Spinbutton } from '../interactive-os/ui/examples/Spinbutton'
import { Meter } from '../interactive-os/ui/examples/Meter'
import { WindowSplitter } from '../interactive-os/ui/examples/WindowSplitter'
import { Feed } from '../interactive-os/ui/examples/Feed'
import { Link } from '../interactive-os/ui/examples/Link'
import { Table } from '../interactive-os/ui/examples/Table'
import { ComboboxSelectOnly } from '../interactive-os/ui/examples/ComboboxSelectOnly'

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
  IndicatorsDemo,
  PatternDemo,
  ListboxScrollable,
  ListboxGrouped,
  Accordion,
  Disclosure,
  Alert,
  AlertDialog,
  TabsAutomatic,
  TabsManual,
  MenuActions,
  MenuActivedescendant,
  MenuNavigation,
  Toolbar,
  TreeFile,
  TreegridEmail,
  GridData,
  GridLayout,
  RadioGroup,
  RadioGroupActivedescendant,
  CheckboxGroup,
  CheckboxMixed,
  SwitchGroup,
  ButtonToggle,
  SliderColorViewer,
  SliderRating,
  Spinbutton,
  Meter,
  WindowSplitter,
  Feed,
  Link,
  Table,
  ComboboxSelectOnly,
}
