// ⑦ /do UI — FlatLayout widgets for /ax-principles route
import { useCallback, useMemo } from 'react'
import type React from 'react'
import { ax } from '@styles/ax'
import { createStore, ROOT_ID } from '@os/schema'
import type { NormalizedData } from '@os/store/types'
import type { NodeState } from '@os/pattern/types'
import { ListBox } from '@os/ui/ListBox'
import { EmptyState } from '@os/ui/EmptyState'
import { PanelHeader } from '@os/ui/PanelHeader'
import { StatusIndicator } from '@os/ui/indicators/StatusIndicator'
import { useAxPrinciples } from './axPrinciplesContext'
import { PrincipleDetail } from './PrincipleDetail'
import { AxPrinciplesFilterBar } from './AxPrinciplesFilterBar'
import { axPrinciplesCommands } from './axPrinciplesStore'
import {
  selectFilteredPrinciples,
  selectSelectedPrinciple,
} from './axPrinciplesState'
import type { Principle, PrincipleStatus } from './axPrincipleSchema'

// ── Tone mapper ──

function statusIndicatorTone(s: PrincipleStatus): 'success' | 'warning' | 'error' | 'info' {
  switch (s) {
    case 'Locked': return 'success'
    case 'Exposed': return 'warning'
    case 'Missing': return 'error'
    case 'Conflicts': return 'error'
    case 'N/A': return 'info'
  }
}

// ── AxPrinciplesHeader ──────────────────────────────────

export function AxPrinciplesHeader() {
  const { engine, store } = useAxPrinciples()
  const count = selectFilteredPrinciples(store).length

  return (
    <div className={ax({ layout: 'spread', padding: 'sm', width: 'full', gap: 'sm' })}>
      <div className={ax({ layout: 'bar', gap: 'sm' })}>
        <span className={ax({ textStyle: 'page', text: 'primary' })}>ax Metaprinciples</span>
        <span className={ax({ textStyle: 'caption', text: 'muted' })}>
          {count} principles
        </span>
      </div>
      <AxPrinciplesFilterBar engine={engine} store={store} />
    </div>
  )
}

// ── AxPrinciplesMaster ───────────────────────────────────

function buildListData(principles: Principle[]): NormalizedData {
  const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
  const ids: string[] = []
  for (const p of principles) {
    entities[p.id] = {
      id: p.id,
      data: {
        label: `${p.id} · ${p.name}`,
        _principle: p,
      },
    }
    ids.push(p.id)
  }
  return createStore({ entities, relationships: { [ROOT_ID]: ids } })
}

export function AxPrinciplesMaster() {
  const { engine, store } = useAxPrinciples()

  const filtered = useMemo(() => selectFilteredPrinciples(store), [store])
  const listData = useMemo(() => buildListData(filtered), [filtered])

  const handleActivate = useCallback(
    (id: string) => {
      engine.dispatch(axPrinciplesCommands.select(id))
    },
    [engine],
  )

  const handleFocusChange = useCallback(
    (id: string | null) => {
      if (id) engine.dispatch(axPrinciplesCommands.select(id))
    },
    [engine],
  )

  const renderItem = useCallback(
    (
      props: React.HTMLAttributes<HTMLElement>,
      node: Record<string, unknown>,
      state: NodeState,
    ): React.ReactElement => {
      const principle = (node.data as { _principle?: Principle } | undefined)?._principle
      if (!principle) {
        return (
          <div
            {...props}
            className={ax({
              role: 'item',
              interactive: 'item',
              content: 'text',
              layout: 'row',
              width: 'full',
            })}
            data-focused={state.focused || undefined}
            data-selected={state.selected || undefined}
          >
            {String(node.label ?? '')}
          </div>
        )
      }
      return (
        <div
          {...props}
          className={ax({
            role: 'item',
            interactive: 'item',
            content: 'text',
            layout: 'row',
            width: 'full',
            padding: 'sm',
            gap: 'sm',
          })}
          data-focused={state.focused || undefined}
          data-selected={state.selected || undefined}
        >
          <StatusIndicator tone={statusIndicatorTone(principle.status)} />
          <div className={ax({ layout: 'stack', gap: 'xs', flex: '1' })}>
            <span
              className={`${ax({ textStyle: 'label', clamp: '1' })} ${ax.raw({ text: state.focused ? 'primary' : 'secondary' })}`}
            >
              {principle.id} · {principle.name}
            </span>
            <span className={ax({ textStyle: 'caption', text: 'muted', clamp: '2' })}>
              {principle.summary}
            </span>
          </div>
          {principle.priority && (
            <span
              className={ax({
                role: 'badge',
                surface: 'ghost',
                border: 'default',
                text: 'muted',
                textStyle: 'caption',
                content: 'text',
                clamp: '1',
                shape: 'pill',
                flex: 'none',
              })}
            >
              {principle.priority}
            </span>
          )}
        </div>
      )
    },
    [],
  )

  return (
    <div className={ax({ layout: 'fill' })}>
      <PanelHeader>
        <span>Principles</span>
      </PanelHeader>
      <div className={ax({ layout: 'scroll' })}>
        {filtered.length === 0 ? (
          <EmptyState
            title="결과 없음"
            description="필터 조건에 맞는 원리가 없습니다."
          />
        ) : (
          <ListBox
            data={listData}
            aria-label="ax Principles"
            onActivate={handleActivate}
            onFocusChange={handleFocusChange}
            renderItem={renderItem}
            autoFocus
          />
        )}
      </div>
    </div>
  )
}

// ── AxPrinciplesDetail ───────────────────────────────────

export function AxPrinciplesDetail() {
  const { store } = useAxPrinciples()
  const principle = selectSelectedPrinciple(store)

  if (!principle) {
    return (
      <div className={ax({ layout: 'fill', padding: 'lg' })}>
        <EmptyState
          title="원리를 선택하세요"
          description="왼쪽 목록에서 항목을 클릭하거나 방향키로 포커스하면 상세가 표시됩니다."
        />
      </div>
    )
  }

  return <PrincipleDetail principle={principle} store={store} />
}
