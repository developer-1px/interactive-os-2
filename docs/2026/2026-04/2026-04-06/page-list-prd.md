---
id: 1-projects/cms/content-editing/page-selection/page-list/prd
title: 'CMS 랜딩페이지 기능 완결성 — PRD'
created: 2026-04-06
updated: 2026-04-09
summary: 'Discussion: QA 탐색에서 "만들다 만" 3건 발견. 콘텐츠가 아닌 기능/디자인 완결성 확보.'
legacy:
  status: active
  kind: note
  topics: [1-projects]
  relates: []
  supersedes: []
---
# CMS 랜딩페이지 기능 완결성 — PRD

> Discussion: QA 탐색에서 "만들다 만" 3건 발견. 콘텐츠가 아닌 기능/디자인 완결성 확보.

## ① 동기

### WHY

- **Impact**: 모바일 프리뷰에서 Hero 타이틀 잘림, 프레젠테이션에서 빈 이미지 거대 공백, 콘솔 에러 13건 — 서비스 첫인상이 "미완성"
- **Forces**: container query 기반 프리뷰(vw ≠ container width), Fragment가 ref 미지원, 빈 상태 분기 부재
- **Decision**: (1) container query용 폰트/레이아웃 축소 (2) shy placeholder 아이콘 (3) Fragment → wrapper. 기각: aria.tsx에 Fragment 감지 예외 추가 — 범용 코드 오염
- **Non-Goals**: 이미지 에셋 제작, 디자인 변경, 에디터 UI 변경

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | CMS 에디터에서 모바일(375px) 프리뷰 | Hero 슬라이드 표시 | 타이틀이 잘리지 않고 읽힘 | |
| S2 | 프레젠테이션 모드에서 이미지 없는 Hero | 해당 섹션 도달 | 거대 빈 공간 대신 shy placeholder | |
| S3 | 프레젠테이션 모드에서 이미지 없는 Gallery | 해당 섹션 도달 | 각 아이템에 shy placeholder, 캡션 유지 | |
| S4 | CMS 페이지 로드 | 콘솔 확인 | Fragment ref 에러 0건 | |
| S5 | CMS 에디터에서 태블릿(768px) 프리뷰 | 카드/그리드 슬라이드 | 레이아웃이 자연스럽게 축소 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| cmsNodePresentation.tsx 수정 | 5개 Fragment 노드를 wrapper 요소로 변경 | |
| CmsPresentMode.tsx 수정 | 빈 이미지 `return null` → shy placeholder 렌더링 | |
| CmsLanding.module.css 수정 | @container 규칙 강화: 폰트 축소, 여백 조정, 스택 전환 | |
| landingTokens.css 수정 (?) | vw → cqi 전환 또는 @container 내 override | |

완성도: 🟢

## ③ 인터페이스

### 3-A. Fragment ref 에러 제거

현재 5개 노드의 render()가 Fragment를 반환하여 aria.tsx cloneElement가 ref 전달 실패.

| 노드 타입 | 현재 render 반환 | 왜 Fragment인가 | 해결 | 역PRD |
|----------|----------------|---------------|------|-------|
| stat-value | `<>{data.value}</>` | 텍스트만 반환 | tag: 'span' 이미 있으므로 render에서 텍스트 직접 반환 (Fragment 제거) | |
| step-num | `<>{data.value}</>` | 텍스트만 반환 | 동일 — 텍스트 직접 반환 | |
| pattern | `<><div icon/><span name/></>` | 2개 형제 요소 | `<div>` wrapper + `display: contents` 또는 기존 부모 Tag가 flex이므로 `<div className="contents">` | |
| brand | `<><div/><span/><span/></>` | 3개 형제 요소 | 동일 전략 | |
| badge | `<><span dot/><LocalizedText/></>` | 2개 형제 요소 | 동일 전략 | |

**왜 이 해결인가**: render() 결과는 이미 Tag wrapper(`getNodeTag()`) 안에 들어감. Fragment 내부에 단일 요소면 Fragment 제거, 복수 형제면 `display: contents` div로 감싸서 레이아웃 영향 0.

