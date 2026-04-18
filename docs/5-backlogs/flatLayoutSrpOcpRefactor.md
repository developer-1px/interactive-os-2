---
id: flatLayoutSrpOcpRefactor
type: backlog
slug: flatLayoutSrpOcpRefactor
title: 'FlatLayout SRP/OCP 리팩토링'
tags: [untagged]
created: 2026-04-19
updated: 2026-04-18
legacy:
  legacy_status: backlog
---
# FlatLayout SRP/OCP 리팩토링

## 배경

`src/interactive-os/ui/FlatLayout.tsx` 가 **436 lines, 책임 16개** 단일 파일로 비대. 2026-04-19 cmux preview POC 세션에서 tabgroup renderer에 `+` 버튼 로직 60줄을 인라인으로 박은 것이 OCP 위반의 구체 증거로 남음 (사용자가 세션 중 지적). 규약 `feedback_ocp_principles` 정면 위반.

## 내용

### T1. SRP 분할 (`/srp`)

파일 책임을 분해:

```
src/interactive-os/ui/
├─ FlatLayout.tsx                    ← orchestrator만 (~60 lines)
├─ flatLayoutContext.tsx             ← FlatLayoutSurfaceContext + useFlatLayoutSurface
├─ renderers/
│  ├─ split.tsx
│  ├─ stack.tsx
│  ├─ bar.tsx
│  ├─ overlay.tsx
│  ├─ grid.tsx
│  ├─ nav.tsx                        ← NavLayoutWrapper 포함
│  ├─ tabgroup.tsx                   ← external focus sync 포함
│  ├─ tab.tsx                        ← FlatLayoutSurface Provider
│  ├─ section.tsx
│  ├─ floating.tsx
│  ├─ widget.tsx
│  └─ index.ts                       ← 집계 + 등록
```

현재 `layoutRenderers` 리터럴 객체는 `index.ts`의 `composeRenderers(entries)` 결과로 대체.

### T2. OCP 등록 인프라 (`/ocp`)

```ts
// src/interactive-os/ui/renderers/defineLayoutRenderer.ts
export function defineLayoutRenderer<T extends LayoutNode['type']>(
  type: T,
  render: (ctx: LayoutRenderContext) => React.ReactNode,
): LayoutRendererEntry

export function composeRenderers(entries: LayoutRendererEntry[]): Record<string, Renderer>
```

외부에서 `defineLayoutRenderer('tabgroup', customTabgroup)` 으로 override/augment 가능. 새 노드 타입 추가 시 기존 파일 수정 불필요.

### T3. tabgroup affordance 플러그인

tabgroup renderer의 `+` 버튼을 별도 파일로 분리 + affordance 배열 스키마:

```ts
// 노드 선언에서
{ type: 'tabgroup', affordances: ['new-tab', 'close-tab'] }

// renderers/affordances/newTabAffordance.tsx
// renderers/affordances/closeTabAffordance.tsx
```

tabgroup renderer 본체는 `affordances` 배열을 받아 slot 렌더만. 새 어포던스 추가 시 renderer 본체 수정 없음.

## 검증

- `pnpm typecheck` + `pnpm test` 전 계열 통과
- 회귀: `/chat`, `/cms`, `/slides`, `/cmux/preview` 5 scenario 스냅 매트릭스 재촬영 → 모두 동일 픽셀 결과
- `screenshots/cmux-preview/*.png` diff 0

## 출처

- 2026-04-19 cmux preview POC 세션에서 사용자가 지적:
  > "근데 FlatLayout 지금 /ocp /srp 둘다 위반아냐?"
- 구체 증거: `FlatLayout.tsx:217~284` tabgroup renderer 67줄, 내부에 + 버튼 로직 인라인
- 해당 세션에서 추가된 `src/interactive-os/ui/FlatLayout.tsx` + 버튼 블록이 이 리팩토링의 첫 피해자
