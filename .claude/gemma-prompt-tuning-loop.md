# ax Refinement Loop — Ralph 자가 수렴 (ax 정립·혁신·개선)

**사용자 재프레임 (2026-04-18)**: "ax 시스템이 개선되고 혁신되고 있어? 그게 핵심이야"

**목표**: ax 시스템이 Gemma 관측을 통해 스스로 갭을 드러내고, 매 iteration에서 **실제 구조 변경 1건**을 반영하여 정립·혁신·개선이 수렴하도록 한다.

**이 루프가 아닌 것**:
- 프롬프트 튜닝 루프 (AS-IS 초기 설계 — 사용자 재프레임으로 무효)
- 점수 해소 루프 (Overall=good 만들기 게임)
- 평가 품질 개선 루프 (수단이 목적화된 형태)

**이 루프인 것**:
- 관측(Gemma) → **ax 시스템 구조 변경** → 재관측 → ... 수렴

## 매 iteration 절차

### Step 1. 관측 (고정 샘플)

```bash
node scripts/gemmaCritique.mjs / /ui
```

- `/` + `/ui` 고정. 다른 라우트는 별도 iter.
- 응답은 `docs/research/ax/gemmaCritique/{root,ui}.md` 덮어쓰기.
- **프롬프트 vP-N 튜닝은 주 작업 아님** — 응답이 너무 모호해서 갭 추출 불가능할 때만 1 iter 할애.

### Step 2. ax 시스템 갭 후보 추출

Gemma 응답을 읽고 각 이슈/좋은 점에 대해:

| 질문 | 해답이 시사하는 것 |
|------|-------------------|
| 이 관찰이 ax의 어떤 **축/토큰/컴포넌트**에 걸리는가? | 직접 수정 가능 지점 |
| 현재 ax가 이 축을 **커버하고 있는가**? | 있으면 sculpt / 없으면 신규 축 |
| 이 이슈가 **구조 설계 갭**인가 **값 조정 갭**인가? | PRD 대상 / sculpt 대상 분리 |
| `ax-baseline.json` **기존 지표**와 매핑되는가? | 매핑 실패 → 새 측정 후보 |

결과를 `docs/0-inbox/gemma-ax-gap-candidates.md`에 **append**. 한 iter당 최소 2 후보 기록.

### Step 3. 개선 대상 1건 선택 + 분류

후보 중 1건을 선택하여 실행. 분류 3가지:

| 분류 | 대상 파일 | 작업 성격 |
|------|---------|---------|
| **(a) 값 조정 (sculpt)** | `src/styles/tokens.css`, `src/styles/ax.css`, `ax-baseline.json` | 기존 축 값 조정 — spacing ratio, color Lc, radius seed 등 |
| **(b) 신규 측정 지표** | `docs/research/ax/04-gap-plan.md` (카드 추가), `scripts/measure*.mjs` (신규) | Gemma 지적이 현 baseline으로 안 잡힘 → 측정 확장 |
| **(c) 구조적 변경** | `docs/2-areas/styles/prds/*-prd.md` (신규 PRD) | 축 자체 추가/삭제, 컴포넌트 재설계 |

**선택 기준**:
- 가장 많이 반복 지적된 후보 먼저 (반복 = 구조적 신호)
- (a) 우선 (변동 비용 최소) → (b) → (c) 순
- 단 (a)로 고칠 수 없는 구조적 갭은 (c)로 직행

### Step 4. 개선 실행 (1 iter = 1 commit)

선택한 분류에 따라 파일 편집 + 커밋.

- 커밋 메시지: `refactor(ax-refine): iter N — <개선 요약>` or `feat(ax-refine): iter N — <신규>`
- Private 축 직접 주입 금지 규약 유지 (CLAUDE.md ax()만)
- baseline 회귀 0 확인 (`pnpm typecheck` + 기존 measure 스크립트)

### Step 5. 재측정

```bash
node scripts/smokeTestPuppeteer.mjs          # 관측 파이프라인 무결
node scripts/gemmaCritique.mjs / /ui         # Gemma 재관찰
# (선택) baseline 재측정 — ax-baseline.json 대상 metric
```