### 3-B. 빈 이미지 shy placeholder

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| hero-image, src='' | present mode | return null → DOM에서 완전 제거 | 빈 공간 대신 의도를 전달해야 함 | shy placeholder: 축소된 높이 + muted 색상 아이콘 + dashed border | |
| gallery-item, image='' | present mode | return null → DOM에서 완전 제거 | 캡션은 살리고 이미지 자리만 표시 | shy placeholder: 작은 이미지 아이콘 + 축소 높이, 캡션 유지 | |
| hero-image, src='' | editor mode | placeholder div 표시 | 편집 안내 역할 — 변경 없음 | 현행 유지 | |

**Shy placeholder 스펙:**
- 높이: 에디터 placeholder의 1/3 수준 (빈 공간 최소화)
- 색상: `--landing-text-muted` (chroma 0, 존재감 최소)
- 아이콘: lucide `ImageOff` 또는 `Image` (16px) — indicators/ 신규 추가 불필요, cmsNodePresentation에서 lucide 직접 사용 (이미 ChevronRight, ArrowRight import 중)
- border: 1px dashed `--landing-surface-outlined-border`
- 프레젠테이션 모드에서만 적용 (CmsPresentMode.tsx)

완성도: 🟢

### 3-C. 모바일 반응형

**핵심 문제**: `clamp(56px, 7vw, 80px)`의 `vw`는 실제 뷰포트 기준이라, CMS 프리뷰 container가 375px로 줄어도 폰트가 안 줄어듬. `85vh` min-height도 동일 문제.

