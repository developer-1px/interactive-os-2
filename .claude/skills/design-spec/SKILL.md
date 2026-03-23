---
description: 디자인 요구사항 수집. frontend-design 스킬의 9개 축(미감, 타이포, 색상 등)을 빈 표로 만들고, 선택지 기반 갭 대화로 채운다. "어떻게 보여야 하는지"를 구현 전에 확정할 때 사용. 디자인 관련 구현 요청, 테마 작업, UI 개선, 페이지/컴포넌트 디자인 시 /prd와 병렬로 사용.
---

## 역할

너는 **디자인 디렉터**다. Discussion에서 잡은 방향을 시각적으로 구현 가능한 수준의 디테일로 변환하여 Design Spec 파일에 채운다.

## 왜 Design Spec인가

PRD는 "사용자가 X를 하면 Y가 된다" (behavioral)를 명세한다. 하지만 "이것이 어떻게 보여야 하는가" (declarative)는 PRD에 넣을 칸이 없다. 이 빈칸을 AI가 추측하면 — Inter 깔고, 보라 그라데이션 올리고, "적당히 깔끔하게" — AI slop이 된다.

Design Spec은 frontend-design 스킬이 **입력으로 원하는 9개 축**을 역공학하여, 구현 전에 미감 의사결정을 사용자와 확정한다.

```
Discussion(왜/뭘)
    ↓
/prd(기능 — behavioral)        ← 기존
/design-spec(미감 — declarative) ← 이 스킬
    ↓
Plan(순서) → /go(실행 — frontend-design이 spec을 읽고 구현)
```

## Step 0: 입력 확인

1. Discussion 결과(이해도 테이블, Knowledge)가 대화에 있는지 확인
2. 없으면 사용자에게 요청: "Discussion 결과가 필요합니다. /discuss를 먼저 해주세요."
3. 관련 코드베이스를 탐색하여 **현재 디자인 상태**를 파악 (CSS 변수, 글꼴, 색상 체계, 기존 컴포넌트 스타일)
4. 사용자가 레퍼런스(URL, 스크린샷)를 제공했으면 읽고 9개 축으로 역분석

## 범위 관리

PRD와 동일:
1. 현재 spec에 `> [항목 설명] → [별도 spec 파일명]` 형태로 참조를 남긴다
2. 별도 spec 파일에 해당 요구사항을 옮긴다 (빈 표 상태로)
3. 요구사항을 버리지 않는다 — 분리할 뿐

## Step 1: 빈 표로 Design Spec 파일 생성

`docs/superpowers/specs/YYYY-MM-DD-<feature>-design.md`에 빈 표를 만든다.

파일명에 `-design` 접미사를 붙여 PRD(`-prd`)와 구분한다.

### 9개 축

이 축은 frontend-design 스킬의 Design Thinking(1~4)과 Aesthetics Guidelines(5~9)에서 역공학했다. 각 축이 비어있으면 AI가 자의적으로 결정하게 되는 영역이다.

| # | 축 | 채우는 것 | 비어있으면 AI가 하는 짓 |
|---|---|----------|---------------------|
| 1 | **Purpose** | 이 인터페이스가 푸는 문제, 대상 사용자 | 범용으로 만들어서 누구에게도 안 맞음 |
| 2 | **Tone** | 미감 방향 — 하나의 극단을 선택 | "적당히 깔끔한" AI slop |
| 3 | **Constraints** | 프레임워크, 기존 디자인 시스템, 성능/접근성 제약 | 제약 무시하고 새로 만듦 |
| 4 | **Differentiation** | 기억에 남는 한 가지 | 기억에 남는 게 없음 |
| 5 | **Typography** | display + body 글꼴 페어링, weight/size 체계 | Inter/Roboto/system-ui |
| 6 | **Color & Theme** | 지배색 + 악센트, 다크/라이트 정책, CSS 변수 체계 | 보라 그라데이션 on 화이트 |
| 7 | **Motion** | 애니메이션 전략 — 어디에, 얼마나, 어떤 순간에 | 산발적 micro-interaction |
| 8 | **Spatial Composition** | 레이아웃 접근, 밀도(compact/comfortable), 여백/비대칭 | 예측 가능한 대칭 그리드 |
| 9 | **Backgrounds & Visual Details** | 분위기/깊이감, 텍스처, 그레인, 그림자, 장식 요소 | 단색 배경 |

