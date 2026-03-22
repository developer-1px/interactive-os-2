# UI Components Base Design — Design Spec

> Discussion: surface 토큰 + semantic color 완성했지만 컴포넌트 기본 디자인(spacing, 상태 표현, 타이포 리듬)이 부재. "토큰은 재료, 조합 규칙이 없다." Claude web의 미감(spacing/radius/밀도)을 차용, 색은 기존 zinc+indigo 유지.

## 1. Purpose

- **풀려는 문제:** 22개 UI 컴포넌트의 시각적 일관성 부재. spacing 제각각, 상태 표현 약함, 아이템이 아이템처럼 안 보임
- **대상 사용자:** interactive-os를 사용하는 개발자. theme creator에서 토큰을 조절하면 모든 컴포넌트가 일관되게 반응하는 것을 기대
- **사용 맥락:** developer tool / design system showcase. 실사용 앱(CMS, Viewer)에도 적용되는 기본 스타일

상태: 🟢

## 2. Tone

- **선택된 방향:** refined-comfortable — Claude web의 "숨 쉬는 여유"를 차가운 zinc palette 위에 올림. compact dev tool이 아닌, 여유 있지만 기능적인 도구
- **레퍼런스:** Claude web (claude.ai) — spacing, radius, 밀도. 색 온도는 차용하지 않음
- **안티 레퍼런스:** VS Code (너무 빽빽), Material UI (너무 colorful/둥근), 기존 상태 (너무 sparse/초라)

상태: 🟢

## 3. Constraints

- **프레임워크:** React, CSS Modules + 전역 components.css (ARIA attribute 셀렉터)
- **기존 디자인 시스템:** surface 6단계, semantic color (primary/focus/selection/destructive), text 4단계, border 3단계, shadow 3단계, spacing (4/8/12/16/24/32), radius (3/4/6)
- **성능 제약:** CSS-only. JS 런타임 스타일 변경 없음
- **접근성 요구:** ARIA 속성이 behavior에서 렌더링됨. CSS는 시각 표현만 담당

상태: 🟢

## 4. Differentiation

- **기억점:** "ARIA 속성이 디자인이다" — className 없이 `[role]` + `[aria-*]`만으로 완성된 시각 시스템. 코드에 `.button-primary-large` 같은 클래스가 없는데도 컴포넌트가 정돈되어 보임

상태: 🟢

## 5. Typography

- **Display 글꼴:** Manrope (기존 유지) — geometric sans, weight 400-800
- **Body 글꼴:** Manrope (기존 유지)
- **Mono 글꼴:** SF Mono → Cascadia Code → JetBrains Mono (기존 유지)
- **Size scale:** 아이템 텍스트 13px, 보조 텍스트 11px, 헤딩 9-10px uppercase mono, 코드 12px
- **Weight 체계:** 400 normal, 500 medium (아이템), 600 semibold (헤딩/강조), 700-800 제목

상태: 🟢

## 6. Color & Theme

- **지배색:** zinc palette (기존 유지) — 차가운 neutral
- **악센트:** indigo-500 (기존 --primary 유지)
- **다크/라이트 정책:** dark default, light는 `[data-theme="light"]`로 전환
- **CSS 변수 체계:** surface 6단계 + semantic color 4축 (이번 세션에서 완성)
- **의미색:** --destructive (red-500), --selection (green), --green, --amber (기존 유지)

상태: 🟢

## 7. Motion

- **전략:** 극도로 절제. 상태 전환(hover/focus)만 0.08s. 페이지 전환/로드 애니메이션 없음
- **고임팩트 모먼트:** 없음 — 도구는 즉각 반응해야 함
- **Hover/Focus 반응:** background transition 0.08s. outline은 즉시(transition 없음)
- **라이브러리:** CSS-only (transition)

상태: 🟢

## 8. Spatial Composition

- **밀도:** comfortable — Claude web 수준. 현재 compact(4px padding)에서 올림
- **아이템 target height:** 32px (padding 포함) — Claude web의 리스트 아이템과 유사
- **아이템 padding:** 6px 12px (현재 4px 10px에서 증가)
- **아이템 gap/margin:** 2px (아이템 간 미세 간격으로 분리감)
- **컨테이너 inset:** 4px (리스트 좌우 내부 여백)
- **그룹 간 gap:** 8px
- **Radius:** 8px (기본), 6px (아이템), 4px (작은 요소) — 현재 6/4/3에서 올림
- **여백 전략:** 컨테이너 안에 여유 있는 inset + 아이템 간 미세 gap

상태: 🟢

## 9. Backgrounds & Visual Details

- **배경 처리:** surface 토큰으로 깊이 표현. 단색, 텍스처 없음
- **텍스처/패턴:** 없음 — 깨끗한 단색 surface만
- **그림자 체계:** raised(shadow-md), overlay(shadow-lg)만. 아이템 레벨 그림자 없음
- **장식 요소:** 없음 — 컴포넌트 자체의 spacing과 상태 표현이 유일한 시각 요소

상태: 🟢

---

**전체 상태:** 🟢 9/9

---

## 부록: 컴포넌트 해부학 (Anatomy)

### Interactive Item (option, treeitem, menuitem, radio, switch)

```
┌─ container (4px inset) ──────────────────────┐
│  ┌─ item (6px 12px, radius 6px, h≈32px) ──┐ │
│  │  [icon 14px] [gap 8px] [label 13px/500] │ │
│  └─────────────────────────────────────────┘ │
│  [2px gap]                                    │
│  ┌─ item ──────────────────────────────────┐ │
│  │  ...                                    │ │
│  └─────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### 상태 표현 매핑

| 상태 | background | color | outline | 비고 |
|------|-----------|-------|---------|------|
| rest | transparent | text-primary | transparent | |
| hover | bg-hover | text-primary | — | :focus-within 시 억제 |
| focused | primary-dim | text-bright | 1.5px primary | 키보드 커서 |
| focused (inactive) | primary-dim | text-bright | transparent | :focus-within 아닐 때 |
| selected | selection | text-primary | — | |
| selected+focused | selection | text-bright | 1.5px primary | |
| active (press) | primary-bright | text-bright | — | :active |
| disabled | transparent | text-muted | — | aria-disabled |
