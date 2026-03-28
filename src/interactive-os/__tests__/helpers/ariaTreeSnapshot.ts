const ARIA_STATE_ATTRS = [
  'aria-selected', 'aria-expanded', 'aria-checked', 'aria-disabled',
  'aria-pressed', 'aria-level', 'aria-activedescendant', 'aria-current',
  'aria-modal', 'aria-multiselectable', 'aria-orientation',
  'aria-valuemin', 'aria-valuemax', 'aria-valuenow', 'aria-valuetext',
  'aria-posinset', 'aria-setsize',
] as const

const IMPLICIT_ROLES: Record<string, string> = {
  button: 'button', a: 'link', input: 'textbox', select: 'combobox',
  textarea: 'textbox', nav: 'navigation', main: 'main', header: 'banner',
  footer: 'contentinfo', aside: 'complementary', ul: 'list', ol: 'list',
  li: 'listitem', table: 'table', tr: 'row', td: 'cell', th: 'columnheader',
  h1: 'heading', h2: 'heading', h3: 'heading', dialog: 'dialog',
}

function implicitRole(el: Element): string | null {
  return IMPLICIT_ROLES[el.tagName.toLowerCase()] ?? null
}

function serializeAriaNode(el: Element, depth: number, activeEl: Element | null): string {
  const indent = '  '.repeat(depth)
  const role = el.getAttribute('role') || implicitRole(el)
  if (!role) return ''

  const name = el.getAttribute('aria-label')
    || (el.children.length === 0 ? el.textContent?.trim().slice(0, 50) : null)
    || ''

  const attrs: string[] = []
  for (const attr of ARIA_STATE_ATTRS) {
    const val = el.getAttribute(attr)
    if (val !== null) {
      const shortName = attr.replace('aria-', '')
      attrs.push(val === 'true' ? shortName : `${shortName}=${val}`)
    }
  }

  if (el === activeEl) attrs.push('focused')

  const tabIdx = el.getAttribute('tabindex')
  if (tabIdx === '0') attrs.push('tabindex=0')
  if (tabIdx === '-1') attrs.push('tabindex=-1')

  const attrStr = attrs.length > 0 ? ` [${attrs.join(', ')}]` : ''
  const nameStr = name ? ` "${name}"` : ''
  const line = `${indent}${role}${nameStr}${attrStr}`

  const childLines: string[] = []
  for (const child of el.children) {
    const childRole = child.getAttribute('role') || implicitRole(child)
    if (childRole) {
      const serialized = serializeAriaNode(child, depth + 1, activeEl)
      if (serialized) childLines.push(serialized)
    } else {
      for (const grandchild of child.children) {
        const serialized = serializeAriaNode(grandchild, depth + 1, activeEl)
        if (serialized) childLines.push(serialized)
      }
    }
  }

  return childLines.length > 0
    ? `${line}\n${childLines.join('\n')}`
    : line
}

/**
 * Captures the aria tree of the first role container in the given element.
 * Returns a human-readable, diffable string.
 */
export function captureAriaTree(container: HTMLElement): string {
  const roleContainer = container.querySelector('[role]')
  if (!roleContainer) return '(no role container found)'
  return serializeAriaNode(roleContainer, 0, container.ownerDocument.activeElement)
}

/**
 * Extracts only the role hierarchy (no attributes, names, or states).
 * Useful for structural comparison.
 */
export function extractRoleHierarchy(container: HTMLElement): string {
  const tree = captureAriaTree(container)
  return tree
    .split('\n')
    .map(line => {
      const indent = line.match(/^(\s*)/)?.[1] ?? ''
      const role = line.trim().split(/[\s"[]/)[0]
      return `${indent}${role}`
    })
    .join('\n')
}
