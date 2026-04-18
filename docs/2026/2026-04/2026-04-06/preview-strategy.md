---
id: 1-projects/cms/preview-deploy/preview/strategy
type: note
slug: previewStrategy
title: 'CMS 랜딩 반응형 + 빈 상태 품질 개선 — PRD'
tags: [untagged]
created: 2026-04-06
updated: 2026-04-09
summary: 'Discussion: CMS 랜딩이 interactive-os의 "proof"로서 3뷰포트에서 프로페셔널하게 보여야 하나, 모바일 프리뷰에서 반응형이 작동하지 않고 빈 콘텐츠가 노출됨'
legacy:
  status: active
  kind: note
  topics: [1-projects]
  relates: []
  supersedes: []
---
# CMS 랜딩 반응형 + 빈 상태 품질 개선 — PRD

> Discussion: CMS 랜딩이 interactive-os의 "proof"로서 3뷰포트에서 프로페셔널하게 보여야 하나, 모바일 프리뷰에서 반응형이 작동하지 않고 빈 콘텐츠가 노출됨

## ① 동기

### WHY

- **Impact**: CMS 관리자가 모바일 프리뷰로 결과를 확인하려 하면, 3열 카드가 잘리고 빈 이미지가 회색 박스로 노출된다. 랜딩 페이지가 "This page is the proof"를 표방하면서 모바일에서 깨지면 제품 신뢰가 훼손된다.
- **Forces**: (원인) `@media (max-width: 768px)` 미디어쿼리는 브라우저 viewport 기준이므로 CMS viewport wrapper의 `max-width: 375px`에 반응하지 않음. (제약) 디자인 변경 불가, plain text만, CMS는 OS 이용자.
- **Decision**: 미디어쿼리 → container query 전환. 기각 대안: (a) JS 기반 클래스 토글 — 불필요한 복잡도, (b) viewport wrapper 내부에 iframe — 완전 격리되지만 인터랙션 전달 복잡.
- **Non-Goals**: 새로운 섹션 타입 추가, CMS 편집 기능 변경, 디자인 토큰 변경.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | 데스크톱 뷰포트 선택 | Manifesto 섹션 확인 | 3열 카드 그리드, 카드 잘림 없음 | |
| S2 | 모바일(375px) 뷰포트 선택 | Manifesto 섹션 확인 | 1열 세로 스택, 모든 카드 완전 표시 | |
| S3 | 태블릿(768px) 뷰포트 선택 | Features 섹션 확인 | 2열 또는 1열, 카드 잘림 없음 | |
| S4 | Hero 배너 이미지 미등록 | 프리뷰 모드 진입 | 빈 영역이 보이지 않거나 의미 있는 placeholder 표시 | |
| S5 | Gallery 아이템 이미지 없음 | 프리뷰 모드 진입 | 빈 회색 박스 대신 숨김 또는 placeholder | |
| S6 | 모바일 뷰포트에서 | 슬라이드 2 썸네일 클릭 | 캔버스가 해당 섹션으로 스크롤됨 | |

완성도: 🟢

## ② 산출물

