import {
  Folder, FolderOpen, FileCode, FileType,
  File, Braces, Palette, Terminal, Image, Settings,
} from 'lucide-react'
import styles from '../PageViewer.module.css'

const ICON_SIZE = 12
const ICON_STROKE = 1.5

export function FileIcon({ name, type, expanded }: { name: string; type: string; expanded?: boolean }) {
  if (type === 'directory') {
    return expanded
      ? <FolderOpen size={ICON_SIZE} strokeWidth={ICON_STROKE} className={`${styles.vwIcon} ${styles.vwIconFolder}`} />
      : <Folder size={ICON_SIZE} strokeWidth={ICON_STROKE} className={`${styles.vwIcon} ${styles.vwIconFolder}`} />
  }
  const ext = name.split('.').pop()
  switch (ext) {
    case 'ts':
    case 'tsx':
      return <FileCode size={ICON_SIZE} strokeWidth={ICON_STROKE} className={`${styles.vwIcon} ${styles.vwIconTs}`} />
    case 'js':
    case 'jsx':
      return <FileCode size={ICON_SIZE} strokeWidth={ICON_STROKE} className={`${styles.vwIcon} ${styles.vwIconJs}`} />
    case 'json':
      return <Braces size={ICON_SIZE} strokeWidth={ICON_STROKE} className={`${styles.vwIcon} ${styles.vwIconJson}`} />
    case 'md':
      return <FileType size={ICON_SIZE} strokeWidth={ICON_STROKE} className={`${styles.vwIcon} ${styles.vwIconMd}`} />
    case 'css':
      return <Palette size={ICON_SIZE} strokeWidth={ICON_STROKE} className={`${styles.vwIcon} ${styles.vwIconCss}`} />
    case 'sh':
    case 'bash':
      return <Terminal size={ICON_SIZE} strokeWidth={ICON_STROKE} className={`${styles.vwIcon} ${styles.vwIconSh}`} />
    case 'png':
    case 'jpg':
    case 'svg':
    case 'gif':
      return <Image size={ICON_SIZE} strokeWidth={ICON_STROKE} className={`${styles.vwIcon} ${styles.vwIconImg}`} />
    case 'yaml':
    case 'yml':
    case 'toml':
      return <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE} className={`${styles.vwIcon} ${styles.vwIconConfig}`} />
    default:
      return <File size={ICON_SIZE} strokeWidth={ICON_STROKE} className={styles.vwIcon} />
  }
}
