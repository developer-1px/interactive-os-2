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
import FormDemo from './FormDemo'
import StoreInspectorDemo from '../devtools/inspector/StoreInspectorDemo'
import IndicatorsDemo from './IndicatorsDemo'
import { PatternDemo } from '../interactive-os/ui/PatternDemo'
import { ListboxScrollable } from '../interactive-os/pattern/examples/ListboxScrollable'
import { ListboxGrouped } from '../interactive-os/pattern/examples/ListboxGrouped'
import { Accordion } from '../interactive-os/pattern/examples/Accordion'
import { Disclosure } from '../interactive-os/pattern/examples/Disclosure'
import { Alert } from '../interactive-os/pattern/examples/Alert'
import { AlertDialog } from '../interactive-os/pattern/examples/AlertDialog'
import { TabsAutomatic } from '../interactive-os/pattern/examples/TabsAutomatic'
import { TabsManual } from '../interactive-os/pattern/examples/TabsManual'
import { MenuActions } from '../interactive-os/pattern/examples/MenuActions'
import { MenuActivedescendant } from '../interactive-os/pattern/examples/MenuActivedescendant'
import { MenuNavigation } from '../interactive-os/pattern/examples/MenuNavigation'
import { MenubarNavigation } from '../interactive-os/pattern/examples/MenubarNavigation'
import { DatePickerCombobox } from '../interactive-os/pattern/examples/DatePickerCombobox'
import { Toolbar } from '../interactive-os/pattern/examples/Toolbar'
import { TreeFile } from '../interactive-os/pattern/examples/TreeFile'
import { TreegridEmail } from '../interactive-os/pattern/examples/TreegridEmail'
import { GridData } from '../interactive-os/pattern/examples/GridData'
import { GridLayout } from '../interactive-os/pattern/examples/GridLayout'
import { RadioGroup } from '../interactive-os/pattern/examples/RadioGroup'
import { RadioGroupActivedescendant } from '../interactive-os/pattern/examples/RadioGroupActivedescendant'
import { CheckboxGroup } from '../interactive-os/pattern/examples/CheckboxGroup'
import { CheckboxMixed } from '../interactive-os/pattern/examples/CheckboxMixed'
import { SwitchGroup } from '../interactive-os/pattern/examples/SwitchGroup'
import { ButtonToggle } from '../interactive-os/pattern/examples/ButtonToggle'
import { SliderColorViewer } from '../interactive-os/pattern/examples/SliderColorViewer'
import { SliderRating } from '../interactive-os/pattern/examples/SliderRating'
import { Spinbutton } from '../interactive-os/pattern/examples/Spinbutton'
import { Meter } from '../interactive-os/pattern/examples/Meter'
import { WindowSplitter } from '../interactive-os/pattern/examples/WindowSplitter'
import { Feed } from '../interactive-os/pattern/examples/Feed'
import { Link } from '../interactive-os/pattern/examples/Link'
import { Table } from '../interactive-os/pattern/examples/Table'
import { ComboboxSelectOnly } from '../interactive-os/pattern/examples/ComboboxSelectOnly'

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
  FormDemo,
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
  MenubarNavigation,
  DatePickerCombobox,
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
