import { useRef, useState, useEffect, useMemo } from 'react'
import { CodeBlock } from './CodeBlock'
import { MarkdownViewer } from '../../pages/viewer/MarkdownViewer'
import { FileIcon } from './FileIcon'
import { Breadcrumb } from './Breadcrumb'
import styles from './FileViewerModal.module.css'

interface FileViewerModalProps {
  filePath: string | null
  editRanges?: string[]
  highlightLines?: Set<number>
  root?: string
  onClose: () => void
}

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp'])

const DEFAULT_ROOT = '/Users/user/Desktop/aria'

export function FileViewerModal({ filePath, editRanges, highlightLines: highlightLinesProp, root = DEFAULT_ROOT, onClose }: FileViewerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [fileContent, setFileContent] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (filePath) {
      dialogRef.current?.showModal()
      fetch(`/api/fs/file?path=${encodeURIComponent(filePath)}`)
        .then(res => { if (!res.ok) throw new Error(); return res.text() })
        .then(text => { setFileContent(text); setError(false) })
        .catch(() => { setFileContent(''); setError(true) })
    } else {
      dialogRef.current?.close()
    }
  }, [filePath])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handler = () => onClose()
    dialog.addEventListener('close', handler)
    return () => dialog.removeEventListener('close', handler)
  }, [onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.defaultPrevented) return
    if (e.target === dialogRef.current) onClose()
  }

  const editedLines = useMemo<Set<number>>(() => {
    const lines = new Set<number>()
    if (!fileContent || !editRanges?.length) return lines
    const contentLines = fileContent.split('\n')
    for (const editNew of editRanges) {
      const editLines = editNew.split('\n')
      for (let i = 0; i <= contentLines.length - editLines.length; i++) {
        let match = true
        for (let j = 0; j < editLines.length; j++) {
          if (contentLines[i + j].trim() !== editLines[j].trim()) { match = false; break }
        }
        if (match) {
          for (let j = 0; j < editLines.length; j++) lines.add(i + j + 1)
          break
        }
      }
    }
    return lines
  }, [fileContent, editRanges])

  const mergedHighlightLines = useMemo<Set<number>>(() => {
    if (!highlightLinesProp && editedLines.size === 0) return new Set()
    const merged = new Set(editedLines)
    if (highlightLinesProp) for (const l of highlightLinesProp) merged.add(l)
    return merged
  }, [editedLines, highlightLinesProp])

  const filename = filePath?.split('/').pop() ?? ''
  const ext = filename.includes('.') ? filename.split('.').pop()!.toLowerCase() : ''
  const isMarkdown = ext === 'md'
  const isImage = IMAGE_EXTS.has(ext)
  const lineCount = fileContent ? fileContent.split('\n').length : 0

  return (
    <dialog ref={dialogRef} className={styles.fvmDialog} onClick={handleBackdropClick}>
      <div className={styles.fvmModal} onClick={e => e.stopPropagation()}>
        <div className={styles.fvmHeader}>
          {filePath && <Breadcrumb path={filePath} root={root} />}
          <div className={styles.fvmHeaderRight}>
            {filePath && (
              <div className={styles.fvmMeta}>
                <FileIcon name={filename} type="file" />
                <span>{ext.toUpperCase()}</span>
                {!isImage && lineCount > 0 && (
                  <>
                    <span className={styles.fvmMetaSep} />
                    <span>{lineCount} lines</span>
                  </>
                )}
                {mergedHighlightLines.size > 0 && (
                  <>
                    <span className={styles.fvmMetaSep} />
                    <span className={styles.fvmEditBadge}>{mergedHighlightLines.size} lines highlighted</span>
                  </>
                )}
              </div>
            )}
            <button className={styles.fvmClose} onClick={onClose}>&times;</button>
          </div>
        </div>
        <div className={styles.fvmBody}>
          {error ? (
            <div className={styles.fvmError}>File not found</div>
          ) : isImage ? (
            <img src={`/api/fs/file?path=${encodeURIComponent(filePath!)}`} alt={filename} className={styles.fvmImage} />
          ) : isMarkdown ? (
            <MarkdownViewer content={fileContent} />
          ) : (
            <CodeBlock code={fileContent} filename={filename}
              highlightLines={mergedHighlightLines.size > 0 ? mergedHighlightLines : undefined} />
          )}
        </div>
      </div>
    </dialog>
  )
}
