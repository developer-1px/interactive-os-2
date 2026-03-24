# CMS Editorial Landing — Design Spec

> Discussion: 기존 SaaS 랜딩(hero→stats→features→...)을 완전 폐기. AI가 만들었을 것 같지 않은 editorial/magazine 스타일로 재구성. 거대 타이포 + 여백 + 비대칭 + 카드 없음.

## 1. Purpose

- **풀려는 문제:** 현재 홈페이지가 "AI에게 랜딩 만들어줘" 하면 나오는 전형적 SaaS 패턴(badge→hero→stats→features→CTA→footer). 어떤 제품 홈이든 다 비슷하게 보임.
- **대상 사용자:** interactive-os에 관심 있는 프론트엔드 개발자. 기술 제품을 평가하러 온 사람.
- **사용 맥락:** CMS 캔버스 내 렌더링 + 프레젠트 모드. 독립 토큰 시스템(`--landing-*`) 위에서 동작.

상태: 🟢

## 2. Tone

> 하나의 극단을 선택한다. "적당히"는 금지.

- **선택된 방향:** editorial-typographic — 매거진의 표지와 스프레드처럼 타이포그래피가 레이아웃을 지배. 정보를 나열하지 않고, 읽히게 한다. 콘텐츠에 리듬과 호흡이 있다.
- **레퍼런스:** The Verge (대담한 타이포 + 비대칭), Bloomberg Businessweek 웹 (텍스트가 곧 디자인), Eye on Design (AIGA — 서체 중심 레이아웃)
- **안티 레퍼런스:** SaaS 랜딩 (Stripe/Linear/Vercel 포함 — 이것들도 이제 AI slop의 원형), Bootstrap 카드 그리드, 어떤 형태든 균일 카드 반복
- **앱 UI와의 관계:** 완전 별개 세계관. 앱 크롬은 industrial-utilitarian, 콘텐츠는 editorial.

상태: 🟢

## 3. Constraints

- **프레임워크:** React + CSS. 독립 토큰 시스템(`landingTokens.css`) 위에서 동작.
- **기존 디자인 시스템:** 앱 토큰 참조 0. `--landing-*` 토큰만 사용. 토큰 값 교체로 톤 전환 가능 유지.
- **성능 제약:** 외부 폰트 1개까지 추가 허용 (display용). 이미지 없음 — 타이포+CSS만.
- **접근성 요구:** WCAG 2.1 AA. 큰 텍스트라도 대비 유지.
- **CMS 구조:** store + engine + spatial nav 유지. 노드 타입/스키마는 변경 가능.

상태: 🟢

## 4. Differentiation

> 이 인터페이스를 본 사람이 딱 하나 기억하는 것

- **기억점:** "글자가 곧 디자인이었다." — 카드도, 아이콘도, 일러스트도 없이 타이포그래피의 크기·굵기·위치만으로 위계와 리듬을 만든다. 한 화면에 하나의 문장이 압도한다.

상태: 🟢

## 5. Typography

- **Display 글꼴:** Serif 계열 — editorial 느낌의 핵심. 후보: Playfair Display, DM Serif Display, Lora, 또는 Noto Serif KR (한글 지원). 기존 Manrope(sans)와 극단적 대비.
- **Body 글꼴:** Manrope 유지 (이미 로드됨). display=serif, body=sans 페어링은 매거진 클래식.
- **Mono 글꼴:** SF Mono 계열 유지 (코드 스니펫용).
- **Size scale:** display 80~120px(!), subtitle 32~48px, body 18~20px, caption 12~14px. 기존 대비 display가 2배 이상. 극단적 크기 대비가 editorial의 핵심.
- **Weight 체계:** display 700~900 (serif bold), body 400, accent text 600. Serif의 굵은 weight가 시각적 앵커.

상태: 🟢

## 6. Color & Theme

- **지배색:** 거의 모노크롬. 검정 배경 + 백색 텍스트 (다크), 또는 백색 배경 + 검정 텍스트 (라이트). 중간 회색 최소화 — 명암 대비를 극단적으로.
- **악센트:** 단일 색상 1개. 매우 절제된 사용 — 링크와 강조 텍스트에만. 면적 5% 미만.
- **다크/라이트 정책:** `--landing-*` 토큰 dark/light 세트. 기존 구조 유지.
- **CSS 변수 체계:** `--landing-*` 네임스페이스 유지.
- **의미색:** 불필요.

상태: 🟢

## 7. Motion

- **전략:** 범위 밖 (이전 사이클과 동일). 나중에 별도 추가.

상태: ⬜ (범위 밖)

## 8. Spatial Composition

- **밀도:** ultra-spacious. 화면의 50~70%가 빈 공간. 매거진은 여백으로 말한다.
- **레이아웃 접근:** 비대칭 2~3단. 텍스트가 화면 한쪽에 치우침. 센터 정렬 금지 (센터 = AI 기본값). 좌측 정렬 또는 오른쪽 정렬이 교차.
- **여백 전략:** 섹션 간 간격 120~200px. 텍스트 블록 주변 여백이 텍스트보다 넓다. 여백 자체가 디자인 요소.
- **그리드 vs 자유 배치:** 비정형. 12-col 그리드를 쓰되 텍스트가 3~5col만 차지하고 나머지는 빈다. 섹션마다 텍스트 위치가 달라진다 (좌→우→좌 리듬).
- **카드:** 없음. 보더도 없음. 텍스트 블록과 여백만으로 구성.

상태: 🟢

## 9. Backgrounds & Visual Details

- **배경 처리:** 순수 단색. 그라데이션/글로우/패턴 없음.
- **텍스처/패턴:** 없음. 인쇄물의 깨끗함.
- **그림자 체계:** 없음. 그림자는 UI 요소(카드, 버튼)에 쓰는 것. 이건 매거진.
- **장식 요소:** 없음. 타이포가 유일한 시각 요소. 예외적으로 가는 수평선(hairline rule)만 구분자로 허용.

상태: 🟢

---

**전체 상태:** 🟢 8/9 (Motion ⬜ 범위 밖)

**교차 검증:**
1. Tone(editorial) ↔ Typography(serif display): ✅ 매거진 = serif 클래식
2. Tone(editorial) ↔ Color(모노크롬): ✅ 인쇄물 = 흑백 기반
3. Tone(editorial) ↔ Spatial(ultra-spacious + 비대칭): ✅ 매거진 = 여백이 디자인
4. Color(모노크롬) ↔ Backgrounds(순수 단색): ✅ 일관
5. Constraints(landing 토큰) ↔ 전체: ✅ 토큰 교체 가능 유지