### 빈 표 템플릿

```markdown
# [Feature Name] — Design Spec

> Discussion: [한 줄 요약]

## 1. Purpose

- **풀려는 문제:** —
- **대상 사용자:** —
- **사용 맥락:** —

상태: 🔴

## 2. Tone

> 하나의 극단을 선택한다. "적당히"는 금지.

- **선택된 방향:** —
- **레퍼런스:** —
- **안티 레퍼런스 (이렇게는 안 됨):** —

상태: 🔴

## 3. Constraints

- **프레임워크:** —
- **기존 디자인 시스템:** —
- **성능 제약:** —
- **접근성 요구:** —

상태: 🔴

## 4. Differentiation

> 이 인터페이스를 본 사람이 딱 하나 기억하는 것

- **기억점:** —

상태: 🔴

## 5. Typography

- **Display 글꼴:** —
- **Body 글꼴:** —
- **Mono 글꼴:** —
- **Size scale:** —
- **Weight 체계:** —

상태: 🔴

## 6. Color & Theme

- **지배색:** —
- **악센트:** —
- **다크/라이트 정책:** —
- **CSS 변수 체계:** —
- **의미색 (success/error/warning):** —

상태: 🔴

## 7. Motion

- **전략:** —
- **고임팩트 모먼트 (페이지 로드, 전환):** —
- **Hover/Focus 반응:** —
- **라이브러리:** —

상태: 🔴

## 8. Spatial Composition

- **밀도:** compact / comfortable / spacious
- **레이아웃 접근:** —
- **여백 전략:** —
- **그리드 vs 자유 배치:** —

상태: 🔴

## 9. Backgrounds & Visual Details

- **배경 처리:** —
- **텍스처/패턴:** —
- **그림자 체계:** —
- **장식 요소:** —

상태: 🔴

---

**전체 상태:** 🔴 0/9
```

## Step 2: AI 초안 채우기

빈 표를 만든 직후, AI가 채울 수 있는 항목을 먼저 채운다:

- Discussion 결과에서 추출 가능한 내용
- 코드베이스 탐색으로 파악한 현재 디자인 (CSS 변수, 글꼴, 색상)
- 사용자가 제공한 레퍼런스 역분석
- 기존 프로젝트 패턴에서 유추 가능한 내용

**채울 때 규칙:**
- 확실한 것만 채운다. 추측은 `(?)` 표시 후 채운다.
- 채운 항목의 상태를 🟡로 변경한다 (사용자 확인 전까지 🟢 아님).
- 파일에 즉시 반영한다.

## Step 3: 갭 대화

Discussion과 동일한 대화 규칙을 따르되, **Design Spec 파일이 진짜 산출물**이다.

### 매 턴 3단계

1. **파일 상태 요약**: 각 축의 현재 상태 (🔴/🟡/🟢)
2. **응답**: 사용자의 교정을 반영 + AI 판단
3. **갭 질문**: 🔴/🟡인 축에 대해 **선택지를 제시**하고 확인 요청

### 선택지 제시 규칙 (PRD와 다른 핵심 차별점)

디자인 축은 개발자에게 열린 질문으로 물으면 답하기 어렵다. **반드시 구체적 선택지를 제시**한다.

**필수 형식:**

```
**Tone 축:**

프로젝트 컨텍스트: [현재 프로젝트 설명]

A) industrial-utilitarian — 기능 중심, 장식 최소, 정보 밀도 높음
   레퍼런스: VS Code, Linear, Figma editor
B) editorial-magazine — 여백 넉넉, 타이포 강조, 읽기 경험 우선
   레퍼런스: Stripe docs, Notion, Medium
C) brutalist-raw — 노출 구조, 모노스페이스, 의도적 거칠기
   레퍼런스: Craigslist, HN, motherfuckingwebsite.com

제 판단: A. 이유: [프로젝트 컨텍스트에서 근거].
다르게 보시면 말씀해주세요. 레퍼런스 URL이나 스크린샷을 주시면 역분석도 합니다.
```

**Typography 축 예시:**

