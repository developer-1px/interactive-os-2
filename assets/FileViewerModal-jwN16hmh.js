var e=`/** @catalog 파일 뷰어 모달 */
import { useRef, useState, useEffect, useMemo } from 'react'
import { FilePreview } from './FilePreview'
import { FileIcon } from './FileIcon'
import { Breadcrumb } from './Breadcrumb'
import { PanelHeader } from './PanelHeader'
import { getFileSource } from './fileRenderers'
import { ax } from '@styles/ax'
import './FileViewerModal.css'

interface FileViewerModalProps {
  filePath: string | null
  editRanges?: string[]
  highlightLines?: Set<number>
  root?: string
  onClose: () => void
}

const DEFAULT_ROOT = '/Users/user/Desktop/aria'

export function FileViewerModal({ filePath, editRanges, highlightLines: highlightLinesProp, root = DEFAULT_ROOT, onClose }: FileViewerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [fileContent, setFileContent] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (filePath) {
      dialogRef.current?.showModal()
      fetch(\`/api/fs/file?path=\${encodeURIComponent(filePath)}\`)
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
    const contentLines = fileContent.split('\\n')
    for (const editNew of editRanges) {
      const editLines = editNew.split('\\n')
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
  const isUrl = filePath ? getFileSource(filePath) === 'url' : false
  const lineCount = fileContent ? fileContent.split('\\n').length : 0

  return (
    <dialog ref={dialogRef} className="border-none bg-transparent fvm-dialog" onClick={handleBackdropClick}>
      <div className={\`fvm-modal \${ax({ surface: 'trap', layout: 'stack', shape: 'xl', scroll: 'hidden' })}\`} onClick={e => e.stopPropagation()}>
        <PanelHeader axes={{ layout: 'spread' }}>
          {filePath && <Breadcrumb path={filePath} root={root} />}
          <div className={ax({ layout: 'bar', gap: 'sm' })}>
            {filePath && (
              <div className={ax({ layout: 'bar', gap: 'xs', textStyle: 'caption', text: 'muted' })}>
                <FileIcon name={filename} type="file" />
                <span>{ext.toUpperCase()}</span>
                {!isUrl && lineCount > 0 && (
                  <>
                    <span className="fvm-meta-sep" />
                    <span>{lineCount} lines</span>
                  </>
                )}
                {mergedHighlightLines.size > 0 && (
                  <>
                    <span className="fvm-meta-sep" />
                    <span className={ax({ tone: 'warning', weight: 'semi' })}>{mergedHighlightLines.size} lines highlighted</span>
                  </>
                )}
              </div>
            )}
            <button className={\`\${ax({ role: 'control', surface: 'ghost', content: 'icon', text: 'secondary' })}\`} onClick={onClose}>&times;</button>
          </div>
        </PanelHeader>
        <div className={ax({ flex: '1', layout: 'scroll' })}>
          {error ? (
            <div className={ax({ tone: 'danger', padding: 'md' })}>File not found</div>
          ) : (
            <FilePreview
              content={fileContent}
              filename={filename}
              src={\`/api/fs/file?path=\${encodeURIComponent(filePath!)}\`}
              highlightLines={mergedHighlightLines.size > 0 ? mergedHighlightLines : undefined}
            />
          )}
        </div>
      </div>
    </dialog>
  )
}
`;export{e as default};