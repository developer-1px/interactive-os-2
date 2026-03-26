// Plugin 인터페이스는 engine/types.ts에 정의 — engine이 소비하는 계약
// plugins/types.ts는 re-export만
export type { Command, Middleware, VisibilityFilter, Plugin } from '../engine/types'
