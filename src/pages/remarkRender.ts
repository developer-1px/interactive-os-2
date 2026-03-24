import type { Plugin } from 'unified'
import type { Root, Code } from 'mdast'
import { visit } from 'unist-util-visit'

const remarkRender: Plugin<[], Root> = () => (tree) => {
  visit(tree, 'code', (node: Code, index, parent) => {
    if (node.lang === 'tsx' && node.meta === 'render' && parent && index !== undefined) {
      // Encode content as data attribute to prevent rehypeRaw from parsing JSX as HTML tags
      const encoded = btoa(node.value)
      parent.children[index] = {
        type: 'html',
        value: `<div data-render="${encoded}"></div>`,
      } as unknown as typeof parent.children[number]
    }
  })
}

export default remarkRender
