# CMS Landing Sections 독립 디자인 시스템 — PRD

> Discussion: CMS 콘텐츠 섹션은 웹 페이지인데 앱 UI 토큰을 그대로 쓰고 있다. 앱과 완전 분리된 독립 토큰 + Apple 스타일 카드/그리드 베리에이션 필요.
> Design Spec: `docs/superpowers/specs/2026-03-24-cms-landing-design.md`

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | CMS 캔버스에 랜딩 섹션이 렌더링됨 | 섹션의 CSS가 앱 토큰(`--surface-*`, `--text-*`)을 참조 | 섹션이 앱 UI와 같은 톤으로 보여서 "관리 도구에 갇힌" 느낌 | |
| M2 | 6개 섹션 variant가 존재 | 모든 variant가 동일한 그리드 패턴(720px, 균일 카드)을 사용 | 스크롤해도 섹션 간 시각적 차이가 없어 단조로움 | |
| M3 | 디자이너가 콘텐츠 톤을 바꾸고 싶을 때 | 토큰이 앱과 공유되어 있어서 콘텐츠만 독립 변경 불가 | 앱 전체가 영향받거나, 하드코딩으로 우회해야 함 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `src/styles/landingTokens.css` | 콘텐츠 전용 토큰 파일. `--landing-*` 네임스페이스. 앱 토큰 참조 0. dark/light 두 세트. | |
| `src/pages/cms/CmsLanding.module.css` | 기존 `PageVisualCms.module.css`를 대체. `--landing-*` 토큰만 참조. variant별 카드/그리드 베리에이션 포함. | |
| `PageVisualCms.module.css` 수정 | 콘텐츠 섹션 스타일 제거. 앱 크롬(사이드바 썸네일 등)에서 참조하는 스타일만 잔류하거나, 새 파일로 이관. | |

**토큰 구조:**

```
--landing-bg-*        (배경: page, card, card-alt, card-accent)
--landing-text-*      (텍스트: heading, body, muted, accent)
--landing-border-*    (보더: subtle, default)
--landing-shadow-*    (그림자: card, card-hover)
--landing-accent      (악센트 1색)
--landing-accent-dim  (악센트 tint)
--landing-font-*      (폰트: display, body, mono)
--landing-size-*      (타이포 스케일: display, title, subtitle, body, caption)
--landing-weight-*    (폰트 weight: display, title, body, caption)
--landing-space-*     (간격: section, card-gap, card-padding, content-max)
--landing-radius-*    (radius: card, card-sm)
```

**그리드 베리에이션 (variant별):**

| variant | 현재 | 변경 후 |
|---------|------|---------|
| hero | 센터 정렬, 풀블리드 | 유지 (풀블리드 히어로) |
| stats | 4등분 균일 그리드 | 1 large stat + 3 small, 또는 2+2 비대칭 |
| features | 2×2 균일 카드 | 1 full-width + 2 half, 또는 3-col 믹스 |
| workflow | 4등분 스텝 | 유지 (수평 타임라인), 카드 내부 여백 확대 |
| patterns | 균일 auto-fill 그리드 | 사이즈 믹스 (일부 2x span) |
| footer | 센터 정렬 | 유지 |

완성도: 🟡

## ③ 인터페이스

> 이 PRD는 CSS/토큰 변경이므로 키보드 인터랙션 변경 없음. 인터페이스 = "토큰 교체 → 톤 전환"의 입출력.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `landingTokens.css`에서 `--landing-accent` 값 변경 | 기본 악센트 | 토큰 값 교체 | 모든 섹션이 `--landing-accent`만 참조하므로 | 전체 섹션 악센트 일괄 전환 | |
| `landingTokens.css`에서 `--landing-bg-*` 값 변경 | 기본 배경 팔레트 | 토큰 값 교체 | 섹션/카드 배경이 `--landing-bg-*`만 참조하므로 | 전체 배경 톤 전환 | |
| `landingTokens.css`에서 `--landing-font-display` 값 변경 | 기본 display 폰트 | 토큰 값 교체 | 모든 display 텍스트가 이 토큰 참조 | 전체 display 폰트 전환 | |
| 앱 토큰(`tokens.css`)의 아무 값 변경 | 앱 UI 변경됨 | — | 콘텐츠 CSS가 앱 토큰을 참조하지 않으므로 | 콘텐츠 섹션 영향 없음 | |
| CMS 사이드바 썸네일이 콘텐츠를 미니 프리뷰 | 썸네일 렌더링 | 콘텐츠 CSS가 적용됨 | 썸네일이 동일 DOM 구조를 zoom:0.1로 렌더링하므로 | 썸네일도 콘텐츠 토큰으로 렌더링 | |

