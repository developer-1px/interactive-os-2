# 내가 구축한 AI 협업 시스템 — 실물 쇼케이스

> 작성일: 2026-03-25
> 작성자: FE개발
> 성격: "이런 걸 만들었다"를 실물 위주로 보여주는 문서

---

## 1. 커스텀 스킬 26개를 직접 설계·작성했다

Claude Code의 스킬 시스템을 활용해 **슬래시 커맨드 26개**를 직접 만들었다. 총 4,667줄. 외부 플러그인을 가져다 쓴 게 아니라, 프로젝트 운영 경험에서 패턴을 추출하여 하나씩 만들었다.

### 코어 파이프라인 — 직접 설계한 5단계 순환 구조

```
/discuss ──→ /prd ──→ /go ──→ /retrospect ──→ /improve
                                    │
                                    ↓
                                 /close
```

| 스킬 | 줄수 | 내가 설계한 핵심 메커니즘 |
|------|------|------------------------|
| `/discuss` | 196줄 | TOC의 Thinking Processes를 11개 요소 테이블로 변환. 🟢/🟡/🔴 이해도 판정 + "첫 🔴에서 멈추기" 출력 알고리즘 설계 |
| `/prd` | 336줄 | 8단계 의존 체인(동기→산출물→인터페이스→경계→원칙대조→부작용→금지→검증) 설계. 완성도 판정 게이트 포함 |
| `/go` | 123줄 | Plan/Execute/Verify 3-phase 자율 오케스트레이터. 상황 판단하여 phase 자율 선택 |
| `/retrospect` | 370줄 | git diff에서 역PRD 자동 생성 → 원본 PRD와 대조 → 갭 테이블 출력. 증거 링크(파일::이름) 필수 |
| `/improve` | 142줄 | 점수 스크립트를 반복 실행하며 hill climbing. 디자인 점수 49%→96% 자율 달성한 실적 |

### 사고 도구 — 논의 중 필요할 때 꺼내 쓰는 도구들

| 스킬 | 내가 설계한 핵심 |
|------|----------------|
| `/conflict` | Evaporating Cloud(대립해소도)를 프롬프트로 구현. 두 방향이 충돌할 때 숨겨진 전제를 찾는 구조 |
| `/doubt` | 존재·적합·분량·효율의 4단 필터. 새 추상화 도입 전 "이거 진짜 필요해?" 게이트 |
| `/ideal` | 추상적 합의를 구체적 산출물(코드 usage, 저니맵, 다이어그램)로 시뮬레이션 |
| `/explain` | Why→How→What→If 골든서클 + 피라미드 원칙(제목=주장, 결론 선행, So What 테스트) 강제 |
| `/resource` | 외부 웹 검색 → 신뢰도 우선순위(공식 스펙 > 공식 문서 > 전문가 블로그 > 커뮤니티) → 구조화된 참고 문서 생성 |

### 품질 게이트 — 자동으로 실행되는 검증

| 스킬 | 내가 설계한 핵심 |
|------|----------------|
| `/naming-audit` | 2축 감사(consistency + aptness). 동의어 드리프트, 패턴 과적 감지. 스크립트(수집+초벌) + LLM(판단) 파이프라인 |
| `/demo-coverage` | 소스 코드 분기 맵 추출 → 데모 컴포넌트 생성 → vitest branch coverage로 충분성 판정 |
| `/simplify` | 커밋 전 필수. 변경 코드의 재사용·품질·효율 리뷰 |

### 문서 관리 — PARA 체계와 연동

| 스킬 | 내가 설계한 핵심 |
|------|----------------|
| `/inbox` | 모든 문서의 진입점. 순번+태그 파일명 자동 생성 |
| `/para` | inbox → PARA 분류 자동 이동 (Projects/Areas/Resources/Archive) |
| `/area` | 구현 완료 후 living doc에 결과 누적. ⬜→🟢 상태 전환 |
| `/publish` | 모듈 단위 문서 완전성 감사. 7섹션 체크 + 빈 곳 자동 채우기 |
| `/close` | 사이클 마무리 오케스트레이터. PROGRESS.md 갱신 → area 누적 → 커밋 → 다음 행동 제안 |
| `/backlog` | 작업 중 발견한 "지금은 아닌 것"을 흐름 끊지 않고 저장. pick으로 꺼내기 |

