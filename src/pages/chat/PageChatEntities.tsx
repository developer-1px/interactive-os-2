/**
 * /chat/entities — entities/chat fixtures 를 TreeView 로 출력하는 디버그 화면.
 * cmux 식 SessionCard 구현 전에 데이터 모양을 시각 확인하기 위함.
 */
import { useMemo } from 'react'
import { TreeView } from '@os/ui/TreeView'
import { ax } from '@styles/ax'
import { buildChatEntityTree } from './chatEntityTreeData'

export default function PageChatEntities() {
  const data = useMemo(() => buildChatEntityTree(), [])

  return (
    <div className={ax({ layout: 'stack', width: 'full' })}>
      <div className={ax({ role: 'control-group', surface: 'raised', layout: 'row', width: 'full', flex: 'none' })}>
        <div className={ax({ textStyle: 'section', flex: '1' })}>Chat Entities</div>
        <div className={ax({ textStyle: 'caption' })}>fixtures · @entities/chat</div>
      </div>
      <div className={ax({ layout: 'stack', width: 'full', flex: '1' })}>
        <TreeView data={data} aria-label="Chat entity tree" />
      </div>
    </div>
  )
}
