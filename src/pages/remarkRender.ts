import type { Plugin } from 'unified'
import type { Root, Code } from 'mdast'
import { visit } from 'unist-util-visit'

const remarkRender: Plugin<[], Root> = () => (tree) => {
  visit(tree, 'code', (node: Code, index, parent) => {
    if (node.lang === 'tsx' && node.meta === 'render' && parent && index !== undefined) {
      parent.children[index] = {
        type: 'html',
        value: `<div data-render>${node.value}</div>`,
      } as any
    }
  })
}

export default remarkRender
