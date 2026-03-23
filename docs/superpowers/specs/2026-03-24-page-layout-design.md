# Page Layout Unification — Design Spec

> Discussion: MD(area) 페이지와 showcase 페이지가 같은 토큰·스케일을 쓰지만 페이지 구조가 달라서 이질적으로 느껴짐. 페이지 헤더 패턴 통합 + 본문 밀도 조율로 "같은 시스템에서 나온 페이지" 느낌을 만들어야 함.

## 1. Purpose

- **풀려는 문제:** showcase(데모 위젯 중심)와 area(prose 중심) 페이지가 같은 shell에 있지만 서로 다른 사이트처럼 느껴짐. 헤더 구조, 본문 밀도, 시각 리듬이 통일되지 않음.
- **대상 사용자:** interactive-os 프레임워크를 사용하는 개발자. sidebar에서 showcase↔area를 오가며 탐색.
- **사용 맥락:** 좌측 sidebar + 우측 content 2컬럼 레이아웃. content 영역 안에서 페이지 유형별 구조 통일.

상태: 🟡

## 2. Tone

- **선택된 방향:** refined-comfortable (기존 계승) — 여유 있지만 기능적. 도구 문서와 데모가 같은 리듬으로 호흡.
- **레퍼런스:** Radix Themes docs — 데모 위젯과 prose 문서가 같은 페이지 구조를 공유
- **안티 레퍼런스:** Storybook (showcase와 docs가 완전 별개 세계), MDN (prose only, 데모 부재)

상태: 🟡

## 3. Constraints

- **프레임워크:** React, CSS Modules + 전역 CSS
- **기존 디자인 시스템:** surface 6단계, Minor Third 타이포 스케일, --leading-* 토큰 (이번 세션 확정)
- **영향 범위:** app.css (page-header/page-title/page-desc), AreaViewer.module.css, layout.css
- **접근성 요구:** heading 계층 유지 (h1→h2→h3 순서)

상태: 🟡

## 4. Differentiation

- **기억점:** "데모든 문서든 같은 페이지" — 위젯과 텍스트가 같은 시각 구조 안에 자연스럽게 공존. 어디서 showcase가 끝나고 docs가 시작되는지 구분이 안 됨.

상태: 🟡

## 5. Typography

> 이번 세션에서 확정 완료. 참조: `2026-03-24-typography-scale-design.md`

- Minor Third (×1.2), 7단계: 10 12 14 17 20 24 29
- page-title: --text-2xl (24px), prose h1: --text-3xl (29px)
- Weight: 400/500/600/700, Leading: tight/snug/normal/relaxed/code

상태: 🟢

## 6. Color & Theme

> 기존 확정. 참조: `2026-03-22-ui-components-design.md` §6

상태: 🟢 (scope 밖)

## 7. Motion

> 기존 확정. 극도로 절제, 상태 전환만 0.08s.

상태: 🟢 (scope 밖)

## 8. Spatial Composition

> 이 spec의 핵심 축.

### 8.1 공유 Page Header 패턴

- **구조:** —
- **간격:** —

### 8.2 Content Area 밀도

- **Showcase 밀도:** —
- **Prose 밀도:** —
- **공유 요소 (table, code, blockquote):** —

### 8.3 여백 리듬

- **수평 padding:** —
- **수직 spacing:** —

상태: 🔴

## 9. Backgrounds & Visual Details

- **페이지 간 시각적 연결 장치:** —

상태: 🔴

---

**전체 상태:** 🟢 3개 (Typography, Color, Motion — 기존 확정), 🟡 4개 (Purpose, Tone, Constraints, Differentiation), 🔴 2개 (Spatial, Backgrounds)