### 구현 도구

| 스킬 | 내가 설계한 핵심 |
|------|----------------|
| `/debugging` | 재현→관측도구검증→설계의도→수정판단 4단계 강제. "관측 도구 자체의 버그"를 먼저 배제하는 단계가 핵심 |
| `/design-extract` | 레퍼런스 웹사이트에서 디자인 토큰을 **생성이 아니라 실측 추출**. LLM의 "평균적 디자인" 문제 해결 |
| `/design-implement` | DESIGN.md의 5개 번들(surface/shape/type/tone/motion)을 세트로 사용 강제. 토큰 개별 사용 방지 |

---

## 2. 메모리 시스템 60+건을 직접 구축했다

AI가 세션 간에 맥락을 유지하도록 **피드백/원칙/프로젝트 사실을 파일로 영속화**하는 체계를 만들었다.

### 메모리 분류 체계

| 유형 | 건수 | 예시 |
|------|------|------|
| feedback (행동 교정) | 35+ | "mock 호출 검증 금지", "margin 금지 gap 사용", "PRD가 애자일보다 낫다" |
| project (프로젝트 사실) | 20+ | "Behavior는 v1 잔재 Pattern이 올바른 이름", "tooltip은 engine 밖 독립" |
| user (사용자 프로필) | 2 | "키보드 우선 FE 개발자" |
| reference (외부 참조) | 3 | "버그 트래커 위치", "온콜 대시보드" |

### 메모리에서 추출한 핵심 원칙들 (실제 운영 중)

**설계 원칙:**
- 설계 원칙 > 사용자 요구 충족. engine 우회 금지, 충돌 시 거절 + 설계 변경 제안
- 하나의 앱 = 하나의 store, 뷰만 분리
- focusRecovery는 불변 조건. CRUD 있으면 반드시 동작

**코딩 규칙:**
- 파일명 = 주 export 식별자. kebab-case 금지. rename 시 git mv 필수
- CSS 모든 수치는 토큰. raw 숫자 자체가 위반
- margin 금지. gap으로 간격 관리. 부모가 자식 간격 제어
- Focus 표현: 컬렉션 항목→bg, 독립 요소→ring

**워크플로우 규칙:**
- "왜"는 이유를 묻는 질문. 반대 의사로 해석 금지
- 버그 보고 시 코드 읽기 전에 테스트 재현부터
- 수정 전 설계 의도 이해 필수. 테스트 통과 ≠ 올바른 수정
- LLM이 테스트로 스스로 검증. 사람 확인 불필요 (증거는 필수)

### 경험 DB

retrospect에서 반복적으로 발견된 패턴을 **경험 DB**로 추출. 빈도 3회 이상이면 feedback으로 승격하는 규칙.

---

## 3. 문서 체계 70+건을 직접 운영했다

PARA 방법론을 적용한 문서 관리 체계를 구축·운영하고 있다.

### 폴더 구조

```
docs/
├── 0-inbox/        ← 모든 문서의 진입점 (51건)
├── 1-projects/     ← 활성 PRD
├── 2-areas/        ← Living documentation (영역별)
│   ├── axis/       ← navigate, select, expand, dismiss, activate
│   ├── plugins/    ← clipboard, history, focusRecovery
│   ├── primitives/ ← useAria
│   └── ...
├── 3-resources/    ← 외부 조사 자료 (23건)
├── 4-archive/      ← 완료/폐기 문서
├── 5-backlogs/     ← 보류 과제
├── PROGRESS.md     ← 모듈별 maturity concept map
├── ARCHITECTURE.md ← 아키텍처 의사결정 기록
└── GOAL.md         ← 프로젝트 방향
```

### 문서 수명 주기 (직접 설계)

```
발생 → inbox (자동 순번)
  ├─ 활성 명세 → projects/ (구현 중)
  ├─ 영구 지식 → areas/ (계속 갱신)
  ├─ 외부 조사 → resources/ (참조용)
  ├─ 보류 → backlogs/ (나중에)
  └─ 완료/폐기 → archive/ (읽기 전용)
```

### PROGRESS.md — 직접 설계한 concept map

모듈별 maturity를 한눈에 파악하는 표. 모듈 추가/삭제 시 행을 즉시 갱신하고, Maturity와 Gaps는 /retrospect 시 반영.

---

