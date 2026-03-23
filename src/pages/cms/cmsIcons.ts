import {
  Database, Cog, Keyboard, Shield, Table, List, Grid3X3,
  PanelTop, MessageSquare, Menu, Layers, ChevronDown, ChevronRight,
  MousePointerClick, ToggleLeft, Radio, Star, Heart, Zap, Globe,
  Settings, Search, Bell, Mail, Image, FileText, Lock, Unlock,
  ArrowRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface CmsIconEntry {
  key: string
  Icon: LucideIcon
}

export const CMS_ICONS: CmsIconEntry[] = [
  { key: 'database', Icon: Database },
  { key: 'cog', Icon: Cog },
  { key: 'shield', Icon: Shield },
  { key: 'keyboard', Icon: Keyboard },
  { key: 'table', Icon: Table },
  { key: 'list', Icon: List },
  { key: 'grid', Icon: Grid3X3 },
  { key: 'paneltop', Icon: PanelTop },
  { key: 'message', Icon: MessageSquare },
  { key: 'menu', Icon: Menu },
  { key: 'layers', Icon: Layers },
  { key: 'chevrondown', Icon: ChevronDown },
  { key: 'chevronright', Icon: ChevronRight },
  { key: 'click', Icon: MousePointerClick },
  { key: 'toggle', Icon: ToggleLeft },
  { key: 'radio', Icon: Radio },
  { key: 'star', Icon: Star },
  { key: 'heart', Icon: Heart },
  { key: 'zap', Icon: Zap },
  { key: 'globe', Icon: Globe },
  { key: 'settings', Icon: Settings },
  { key: 'search', Icon: Search },
  { key: 'bell', Icon: Bell },
  { key: 'mail', Icon: Mail },
  { key: 'image', Icon: Image },
  { key: 'file', Icon: FileText },
  { key: 'lock', Icon: Lock },
  { key: 'unlock', Icon: Unlock },
  { key: 'arrow-right', Icon: ArrowRight },
]

export const CMS_ICON_MAP = new Map(CMS_ICONS.map(i => [i.key, i.Icon]))
