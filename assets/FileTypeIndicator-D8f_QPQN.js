var e=`import { Folder, FileText, File, Image, FileCode, FileJson } from 'lucide-react'

const EXT_MAP: Record<string, typeof File> = {
  md: FileText,
  txt: FileText,
  json: FileJson,
  ts: FileCode,
  tsx: FileCode,
  js: FileCode,
  jsx: FileCode,
  css: FileCode,
  png: Image,
  jpg: Image,
  jpeg: Image,
  svg: Image,
  gif: Image,
}

interface FileTypeIndicatorProps {
  name: string
  isFolder: boolean
  className?: string
}

export function FileTypeIndicator({ name, isFolder, className }: FileTypeIndicatorProps) {
  if (isFolder) {
    return <Folder size="1em" className={className} />
  }
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const Icon = EXT_MAP[ext] ?? File
  return <Icon size="1em" className={className} />
}
`;export{e as default};