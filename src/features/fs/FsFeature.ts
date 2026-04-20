// FsFeature — 실제 파일시스템을 깡통 Finder의 데이터 소스로 꽂는다.
//
// 수동 분리 검증: 기존 pages/finder/fsClient.ts + treeTransform.ts 의 dataSource 역할만
// defineFeature로 재포장. UI·상태·라우팅은 깡통 또는 다른 Feature의 몫.

import { Folder } from 'lucide-react'
import { createElement } from 'react'
import { defineFeature } from '@os/feature/defineFeature'
import { fetchTree } from '../../pages/finder/fsClient'
import { treeToStore } from '../../pages/finder/treeTransform'
import { DEFAULT_ROOT } from '../../pages/finder/types'

export const FsFeature = defineFeature({
  id: 'fs',
  name: 'File System',
  version: '0.1.0',
  description: '로컬 파일시스템을 TreeView 데이터로 제공',

  dataSource: {
    id: 'fs',
    label: 'Files',
    icon: createElement(Folder, { size: 14 }),
    load: async ({ rootPath, signal: _signal }) => {
      const root = rootPath ?? DEFAULT_ROOT
      const tree = await fetchTree(root)
      return treeToStore(tree)
    },
  },
})
