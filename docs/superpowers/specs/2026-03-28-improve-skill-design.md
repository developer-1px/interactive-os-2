# /improve 스킬 재설계 — 릴리즈 품질 루프

## 한 줄 요약

"이걸 사용자에게 릴리즈할 수 있는가?" — fresh 에이전트가 실제로 보고 실행하며 판단하고, 안 되면 고치는 루프.

## 배경

### 파이프라인에서의 위치

```
discuss → prd → plan → dev → improve → retrospect → publish → close
```

- `/go`(plan→dev→verify): "동작하게 만든다" — 코드가 typecheck/lint/test 통과하는 구조적으로 건전한 상태
- `/improve`: "릴리즈할 수 있게 만든다" — 시각+기능+코드+제품깊이를 사용자 앞에 내놓을 수 있는 수준으로
- 각 스킬은 독립적으로 완결. `/improve`는 `/go`의 Verify를 전제하지 않음

### 왜 별도 에이전트가 평가하는가

Anthropic "Harness Design" 블로그의 핵심 교훈:
- **Self-evaluation bias는 실재** — 만든 에이전트가 자기 작업을 평가하면 문제를 발견하고도 dismiss
- **QA 에이전트는 튜닝 없이는 판단이 흔들림** — few-shot 캘리브레이션 필요
- **Context reset > compaction** — 요약보다 전체 리셋이 나음
- **통신은 파일 기반** — 에이전트 간 컨텍스트 토큰 낭비 방지

## 아키텍처

### 3가지 역할

| 역할 | 누가 | 컨텍스트 | 하는 일 |
|------|------|----------|---------|
| **Planner** | 메인 에이전트 | 프로젝트 맥락 보유 | 평가 기준 수립 + 매 사이클 후 evaluate 보고서 → 수정 전략 |
| **Dev** | 메인 에이전트 | 프로젝트 맥락 보유 | plan에 따라 코드/CSS/테스트 수정 |
| **Evaluate** | fresh 서브에이전트 | 격리 | 실제 앱을 보고/실행하고 릴리즈 가능 여부 판단 |

Planner와 Dev가 같은 메인 에이전트인 이유: 코드베이스 맥락을 유지해야 수정이 효율적. 블로그에서도 plan은 1회, 이후는 build가 QA 피드백을 직접 소화.

### 전체 흐름

```
/improve
  │
  ├─ Step 0: 대상 파악 (뭘 릴리즈 수준으로?)
  ├─ Step 1: dev 서버 확인 + 초기 Evaluate 스폰 (baseline)
  │    └─ 이미 "릴리즈 가능"이면 바로 종료
  │
  └─ Loop (최대 5회전):
       ├─ Plan: evaluate 보고서 → 수정 전략 수립
       ├─ Dev: Critical 1~3개 해결 목표로 수정
       ├─ Evaluate: fresh 서브에이전트 스폰
       │    ├─ 코드 건전성 (typecheck/lint/test/check:deps)
       │    ├─ Playwright/Chrome으로 시각+기능 확인
       │    ├─ 보고서 → 파일 저장
       │    └─ verdict: "릴리즈 가능" or "불가 + 이유"
       ├─ verdict = "릴리즈 가능" → 종료
       └─ verdict = "불가" → 다음 회전
```

## Step 0: 대상 파악

| 상황 | 동작 |
|------|------|
| `/go` 직후 호출 | 방금 만든 것이 대상. git diff에서 변경 범위 추출 |
| 대화에 대상 명시 ("CMS 개선해") | 해당 라우트/모듈이 대상 |
| 인자 있음 (`/improve /chat`) | 해당 라우트가 대상 |
| 맥락 없음 | "뭘 개선할까요?" 질문 |

대상이 정해지면 **해당 라우트의 URL과 진입점 파일**을 식별. evaluate 에이전트가 실제로 접근할 수 있어야 함.

## Step 1: 초기 Evaluate (Baseline)

수정 전에 현재 상태부터 파악:

1. `pnpm dev` 기동 확인 (안 돌면 백그라운드 기동)
2. evaluate 컨텍스트 파일 작성 (대상 URL, PRD, DESIGN.md 등)
3. 첫 evaluate 서브에이전트 스폰 → baseline 보고서
4. verdict가 "릴리즈 가능"이면 바로 종료

## Evaluate 에이전트 상세

### 평가 4축

| 축 | 보는 것 | 도구 |
|----|---------|------|
| **시각적 완성도** | 레이아웃 깨짐, 정렬, 간격, 토큰 준수 | Playwright 스크린샷 or Chrome Claude |
| **기능적 완성도** | 클릭/키보드 동작, 인터랙션 흐름, 에러 상태 | Playwright 조작 or Chrome Claude |
| **코드 건전성** | typecheck, lint, test, 레이어 의존 위반 | pnpm typecheck/lint/test/check:deps |
| **제품 깊이** | stub 수준 아닌가? 실제 사용자가 쓸 만한가? | 사용자 관점 시나리오 수행 |

4축 전부를 매번 보되, 해당 사이클에서 수정한 영역에 가중치.

### 평가 보고서 포맷

