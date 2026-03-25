import {
  Folder, FolderOpen, FileCode, FileType,
  File, Braces, Palette, Terminal, Image, Settings,
} from 'lucide-react'
import styles from './FileIcon.module.css'

const ICON_SIZE = 16

export function FileIcon({ name, type, expanded }: { name: string; type: string; expanded?: boolean }) {
  if (type === 'directory') {
    return expanded
      ? <FolderOpen size={ICON_SIZE} className={`${styles.icon} ${styles.iconFolder}`} />
      : <Folder size={ICON_SIZE} className={`${styles.icon} ${styles.iconFolder}`} />
  }
  const ext = name.split('.').pop()
  switch (ext) {
    case 'ts':
    case 'tsx':
      return <FileCode size={ICON_SIZE} className={`${styles.icon} ${styles.iconTs}`} />
    case 'js':
    case 'jsx':
      return <FileCode size={ICON_SIZE} className={`${styles.icon} ${styles.iconJs}`} />
    case 'json':
      return <Braces size={ICON_SIZE} className={`${styles.icon} ${styles.iconJson}`} />
    case 'md':
      return <FileType size={ICON_SIZE} className={`${styles.icon} ${styles.iconMd}`} />
    case 'css':
      return <Palette size={ICON_SIZE} className={`${styles.icon} ${styles.iconCss}`} />
    case 'sh':
    case 'bash':
      return <Terminal size={ICON_SIZE} className={`${styles.icon} ${styles.iconSh}`} />
    case 'png':
    case 'jpg':
    case 'svg':
    case 'gif':
      return <Image size={ICON_SIZE} className={`${styles.icon} ${styles.iconImg}`} />
    case 'yaml':
    case 'yml':
    case 'toml':
      return <Settings size={ICON_SIZE} className={`${styles.icon} ${styles.iconConfig}`} />
    default:
      return <File size={ICON_SIZE} className={styles.icon} />
  }
}
