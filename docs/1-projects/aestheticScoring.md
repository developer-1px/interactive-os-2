# 미감 점수화 — 2축 분석과 방향 — 2026-03-25

## 핵심 발견

토큰 값이 검증된 디자인(claude.ai)에서 추출되었으므로 **값 자체는 문제가 아니다.** 미감이 갈리는 결정적 원인은 토큰과 최종 렌더링 사이의 **조합 레이어**에 있다.

## 2축

### 축 1: 비례/배치 (Layout Structure)

토큰이 커버하지 않는 레이아웃 결정.

| 토큰이 결정 | 토큰이 결정하지 않음 |
|---|---|
| 색상, 간격 값, 크기, 둥글기, 그림자 | 요소가 컨테이너의 몇 %를 차지하는가 |
| | 형제 요소들의 분배 비율 |
| | 비례 제약 유무 (aspect-ratio, max-width) |
| | 그리드 컬럼 수 |
| | 여백 분포 |

**실제 사례:** 프리미티브 프리뷰에서 `width: 100%` + aspect-ratio 없이 늘림 → 모든 토큰이 맞는데 비율이 안 좋음. `max-width: 960px` + 6컬럼 고정으로 수정 → 해결.

**점수화:** lint로 검사 가능 — max-width/aspect-ratio 유무, 컬럼 수 vs 아이템 수 일치 등.

### 축 2: 역할 일관성 (Role Consistency)

같은 역할의 페이지가 다른 CSS 경로를 타는 것.

| 역할 | 현재 경로들 | 문제 |
|------|-----------|------|
| Prose (콘텐츠 노출) | AreaViewer / PageDocs / MarkdownViewer / 직접 컴포넌트 | **3~4개 난립** |
| Showcase (데모) | PageUiShowcase / PageThemeCreator | 2개 |
| Tool (도구) | 각자 고유 | 정상 (도구마다 다른 건 맞음) |

**실제 사례:** `/internals/area/plugins`와 `/internals/primitives/aria`가 같은 "콘텐츠 노출"인데 여백/본문 스타일이 다름. 원인: 전자는 MdPage + AreaViewer.module.css, 후자는 PageAriaComponent 직접 렌더링.

**점수화:** lint로 검사 가능 — 같은 역할의 페이지가 공유 렌더러를 쓰는가.

**원칙:** 역할이 같으면 같은 디자인을 써야 한다.

## 해결 방향

### 비례/배치 → DESIGN.md에 배치 규칙 추가

조합 규칙(§3)에 레이아웃 규칙 추가:
- 컨테이너에 max-width 또는 컬럼 제약 필수
- 가변 폭 요소에 aspect-ratio 또는 고정 높이 필수
- 그리드 컬럼 수 = 아이템 수 (auto-fit 지양)

### 역할 일관성 → Prose 렌더러 통일

- Prose 역할 페이지를 전부 MdPage 렌더러로 통일
- 직접 컴포넌트(PageAriaComponent 등) → MdPage 마이그레이션
- routeConfig에 역할(role) 필드 추가 검토

## 점수화 3층 전략 (조사 결과에서)

| 층 | 도구 | 대상 | 정확도 |
|---|------|------|--------|
| Lint | Stylelint + 커스텀 / score 스크립트 | raw value 위반, 번들 미사용, 비례 제약 누락 | 100% |
| Score | CSS AST 분석 | 번들 준수율, 비례 제약 준수율, 역할 일관성 | 높음 |
| Judge | MLLM 스크린샷 | 여백 균형, 시선 흐름, 정보 밀도 | 72~77% |

상세: docs/3-resources/22-[design]aestheticScoring.md

## 다음 행동

- [ ] Prose 렌더러 통일 (MdPage로) — 별도 PRD
- [ ] DESIGN.md §3에 배치 규칙 추가
- [ ] `pnpm score:aesthetics` 스크립트 — lint 층부터 시작