완성도: 🟡

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 앱 다크모드 + 콘텐츠 라이트 톤 | 앱과 콘텐츠 동일 테마 | 콘텐츠는 독립 세계관이므로 앱 테마와 무관해야 | 캔버스 내부만 라이트, 앱 크롬은 다크 유지 | 혼재 가능 | |
| 콘텐츠 토큰에 앱 토큰 이름과 동일한 변수 사용 | — | CSS 변수 cascade로 의도치 않은 값 상속 발생 | `--landing-*` 네임스페이스로 충돌 방지 | 이름 충돌 없음 | |
| 사이드바 썸네일에서 콘텐츠 CSS 적용 | 앱 CSS 환경 내 미니 프리뷰 | 썸네일도 콘텐츠와 같은 모습이어야 편집 시 WYSIWYG | 콘텐츠 토큰이 캔버스+썸네일 모두에 적용 | 일관된 프리뷰 | |
| viewport 모바일(375px)에서 카드 그리드 | 다양한 col 배치 | 좁은 화면에서 multi-col이 깨지면 안 됨 | 1-col fallback 또는 responsive grid | 그리드 적응 | |
| 프레젠트 모드(풀스크린) | 앱 크롬 없음 | 콘텐츠만 보이므로 앱 토큰 의존 시 깨짐 | 콘텐츠 토큰만으로 완결 → 프레젠트 모드 정상 | 독립 렌더링 | |

완성도: 🟡

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | CMS에서 디자인 변경 불가 = 핵심 가치 (memory: feedback_no_design_in_cms) | ② 토큰 구조 | ✅ 준수 — 토큰은 템플릿 레벨, 관리자 접근 불가 | — | |
| P2 | 파일명 = 주 export 식별자 (CLAUDE.md) | ② 파일명 | ✅ 준수 — `landingTokens.css`, `CmsLanding.module.css` | — | |
| P3 | 하나의 앱 = 하나의 store (memory: feedback_one_app_one_store) | ② 구조 | ✅ 준수 — CSS만 분리, store/engine 불변 | — | |
| P4 | never barrel export (CLAUDE.md) | ② 파일 구조 | ✅ 준수 — CSS 파일, 배럴 없음 | — | |
| P5 | Surface 토큰 체계 (memory: project_surface_token_system) | ② 토큰 네임스페이스 | ✅ 준수 — `--landing-*`은 앱 `data-surface`와 독립 | — | |

완성도: 🟡

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | `PageVisualCms.module.css` — 현재 콘텐츠+앱 스타일 혼재 | 콘텐츠 스타일 제거 시 사이드바 썸네일 `SectionThumbnail`이 class 참조 깨짐 | 높 | 썸네일도 새 CSS(`CmsLanding.module.css`)를 참조하도록 변경. `cms-renderers.tsx`의 class 매핑 일괄 갱신. | |
| S2 | `cms-renderers.tsx` — `getNodeClassName` 등이 현재 module CSS import | import 경로 변경 필요 | 중 | `CmsLanding.module.css`로 import 변경 | |
| S3 | `cms.css` — 앱 크롬 스타일(사이드바, 툴바 등) | 앱 크롬은 앱 토큰 유지해야 함 | 낮 | `cms.css`는 앱 크롬 전용으로 유지. 콘텐츠 스타일은 건드리지 않음. | |
| S4 | 프레젠트 모드 `CmsPresentMode.tsx` | 현재 `.cms-landing` class의 앱 토큰 의존 | 중 | 프레젠트 모드도 `CmsLanding.module.css` 참조로 전환 | |

완성도: 🟡

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| X1 | `landingTokens.css`에서 앱 토큰(`--surface-*`, `--text-*` 등) 참조 | ⑤P5, 설계 핵심 | 토큰 독립성 파괴. 톤 교체 불가. | |
| X2 | `CmsLanding.module.css`에서 앱 토큰 직접 사용 | ⑤P5, 설계 핵심 | 위와 동일 | |
| X3 | `cms.css`(앱 크롬)에서 `--landing-*` 토큰 참조 | 역방향 오염 | 앱 크롬이 콘텐츠 토큰에 의존하면 안 됨 | |
| X4 | 카드 그리드 레이아웃을 토큰으로 제어 | 설계: 토큰=값, 레이아웃=CSS | 토큰 교체로 톤은 바뀌되 레이아웃은 불변이어야 | |
| X5 | 관리자에게 토큰 값 노출/편집 UI | ⑤P1 | CMS 관리자는 디자인 변경 불가 | |

완성도: 🟡

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①M1 | 콘텐츠 섹션 CSS에 앱 토큰 변수가 0개 | `CmsLanding.module.css`에서 `--surface-*`, `--text-*` 등 grep 결과 0 | |
| V2 | ①M3 | `--landing-accent` 값을 red로 변경 | 모든 섹션의 악센트가 red로 일괄 전환 | |
| V3 | ①M2 | features 섹션과 patterns 섹션의 그리드 column 수가 다름 | 시각적 확인: features는 1+2 또는 3-col, patterns는 사이즈 믹스 | |
| V4 | ④ 앱다크+콘텐츠라이트 | 앱 다크모드에서 콘텐츠 토큰을 라이트로 설정 | 캔버스 내부만 라이트, 사이드바/툴바는 다크 유지 | |
| V5 | ④ 썸네일 | 사이드바 썸네일이 콘텐츠 CSS로 렌더링 | 썸네일과 캔버스가 같은 톤 | |
| V6 | ④ 프레젠트 | 프레젠트 모드에서 콘텐츠 렌더링 | 앱 토큰 없이 정상 렌더링 | |
| V7 | ④ 모바일 | viewport 375px에서 카드 그리드 | 1-col fallback, 깨지지 않음 | |

완성도: 🟡

---

**전체 완성도:** 🟡 8/8 (전부 채움, 사용자 확인 대기)
