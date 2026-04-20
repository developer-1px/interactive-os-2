// FinderApp — BaselineFinder + Features 조립. defineApp 실작동 증명.
//
// 이 파일 자체가 런타임에 동작하는 건 아직 아니고, defineApp의 required 검증·
// 레지스트리 투사가 되는지를 확인하는 **조립 선언**이다.

import { defineApp } from '@os/feature/defineFeature'
import { BaselineFinder } from './BaselineFinder'
import { FsFeature } from '../../features/fs/FsFeature'
import { MillerFeature } from '../../features/miller/MillerFeature'
import { BookFeature } from '../../features/book/BookFeature'

export const FinderApp = defineApp({
  baseline: BaselineFinder,
  features: [
    FsFeature,      // dataSource (required 충족)
    MillerFeature,  // viewMode: columns
    BookFeature,    // viewMode: book + scoped keymap
  ],
})
