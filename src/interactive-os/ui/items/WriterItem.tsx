// ② pages/writer 소급 마이그레이션
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import type { EditKeyContext } from '../../primitives/AriaEditable'
import { ExpandIndicator } from '../indicators'
import { Aria } from '../../primitives/aria'
import { ax, type Axes } from '@styles/ax'

type SentenceRole = 'claim' | 'evidence' | 'reasoning' | 'context' | 'counter' | 'transition'

const headingStyle = ['display', 'page', 'section', 'label', 'label', 'label'] as const

const roleLabel: Record<SentenceRole, string> = {
  claim: '주장',
  evidence: '근거',
  reasoning: '논증',
  context: '맥락',
  counter: '반론',
  transition: '전환',
}

const roleTone: Record<SentenceRole, Axes['tone']> = {
  claim: 'accent',
  evidence: 'success',
  reasoning: 'warning',
  context: 'neutral',
  counter: 'danger',
  transition: 'neutral',
}

export interface WriterItemOptions {
  editKeyDown?: (e: React.KeyboardEvent, ctx: EditKeyContext) => void
}

export function WriterItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
  options?: WriterItemOptions,
): React.ReactElement {
  const data = node.data as Record<string, unknown> | undefined
  const content = (data?.content as string) ?? ''
  const type = data?.type as string
  const level = data?.level as number | undefined
  const hasChildren = state.expanded !== undefined
  const depth = (state.level ?? 1) - 1
  const depthStyle = { paddingLeft: `calc(${depth} * var(--space-md) + var(--space-xs))` }
  const surface = state.selected ? 'action' as const : undefined

  if (type === 'document') {
    return (
      <div {...props} className={ax({ role: 'item', interactive: 'item', surface, layout: 'row', width: 'full' })} style={depthStyle}>
        <ExpandIndicator expanded={state.expanded} hasChildren={hasChildren} />
        <span className={ax({ text: 'muted' })}>{data?.path as string || 'Untitled'}</span>
      </div>
    )
  }

  if (type === 'heading' && level) {
    const marginCls = level === 1 ? 'writer-heading-l1' : 'writer-heading'
    return (
      <div {...props} className={`${ax({ role: 'item', interactive: 'item', surface, layout: 'row', width: 'full' })} ${marginCls}`} style={depthStyle}>
        <ExpandIndicator expanded={state.expanded} hasChildren={hasChildren} />
        <Aria.Editable field="content" selection="end" editKeyDown={options?.editKeyDown}><span className={ax({ textStyle: headingStyle[level - 1], text: state.focused ? 'primary' : 'secondary' })}>{content}</span></Aria.Editable>
      </div>
    )
  }

  if (type === 'paragraph') {
    const marginCls = 'writer-paragraph'
    return (
      <div {...props} className={`${ax({ role: 'item', interactive: 'item', surface, layout: 'row', width: 'full' })} ${marginCls}`} style={depthStyle}>
        <ExpandIndicator expanded={state.expanded} hasChildren={hasChildren} />
        <span className={ax({ text: 'muted' })}>¶{state.index + 1}</span>
      </div>
    )
  }

  if (type === 'list') {
    return (
      <div {...props} className={ax({ role: 'item', interactive: 'item', surface, layout: 'row', width: 'full' })} style={depthStyle}>
        <ExpandIndicator expanded={state.expanded} hasChildren={hasChildren} />
        <span className={ax({ text: 'muted' })}>{(data?.ordered as boolean) ? 'ol' : 'ul'}</span>
      </div>
    )
  }

  if (type === 'listItem') {
    return (
      <div {...props} className={ax({ role: 'item', interactive: 'item', surface, layout: 'row', width: 'full' })} style={depthStyle}>
        <ExpandIndicator hasChildren={false} />
        <span className={ax({ text: 'muted' })}>{state.index + 1}</span>
        <Aria.Editable field="content" selection="end" editKeyDown={options?.editKeyDown}><span className={ax({ text: state.focused ? 'primary' : 'secondary' })}>{content}</span></Aria.Editable>
      </div>
    )
  }

  if (type === 'hr') {
    return <div {...props} className={`${ax({ role: 'item', interactive: 'item', surface, layout: 'row', width: 'full' })} writer-hr`} style={depthStyle} />
  }

  // sentence (default)
  const role = data?.role as SentenceRole | undefined
  return (
    <div {...props} className={ax({ role: 'item', interactive: 'item', surface, layout: 'row', width: 'full' })} style={depthStyle}>
      <ExpandIndicator hasChildren={false} />
      <span className={ax({ text: 'muted' })}>{state.index + 1}</span>
      <Aria.Editable field="content" selection="end" editKeyDown={options?.editKeyDown}><span className={ax({ text: state.focused ? 'primary' : 'secondary' })}>{content}</span></Aria.Editable>
      {role && (
        <span className={`${ax({ tone: roleTone[role] })} ml-auto`}>
          {roleLabel[role]}
        </span>
      )}
    </div>
  )
}
