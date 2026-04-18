/**
 * /chat/entities — entities/chat 의 Zod 스키마를 TreeGrid 로 출력.
 * 컬럼: Field | Type. z.object 는 children 으로 펼침.
 */
import { useMemo } from 'react'
import { TreeGrid } from '@os/ui/TreeGrid'
import { ax } from '@styles/ax'
import { buildSchemaTree } from './chatEntityTreeData'

const COLUMNS = [
  { key: 'field', header: 'Field', width: '320px' },
  { key: 'type', header: 'Type', width: '1fr' },
]

export default function PageChatEntities() {
  const data = useMemo(() => buildSchemaTree(), [])

  return (
    <div className={ax({ layout: 'stack', width: 'full' })}>
      <div className={ax({ role: 'control-group', surface: 'raised', layout: 'row', width: 'full', flex: 'none' })}>
        <div className={ax({ textStyle: 'section', flex: '1' })}>Chat Schemas</div>
        <div className={ax({ textStyle: 'caption' })}>
          @entities/chat — z.infer source
        </div>
      </div>
      <div className={ax({ layout: 'stack', width: 'full', flex: '1' })}>
        <TreeGrid
          data={data}
          columns={COLUMNS}
          header
          aria-label="Chat Zod schemas"
        />
      </div>
    </div>
  )
}
