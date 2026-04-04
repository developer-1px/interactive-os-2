# Aria.Panel + Aria.Trigger — Task

PRD: `2026-03-28-aria-panel-trigger-prd.md`

## 액션 플랜

### T1: Aria.Panel 컴포넌트 (`aria.tsx`)
- Item과 동형의 store 순회 렌더러
- `state.slotProps`를 render function에 전달
- panelVisibility에 따라 visible/hidden 제어
- role, aria-labelledby, id 자동 생성 (이미 slotProps에 있음)

### T2: Aria.Trigger 컴포넌트 (`aria.tsx`)
- popup 축의 진입점
- triggerKeyMap 바인딩 (onKeyDown)
- triggerClickMap 바인딩 (onClick)
- aria-haspopup, aria-expanded, aria-controls 자동 생성
- stopPropagation으로 버블링 차단

### T3: composePattern triggerKeyMap 통합
- composePattern에서 triggerKeyMap을 pattern.triggerKeyMap으로 전달
- 기존 3arg 호출 호환 유지

### T4: 패턴 업데이트
- tabs: panel 이미 있음. triggerKeyMap 불필요 (tab은 trigger가 아님)
- accordion: panel 이미 있음
- menuButton: triggerKeyMap 추가 (Enter/Space/ArrowDown → open)

### T5: 테스트 (V1-V10)
