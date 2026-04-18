/** @catalog 파일 확장자별 아이콘 */
import { ax } from '@styles/ax'
import {
  Folder, FolderOpen, FileCode, FileType,
  File, Braces, Palette, Terminal, Image, Settings,
} from 'lucide-react'
import './FileIcon.css'

const ICON_SIZE = 16

const base = ax({ flex: 'none',  })

export function FileIcon({ name, type, expanded }: { name: string; type: string; expanded?: boolean }) {
  if (type === 'directory') {
    return expanded
      ? <FolderOpen size={ICON_SIZE} className={base} />
      : <Folder size={ICON_SIZE} className={base} />
  }
  const ext = name.split('.').pop()
  switch (ext) {
    case 'ts':
    case 'tsx':
      return <FileCode size={ICON_SIZE} className={base} />
    case 'js':
    case 'jsx':
      return <FileCode size={ICON_SIZE} className={base} />
    case 'json':
      return <Braces size={ICON_SIZE} className={base} />
    case 'md':
      return <FileType size={ICON_SIZE} className={base} />
    case 'css':
      return <Palette size={ICON_SIZE} className={base} />
    case 'sh':
    case 'bash':
      return <Terminal size={ICON_SIZE} className={base} />
    case 'png':
    case 'jpg':
    case 'svg':
    case 'gif':
      return <Image size={ICON_SIZE} className={base} />
    case 'yaml':
    case 'yml':
    case 'toml':
      return <Settings size={ICON_SIZE} className={base} />
    default:
      return <File size={ICON_SIZE} className={base} />
  }
}
