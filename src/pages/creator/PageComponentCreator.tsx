// ② 2026-03-27-component-creator-prd.md

import { useState, useMemo, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { SplitPane } from '../../interactive-os/ui/SplitPane'
import { componentRegistry, type RegistryEntry } from './componentRegistry'
import { ComponentCanvas } from './ComponentCanvas'
import { ComponentChat } from './ComponentChat'
import styles from './PageComponentCreator.module.css'

export default function PageComponentCreator() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  // Extract component name from URL: /creator/Button → "Button"
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

  const [splitSizes, setSplitSizes] = useState([0.65, 0.35])

  return (
    <div className={`flex-col ${styles.page}`}>
      {/* Body: Canvas + Chat */}
      <div className={`flex-row ${styles.body}`}>
        <SplitPane direction="horizontal" sizes={splitSizes} onResize={setSplitSizes}>
          {/* Left: Canvas */}
          {selectedEntry ? (
            <ComponentCanvas entry={selectedEntry} />
          ) : (
            <div className={`flex-row items-center justify-center ${styles.canvasEmpty}`}>
              컴포넌트를 선택하세요
            </div>
          )}

          {/* Right: Chat */}
          <ComponentChat entry={selectedEntry ?? null} />
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
