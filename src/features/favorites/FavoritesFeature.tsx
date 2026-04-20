// FavoritesFeature — 프로젝트 주요 폴더를 사이드바에 기여. 활성화 시 dataSource rootPath 전환.

import { Folder, Code2, BookText, Image, Component, CalendarDays, CalendarClock } from 'lucide-react'
import { defineFeature } from '@os/feature/defineFeature'

const ICON = 14
const ROOT = '/Users/user/Desktop/aria'

const today = new Date()
const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
const dayPath = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${ROOT}/docs/${y}/${y}-${m}/${y}-${m}-${day}`
}

export const FavoritesFeature = defineFeature({
  id: 'favorites',
  name: 'Favorites Sidebar',
  version: '0.1.0',
  sidebar: [
    {
      id: 'recent',
      section: 'recent',
      order: 0,
      items: [
        { id: 'today', label: 'Today', rootPath: dayPath(today), icon: <CalendarDays size={ICON} /> },
        { id: 'yesterday', label: 'Yesterday', rootPath: dayPath(yesterday), icon: <CalendarClock size={ICON} /> },
      ],
    },
    {
      id: 'favorites',
      section: 'favorites',
      order: 1,
      items: [
        { id: 'root', label: '/', rootPath: ROOT, icon: <Folder size={ICON} /> },
        { id: 'src', label: 'src', rootPath: `${ROOT}/src`, icon: <Code2 size={ICON} /> },
        { id: 'docs', label: 'docs', rootPath: `${ROOT}/docs`, icon: <BookText size={ICON} /> },
        { id: 'ui', label: 'UI Showcase', rootPath: `${ROOT}/contents/ui`, icon: <Component size={ICON} /> },
        { id: 'screenshots', label: 'screenshots', rootPath: `${ROOT}/screenshots`, icon: <Image size={ICON} /> },
      ],
    },
  ],
})
