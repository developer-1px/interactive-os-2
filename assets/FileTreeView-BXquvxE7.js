var e=`/** @catalog 파일 시스템 트리 뷰 */
import type { AriaComponentProps } from './types'
import type { Plugin } from '../plugins/types'
import { TreeView } from './TreeView'
import { FileTreeItem } from './items'

const emptyPlugins: Plugin[] = []

interface FileTreeViewProps extends AriaComponentProps {
  activateOnClick?: boolean
}

/**
 * TreeView specialized for file/directory nodes.
 * Uses FileTreeItem (with FileIcon + depth indentation) as default item.
 */
export function FileTreeView({
  data,
  plugins = emptyPlugins,
  onChange,
  onActivate,
  onFocusChange,
  activateOnClick,
  'aria-label': ariaLabel,
}: FileTreeViewProps) {
  return (
    <TreeView
      data={data}
      plugins={plugins}
      onChange={onChange}
      onActivate={onActivate}
      onFocusChange={onFocusChange}
      renderItem={FileTreeItem}
      activateOnClick={activateOnClick}
      aria-label={ariaLabel}
    />
  )
}
`;export{e as default};