// ② 2026-03-27-component-creator-prd.md

import { useState, useMemo, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { SplitPane } from '../../interactive-os/ui/SplitPane'
import { componentRegistry, type RegistryEntry } from './componentRegistry'
import { ComponentCanvas } from './ComponentCanvas'
import { ComponentChat } from './ComponentChat'
import { SourceViewer } from './SourceViewer'
import styles from './PageComponentCreator.module.css'

type SourceTab = 'tsx' | 'css'

export default function PageComponentCreator() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const selectedName = useMemo(() => {
    const segment = pathname.replace(/^\/creator\/?/, '').split('/')[0]
    return componentRegistry.find((e) => e.name === segment)?.name ?? componentRegistry[0]?.name ?? ''
  }, [pathname])

  const selectedEntry: RegistryEntry | undefined = useMemo(
    () => componentRegistry.find((e) => e.name === selectedName),
    [selectedName],
  )

  const handleSelectComponent = useCallback(
    (name: string) => navigate(`/creator/${name}`),
    [navigate],
  )

  // Split states
  const [mainSplit, setMainSplit] = useState([0.5, 0.5])     // Canvas | Right
  const [rightSplit, setRightSplit] = useState([0.65, 0.35])  // Code | Chat
  const [sourceTab, setSourceTab] = useState<SourceTab>('tsx')

  return (
    <div className={`flex-col ${styles.page}`}>
      {/* Body: Canvas | (Code / Chat) */}
      <div className={`flex-row ${styles.body}`}>
        <SplitPane direction="horizontal" sizes={mainSplit} onResize={setMainSplit}>
          {/* ── Primary pane: Canvas (항상 보임) ── */}
          <div className={`flex-col ${styles.canvasPane}`}>
            <div className={`flex-row items-center ${styles.paneHeader}`}>
              <span className={styles.paneTitle}>{selectedName || 'Select'}</span>
              {selectedEntry && (
                <span className={styles.paneMeta}>
                  {selectedEntry.variants.length} variants · {selectedEntry.sizes.length} sizes
                  {selectedEntry.tokens.shape && ` · shape:${selectedEntry.tokens.shape}`}
                </span>
              )}
            </div>
            {selectedEntry ? (
              <ComponentCanvas entry={selectedEntry} />
            ) : (
              <div className={`flex-row items-center justify-center flex-1 ${styles.emptyState}`}>
                컴포넌트를 선택하세요
              </div>
            )}
          </div>

          {/* ── Right: Code | Chat (가로 split) ── */}
          <div className={`flex-col ${styles.rightPane}`}>
            <SplitPane direction="horizontal" sizes={rightSplit} onResize={setRightSplit}>
              {/* Secondary pane: Source code [TSX | CSS] 탭 */}
              <div className={`flex-col ${styles.codePane}`}>
                <div className={`flex-row items-center ${styles.paneHeader}`}>
                  <button
                    data-surface="action"
                    className={`${styles.sourceTab}${sourceTab === 'tsx' ? ` ${styles.sourceTabActive}` : ''}`}
                    onClick={() => setSourceTab('tsx')}
                  >
                    TSX
                  </button>
                  <button
                    data-surface="action"
                    className={`${styles.sourceTab}${sourceTab === 'css' ? ` ${styles.sourceTabActive}` : ''}`}
                    onClick={() => setSourceTab('css')}
                  >
                    CSS
                  </button>
                </div>
                <div className={`flex-1 overflow-auto ${styles.codeContent}`}>
                  {selectedEntry ? (
                    <SourceViewer entry={selectedEntry} activeTab={sourceTab} />
                  ) : (
                    <div className={`flex-row items-center justify-center flex-1 ${styles.emptyState}`}>
                      컴포넌트를 선택하세요
                    </div>
                  )}
                </div>
              </div>

              {/* Tertiary pane: Chat (항상 보임) */}
              <ComponentChat entry={selectedEntry ?? null} />
            </SplitPane>
          </div>
        </SplitPane>
      </div>

      {/* Nav bar: Component tabs */}
      <div className={`flex-row shrink-0 items-center ${styles.navBar}`}>
        {componentRegistry.map((entry) => (
          <button
            key={entry.name}
            data-surface="action"
            className={`${styles.navTab}${entry.name === selectedName ? ` ${styles.navTabActive}` : ''}`}
            onClick={() => handleSelectComponent(entry.name)}
          >
            {entry.name}
          </button>
        ))}
      </div>
    </div>
  )
}