| 요소 | 현재 | @container ≤768px | @container ≤480px | 왜 | 역PRD |
|------|------|-------------------|-------------------|-----|-------|
| .cmsHeroTitle font-size | clamp(56px,7vw,80px) | 40px | 32px | container 안에서 vw 무효, 절대값으로 override | |
| .cmsHero min-height | 85vh | auto | auto | vh도 container 무효 | |
| .cmsHero padding-top | 20vh | 10cqi | 8cqi | container 비례 여백 | |
| .cmsHeroSubtitle font-size | var(--landing-type-section-size) 18px | 16px | 14px | 좁은 화면 가독성 | |
| .cmsSectionTitle font-size | clamp(28px,3.5vw,40px) | 24px | 20px | 동일 사유 | |
| .cmsManifestoValues | grid 3col | 1fr (이미 있음) | 1fr | 이미 구현됨 | |
| .cmsFeaturesGrid | grid auto | 1fr (이미 있음) | 1fr | 이미 구현됨 | |
| .cmsPatternsGrid | grid 4col | repeat(2,1fr) (이미 있음) | repeat(2,1fr) (이미 있음) | 이미 구현됨 | |
| .cmsGalleryGrid | grid auto | 2col (이미 있음) | 1fr | 375px에서 2col은 좁음 → 1col | |
| .cmsShowcaseGrid | grid auto | 1fr (이미 있음) | 1fr | 이미 구현됨 | |
| .cmsFooterInner | flex-row | flex-col | flex-col | 가로→세로 스택 | |
| .cmsFooterLinks | flex-row | flex-col | flex-col | 링크 세로 스택 | |
| .cmsArticleContent | flex-row | flex-col | flex-col | 아티클 카드 세로 스택 | |
| .cmsHeroCtas | flex-row | flex-col w-full | flex-col w-full | CTA 버튼 세로 풀너비 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 모든 이미지가 비어있는 상태에서 프레젠테이션 | Hero+Gallery 모두 null | shy placeholder가 있으므로 시각적 구멍 없음 | shy placeholder 표시 | 자연스러운 페이지 | |
| 데스크톱 프리뷰에서 이미지 있음 | 정상 렌더링 | shy placeholder 로직이 이미지 있을 때 간섭하면 안됨 | 기존 이미지 그대로 | 변경 없음 | |
| Container query 미지원 브라우저 | @supports fallback | graceful degradation | @media fallback 동작 | 기존 동작 유지 | |
| 프리뷰 뷰포트 전환(모바일↔데스크톱) | 뷰포트 버튼 클릭 | container 크기 변경 → @container 규칙 재평가 | 부드러운 전환 (transition 이미 있음) | 반응형 적용됨 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | ax()만 사용, style={} 금지 (CLAUDE.md) | CSS 수정 | ✅ 준수 | module.css만 수정 | |
| 2 | surface 소유 속성에 last-mile 금지 (feedback_surface_no_lastmile) | shy placeholder | ✅ 준수 | 새 surface 안 만듬, 기존 토큰 사용 | |
| 3 | 디자인 변경 불가 (feedback_cms_rules) | 전체 | ✅ 준수 | CSS 레벨 반응형만, UI 변경 없음 | |
| 4 | container query 기반 (CLAUDE.md 아키텍처) | 반응형 | ✅ 준수 | @container만 사용, @media는 fallback | |
| 5 | indicators/ 사용, 이모지 금지 (CLAUDE.md os 규칙) | shy placeholder | ⚠️ 주의 | lucide 아이콘 사용 — cmsNodePresentation이 이미 lucide import 중이므로 허용 | |
| 6 | 토큰 범위 --landing-* (landingTokens.css) | 새 토큰 | ✅ 준수 | 기존 토큰만 사용, 새 토큰 추가 안 함 | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | cmsNodePresentation.tsx — 5개 노드 render() | wrapper 추가 시 레이아웃 shift | Medium | display:contents로 레이아웃 영향 0. stat-value/step-num은 Fragment 제거만 (텍스트 직접 반환) | |
| 2 | CmsPresentMode.tsx — 빈 이미지 분기 | 프레젠테이션 모드 높이 변화 | Low | shy placeholder는 축소 높이 → 기존 null보다 약간 공간 차지, 허용 | |
| 3 | CmsLanding.module.css — @container 규칙 확장 | 기존 데스크톱 레이아웃 영향 | Low | @container 규칙은 ≤768px에서만 발동, 데스크톱 무영향 | |
| 4 | SectionThumbnail — 축소 프리뷰 | container query가 thumbnail 안에서도 발동할 수 있음 | Medium | thumbnail은 scale transform이라 container size는 원래 크기 유지 → 무영향 확인 필요 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| 1 | 새 CSS 토큰 추가 | ⑤#6 | --landing-* 범위 내 기존 토큰만 | |
| 2 | style={} 인라인 스타일 | ⑤#1 | ax() 시스템 위반 | |
| 3 | 에디터 모드 UI 변경 | ⑤#3 | 디자인 변경 불가 규칙 | |
| 4 | @media 단독 사용 | ⑤#4 | @container 기반, @media는 fallback에서만 | |
| 5 | indicators/ 신규 컴포넌트 생성 | ⑤#5 | lucide 아이콘으로 충분 | |
| 6 | Fragment를 남기고 aria.tsx에 예외 추가 | ①Decision | 범용 코드 오염 금지 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S4 | CMS 페이지 로드 후 콘솔 확인 | "Invalid prop ref supplied to React.Fragment" 에러 0건 | |
| V2 | S1 | 모바일(375px) 프리뷰에서 Hero 타이틀 | 단어 중간 잘림 없이 전체 텍스트 표시 | |
| V3 | S2 | 프레젠테이션 모드, Hero 이미지 비어있을 때 | 축소된 shy placeholder 표시, 거대 빈 공간 없음 | |
| V4 | S3 | 프레젠테이션 모드, Gallery 이미지 비어있을 때 | 각 아이템에 shy placeholder + 캡션 유지 | |
| V5 | S5 | 태블릿(768px) 프리뷰에서 카드 그리드 | 1열 또는 2열로 자연스럽게 축소 | |
| V6 | ④ | 데스크톱 프리뷰 (기존 상태) | 기존 레이아웃 변경 없음 (regression 없음) | |
| V7 | ④ | 이미지가 있는 상태에서 프레젠테이션 모드 | shy placeholder 미표시, 기존 이미지 정상 | |
| V8 | S1 | 모바일 프리뷰에서 Footer | 세로 스택으로 전환, 링크 가독성 유지 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

### 교차 검증

1. **동기 ↔ 검증**: S1-S5 모두 V1-V8로 커버됨 ✅
2. **인터페이스 ↔ 산출물**: 3개 파일 수정이 3-A/B/C와 1:1 대응 ✅
3. **경계 ↔ 검증**: 데스크톱 regression(V6), 이미지 있을 때(V7), container query fallback(④) 커버 ✅
4. **금지 ↔ 출처**: 6개 금지 모두 ⑤/① 출처 유효 ✅
5. **원칙 대조 ↔ 전체**: lucide 사용은 기존 패턴과 일치, 위반 없음 ✅

#kind/prd #topic/cms
