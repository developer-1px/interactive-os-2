# Theme Preview Bento Grid — Design Spec

> Discussion: 테마 페이지 우측 preview를 벤토 그리드로 개편. 22개 컴포넌트 전수를 10장 시나리오 카드에 배치.
> 핵심 원칙: 디자인은 장식이 아니라 기능. 간격 → 면 → 선 → 순서.

## 1. Purpose

- **풀려는 문제:** 토큰 변경이 실제 UI 조합에 미치는 효과를 한눈에 보여주기 (현재는 균일 카드 카탈로그라 맥락 없음)
- **대상 사용자:** interactive-os 개발자/디자이너 — 토큰을 조정하며 결과를 즉시 확인
- **사용 맥락:** `/internals/theme` 페이지 우측 패널. 좌측 토큰 컨트롤 240px 고정, 나머지 전부 preview

상태: 🟢

## 2. Tone

- **선택된 방향:** editorial-minimal — 컴포넌트가 주인공, 여백이 무대. 장식 제로.
- **기획 우선순위:** 간격(spacing) → 면(surface) → 선(border) → 순서(visual order)
- **레퍼런스:** shadcn/ui Cards 탭의 여백과 크기 변화, 단 카드 헤더/뱃지 같은 장식 없이
- **안티 레퍼런스:** Storybook (균일 캔버스), 현재 PageThemeCreator (cardHeader/cardBadge = 불필요한 장식)

상태: 🟢

## 3. Constraints

- **프레임워크:** React + CSS Modules (기존)
- **기존 디자인 시스템:** tokens.css — Zinc palette, Indigo primary, 6-level surface (base/sunken/default/raised/overlay/outlined), data-surface 번들
- **성능 제약:** 22개 컴포넌트 동시 렌더링 — 각 컴포넌트는 자체 useState + makeData()
- **접근성 요구:** 기존 ARIA 패턴 유지 (각 컴포넌트가 이미 ARIA 완전), 벤토 레이아웃 자체는 시각적 구조
- **장식 금지:** 카드 헤더, 뱃지, 라벨, 아이콘 장식 추가하지 않음. 컴포넌트 자체가 콘텐츠.

상태: 🟢

## 4. Differentiation

- **기억점:** surface 계층이 한 화면에서 전부 보인다. 6단계 surface가 자연스럽게 중첩되어, 토큰 하나를 바꾸면 깊이감 전체가 변하는 것을 목격하는 경험. 장식 없이 면만으로 만든 깊이.

상태: 🟢

## 5. Typography

- **Display 글꼴:** 없음 (도구 페이지, display 필요 없음)
- **Body 글꼴:** Manrope (--sans), wght 400–800
- **Mono 글꼴:** SF Mono → Cascadia Code → JetBrains Mono (--mono)
- **Size scale:** xs(10) sm(12) md(14) lg(17) xl(20) 2xl(24) 3xl(29)
- **카드 내부:** 컴포넌트 자체 타이포 그대로 사용. 카드 레벨에서 추가 텍스트 없음.

상태: 🟢

## 6. Color & Theme

- **지배색:** Zinc (neutral gray scale, 0–950)
- **악센트:** Indigo-500 (#5B5BD6) = primary/focus
- **다크/라이트 정책:** dark-first, [data-theme="light"] override, 토큰 편집은 CSS variable 직접 조작
- **CSS 변수 체계:** Tier 1 palette → Tier 2 semantic → data-surface 번들
- **의미색:** selection(green), destructive(red-500), status green/amber
- **카드 surface 전략:** 카드마다 의도적으로 다른 data-surface를 부여하여 6단계 계층이 한눈에 보이게

상태: 🟢

## 7. Motion

- **전략:** 거의 없음. `--transition-fast: 0.08s`만 사용.
- **토큰 변경:** CSS variable 즉시 반영, transition 불필요.
- **Hover/Focus:** 컴포넌트 자체의 hover/focus 반응만 (이미 구현됨). 카드 레벨 hover 효과 없음.
- **라이브러리:** 없음.

상태: 🟢

## 8. Spatial Composition

- **밀도:** comfortable — 카드 간 gap `--space-xl`(24px), 카드 내부 padding `--space-lg`(16px)
- **레이아웃:** CSS Grid 3컬럼, `grid-template-columns: repeat(3, 1fr)`
- **hero 카드:** `grid-column: span 2` (Board, Data View)
- **높이:** 고정하지 않음. 컴포넌트 콘텐츠가 결정. 자연스러운 높이 변화가 리듬.
- **여백:** preview 영역 전체 `padding: --space-2xl`(32px). 카드 내부 padding이 "무대".

상태: 🟢

## 9. Backgrounds & Visual Details

- **배경:** preview 영역 = `data-surface="base"` (가장 어두운 바닥)
- **카드 배경:** data-surface를 카드별로 의도적 배분 — 장식 없이 시각적 분리를 만드는 유일한 수단
- **그림자:** data-surface 번들 포함분만 (raised = shadow-md, overlay = shadow-lg). 추가 없음.
- **텍스처/패턴:** 없음
- **장식 요소:** 없음. border도 data-surface 번들 포함분만.

상태: 🟢

---

**전체 상태:** 🟢 9/9

## 교차 검증

1. **Tone ↔ Typography:** ✅ editorial-minimal + 컴포넌트 자체 타이포만 = 추가 텍스트 없음
2. **Tone ↔ Color:** ✅ Zinc neutral + 장식 제로 = 면의 미묘한 차이가 돋보임
3. **Tone ↔ Spatial:** ✅ comfortable 밀도 + 여백이 무대 = 컴포넌트가 호흡할 공간
4. **Color ↔ Backgrounds:** ✅ data-surface 번들이 bg+border+shadow 통합 관리
5. **Constraints ↔ 전체:** ✅ 기존 토큰 체계 100% 재사용, 새 변수 없음

## 시나리오 카드 배치

| # | 카드명 | 컴포넌트 | grid-column | data-surface |
|---|--------|---------|-------------|--------------|
| 1 | Board | Kanban | span 2 | raised |
| 2 | Preferences | SwitchGroup, RadioGroup, Slider, Checkbox | span 1 | default |
| 3 | Data View | Grid, TabList, Combobox | span 2 | sunken |
| 4 | Explorer | TreeView, Toolbar | span 1 | default |
| 5 | Hierarchy | TreeGrid | span 1 | raised |
| 6 | Input Group | Spinbutton, Toggle, ToggleGroup | span 1 | outlined |
| 7 | Sidebar | NavList, Accordion | span 1 | sunken |
| 8 | Actions | Toaster, ListBox | span 1 | default |
| 9 | Confirm | Dialog, AlertDialog | span 1 | overlay |
| 10 | Menu | DisclosureGroup, MenuList | span 1 | raised |

**22/22 컴포넌트 전수, surface 6단계 중 5단계 사용 (base = preview 배경)**

---

Design Spec 완료. `/go`로 진행하면 frontend-design 스킬이 이 spec을 읽고 구현합니다.