## 4. CI/CD 파이프라인을 구축·정비했다

### 오늘 한 것: CI 전면 정비

| Before | After |
|--------|-------|
| 10+ 커밋 연속 failure | 전수 통과 (green) |
| 1 job 직렬 | 3 job 병렬 (lint/test/build) |
| Node.js 22 (deprecation 경고) | Node.js 24 (경고 0) |
| pnpm 9 하드코딩 | packageManager 필드 단일 소스 |
| 패키지 14개 outdated | **0개** (전수 최신화) |
| 의존성 관리 수동 | Renovate 자동화 (patch 자동 머지) |

### CI 파이프라인 구성

```
push to main
  ├── lint (ESLint 10)
  ├── test (vitest, 799 cases)          ← 3개 병렬 실행
  └── build (tsc + vite + tsup)
```

### 패키지 최신화 성과

| 패키지 | Before → After |
|--------|---------------|
| TypeScript | 5.9 → **6.0** |
| ESLint | 9.x → **10.x** |
| Node.js | 22 → **24** |
| Vite | 8.0.0 → **8.0.2** |
| lucide-react | 0.577 → **1.6.0** |

125개 TypeScript 빌드 에러를 Cynefin 프레임워크로 분류(Clear→Complicated→Complex)하여 체계적으로 해소.

---

## 5. 디자인 시스템을 구축했다

### DESIGN.md — 토큰 기반 디자인 시스템

**"LLM이 평균적인 디자인을 생성하는 문제"**를 해결하기 위해, 레퍼런스 사이트에서 **실측 추출**한 토큰으로 디자인 시스템을 구축했다.

5개 번들 체계:
| 번들 | 역할 | 예시 |
|------|------|------|
| **surface** | 배경·면 | `data-surface="page"`, `data-surface="raised"` |
| **shape** | 간격·크기·반경 | `--shape-gap-md`, `--shape-radius-sm` |
| **type** | 서체·크기·굵기 | `--type-body-size`, `--type-heading-weight` |
| **tone** | 의미 색상 | `--tone-primary`, `--tone-destructive` |
| **motion** | 전환·애니메이션 | `--motion-duration-enter` |

규칙: **CSS의 모든 디자인 수치는 토큰이어야 한다. raw 숫자 자체가 위반.** `/design-implement` 스킬이 이 규칙을 강제한다.

### 자가 개선 루프 실적

`pnpm score:design` 점수 스크립트를 만들고 `/improve`로 자율 루프 실행:
- **시작**: 49%
- **종료**: 96%
- **방법**: AI가 낮은 점수 항목을 식별 → 수정 → 재측정 반복
- **사람 개입**: 점수 스크립트 정의 + 실행 명령만

---

## 6. 테스트 체계를 구축했다

### 테스트 규모

- 84개 테스트 파일
- 799개 테스트 케이스 (전수 통과)
- 1,489개 어설션

### 직접 설계한 테스트 원칙

```
계산 → unit test (순수 함수, node 환경)
인터랙션 → 통합 test (userEvent → DOM/ARIA 상태 검증)
mock 호출 검증 → 금지
셀렉터 → role > data-* > CSS class(금지)
```

### 데모 = 테스트 = 쇼케이스 수렴

`/demo-coverage` 스킬로 **소스 코드의 분기 맵을 추출 → 데모 컴포넌트 생성 → vitest branch coverage로 충분성 판정**하는 루프를 구축. 하나의 데모가 쇼케이스이자 테스트인 구조.

---

## 7. 향후 진행 방향

### 범용 플러그인화

26개 스킬을 분석한 결과:
- **35% (7개)**: 이미 완전 범용 — 프로젝트 의존 0
- **45% (9개)**: 경로/설정 추출만으로 범용화 가능
- **20% (5개)**: 프로젝트 설정 주입으로 범용화 가능

→ 100% 범용화 가능. 글로벌 플러그인으로 분리하여 **어떤 프로젝트에서든** discuss-first 파이프라인을 사용할 수 있도록 준비 중.

### 프로젝트 프로필 설계

CLAUDE.md(행동 지시), MEMORY.md(대화 기억)와 별도로, **project.yml(프로젝트 구조 선언)** 제3의 설정 레이어를 설계 중. 관심사(문서/네이밍/테스트/디자인/품질)별로 철학→구조→도구를 선언하는 방식.
