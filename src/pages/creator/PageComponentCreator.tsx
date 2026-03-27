// ② 2026-03-27-component-creator-prd.md

import { useState, useMemo, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { SplitPane } from '../../interactive-os/ui/SplitPane'
import { componentRegistry, type RegistryEntry } from './componentRegistry'
import { ComponentCanvas } from './ComponentCanvas'
import { ComponentChat } from './ComponentChat'
import { SourceViewer } from './SourceViewer'
import styles from './PageComponentCreator.module.css'

type RightTab = 'preview' | 'tsx' | 'css' | 'chat'

const RIGHT_TABS: { id: RightTab; label: string }[] = [
  { id: 'preview', label: 'Preview' },
  { id: 'tsx', label: 'TSX' },
  { id: 'css', label: 'CSS' },
  { id: 'chat', label: 'Chat' },
]

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

  const [splitSizes, setSplitSizes] = useState([0.5, 0.5])
  const [rightTab, setRightTab] = useState<RightTab>('preview')

  return (
    <div className={`flex-col ${styles.page}`}>
      {/* Body: Canvas | Right Panel */}
      <div className={`flex-row ${styles.body}`}>
        <SplitPane direction="horizontal" sizes={splitSizes} onResize={setSplitSizes}>
          {/* Left: Canvas — always shows component */}
          <div className={`flex-col ${styles.canvasPane}`}>
            <div className={styles.canvasPaneHeader}>
              <span className={styles.canvasPaneTitle}>{selectedName || 'Select'}</span>
              {selectedEntry && (
                <span className={styles.canvasPaneMeta}>
                  {selectedEntry.variants.length} variants · {selectedEntry.sizes.length} sizes
                  {selectedEntry.tokens.shape && ` · shape:${selectedEntry.tokens.shape}`}
                </span>
              )}
            </div>
            {selectedEntry ? (
              <ComponentCanvas entry={selectedEntry} />
            ) : (
              <div className={`flex-row items-center justify-center flex-1 ${styles.canvasEmpty}`}>
                컴포넌트를 선택하세요
              </div>
            )}
          </div>

          {/* Right: Tabbed panel — Preview/TSX/CSS/Chat */}
          <div className={`flex-col ${styles.rightPane}`}>
            {/* Tab bar */}
            <div className={`flex-row shrink-0 items-center ${styles.rightTabBar}`}>
              {RIGHT_TABS.map((tab) => (
                <button
                  key={tab.id}
                  data-surface="action"
                  className={`${styles.rightTab}${rightTab === tab.id ? ` ${styles.rightTabActive}` : ''}`}
                  onClick={() => setRightTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className={`flex-col flex-1 min-w-0 ${styles.rightContent}`}>
              {rightTab === 'preview' && selectedEntry && (
                <ComponentCanvas entry={selectedEntry} />
              )}
              {rightTab === 'tsx' && selectedEntry && (
                <SourceViewer entry={selectedEntry} activeTab="tsx" />
              )}
              {rightTab === 'css' && selectedEntry && (
                <SourceViewer entry={selectedEntry} activeTab="css" />
              )}
              {rightTab === 'chat' && (
                <ComponentChat entry={selectedEntry ?? null} />
              )}
              {!selectedEntry && (
                <div className={`flex-row items-center justify-center flex-1 ${styles.canvasEmpty}`}>
                  컴포넌트를 선택하세요
                </div>
              )}
            </div>
          </div>
        </SplitPane>
      </div>

      {/* Bottom: Component tabs */}
      <div className={`flex-row shrink-0 items-center ${styles.tabs}`}>
        {componentRegistry.map((entry) => (
          <button
            key={entry.name}
            data-surface="action"
            className={`${styles.tab}${entry.name === selectedName ? ` ${styles.tabActive}` : ''}`}
            onClick={() => handleSelectComponent(entry.name)}
          >
            {entry.name}
          </button>
        ))}
      </div>
    </div>
  )
}
