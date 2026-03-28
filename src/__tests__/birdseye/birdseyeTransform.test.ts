import { describe, it, expect } from 'vitest'
import { buildNavStore, buildKanbanStore } from '../../pages/birdseye/birdseyeTransform'
import { createStore, getChildren, getEntityData } from '../../interactive-os/store/createStore'
import { ROOT_ID } from '../../interactive-os/store/types'
import type { NormalizedData } from '../../interactive-os/store/types'

// Fixture:
// ROOT
//   ├── src/                 (directory)
//   │   ├── pages/           (directory)
//   │   │   ├── Home.tsx     (file)
//   │   │   └── About.tsx    (file)
//   │   ├── utils/           (directory)
//   │   │   └── math.ts      (file)
//   │   └── index.ts         (file, root-level in src)
//   └── docs/                (directory)
//       ├── guide/           (directory)
//       │   └── intro.md     (file)
//       └── README.md        (file, root-level in docs)

function buildFixtureStore(): NormalizedData {
  let store = createStore()

  const add = (id: string, parentId: string, name: string, type: 'file' | 'directory') => {
    store = {
      entities: {
        ...store.entities,
        [id]: { id, data: { name, type, path: id } },
      },
      relationships: {
        ...store.relationships,
        [parentId]: [...(store.relationships[parentId] ?? []), id],
      },
    }
  }

  add('src', ROOT_ID, 'src', 'directory')
  add('docs', ROOT_ID, 'docs', 'directory')

  add('src/pages', 'src', 'pages', 'directory')
  add('src/utils', 'src', 'utils', 'directory')
  add('src/index.ts', 'src', 'index.ts', 'file')

  add('src/pages/Home.tsx', 'src/pages', 'Home.tsx', 'file')
  add('src/pages/About.tsx', 'src/pages', 'About.tsx', 'file')

  add('src/utils/math.ts', 'src/utils', 'math.ts', 'file')

  add('docs/guide', 'docs', 'guide', 'directory')
  add('docs/README.md', 'docs', 'README.md', 'file')

  add('docs/guide/intro.md', 'docs/guide', 'intro.md', 'file')

  return store
}

describe('buildNavStore', () => {
  it('재귀적 폴더 트리를 생성한다 (파일 제외, 폴더만)', () => {
    const fsStore = buildFixtureStore()
    const navStore = buildNavStore(fsStore)

    // ROOT has 2 folders
    const rootChildren = getChildren(navStore, ROOT_ID)
    expect(rootChildren).toHaveLength(2)
    expect(rootChildren).toContain('src')
    expect(rootChildren).toContain('docs')

    // src has 2 child dirs (pages, utils)
    const srcChildren = getChildren(navStore, 'src')
    expect(srcChildren).toHaveLength(2)
    expect(srcChildren).toContain('src/pages')
    expect(srcChildren).toContain('src/utils')

    // docs has 1 child dir (guide)
    const docsChildren = getChildren(navStore, 'docs')
    expect(docsChildren).toHaveLength(1)
    expect(docsChildren).toContain('docs/guide')

    // entity data
    const pagesItem = getEntityData<{ label: string; sourceId: string }>(navStore, 'src/pages')
    expect(pagesItem?.label).toBe('pages')
    expect(pagesItem?.sourceId).toBe('src/pages')
  })

  it('하위 디렉토리가 없는 폴더는 leaf 노드로 포함한다', () => {
    let store = createStore()
    store = {
      entities: {
        ...store.entities,
        assets: { id: 'assets', data: { name: 'assets', type: 'directory', path: 'assets' } },
        'assets/logo.png': { id: 'assets/logo.png', data: { name: 'logo.png', type: 'file', path: 'assets/logo.png' } },
      },
      relationships: {
        ...store.relationships,
        [ROOT_ID]: ['assets'],
        assets: ['assets/logo.png'],
      },
    }

    const navStore = buildNavStore(store)
    const rootChildren = getChildren(navStore, ROOT_ID)
    expect(rootChildren).toContain('assets')

    // leaf — no children in nav store
    const assetsChildren = getChildren(navStore, 'assets')
    expect(assetsChildren).toHaveLength(0)
  })
})

