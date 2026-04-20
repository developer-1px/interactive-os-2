import { describe, expect, it } from 'vitest'
import { defineApp } from '../defineFeature'
import { buildRegistry, resolveActiveKeymap } from '../featureRegistry'
import { BaselineFinder } from '../../../baselines/finder/BaselineFinder'
import { FinderApp } from '../../../baselines/finder/FinderApp'
import { MillerFeature } from '../../../features/miller/MillerFeature'
import { BookFeature } from '../../../features/book/BookFeature'

describe('defineApp required check', () => {
  it('dataSource 누락 시 throw', () => {
    expect(() =>
      defineApp({ baseline: BaselineFinder, features: [MillerFeature, BookFeature] })
    ).toThrow(/requires at least one "dataSource"/)
  })

  it('dataSource 1개 이상이면 통과 (FinderApp)', () => {
    expect(FinderApp.baseline.id).toBe('finder')
    expect(FinderApp.features).toHaveLength(3)
  })
})

describe('buildRegistry', () => {
  it('FinderApp에서 viewMode 2개 등록(columns + book)', () => {
    const reg = buildRegistry(FinderApp)
    expect(reg.viewModes.map(v => v.id).sort()).toEqual(['book', 'columns'])
    expect(reg.dataSources).toHaveLength(1)
    expect(reg.dataSources[0].id).toBe('fs')
  })

  it('keymap priority desc 정렬', () => {
    const reg = buildRegistry(FinderApp)
    expect(reg.keymaps[0].priority).toBe(10) // Book keymap
  })
})

describe('resolveActiveKeymap', () => {
  it('book 모드일 때 ←/→가 book 명령으로 매핑', () => {
    const reg = buildRegistry(FinderApp)
    const km = resolveActiveKeymap(reg, { viewMode: 'book' })
    expect(km.ArrowLeft).toBe('book:turnPagePrev')
    expect(km.ArrowRight).toBe('book:turnPageNext')
  })

  it('list 모드일 때 book keymap 비활성 (scope false)', () => {
    const reg = buildRegistry(FinderApp)
    const km = resolveActiveKeymap(reg, { viewMode: 'list' })
    expect(km.ArrowLeft).toBeUndefined()
    expect(km.ArrowRight).toBeUndefined()
  })
})
