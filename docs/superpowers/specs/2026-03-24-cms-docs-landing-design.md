# CMS Docs Landing — Design Spec

> Discussion: editorial/magazine 톤을 IT Library 기술문서 홈페이지 메인으로 전환. 섹션 구조(hero→manifesto→features→patterns→showcase→journal→testimonial→cta→footer)는 유지. shadcn/ui, Radix, Tailwind CSS docs 계열 vibe.
> 이전 Design Spec: `2026-03-24-cms-editorial-landing-design.md` (archive)

## 1. Purpose

- **풀려는 문제:** editorial 스타일이 기술 라이브러리 홈으로는 과하다. 개발자가 기대하는 "기술문서 홈" 포맷 — 깔끔한 sans-serif, 적절한 정보 밀도, 기능 카드, 코드 스니펫 느낌.
- **대상 사용자:** interactive-os를 평가/도입하려는 프론트엔드 개발자.
- **사용 맥락:** CMS 캔버스 내 렌더링 + 프레젠트 모드. 독립 토큰 시스템(`--landing-*`).

상태: 🟢

## 2. Tone

> 하나의 극단을 선택한다. "적당히"는 금지.

- **선택된 방향:** developer-utilitarian — 도구의 신뢰성이 시각적으로 드러나는 문서 사이트. 장식 없이 정보가 정돈되어 있고, 위계가 명확하며, 코드와 텍스트가 동등한 1급 시민. 깔끔함이 곧 전문성.
- **레퍼런스:** shadcn/ui (카드+border+subtle shadow), Tailwind CSS docs (hero+feature grid), Radix (모노크롬+기능 중심), Zustand/Jotai (미니멀 라이브러리 홈)
- **안티 레퍼런스:** editorial/magazine (Playfair serif, 비대칭, 거대 타이포), SaaS 마케팅 (그라데이션 글로우, 3D), 과도한 애니메이션
- **앱 UI와의 관계:** 앱 크롬(industrial-utilitarian)과 같은 계열이되, 랜딩은 더 여유롭고 더 큰 타이포. 같은 서체, 같은 색상 계열, 밀도만 다름.

상태: 🟢

## 3. Constraints

- **프레임워크:** React + CSS. 독립 토큰 시스템(`landingTokens.css`) 위에서 동작.
- **기존 디자인 시스템:** 앱 토큰 참조 0. `--landing-*` 토큰만 사용. 토큰 값 교체로 톤 전환 가능 유지.
- **성능 제약:** 외부 폰트 추가 없음 — Manrope(이미 로드) + system mono만 사용. Playfair Display 제거.
- **접근성 요구:** WCAG 2.1 AA.
- **CMS 구조:** store + engine + spatial nav 유지.

상태: 🟢

## 4. Differentiation

> 이 인터페이스를 본 사람이 딱 하나 기억하는 것

- **기억점:** "문서인데 라이브러리의 구조가 한눈에 보였다." — 16개 APG 패턴이 그리드로 펼쳐지고, 아이콘이 각 모듈의 정체성을 시각화. 코드 라이브러리의 아키텍처가 페이지 구조에 투영됨.

상태: 🟢

## 5. Typography

- **Display 글꼴:** Manrope (sans-serif, 이미 로드). serif 제거. 기술문서는 sans-serif가 표준.
- **Body 글꼴:** Manrope 유지.
- **Mono 글꼴:** SF Mono / Cascadia Code / system mono 유지.
- **Size scale:** display 48~64px, title 28~36px, subtitle 20~24px, body 16px, caption 13px, label 11px. editorial 대비 display 절반 이하로 줄임. 크기 대비는 유지하되 극단적이지 않게.
- **Weight 체계:** display 700, title 600, body 400, caption 500, label 600. Geometric sans의 semibold가 heading 앵커.

상태: 🟢

## 6. Color & Theme

- **지배색:** neutral gray 스케일. 다크: zinc/slate 계열(#09090B 배경). 라이트: white(#FFFFFF 배경).
- **악센트:** 단일 brand color 없이 모노크롬 유지. 링크/CTA만 약간 밝은 white or subtle blue-gray. 아이콘 색상으로 위계 표현.
- **다크/라이트 정책:** `--landing-*` 토큰 dark/light 세트 유지.
- **CSS 변수 체계:** `--landing-*` 네임스페이스 유지.
- **의미색:** 불필요 (문서 랜딩에는 success/error 없음).

상태: 🟢

## 7. Motion

- **전략:** 범위 밖 (이전 사이클과 동일).

상태: ⬜ (범위 밖)

## 8. Spatial Composition

- **밀도:** comfortable. editorial의 ultra-spacious에서 줄이되, SaaS의 cramped보다는 여유. 화면의 30~40%가 여백.
- **레이아웃 접근:** 센터 정렬 기반, max-width 1200px. 섹션별 그리드 베리에이션(1col, 2col, 3col, 패턴 grid). 비대칭 제거 — 기술문서는 예측 가능한 구조가 신뢰를 줌.
- **여백 전략:** 섹션 간 80~120px. 카드 gap 24~32px. 콘텐츠 영역 inline padding 24~48px.
- **그리드:** 12-col 기반, 섹션별 col 수 변화. features=2col, patterns=4col grid, showcase=3col, journal=vertical list.
- **카드:** 있음. subtle border + 작은 radius. 호버 시 약간의 elevation 변화. shadcn/ui 스타일.

상태: 🟢

## 9. Backgrounds & Visual Details

- **배경 처리:** 단색 기본. 섹션 간 미세한 배경 변화(bg-page vs bg-section-alt)로 리듬 생성.
- **텍스처/패턴:** 없음.
- **그림자 체계:** subtle shadow만. 카드 호버 시 `0 1px 3px rgba(0,0,0,0.1)`. 과도한 elevation 금지.
- **장식 요소:** hairline rule(섹션 구분), subtle border(카드), 아이콘(lucide). 그 외 장식 없음.
- **Border radius:** 8px (카드), 6px (작은 요소). editorial의 0px에서 표준 docs radius로.

상태: 🟢

---

**전체 상태:** 🟢 8/9 (Motion ⬜ 범위 밖)

**교차 검증:**
1. Tone(developer-utilitarian) ↔ Typography(Manrope sans): ✅ 기술문서 = sans-serif
2. Tone(developer-utilitarian) ↔ Color(neutral gray): ✅ 도구 = 모노크롬
3. Tone(developer-utilitarian) ↔ Spatial(comfortable, 센터, 카드): ✅ docs = 예측 가능 구조
4. Color(neutral) ↔ Backgrounds(미세 변화 + subtle shadow): ✅ 일관
5. Constraints(Manrope only) ↔ Typography(외부 폰트 0): ✅