describe('buildKanbanStore', () => {
  it('선택 폴더의 하위 디렉토리를 컬럼으로, 파일을 카드로 생성한다', () => {
    const fsStore = buildFixtureStore()
    const kanbanStore = buildKanbanStore(fsStore, 'src')

    // 3 columns: pages, utils, (files)
    const columns = getChildren(kanbanStore, ROOT_ID)
    expect(columns).toHaveLength(3)
    expect(columns).toContain('col:src/pages')
    expect(columns).toContain('col:src/utils')
    expect(columns).toContain('col:__files__')

    // column entities have correct data
    const pagesCol = getEntityData<{ title: string; sourceId: string }>(kanbanStore, 'col:src/pages')
    expect(pagesCol).toEqual({ title: '1. /pages', sourceId: 'src/pages' })

    // pages column has 2 cards (Home.tsx, About.tsx)
    const pageCards = getChildren(kanbanStore, 'col:src/pages')
    expect(pageCards).toHaveLength(2)
    expect(pageCards).toContain('card:src/pages/Home.tsx')
    expect(pageCards).toContain('card:src/pages/About.tsx')

    // (files) column has 1 card (index.ts)
    const fileCards = getChildren(kanbanStore, 'col:__files__')
    expect(fileCards).toHaveLength(1)
    expect(fileCards).toContain('card:src/index.ts')
  })

  it('하위 디렉토리가 없으면 단일 (files) 컬럼만 생성한다', () => {
    const fsStore = buildFixtureStore()
    const kanbanStore = buildKanbanStore(fsStore, 'src/pages')

    const columns = getChildren(kanbanStore, ROOT_ID)
    expect(columns).toHaveLength(1)
    expect(columns).toContain('col:__files__')

    const fileCards = getChildren(kanbanStore, 'col:__files__')
    expect(fileCards).toHaveLength(2)
    expect(fileCards).toContain('card:src/pages/Home.tsx')
    expect(fileCards).toContain('card:src/pages/About.tsx')
  })

  it('카드 데이터에 원본 id와 type을 보존한다', () => {
    const fsStore = buildFixtureStore()
    const kanbanStore = buildKanbanStore(fsStore, 'src')

    const homeCard = getEntityData<{ title: string; sourceId: string; sourceType: string }>(
      kanbanStore, 'card:src/pages/Home.tsx'
    )
    expect(homeCard).toEqual({
      title: 'Home.tsx',
      sourceId: 'src/pages/Home.tsx',
      sourceType: 'file',
    })

    // utils column has math.ts
    const mathCard = getEntityData<{ title: string; sourceId: string; sourceType: string }>(
      kanbanStore, 'card:src/utils/math.ts'
    )
    expect(mathCard).toEqual({
      title: 'math.ts',
      sourceId: 'src/utils/math.ts',
      sourceType: 'file',
    })
  })

  it('docs 폴더: guide 컬럼 + (files) 컬럼을 생성한다', () => {
    const fsStore = buildFixtureStore()
    const kanbanStore = buildKanbanStore(fsStore, 'docs')

    const columns = getChildren(kanbanStore, ROOT_ID)
    expect(columns).toHaveLength(2)
    expect(columns).toContain('col:docs/guide')
    expect(columns).toContain('col:__files__')

    // guide column has intro.md
    const guideCards = getChildren(kanbanStore, 'col:docs/guide')
    expect(guideCards).toHaveLength(1)
    expect(guideCards).toContain('card:docs/guide/intro.md')

    // (files) column has README.md
    const fileCards = getChildren(kanbanStore, 'col:__files__')
    expect(fileCards).toHaveLength(1)
    expect(fileCards).toContain('card:docs/README.md')
  })
})