재관측 결과를 이전 iter 응답과 비교:
- 같은 이슈가 여전히 지적되면 → 개선 불충분 or 다른 원인
- 다른 이슈가 지적되면 → 원 갭 해소, 새 갭 수면 위로
- 지적 없으면 → iter 수렴 신호 1 (3 연속이면 종료 조건)

### Step 6. 로그 + 수렴 판정

`docs/research/ax/gemmaCritique/summary.md`에 **iter N** 섹션 append:

```markdown
## Refinement iter N (YYYY-MM-DD)

**관측 이슈**: [/, /ui의 주요 이슈 요약]
**선택 갭**: [후보 중 1개 + 분류]
**실행**: [commit hash + 파일 변동]
**재측정**: [이전 이슈 해소 여부 / 새 이슈 / baseline 변동]
**수렴 신호**: 0 / 1 / 2 / 3 (연속 "지적 없음"이면 ++, 지적 재등장하면 0)
**다음 후보**: [inbox gap-candidates에서 남은 것 중 1건]
```

### 완료 약속: `AX_CONVERGED`

다음 **모두** 만족하면 `<promise>AX_CONVERGED</promise>` 출력:
1. 직전 3 iter 연속 Gemma 응답에서 **같은 갭 재등장 0**
2. `docs/0-inbox/gemma-ax-gap-candidates.md`의 미처리 후보 0건
3. `ax-baseline.json` 모든 metric 안정 (pass 카운트 감소 0)
4. smoke test 통과

위 조건 미충족이면 promise 출력 금지. Ralph가 다음 iter 재공급.

### 한계 탈출: `LIMIT_REACHED: <사유>`

다음 중 하나면 `LIMIT_REACHED` 출력:
- 같은 갭이 5 iter 연속 잔존 (구조적 난제 — 사람 개입 필요)
- Gemma 응답이 완전 불변 (평가 도구 한계)
- baseline 회귀 발생 + 롤백도 실패

## 엄수 규칙

| 규칙 | 이유 |
|------|------|
| 한 iter = 한 개선 | 효과 분리 + bisect 가능 |
| 고정 샘플 라우트 (`/`, `/ui`) | A/B 공정성 |
| 프롬프트 튜닝은 Step 1의 부속, 주 작업 아님 | 사용자 재프레임 정합 |
| 매 iter inbox gap-candidates에 최소 2 후보 append | 갭 DB 축적 |
| "Overall 등급 향상 = 성공" 판정 금지 | 점수 해소 재진입 방지 |
| Phase 2/3으로의 재료 (메타 지표 / 자율 개선 정책) 축적 | `project_ax_codification` 일치 |
| 새 축/토큰 도입 전 `CATALOG.md` + `04-gap-plan.md` 사전 확인 | CLAUDE.md 제1원칙 "있는 걸로 만든다" |

## 보조 도구

- `scripts/gemmaCritique.mjs` — 관측 실행기 (PROMPT 상수가 불충분할 때만 vP-N 조정)
- `scripts/smokeTestPuppeteer.mjs` — pre-flight
- `docs/0-inbox/gemma-ax-gap-candidates.md` — 갭 후보 누적 (신규)
- `docs/research/ax/gemmaCritique/summary.md` — iter 로그
- `docs/research/ax/04-gap-plan.md` — 승격된 측정 후보 (원리 × 7 layer)
- `docs/2-areas/styles/prds/*` — 구조적 변경 PRD
- `ax-baseline.json` — 정량 metric SSOT

## 재료 이관 (Phase 2 진입 조건)

이 루프가 AX_CONVERGED 도달 시 다음이 자동 확보되어 Phase 2에 투입:
- **갭 DB**: inbox + 04-gap-plan에 반복 지적 이슈 카탈로그
- **변경 로그**: summary.md에 iter별 개선 기록 — 어떤 갭이 어떤 축/토큰/구조 변경으로 해소됐는지
- **baseline 추이**: 개선 전/후 정량 지표 변동 — 메타 지표 재설계 재료