```markdown
# Evaluate Report — Round N

## Verdict: 릴리즈 불가 | 릴리즈 가능

## 이전 대비 변화
- 개선: [목록]
- 퇴보: [목록]
- 변화 없음: [목록]

## 발견 사항

### 시각적 완성도
- [Critical] 설명 (스크린샷: screenshot-N-1.png)
- [Minor] 설명

### 기능적 완성도
- [Critical] 설명
- [Minor] 설명

### 코드 건전성
- typecheck: PASS/FAIL
- lint: PASS/FAIL (N issues)
- test: PASS/FAIL (N fail)
- check:deps: PASS/FAIL

### 제품 깊이
- [Critical/Minor] 설명

## 우선순위 제안
1. (Critical) 설명
2. (Critical) 설명
3. (Minor) 설명
```

### 캘리브레이션 기준

- **릴리즈 불가**: Critical이 1개라도 있음
- **릴리즈 가능**: Critical 0, 사용자 시나리오가 끊김 없이 완주 가능
- **Critical 정의**: 사용자가 의도한 동작을 못 하거나 시각적으로 명백히 깨진 것
- **Minor 정의**: 동작은 하지만 polish가 부족한 것

스킬 안에 few-shot 예시 포함하여 판단 기준선을 심는다.

### Evaluate에 전달하는 컨텍스트

```markdown
# Evaluate Context

## 대상
- URL: http://localhost:5173/viewer
- 설명: 메타 쇼케이스 + 문서 viewer

## 참조 (있으면)
- PRD: docs/superpowers/prds/2026-03-27-xxx-prd.md
- 디자인: DESIGN.md

## 이전 보고서 (2회차부터)
- reports/improve-round-0.md
- reports/improve-round-1.md

## 평가 기준
- 4축 평가
- Critical 0이면 릴리즈 가능
```

## 루프 제어

### 변경 범위 제한

한 회전에 너무 많이 고치면 평가 정확도가 떨어지고 퇴보 시 롤백이 어렵다.
원칙: **한 회전에 Critical 1~3개 해결을 목표**. 전부 고치려 하지 않는다.

### 종료 조건

| 조건 | 행동 |
|------|------|
| verdict = "릴리즈 가능" | 종료 → 커밋 |
| 5회전 도달 | 현재까지 개선 요약 + 남은 이슈 보고 → 사용자에게 판단 위임 |
| 2회 연속 정체/퇴보 | 접근 변경 1회 시도 → 안 되면 사용자에게 보고 |
| "범위 밖" 판정 | 해당 이슈 제외하고 나머지로 verdict 재판정 |

### 퇴보 감지와 롤백

evaluate 보고서에 이전 대비 **신규 Critical** 등장 시:

1. git diff로 이번 회전 변경 확인
2. 신규 Critical이 이번 수정 때문인지 판단
3. 맞으면 해당 파일만 `git checkout -- [파일]`
4. 다른 접근으로 재시도

### 보고서 누적

`/tmp/improve-<timestamp>/` 하위에 저장. 대화 세션 동안만 유효.

```
/tmp/improve-20260328-1430/
  improve-context.md      ← evaluate에 전달하는 컨텍스트
  improve-round-0.md      ← 초기 baseline
  improve-round-1.md      ← 1회전 후
  improve-round-2.md      ← 2회전 후
  screenshots/            ← evaluate가 찍은 스크린샷
```

## 엣지 케이스

| 상황 | 처리 |
|------|------|
| dev 서버 기동 불가 | 코드 건전성만 평가, 시각/기능 스킵 + 사유 기록 |
| Playwright/Chrome 둘 다 불가 | 코드 건전성 + 코드 리뷰 기반 fallback |
| 대상이 여러 라우트 | 라우트별 evaluate, 전체 verdict = 가장 낮은 라우트 기준 |
| 초기 evaluate에서 "릴리즈 가능" | 바로 종료 보고 |
| score 스크립트 존재 | evaluate 코드 건전성 축의 추가 시그널로 활용 |

## 기존 스킬과의 관계

| 스킬 | 관계 |
|------|------|
| `/go` | 독립. `/go`는 "동작하게", `/improve`는 "릴리즈 가능하게". 각자 완결 |
| `/retrospect` | `/improve` 종료 후 호출. improve 보고서가 retrospect 입력 |
| `/fix` | 독립. `/fix`는 "고장 수리", `/improve`는 "품질 향상" |
| score 스크립트 | 있으면 evaluate에서 활용, 없어도 동작 |

## 트리거 조건

| 발화 | 트리거 |
|------|--------|
| "/improve", "개선해", "품질 올려" | O |
| "릴리즈 수준으로", "더 다듬어" | O |
| "점수 올려", "score 올려" | O |
| "사용자한테 보여줄 수 있어?" | O |
| "버그야", "안 돼" | X → /fix |
| "만들어줘", "구현해" | X → /go |

## 종료 보고

```
=== /improve 완료 ===
회전: 3회 (baseline + 수정 2회)
시작: Critical 5, Minor 8
종료: Critical 0, Minor 3
수정: 7 파일
verdict: 릴리즈 가능
```
