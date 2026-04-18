# Gemma Critique Loop — Ralph-orchestrated 자율 iteration

**목표**: 디자인 시스템 **관리 시스템** 업그레이드. 점수 해소가 아니라 **피드백 누적 → 메타 지표 도출 → 구조 개선** 루프.

**전제**:
- `scripts/gemmaCritique.mjs` 작동 (ollama daemon @ `localhost:11434` + `gemma4:latest` + dev server @ `localhost:5173`)
- 리포트 출력: `docs/research/ax/gemmaCritique/{label}.md` (timestamp 포함)
- `ralph-loop` 플러그인 (`/ralph-loop` 커맨드)

**선행 루프**: `.claude/sculpt-design-loop.md` (Claude subagent 비평자) — 이 루프는 Gemma로 **승격** 버전.

---

## 매 iteration 절차

### Step 1. 라우트 roster pick

이번 iteration에서 볼 2~3 라우트. `gemmaCritique.mjs`의 기본 public 5개(`/`, `/ax-principles`, `/ui`, `/catalog`, `/showcase/gmail`)에서 로테이션하되, **같은 라우트를 최소 3 iter 간격** 이상 두어 단기 변동 노이즈 방지.

iteration별 기본 로테이션 (디자인 변경이 크면 이전 라우트 재방문):
- iter 1: `/`, `/ui`
- iter 2: `/ax-principles`, `/catalog`
- iter 3: `/showcase/gmail`, `/` (재평가)
- iter 4+: 사람 선택 또는 이전 리포트가 "needs improvement"인 라우트 우선

### Step 2. gemmaCritique 실행

```bash
node scripts/gemmaCritique.mjs <routes...>
```

출력:
- `screenshots/{label}.png`
- `docs/research/ax/gemmaCritique/{label}.md` (덮어쓰기 — 히스토리는 아래 Step 3에서 보존)

**주의**: 현재 `writeReport`는 파일 덮어쓰기. Phase 1-a에서는 iteration별 diff를 git에 커밋하여 히스토리 보존. Phase 2에서 `{label}-{iso-date}.md` 또는 단일 append 파일로 전환 검토.

### Step 3. 리포트 읽기 + 패턴 추출

루프 에이전트(Claude)가 수행:

1. 이번 iteration 리포트 `docs/research/ax/gemmaCritique/*.md` 전체 Read
2. 각 라우트 "Overall" 판정 집계 (good/ok/needs improvement)
3. **반복 지적되는 이슈 군집화** — 이것이 진짜 신호
   - 예: "여백 비율 부족" × 3 라우트 = **spatial 원리 실효 미달**
   - 예: "위계 약함" × 2 라우트 = **typography hierarchy 또는 contrast 갭**
4. git log로 이전 iteration 리포트 diff — **수렴/발산 관찰**

출력: `docs/research/ax/gemmaCritique/summary.md` (append-only 메타 로그)

### Step 4. 액션 분류 (점수 해소 금지)

이슈를 해소하기보다 **어디에 기록할지** 분류:

| 이슈 유형 | 기록 위치 | 후속 |
|----------|---------|------|
| 기존 baseline 지표(focus-apca/text-apca/surface-pairs)에서 이미 측정되는 패턴 | baseline 지표의 **해석 재검토** (Phase 2에서 종합) | 즉시 수정 금지 |
| baseline에 없는 패턴 — Gemma가 보는 축 | `docs/research/ax/04-gap-plan.md`에 **신규 측정 후보**로 추가 (P-XX 카드화) | Phase 2에서 측정 스크립트 설계 |
| 구조적 문제 (예: 위계 누락, 정렬 깨짐) | `docs/0-inbox/` 신규 MD 초안 → PRD 후보 | Phase 3에서 PRD 발행 판정 |
| "good"이 나왔지만 실체는 fail (이전 text-apca 88/88 패턴) | `feedback_` memory 승격 후보 | 즉시 저장 |

**엄수**:
- 점수(Overall 등급, APCA Lc 등)를 올리는 직접 수정 금지
- 수정은 **구조 변경**(PRD)이나 **측정 확장**(축 추가)을 통해서만
- 루프는 관측·기록 기계. 결정은 Phase 2/3에서

### Step 5. 수렴 / 진행 판정

Ralph Loop completion promise 조건:
- `METADATA_STABLE` — iteration 3회 연속 "반복 지적 이슈 군집"이 변동 없음 (노이즈 축소, 축 추가 후보 확정)

완료 못 한 경우 Ralph Loop이 같은 prompt로 다음 iteration 실행.

## Ralph Loop 호출 예시

```
/ralph-loop 읽기: .claude/gemma-critique-loop.md. 매 라운드 Step 1~5 수행. Step 3 summary.md에 누적. --max-iterations 6 --completion-promise METADATA_STABLE
```

## 엄수 규칙

| 규칙 | 이유 |
|------|------|
| 점수를 직접 올리는 sculpt 금지 (이 루프 내에서) | 점수 해소 게임 방지. 사용자 재프레임 |
| 라우트 선택은 로테이션 + 이전 "needs improvement" 우선 | confirmation bias 방지 |
| Gemma 리포트 원문 그대로 summary에 인용 | `feedback_pyramid_preserve_original` |
| iter 간 리포트 덮어쓰기 diff는 git 커밋에 보존 | 수렴 추이 관측 |
| 발견한 신규 축 후보는 즉시 `04-gap-plan.md`에 카드화 | `feedback_specs_not_inbox` — 참조 대상은 specs |
| 2회 연속 같은 이슈 → summary.md에 ⚠ 표기 | 구조적 문제 신호 |
| 3회 연속 같은 이슈 → `feedback_` memory 승격 후보 | 경험 DB 원칙 |

## Phase 2 진입 트리거 (이 루프의 목적)

6~10 iteration 후 `summary.md`에 다음이 축적되면 Phase 2(메타 지표 재설계)로 이관:

1. **반복 이슈 ≥ 5 종류** 의 MECE 리스트
2. **baseline 지표와의 매핑 표** (어느 이슈가 어느 지표와 연결되는지 / 연결 안 되는지)
3. **"good"이지만 실체 fail" 사례 ≥ 2건** (Tooltip 사건의 일반화 후보)

이 세 가지가 확보되면 메타 지표 재설계에 착수할 증거가 쌓인 것.

## 참조

- `scripts/gemmaCritique.mjs` — 루프의 관측 도구
- `.claude/sculpt-design-loop.md` — 선행 루프 (Claude 비평자 기반)
- `docs/research/ax/04-gap-plan.md` — 신규 축 후보가 이곳에 카드화
- `feedback_design_convergence_loop` memory — 측정(A) → 루프(B) 순서 원칙
- `feedback_slot_existence_vs_intent` — 2단 판정 + 스샷 검증 필수
- `feedback_redteam_sharper` — 비평은 반문으로 날카롭게
