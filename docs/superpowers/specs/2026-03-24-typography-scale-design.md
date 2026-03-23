# Typography Scale Unification — Design Spec

> Discussion: 홈페이지 UI(14px 기반)와 MarkdownViewer(16px 기반)가 사실상 별도 스케일. 토큰을 공유하되 매핑이 1단계 shift → h3=body 동일 크기, h2=페이지 h1 등 계층 충돌. 스케일 자체를 처음부터 재설계하여 하나의 체계로 통합.

## 1. Purpose

- **풀려는 문제:** UI와 prose가 같은 토큰 세트를 쓰면서도 별도 스케일처럼 동작. 6단계 불균일 비율(×1.09~×1.4)로 prose heading 분화 부족
- **대상 사용자:** interactive-os 프레임워크를 사용하는 개발자. 쇼케이스·문서·CMS가 한 페이지에 공존
- **사용 맥락:** 도구 UI(sidebar, ARIA 컴포넌트)와 문서 prose(Area, docs)가 나란히 렌더링

상태: 🟢

## 2. Tone

- **선택된 방향:** refined-comfortable (기존 UI design spec 계승) — 여유 있지만 기능적인 도구
- **레퍼런스:** Linear, Stripe docs — 도구 UI와 기술 문서가 같은 타이포 리듬
- **안티 레퍼런스:** Medium (prose가 UI와 완전 별개 세계), VS Code (타이포 분화 부족)

상태: 🟢

## 3. Constraints

- **프레임워크:** CSS custom properties (tokens.css), 전역 적용
- **기존 디자인 시스템:** surface 6단계, text 4단계 색상, spacing (4~40px), Manrope + SF Mono
- **영향 범위:** tokens.css(정의) + MarkdownViewer.module.css(prose) + components.css(ARIA) + layout.css(page) + 각 module.css
- **접근성 요구:** WCAG AA contrast (기존 충족), 최소 font-size 10px (caption)

상태: 🟢

## 4. Differentiation

- **기억점:** "하나의 스케일에서 UI도 문서도 나온다" — 도구 인터페이스와 기술 문서가 같은 리듬으로 호흡하는, 이음새 없는 타이포 시스템. className 없이 ARIA 속성만으로 완성된 시각 시스템(기존 기억점)과 결합.

상태: 🟢

## 5. Typography

- **Display 글꼴:** Manrope (유지)
- **Body 글꼴:** Manrope (유지)
- **Mono 글꼴:** SF Mono / Cascadia Code / JetBrains Mono (유지)

### Size Scale — Minor Third (×1.2), 7단계

| 토큰 | 값 | UI 용도 | Prose 용도 |
|------|-----|---------|-----------|
| `--text-xs` | 10px | caption, uppercase label | — |
| `--text-sm` | 12px | 보조 텍스트, badge, tooltip | — |
| `--text-md` | 14px | **body**, 컴포넌트 아이템 | **body**, code, table |
| `--text-lg` | 17px | subtitle, sidebar heading | h4 |
| `--text-xl` | 20px | page title | h3 |
| `--text-2xl` | 24px | — | h2 |
| `--text-3xl` | 29px | — | h1 |

이전 대비 변경:
- `xs: 11→10`, `lg: 16→17`, `2xl: 28→24`, `3xl: 29 (신규)`
- prose body를 `--text-md`(14px)로 통일 — shift 제거

### Weight 체계 — 4단계

| Weight | 토큰 | 용도 |
|--------|------|------|
| 400 | normal | body (UI + prose 동일) |
| 500 | medium | 컴포넌트 아이템, 강조 |
| 600 | semibold | heading (h3~h4), label, th |
| 700 | bold | heading (h1~h2), strong |

- 450 (prose 전용) 제거 — 시스템 통합
- 800 (기존 h1) → 700으로 통일

### Line-height 체계 — 5단계 토큰

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--leading-tight` | 1.2 | heading h1~h3 |
| `--leading-snug` | 1.4 | h4, UI 캡션 |
| `--leading-normal` | 1.5 | UI body, 컴포넌트 |
| `--leading-relaxed` | 1.7 | prose body, 리스트 |
| `--leading-code` | 1.6 | code block |

### Letter-spacing 체계

| 용도 | 값 |
|------|-----|
| display heading (h1~h2) | `-0.02em` |
| sub heading (h3~h4) | `-0.01em` |
| body | `0` |
| uppercase label | `0.04em` |

상태: 🟢

## 6. Color & Theme

> 이번 scope 밖. 기존 UI design spec 그대로 유지.

- 기존 spec 참조: `2026-03-22-ui-components-design.md` §6

상태: 🟢 (scope 밖)

## 7. Motion

> 이번 scope 밖.

상태: 🟢 (scope 밖)

## 8. Spatial Composition

- **밀도:** UI=comfortable (기존 유지), prose=relaxed
- **prose 여백 전략:** line-height 1.7 + margin으로 호흡. prose body가 14px로 내려온 만큼 leading-relaxed(1.7)로 가독성 확보
- **UI↔prose 경계:** max-width 720px가 prose 영역을 한정, 사이드바(14px body)와 자연스럽게 공존

상태: 🟢

## 9. Backgrounds & Visual Details

> 이번 scope 밖.

상태: 🟢 (scope 밖)

---

**전체 상태:** 🟢 9/9

**교차 검증:**
1. Tone ↔ Typography: ✅ refined-comfortable + Minor Third = 차분하고 기능적
2. Tone ↔ Color: ✅ scope 밖, 기존 zinc+indigo 유지
3. Tone ↔ Spatial: ✅ comfortable UI + relaxed prose = 여유 있지만 기능적
4. Color ↔ Backgrounds: ✅ scope 밖
5. Constraints ↔ 전체: ✅ CSS custom properties 교체, 영향 범위 명확

**구체성 체크:**
1. 입력: tokens.css 토큰 값 변경 → 전파
2. 출력: UI·prose 모든 텍스트가 동일 스케일에서 렌더링
3. 구조: tokens.css(정의) → components.css + MarkdownViewer.module.css + layout.css(소비)
4. 검증: 브라우저에서 사이드바·본문·heading 크기 확인
