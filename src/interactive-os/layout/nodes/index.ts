// 모든 LayoutNode 타입의 render + policy 등록 허브. import 1회로 전체 초기화.
// 새 노드 타입 추가 = 이 폴더에 파일 하나 + 아래 import 1줄 + REGISTERED_TYPES 갱신.

import './split'
import './stack'
import './bar'
import './grid'
import './overlay'
import './nav'
import './tabgroup'
import './tab'
import './section'
import './floating'
import './widget'
import './state'

import type { LayoutNode } from '../flatLayout'

// 타입 커버리지 체크 — LayoutNode union에 이 리스트 밖 멤버가 생기면 컴파일 에러.
type _RegisteredType =
  | 'split' | 'stack' | 'bar' | 'grid' | 'overlay'
  | 'nav' | 'tabgroup' | 'tab' | 'section' | 'floating'
  | 'widget' | 'state'
type _Missing = Exclude<LayoutNode['type'], _RegisteredType>
type _AssertAllRegistered = [_Missing] extends [never] ? true : _Missing
const _check: _AssertAllRegistered = true
void _check