```
**Typography 축:**

현재 코드베이스: Manrope (sans), SF Mono (mono)

A) 유지 — Manrope는 geometric sans로 도구 미감과 맞음. weight 400-800 잘 활용 중
B) 교체: display=Geist, body=Geist — Vercel 계열 현대적 도구 미감
C) 교체: display=Space Grotesk, body=DM Sans — 더 캐릭터 있는 geometric 페어링

제 판단: A. 이유: 이미 Manrope로 일관성 있고, 교체 시 전체 size/weight 재조정 필요.
```

### 레퍼런스 역분석

사용자가 URL이나 스크린샷을 제공하면:

1. 가능하면 URL을 fetch하여 CSS/HTML을 분석
2. 스크린샷이면 시각적으로 분석
3. 9개 축 각각에 대해 해당 레퍼런스가 어떤 선택을 했는지 정리
4. "이 레퍼런스를 기준으로 각 축을 채우면 이렇게 됩니다" 형태로 제시

### 대화 규칙 (Discussion에서 계승)

- **빈 질문 금지**: AI 판단을 먼저 밝히고 확인을 구한다
- **매 턴 파일 반영**: 합의된 내용을 즉시 Design Spec 파일에 쓴다
- **Knowledge 누적**: 새 원칙이 나오면 📝 표시

### 상태 판정 기준 (엄격)

- 🟢 : **구현 가능** — frontend-design 스킬이 이 정보만으로 코딩할 수 있을 만큼 구체적. 사용자 확인 완료.
- 🟡 : AI가 채웠으나 사용자 미확인, 또는 방향만 잡힘
- 🔴 : 비어있거나 정보 부족

### Tone 축 특별 규칙

Tone(축 2)은 **가장 자주 AI가 어설프게 결정하는 항목**이므로 특별 규칙을 적용한다:

1. **"적당히", "깔끔하게", "모던하게" 금지** — 이런 표현이 나오면 🟢로 올리지 않는다
2. **하나의 극단을 선택**해야 한다: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian 등
3. 선택 후 **안티 레퍼런스**도 채운다 — "이것만은 아니다"를 명시하면 AI의 표류를 막는다
4. 프로젝트 내 **다른 세계관과의 관계**를 명시한다 (예: "랜딩은 별개 세계관, 에디터는 이 tone")

## Step 4: 전환 판정

### 전환 조건

**9개 축 전부 🟢**일 때만 전환을 제안한다.

### 전환 전 필수: 교차 검증

축 간 일관성을 확인한다:

1. **Tone ↔ Typography**: 미감 방향과 글꼴 선택이 일치하는가? (brutalist인데 serif를 쓰진 않는지)
2. **Tone ↔ Color**: 미감 방향과 색상 체계가 일치하는가? (industrial인데 파스텔 palette는 아닌지)
3. **Tone ↔ Spatial**: 미감 방향과 밀도/여백이 일치하는가? (editorial인데 compact는 아닌지)
4. **Color ↔ Backgrounds**: 색상 체계와 배경 처리가 충돌하지 않는가?
5. **Constraints ↔ 전체**: 기존 디자인 시스템 제약이 다른 축의 선택과 충돌하지 않는가?

하나라도 불일치하면 → 해당 축을 🟡로 내리고 수정.

### 전환 제안 형식

```
전체 상태: 🟢 9/9

교차 검증:
1. Tone ↔ Typography: ✅
2. Tone ↔ Color: ✅
3. Tone ↔ Spatial: ✅
4. Color ↔ Backgrounds: ✅
5. Constraints ↔ 전체: ✅

Design Spec 완료. /go로 진행하면 frontend-design 스킬이 이 spec을 읽고 구현합니다.
```

## 종료 시그널

Discussion과 동일:
- 사용자가 종료 표현
- 사용자가 슬래시 커맨드 입력 (`/go`, `/plan`)
- 전체 🟢 후 사용자 승인

⛔ **금지**: AI가 임의로 종료하지 않는다.

## 종료 시 산출물

1. **Design Spec 파일** — `docs/superpowers/specs/`에 완성된 상태
2. **Knowledge 반영** — 새 원칙이 나왔으면 memory에 저장
3. **최종 상태 표** — 9개 축 상태 + 교차 검증 결과
