# 스킬 에코시스템 현황 보고서

> 작성일: 2026-03-25
> 목적: 범용 플러그인 설계 전 현황 파악 — 설계 제안이 아니라 있는 그대로의 지형도

---

## 1. 전체 인벤토리

26개 스킬, 총 4,667줄.

| # | 스킬 | 줄수 | 한 줄 역할 |
|---|------|------|-----------|
| 1 | discuss | 196 | 의도 정렬 + 문제 구조화 (TOC 11요소) |
| 2 | prd | 336 | 구현 명세 (8단계 의존 체인) |
| 3 | go | 123 | 자율 실행 오케스트레이터 |
| 4 | retrospect | 370 | 의도 vs 결과 diff (역PRD) |
| 5 | improve | 142 | 점수 함수 기반 자율 개선 루프 |
| 6 | close | 110 | 사이클 마무리 + 상태 갱신 |
| 7 | conflict | 152 | 대립해소도 (Evaporating Cloud) |
| 8 | doubt | 113 | 4단 필터로 불필요한 것 제거 |
| 9 | explain | 240 | Why→How→What→If 해설 문서 |
| 10 | ideal | 162 | 이상적 결과를 산출물로 시뮬레이션 |
| 11 | resource | 211 | 외부 웹 조사 → 참고 문서 |
| 12 | debugging | 152 | 재현→관측→의도→수정 4단계 |
| 13 | naming-audit | 212 | 네이밍 일관성/적합성 감사 |
| 14 | demo-coverage | 194 | 소스 분기 맵 → 커버리지 테스트 |
| 15 | design-extract | 242 | 레퍼런스 사이트에서 디자인 토큰 추출 |
| 16 | design-implement | 184 | DESIGN.md 번들 체계로 CSS 작성 |
| 17 | area | 144 | 구현 결과를 area 문서에 누적 |
| 18 | publish | 167 | 문서 완전성 감사 + 빈 곳 채우기 |
| 19 | inbox | 64 | 요청을 inbox 문서로 저장 |
| 20 | para | 75 | inbox → PARA 분류 이동 |
| 21 | backlog | 128 | "지금은 아닌 것" 저장/조회/꺼내기 |
| 22 | simplify | — | 코드 품질/효율 리뷰 (superpowers) |
| 23~26 | workspace 스킬 | — | debug-flow, debugging, discuss, prd 워크스페이스 |

---

## 2. 호출 관계 (있는 그대로)

### 주요 파이프라인

```
discuss ──→ prd ──→ go ──→ retrospect ──→ improve
   │                 │         │              │
   │                 │         ↓              │
   │                 │       close ←──────────┘
   │                 │         │
   ↓                 ↓         ↓
conflict           simplify   area / publish
doubt              naming-audit
ideal              backlog
resource
```

### 스킬 간 참조 관계 (명시적으로 언급하는 것)

| 호출하는 스킬 | 참조하는 스킬들 |
|-------------|---------------|
| **discuss** | conflict, ideal, resource, prd, go |
| **prd** | discuss, go, retrospect |
| **go** | prd, retrospect, simplify, naming-audit, backlog |
| **retrospect** | prd, backlog |
| **close** | retrospect, area, publish, simplify, backlog, go |
| **improve** | discuss, prd, go |
| **publish** | area, retrospect, demo-coverage, close, improve |

### 진입점 유형

| 유형 | 스킬 | 설명 |
|------|------|------|
| **사용자 직접 호출** | discuss, go, debugging, explain, resource | 대화 시작점 |
| **파이프라인 자동 제안** | prd, retrospect, close, area, publish | 이전 단계가 제안 |
| **on-demand 도구** | conflict, doubt, ideal, backlog, inbox, para | 필요할 때 호출 |
| **verify phase 자동** | naming-audit, simplify, demo-coverage | go/close가 호출 |

---

## 3. 프로젝트 의존성 분석

각 스킬이 aria 프로젝트의 어떤 요소에 의존하는지.

### 의존 유형 분류

| 의존 유형 | 설명 | 예시 |
|----------|------|------|
| **경로** | 특정 파일/디렉토리 경로 하드코딩 | `docs/2-areas/`, `docs/PROGRESS.md` |
| **구조** | 문서 구조/형식 전제 | L1→L4 줌 레벨, MDX 형식 |
| **용어** | 도메인 용어 하드코딩 | ARIA 표준, axis/pattern/engine |
| **도구** | 특정 도구 전제 | vitest, pnpm score:design |
| **없음** | 프로젝트 무관 | — |