> 기존 파일 수정. 새 파일 생성 없음.

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `CmsLanding.module.css` 반응형 전환 | `@media` → `@container` 쿼리로 전환. 기존 breakpoint 로직 유지하되 container 기준으로 변경 | |
| `CmsViewportWrapper.tsx` container 선언 | viewport wrapper에 `container-type: inline-size` 추가 | |
| `CmsLanding.module.css` 빈 상태 처리 | 프리뷰 모드에서 `src === ''`인 이미지 영역 숨김 또는 placeholder 표시 | |
| `cmsNodePresentation.tsx` 빈 상태 분기 | 프리뷰 모드 + 빈 이미지 → 렌더링 생략 또는 placeholder 컴포넌트 | |
| `CmsSidebar.tsx` 스크롤 버그 수정 | viewport 변경 후 scrollIntoView 타이밍 보정 | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 뷰포트 "mobile" 선택 | container width 375px | Manifesto 3열→1열 | container query가 375px에 반응하여 `grid-template-columns: 1fr` 적용 | 1열 세로 스택 | |
| 뷰포트 "mobile" 선택 | container width 375px | Patterns 4열→2열 | 375px < 480px breakpoint → 2열 | 2열 그리드 | |
| 뷰포트 "tablet" 선택 | container width 768px | Features 3열→1열 | 768px ≤ 768px breakpoint → 1열 | 1열 세로 스택 | |
| 뷰포트 "desktop" 선택 | container width 무제한 | 모든 섹션 원래 그리드 | breakpoint 미해당 | 기존 다열 유지 | |
| 프리뷰 모드 + hero-image src="" | 빈 이미지 | 영역 숨김 | src 빈 값이면 hero-image wrap 자체를 렌더링하지 않음 | 빈 영역 없음 | |
| 프리뷰 모드 + gallery-item 이미지 없음 | 빈 갤러리 | placeholder 또는 숨김 | 편집 모드에서는 placeholder 유지, 프리뷰에서는 숨김 | 깔끔한 프리뷰 | |
| 슬라이드 썸네일 클릭 | 모바일 뷰포트 | 캔버스 스크롤 | scrollIntoView가 container 내부 scroll 기준으로 작동 | 해당 섹션 표시 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 모든 이미지가 비어있는 상태에서 프리뷰 | 여러 빈 placeholder | 빈 이미지만 가득한 프리뷰는 쓸모없다 | 빈 이미지 영역 모두 숨김, 텍스트 콘텐츠만 표시 | 텍스트만 있는 깔끔한 프리뷰 | |
| 모바일에서 1열로 전환 시 매우 긴 페이지 | Manifesto 3카드 세로 스택 | 관리자가 실제 모바일 경험을 정확히 확인해야 한다 | 자연스러운 스크롤, 각 카드 full-width | 길지만 정확한 프리뷰 | |
| 뷰포트를 빠르게 전환 (mobile→desktop→mobile) | 이전 뷰포트 스타일 | transition 중 레이아웃 점프 방지 | `transition: max-width 0.2s ease` (기존) 유지 | 부드러운 전환 | |
| container query 미지원 브라우저 | 구 브라우저 | graceful degradation | 데스크톱 레이아웃 유지 (기존 미디어쿼리 폴백) | 최소 데스크톱은 정상 | |
| 슬라이드 클릭 직후 뷰포트 변경 | 스크롤 진행 중 | race condition 방지 | 뷰포트 변경 완료 후 스크롤 재실행 | 정확한 위치 스크롤 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | ax()만 사용, style={} 금지 (CLAUDE.md) | ② CSS 수정 | ✅ 준수 | container query는 module.css에 작성 (last-mile) | |
| 2 | module.css는 last-mile만 (CLAUDE.md) | ② CSS 수정 | ✅ 준수 | container query = 축에 없는 CSS → last-mile 해당 | |
| 3 | surface 소유 속성에 module.css 금지 (feedback) | ② 빈 상태 CSS | ⚠️ 주의 | placeholder의 bg/border는 이미 module.css에 있음. 추가하지 않고 기존 것 활용 | |
| 4 | 디자인 변경 UI 절대 금지 (feedback_cms_rules) | ③ 전체 | ✅ 준수 | 반응형은 CSS 레벨, 관리자 UI 변경 아님 | |
| 5 | CMS는 OS 이용자 (feedback_cms_rules) | ② 스크롤 수정 | ✅ 준수 | scrollIntoView 타이밍 보정은 CMS 레벨 수정 | |
| 6 | 간격→면→선 순서 (feedback_design_css_principles) | ② placeholder | ✅ 준수 | 기존 placeholder 스타일(dashed border)을 편집 모드에서만 유지 | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | CmsLanding.module.css @media → @container | 실제 배포(비-CMS) 페이지의 반응형이 깨질 수 있음 | 낮음 | CMS 렌더러는 CMS 내부에서만 사용 (import 5곳 확인). 영향 격리됨 | |
| 2 | CmsPresentMode에도 같은 CSS 적용 | 프리뷰 모드에서도 반응형 적용 | 없음 | 기대 동작 — 프리뷰가 실제 결과를 반영해야 함 | |
| 3 | SectionThumbnail에도 같은 CSS | 썸네일 내부 레이아웃이 변경될 수 있음 | 낮음 | 썸네일은 transform: scale()로 축소하므로 container query가 다르게 반응할 수 있음 → 썸네일 wrapper에 container-type 미적용으로 격리 | |
| 4 | container query 폴백 | @container 미지원 시 기존 @media 동작 | 낮음 | @media를 @container 뒤에 폴백으로 유지 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | SectionThumbnail에 container-type 적용 | ⑥-3 | 썸네일 축소(scale) 환경에서 container query가 의도치 않게 모바일 breakpoint 발동 | |
| 2 | 프리뷰 모드에서 placeholder를 새로 디자인 | ⑤-3 | surface 소유 속성 추가 금지. 기존 placeholder 스타일 재사용하거나 숨김 | |
| 3 | style={} 인라인 스타일로 반응형 구현 | ⑤-1 | ax()만 사용 원칙 | |
| 4 | 새 CSS custom property 추가 | ⑤-3 | 기존 `--landing-*` 토큰 범위 내에서만 작업 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 동기 | 데스크톱 뷰포트에서 Manifesto 확인 | 3열 카드 그리드 유지, 기존과 동일 | |
| V2 | S2 동기 | 모바일 뷰포트에서 Manifesto 확인 | 1열 세로 스택, 모든 카드 잘림 없이 표시 | |
| V3 | S3 동기 | 태블릿 뷰포트에서 Patterns 확인 | 2열 그리드 (4열→2열 축소) | |
| V4 | S4 동기 | 프리뷰 모드에서 Hero 배너 이미지 미등록 | 빈 영역 숨김 (placeholder 미노출) | |
| V5 | S5 동기 | 프리뷰 모드에서 Gallery 이미지 없음 | 빈 아이템 숨김 | |
| V6 | S6 동기 | 모바일 뷰포트에서 슬라이드 클릭 | 캔버스가 해당 섹션으로 정확히 스크롤 | |
| V7 | E1 경계 | 모든 이미지 비어있는 상태 프리뷰 | 텍스트만 표시, 빈 영역 없음 | |
| V8 | E3 경계 | 뷰포트 빠른 전환 (mobile↔desktop) | 부드러운 transition, 레이아웃 점프 없음 | |
| V9 | E4 경계 | @container 미지원 시 | 데스크톱 레이아웃 유지 (@media 폴백) | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
