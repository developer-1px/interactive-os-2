# CMS 랜딩 디자인 다양화 — 2026-03-24

## 배경

디자인 시스템(5개 번들: surface/shape/type/tone/motion)을 CMS 랜딩에 적용 완료. landingTokens.css를 번들 기반으로 전면 재작성하고, 컨텐츠를 영어로 브랜딩했다. Hero Serif + 극적 위계까지 적용.

하지만 **카드 구성이 전부 동일**(icon + title + desc)이고, **버튼이 Hero에만 존재**하며, **레이아웃 변형이 없다**. "웹 랜딩"으로서 다양성이 부족하다는 피드백.

## 내용

### 1. 카드 구성 다양화

현재 모든 카드가 `icon + title + desc` 동일 구조. 새 카드 타입 추가:

| 카드 타입 | 구성 | 용도 | 렌더러 추가 필요 |
|----------|------|------|-----------------|
| **code-card** | title + code snippet (syntax highlight) | Features 섹션 — Store/Engine 실제 코드 예시 | `cms-renderers.tsx`에 `type: 'code-card'` 추가 |
| **stat-card** | 큰 숫자 + label + desc | 정량 지표 (705 tests, 16 patterns, 11 plugins) | `type: 'stat-card'` 추가 |
| **comparison-card** | before/after 또는 with/without 대비 | "매번 30줄 vs 플러그인 1줄" 시각화 | `type: 'comparison-card'` 추가 |
| **quote-card** | 인용문 + attribution (작은 버전) | 섹션 내 인라인 인용 | `type: 'quote-card'` 추가 |

### 2. 버튼 추가

현재 Hero에만 CTA 2개. 각 섹션에 맥락에 맞는 버튼 필요:

| 섹션 | 버튼 | 동작 |
|------|------|------|
| Features | "View Architecture →" | /docs 또는 explain 문서 링크 |
| Patterns | "Browse all patterns →" | /ui 페이지 링크 |
| Showcase | "Try the CMS →" | / (CMS 편집 모드) 링크 |
| Journal | 각 기사에 "Read →" | 해당 문서 링크 |

버튼 타입: `type: 'section-cta'` with `{ label, href }` — 기존 `cta` 타입과 구분 (hero용 vs 섹션 인라인용)

### 3. 레이아웃 변형

현재 모든 섹션이 center-aligned + 균일 grid. 변형 필요:

| 섹션 | 현재 | 제안 |
|------|------|------|
| Features | 2x2 균일 grid | **1+3 레이아웃** — 첫 카드(Store)를 full-width hero card로, 나머지 3개를 3-col |
| Patterns | 4x4 균일 grid | **3+1 레이아웃** — 상위 3개를 large card(code snippet 포함), 나머지 13개를 compact grid |
| Showcase | 3x2 균일 grid | **2-col zigzag** — icon 좌/우 교대 배치, 또는 **timeline 형태** |
| Journal | vertical list | **featured + list** — 첫 기사를 large card, 나머지를 compact list |

### 4. Footer tagline 렌더링

`footer-tagline` 엔티티와 CSS 클래스는 추가됨. 렌더러에서 className 매핑(`cmsFooterTagline`)은 완료. 하지만 Footer 렌더러가 `brand` + `links`만 처리하므로, `text` 타입의 `footer-tagline` role이 실제로 보이는지 확인 필요.

### 5. 번들 준수 체크리스트

새 카드 타입 추가 시 반드시 확인:
- [ ] surface: 새 카드의 계층 결정 (raised? outlined? sunken?)
- [ ] shape: 카드 크기에 맞는 radius+padding 세트 (lg for 큰 카드, sm for compact)
- [ ] type: 텍스트 역할별 번들 적용 (title=section, desc=body, code=label-family)
- [ ] tone: 포인트 컬러 최소화
- [ ] motion: 호버 transition 번들 사용

## 검증

1. `http://localhost:5174/` 에서 최소 3가지 서로 다른 카드 구성이 보여야 한다
2. Hero 외에 최소 2개 섹션에 인라인 CTA 버튼이 있어야 한다
3. 최소 1개 섹션이 비균일 레이아웃 (1+3, featured+list 등)이어야 한다
4. CSS에 raw px/hex 값 0개, 모든 값이 `--landing-*` 번들 토큰 사용

## 출처

2026-03-24 디자인 시스템 구축 세션 — discuss → design-extract → design-implement → 컨텐츠 브랜딩 → 카드 다양화 피드백

## 관련 파일

- `src/pages/cms/cms-store.ts` — CMS 데이터 (엔티티 + 관계)
- `src/pages/cms/cms-renderers.tsx` — 노드 타입별 렌더러 + className 매핑
- `src/pages/cms/CmsLanding.module.css` — 번들 기반 CSS (전면 재작성 완료)
- `src/styles/landingTokens.css` — 랜딩 전용 번들 토큰 (독자 관리)
- `DESIGN.md` — 디자인 시스템 명세
- `docs/0-inbox/39-[explain]interactive-os-architecture.md` — 컨텐츠 소스