### 스킬별 의존 매트릭스

| 스킬 | 경로 | 구조 | 용어 | 도구 | 총 의존 |
|------|------|------|------|------|--------|
| discuss | — | — | — | — | **0** |
| prd | specs/ | 8단계 체인 | — | — | **1** |
| go | specs/ | — | — | — | **1** |
| retrospect | specs/, memory/ | 역PRD 형식 | — | git | **2** |
| improve | — | — | — | score 스크립트 | **1** |
| close | PROGRESS.md, ARCHITECTURE | 행 갱신 규칙 | — | git | **3** |
| conflict | — | — | — | — | **0** |
| doubt | — | — | — | — | **0** |
| explain | — | Why→How→What→If | — | — | **0** |
| ideal | — | — | — | — | **0** |
| resource | docs/3-resources/ | SCQ+GHWI 형식 | — | WebSearch | **1** |
| debugging | — | — | — | 브라우저 | **0** |
| naming-audit | — | — | ARIA 용어 | 스크립트 | **2** |
| demo-coverage | axis/, pages/ | — | axis, pattern | vitest | **3** |
| design-extract | — | — | — | 브라우저 | **0** |
| design-implement | DESIGN.md | 5번들 체계 | 토큰명 | — | **2** |
| area | docs/2-areas/ | L1→L4 줌 | — | — | **3** |
| publish | docs/2-areas/, registry | 7섹션 감사 | 모듈명 | — | **4** |
| inbox | docs/0-inbox/ | 순번+태그 | — | — | **1** |
| para | docs/0-inbox/, 2/3/4 | PARA 분류 | — | — | **2** |
| backlog | docs/1-specs/ | — | — | — | **1** |

### 의존도 히트맵

```
의존 0 (완전 범용)  : discuss, conflict, doubt, explain, ideal,
                      debugging, design-extract
                      → 7개 (35%)

의존 1~2 (경미 수정) : prd, go, retrospect, improve, resource,
                      inbox, backlog, naming-audit, design-implement
                      → 9개 (45%)

의존 3+ (깊은 의존)  : close, area, publish, demo-coverage, para
                      → 5개 (20% — but 전부 "설정 주입"으로 해결 가능)
```

---

## 4. 설정으로 추출 가능한 것들

"깊은 의존"이라고 분류한 것들도 의존 대상을 분석하면 패턴이 보인다:

### 반복되는 설정 항목

| 설정 항목 | 참조하는 스킬 | 현재 하드코딩 값 |
|----------|-------------|---------------|
| **문서 루트** | area, publish, para, inbox, resource | `docs/` |
| **영역 문서 경로** | area, publish, close | `docs/2-areas/` |
| **inbox 경로** | inbox, para | `docs/0-inbox/` |
| **스펙 경로** | prd, go, backlog, retrospect | `docs/1-specs/` |
| **리소스 경로** | resource | `docs/3-resources/` |
| **진척 파일** | close | `docs/PROGRESS.md` |
| **아키텍처 파일** | close | `docs/ARCHITECTURE.md` |
| **디자인 시스템** | design-implement | `DESIGN.md` |
| **점수 스크립트** | improve | `pnpm score:design` |
| **테스트 러너** | demo-coverage | `vitest` |
| **네이밍 사전** | naming-audit | ARIA 표준 (암묵적) |
| **파일명 규칙** | inbox, para | `{순번}-[{태그}]{제목}.md` |

### 관찰

1. **문서 IA** 관련 설정이 가장 많이 반복된다 (6개 스킬이 참조)
2. **도구** 설정은 improve, demo-coverage, naming-audit 3개만
3. **용어/사전**은 naming-audit 1개만 — 가장 도메인 특화
4. 모든 "깊은 의존"은 **경로 + 구조** 조합이다. 로직 자체는 범용

---

## 5. 스킬이 커버하지 않는 영역 (빈 곳)

현재 파이프라인에서 암묵적으로 존재하지만 스킬로 정의되지 않은 것:

| 빈 곳 | 현재 상태 | 비고 |
|-------|----------|------|
| **테스트 전략** | CLAUDE.md에 텍스트로 존재 | "계산=unit, 인터랙션=통합" — 스킬이 아님 |
| **커밋 전 체크** | `/simplify` 필수 (CLAUDE.md) | superpowers 스킬 의존 |
| **PR/브랜치 전략** | 암묵적 | 스킬 없음 |
| **코드 리뷰** | superpowers 의존 | 자체 스킬 없음 |
| **온보딩/문맥 전달** | MEMORY.md + CLAUDE.md | 새 세션에 맥락 전달하는 전용 스킬 없음 |
| **의존성 관리** | 방금 Renovate 추가 | 스킬 아님, CI 수준 |
| **성능/접근성 감사** | 없음 | axe-core는 있지만 스킬화 안 됨 |

---

## 6. 스킬 성숙도

사용 빈도와 안정성 기준 주관적 평가.

| 성숙도 | 스킬 | 근거 |
|--------|------|------|
| **안정** (매일 사용, 변경 없음) | discuss, prd, go, retrospect, explain, backlog, inbox | 코어 루프. 변경 빈도 낮음 |
| **활성** (자주 사용, 가끔 수정) | close, improve, conflict, resource, debugging | 사용하면서 개선 중 |
| **초기** (만들었지만 덜 검증) | area, publish, naming-audit, demo-coverage, para | 구조는 있으나 반복 사용 부족 |
| **실험** (방향 탐색 중) | design-extract, design-implement, ideal, doubt | 컨셉 검증 단계 |

---

## 7. 이론적 기반 매핑

docs/3-resources/23-[methodology]discussFirstWorkflowTheory.md에서 분석한 5개 이론이 각 스킬에 어떻게 매핑되는지.

| 이론 | 직접 구현 스킬 | 간접 지원 스킬 |
|------|-------------|---------------|
| **TOC TP** | discuss (11요소 = CRT+EC+FRT+PRT) | conflict (EC 드릴다운) |
| **OODA** | discuss (Orient), go (Act) | debugging (Observe→Orient 특화) |
| **Double-Loop** | discuss (가정 질문), retrospect (가정 재검토) | improve (governing variable 수정) |
| **Deliberate Practice** | improve (피드백+반복), retrospect (오류 활용) | demo-coverage (측정) |
| **PDCA** | prd (Plan), go (Do), retrospect (Check), close (Act) | 전체 순환 |

### 이론이 커버하지 않는 스킬

| 스킬 | 이론적 기반 | 비고 |
|------|-----------|------|
| explain | 교육학 (scaffolding, Bloom's taxonomy) | 별도 이론 영역 |
| resource | 정보 리터러시 | 조사 방법론 |
| design-extract/implement | 디자인 시스템 이론 | 별도 도메인 |
| naming-audit | 언어학 (terminology management) | 별도 도메인 |
| inbox/para/backlog | GTD (Getting Things Done) | Allen의 방법론 |

---

## 8. 요약 — 현재 지형의 특성

### 강점
- **코어 루프가 견고하다**: discuss→prd→go→retrospect→improve 5개가 이론적으로 뒷받침되고 안정적
- **35%가 이미 완전 범용**: 7개 스킬은 프로젝트 의존 0
- **나머지 45%도 경미한 수정**: 경로/설정 추출만으로 범용화 가능

### 약점
- **체계 없이 성장**: 스킬 분류 기준이 암묵적, 명시적 카테고리 없음
- **설정이 하드코딩**: 같은 경로(docs/2-areas/ 등)를 여러 스킬이 반복 참조
- **문서 IA 전략 분산**: inbox, para, area, publish, close가 각각 문서 구조를 알고 있어야 함
- **workspace 스킬 방치**: 4개의 -workspace 스킬이 활용 불명확

### 패턴 (설계 제안 아님, 관찰)
1. 스킬은 자연스럽게 **사고 루프 / 도구 / 게이트 / 관리** 4가지로 묶인다
2. 프로젝트 의존은 대부분 **경로 + 문서 구조** — 로직이 아님
3. 반복 참조되는 설정 항목은 12개로 수렴한다
4. 이론적 기반이 있는 스킬(코어 루프)과 도메인 도구 스킬은 성격이 다르다
