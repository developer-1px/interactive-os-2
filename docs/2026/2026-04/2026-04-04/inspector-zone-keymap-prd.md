---
id: 1-projects/viewer/prds/inspector-zone-keymap-prd
title: 'Inspector 새 창 + Zone 계층 KeyMap 노출 — PRD'
created: 2026-04-04
updated: 2026-04-08
summary: 'Discussion: Inspector에서 AriaRoute 전역키만 보이고 Zone별 keyMap이 누락됨. 새 창 전용으로 전환.'
legacy:
  status: active
  kind: prd
  topics: [1-projects]
  relates: []
  supersedes: []
---
# Inspector 새 창 + Zone 계층 KeyMap 노출 — PRD

> Discussion: Inspector에서 AriaRoute 전역키만 보이고 Zone별 keyMap이 누락됨. 새 창 전용으로 전환.

## ① 동기

### WHY (discuss FRT에서 이식)

- **Impact**: 개발자가 Inspector로 키보드 바인딩을 확인할 때, AriaRoute 전역키만 보이고 `<Aria>` + Zone의 pattern/plugin/override keyMap이 안 보여서 디버깅 불가
- **Forces**: `useAriaView`의 mergedKeyMap은 view 레벨 관심사인데, `engine.inspect()`는 store/command 레벨 → engine에 view 정보를 역류시키면 레이어 위반. Aria 중첩 없음(Aria 하나 = 온전한 KeyMap)
- **Decision**: registry 레벨에서 `getKeyMap` 별도 채널로 우회. 계층은 `parentId`로 표현. 새 창은 `window.open` + `createRoot`. 기각: engine.inspect()에 keyMap 주입(레이어 역류), BroadcastChannel(직렬화 오버헤드), Chrome extension(과도)
- **Non-Goals**: Inspector에서의 인터랙션(dispatch, command 실행). 이번은 정보 노출만.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | `/i18n` 라우트에 Aria listbox + Zone toolbar가 렌더링됨 | Inspector 새 창을 열면 | AriaRoute, Aria(listbox), Zone(toolbar) 3개가 계층 트리로 보인다 | ✅ `InspectorWindow.tsx::buildTree` + `TreeNode` |
| S2 | Inspector 새 창이 열려 있음 | Aria(listbox)를 선택하면 | pattern keyMap + plugin keyMap + override keyMap이 출처별로 구분되어 보인다 | ✅ `useAriaView.ts::keyMapDesc` → `KeyMapTable` |
| S3 | 메인 창에서 라우트를 이동함 | Inspector 새 창 | 1초 polling으로 새 라우트의 Aria/Zone이 반영된다 | ✅ `InspectorWindow.tsx` 1초 setInterval |
| S4 | Inspector 새 창이 열려 있음 | 메인 창을 닫으면 | Inspector 창도 함께 닫힌다 (opener 관계) | ✅ `openInspectorWindow.ts::closeOnMainUnload` |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `ariaRegistry.ts` 타입 확장 | `AriaActions`에 `getKeyMap?: () => Record<string, string>`, `parentId?: string` 추가 | ✅ `ariaRegistry.ts::AriaActions` |
| `AriaInternalContext.ts` 확장 | `AriaInternalContextValue`에 `registryKey?: string` 추가 | ✅ `AriaInternalContext.ts::AriaInternalContextValue` |
| `aria.tsx` 수정 | Context에 `registryKey` 전달 + `registerAria` 시 `getKeyMap` 등록 (mergedKeyMap → key:owner 변환) | ✅ `aria.tsx::AriaRoot` |
| `useAriaZone.ts` 수정 | Zone이 `registerAria(scope, actions, { parent })` 호출 + `getKeyMap` 노출 | ✅ `useAriaZone.ts::useAriaZone` |
| `inspectToTree.ts` 수정 | `getKeyMap()` 결과를 keyMap 트리에 반영 | ❌ 미구현 — InspectorWindow에서 getKeyMap() 직접 사용으로 불필요 |
| `AppInspectorPanel.tsx` 삭제 | overlay 방식 제거 | ✅ 삭제됨 |
| `openInspectorWindow.ts` (신규) | `window.open` + `createRoot`로 새 창 렌더링. 같은 JS 컨텍스트 공유 | ✅ `openInspectorWindow.ts::openInspectorWindow` |
| `InspectorWindow.tsx` (신규) | 새 창 루트. registry parentId로 계층 트리 구축, 선택 시 inspect() + getKeyMap() 표시 | ✅ `InspectorWindow.tsx::InspectorWindow` |
| `AppShell.tsx` 수정 | overlay 토글 → `openInspectorWindow()` 호출 | ✅ `AppShell.tsx` |
| `PageInspector.tsx` 삭제 | 새 창으로 대체. 라우트 제거 | ✅ 삭제됨 |
| `router.tsx` 수정 | `/inspector` 라우트 제거 | ✅ `router.tsx` |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `Mod+Shift+I` (AppShell) | 메인 창 활성 | `openInspectorWindow()` 호출 | 기존 단축키 유지, 동작만 새 창으로 변경 | 새 창 열림 (이미 열려 있으면 focus) | ✅ |
| 트리 노드 클릭 | Inspector 트리 표시 | 해당 노드 선택 | 선택된 노드의 inspect() + getKeyMap() 상세 표시 | 상세 패널 갱신 | ✅ |
| ↑↓ | 트리 포커스 | 포커스 이동 | TreeView 표준 패턴 | 포커스 이동 | ❌ 미구현 — devtools button 트리, 키보드 네비 없음 |
| ←→ | 트리 포커스 | expand/collapse | 계층 구조 탐색 | 자식 열림/닫힘 | ❌ 미구현 |
| Enter | 트리 노드 포커스 | 선택 (= 클릭) | 키보드 접근성 | 상세 패널 갱신 | ❌ 미구현 |
| Home/End | 트리 포커스 | 첫/마지막 노드 | TreeView 표준 | 포커스 이동 | ❌ 미구현 |
| 라우트 변경 (메인 창) | Inspector 열림 | 1초 polling으로 감지 | registry 스냅샷 갱신 | 트리 자동 갱신 | ✅ |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| E1: Aria/Zone 0개 라우트 | Inspector 열림 | 빈 상태도 에러 없이 표시 | "등록된 인스턴스 없음" 메시지 | 트리 비어있음 | ✅ |
| E2: 이미 열린 상태에서 `Mod+Shift+I` | 새 창 존재 | 중복 창 방지 | 기존 창에 focus | 변화 없음 | ✅ |
| E3: Zone 부모 Aria unmount | Zone registry에 남음 | 고아 노드 방지 | Zone도 cleanup으로 제거 (React unmount 순서) | 트리에서 사라짐 | ✅ useEffect cleanup |
| E4: `getKeyMap` 없는 항목 (AriaRoute) | AriaRoute는 inspect().keyMap만 | 하위호환 | `inspect().keyMap` fallback | keyMap 정상 표시 | ✅ |
| E5: 새 창 CSS | 별도 document | 메인 창 stylesheet 미적용 | 필요 CSS를 새 창에 주입 | 스타일 정상 | ✅ link + style tag 복사 |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | engine에 view 역류 금지 (discuss 제약) | ② registry 확장 | ✅ 준수 | — | ✅ getKeyMap은 registry 채널 |
| P2 | UI → ui/ 기존 완성품 사용 (CLAUDE.md) | ③ TreeView | ✅ 준수 | — | 🔀 devtools는 os 재귀 등록 문제로 button 트리 사용 |
| P3 | pages에서 useAria/useAriaZone 직접 사용 금지 (CLAUDE.md) | ② InspectorWindow | ✅ 준수 — devtools/ 하위 | — | ✅ |
| P4 | 선언=등록, dispatcher 금지 (feedback_declarative_ocp) | ② registerAria | ✅ 준수 | — | ✅ |
| P5 | style={} 금지, ax()만 (feedback_style_is_hatch) | ② InspectorWindow | ⚠️ 주의 — 새 창 CSS 주입 시 | ax.css+tokens.css+reset.css를 link로 주입 | ✅ module.css + ax() 사용 |
| P6 | 모든 OS 상태는 NormalizedData+Command (feedback_all_state_normalized_command) | ② Inspector 트리 | ✅ 준수 | — | 🔀 Inspector 자체는 useState 기반 (devtools, os 외부) |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| B1 | `ariaRegistry.ts` 타입 변경 | 기존 호출부에 새 필드 요구 | 낮 | optional 필드, 무변경 | ✅ |
| B2 | `AriaInternalContext` 필드 추가 | Context consumer 영향 | 낮 | optional, 무영향 | ✅ |
| B3 | `AppShell.tsx` overlay 제거 | inspectorOpen state 불필요 | 낮 | 코드 삭제로 단순화 | ✅ |
| B4 | `AppInspectorPanel.tsx` 삭제 | AppShell import 에러 | 낮 | AppShell 수정에 포함 | ✅ |
| B5 | `PageInspector.tsx` + 라우트 삭제 | `/inspector` 404 | 낮 | 새 창으로 대체 | ✅ |
| B6 | `useAriaZone.ts` registerAria 추가 | mount/unmount 사이드이펙트 추가 | 낮 | useEffect cleanup | ✅ |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | `engine.inspect()`에 mergedKeyMap 주입 금지 | P1 (⑤) | engine에 view 역류 = 레이어 위반 | ✅ |
| F2 | 새 창에서 `style={}` 사용 금지 | P5 (⑤) | ax() 시스템 일관성 | ✅ module.css 사용 |
| F3 | Inspector에서 dispatch/command 실행 금지 | Non-Goals (①) | 이번은 정보 노출만 | ✅ 읽기 전용 |
| F4 | Inspector에서 useAria/useAriaZone 직접 사용 금지 | P3 (⑤) | ui/ TreeView 사용 | ✅ button 트리 직접 구현 |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | S1 (①) | Aria + Zone 라우트에서 `Mod+Shift+I` | 새 창에 AriaRoute → Aria → Zone 계층 트리 표시 | ❌ 테스트 없음 (window.open 필요) |
| V2 | S2 (①) | Inspector에서 Aria 노드 선택 | keyMap에 pattern/plugin/override 출처별 구분 표시 | ❌ 테스트 없음 |
| V3 | S3 (①) | 메인 창에서 라우트 이동 | Inspector 트리가 1초 내 갱신 | ❌ 테스트 없음 |
| V4 | S4 (①) | 메인 창 닫기 | Inspector 창도 닫힘 | ❌ 테스트 없음 |
| V5 | E1 (④) | Aria 0개 라우트 | "등록된 인스턴스 없음" 표시, 에러 없음 | ❌ 테스트 없음 |
| V6 | E2 (④) | 이미 열린 상태에서 `Mod+Shift+I` | 기존 창 focus, 중복 창 없음 | ❌ 테스트 없음 |
| V7 | E4 (④) | AriaRoute만 있는 라우트 | inspect().keyMap fallback으로 정상 표시 | ❌ 테스트 없음 |
| V8 | E5 (④) | 새 창 열기 | ax() 스타일 정상 적용 | ❌ 테스트 없음 |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

#kind/prd #topic/viewer
