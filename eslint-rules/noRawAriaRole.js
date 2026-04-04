/**
 * pages/ 에서 ARIA composite widget role 직접 사용 금지.
 * ui/ 완성품 컴포넌트를 사용해야 한다.
 */

const FORBIDDEN_ROLES = new Set([
  'tab', 'tablist', 'tabpanel',
  'listbox', 'option',
  'tree', 'treeitem',
  'treegrid', 'row', 'gridcell', 'rowheader', 'columnheader',
  'grid',
  'combobox',
  'menu', 'menuitem', 'menubar', 'menuitemcheckbox', 'menuitemradio',
  'toolbar',
  'radiogroup', 'radio',
])

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow raw ARIA widget roles in pages/ — use ui/ components instead',
    },
    messages: {
      noRawRole: 'role="{{role}}" 날코딩 금지. src/interactive-os/ui/ 완성품을 사용하세요.',
    },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (
          node.name.type === 'JSXIdentifier' &&
          node.name.name === 'role' &&
          node.value?.type === 'Literal' &&
          typeof node.value.value === 'string' &&
          FORBIDDEN_ROLES.has(node.value.value)
        ) {
          context.report({
            node,
            messageId: 'noRawRole',
            data: { role: node.value.value },
          })
        }
      },
    }
  },
}
