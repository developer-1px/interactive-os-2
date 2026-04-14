---
created_at: 2026-04-15
session_id: 124c5a5b-e314-4a59-8e2d-130b15acb61c
tags: [retrospective, failure, design-loop]
---

# Handoff: Beauty 루프 실패 회고 — 왜 점수가 안 올랐나

> correctness 루프(L1/L2 체크리스트)는 수렴 증명에 성공했지만, 그걸로는 "미려함"이 생산되지 않음을 실증. 3-actor beauty 루프(Critic/Improver/Judge) 구조는 작동했으나 단일 토큰 개입으로는 30개 결함 중 3개만 부분 개선. 다음 세션에서 "대규모 동시 개입"으로 재도전해야 함.

## 이 세션의 명제

**"LLM은 디자인 비평은 고해상도로 하지만 개선은 평균으로 회귀한다"** — 이 갭을 수렴 루프로 닫을 수 있는가?

## 무엇을 시도했나

### 1. Correctness 루프 (L1/L2) — 성공

- **L1 체크리스트 13축** 설계 (기존 10 + L11 인접 same-surface + L12 1-child + L13 padding rhythm)
- **i18n editor 3회 iteration**:
  - iter1: 2-layer → 4-layer (header/toolbar/grid/footer)
  - iter2: I18nStats 위계 승격, help 인라인 hints
  - iter3: L11 위반 수정 (footer base→sunken)
- **viewer 1회 iteration**: 5 영역 surface 3-coloring, resizable true
- **결과**: L1 축 100% ✓ 달성, 구조적 정확성은 수렴

### 2. Beauty 루프 (3-actor) — 구조는 작동, 결과는 부족

- **Critic** (fresh agent): viewer 스샷 → 30개 결함 번호 매김
- **Improver** (메인): tokens.css 수정 — surface 팔레트 delta 확대 (sunken→stone-950, raised→stone-750)
- **Judge** (다른 fresh agent): 원본 30개 리스트 + 새 스샷 → 판정
- **결과**: ✅ 0 / 🟡 3 (모두 깊이 관련) / ❌ 26 / ⬛ 1 (악화)

### 3. 스킬화

- `.claude/skills/layout-score/SKILL.md` 작성 (.claude는 symlink, repo 외)

## 왜 실패했나 (핵심 진단)

1. **correctness ≠ beauty** — L1 체크리스트는 "slot이 있는가, 인접이 다른가"만 묻는다. 체크리스트 전부 ✓ 찍혀도 미려함은 증가하지 않는다. 천장이 낮다.

2. **단일 front 개입의 한계** — Improver가 토큰 2줄만 바꾼 결과 30개 중 27개는 요지부동. 비주얼 품질은 **non-commutative**: 색만 고치면 폰트가 약해 보이고, 폰트만 고치면 색이 약해 보인다. 동시에 5-10개 front를 밀어야 점수가 움직인다.

3. **레퍼런스 부재** — Linear·Arc·Raycast 같은 실측 앵커 없이 루프를 돌리면 모델은 "평균적 다크 UI"로 수렴한다. `/design-extract`가 스킬 카탈로그에 있었는데 한 번도 호출 안 함. **이게 가장 큰 실수**.

4. **Binary 판정의 천장** — "padding 있음 ✓"와 "padding이 리듬을 만드는가"는 다르다. 연속 척도(percentile 거리)가 있어야 80→90점이 가능.

5. **widget 내부를 안 건드림** — 30개 결함 중 ~15개가 widget 내부 (icons, hover, typography, chips). L3 토큰만으로는 닿을 수 없다.

## 작동한 것 (잃지 말 것)

- **3-actor loop 구조**: Critic/Improver/Judge 분리가 self-bias를 제거. 내가 직접 판정했으면 "많이 나아졌다" 왜곡. Judge가 솔직하게 "26/30 그대로"라고 찍어준 게 결정적.
- **Critic 원본 리스트를 baseline으로 고정**: iteration 간 비교 가능.
- **L11 인접 same-surface 원칙**: constraint graph로 풀리는 문제. 수동 3-coloring 성공. 자동화 가능.
- **2단 판정 (slot 존재 ≠ 의도 수행)**: footer keyboard hints 사례에서 실증.
- **스샷 검증 필수성**: 텍스트 체크리스트 통과해도 시각적 실패가 드러남.
- **hook 가드가 보조 평가자**: `style={}` 자동 차단이 평균 해법을 걸러줌.

## 완료

| 커밋 | 내용 |
|------|------|
| `f4b2812d` | refactor(layout): i18n/viewer L1 수렴 루프 실험 — correctness ✓, beauty ✗ |

## 남은 것

### 즉시 (다음 세션 첫 작업)

1. **`/design-extract` 실제 실행** — Linear 또는 유사 파일 뷰어를 1개 골라 실측. 토큰 사전 생성. 이게 없으면 beauty 루프는 또 평균으로 간다.
2. **대규모 Improver iteration 재시도** — 레퍼런스 사전을 앵커로 widget 5-6개 + accent 토큰 + typography + row states 동시 수정. viewer를 타겟으로.
3. **Critic/Judge 재실행** — 원본 30개 리스트 유지한 채 재판정.

### 이후

- **L3 루프 공식화** — `/design-score` 스킬 설계 (지금 `/layout-score`와 별개). 레퍼런스 실측 입력 + 연속 판정 + 다중 front + 3-actor loop.
- **L11 constraint checker 자동화** — definePage AST → graph coloring 자동 풀이.
- **screenshot.mjs 상태 주입** — 파일 선택·포커스 등 route state 세팅 기능 (viewer preview 상태별 스샷을 위해).
- **ProgressIndicator 가시성** — i18n editor iter2에서 발견. width/색 조사.
- **ax 축 누락**: `tabular-nums` 없음 — 숫자 컬럼 정렬 불가.

## 컨텍스트

- **관련 PRD**: 없음 (실험 세션이라 PRD 없이 진행)
- **관련 memory** (repo 외, `~/.claude/projects/.../memory/`):
  - `feedback_design_convergence_loop` — 수렴 루프가 왜 필요한가
  - `feedback_flatlayout_separation_declaration` — 인접 구분 수단 원칙
  - `feedback_slot_existence_vs_intent` — 2단 판정
- **새 스킬** (repo 외, .claude symlink): `.claude/skills/layout-score/SKILL.md` — correctness 루프만 다룸. beauty 루프는 아직 없음.
- **주의 사항**:
  - correctness와 beauty는 **별개 루프**. 하나로 합치려 하지 말 것.
  - 레퍼런스 없이 beauty 루프 돌리면 같은 함정에 빠진다.
  - Critic/Improver/Judge는 **반드시 다른 에이전트** (메인이 Improver, 나머지는 Agent 디스패치).
  - Improver는 **한 iteration에 5개 이상 front 동시 수정**해야 점수가 움직인다. 쫀쫀하게 한 번에 하나는 낭비.

## 이어받는 법

다음 세션에서 `/handoff`로 이 파일이 자동 선택됨. 첫 행동:

```
/design-extract
→ 타겟: Linear (또는 VS Code 파일 탐색기, GitHub 파일 뷰어 중 택1)
→ 출력: docs/design-tokens/{타겟}.md + 측정된 색·간격·폰트 값
```

그 다음 viewer를 타겟으로 3-actor beauty 루프 재시도. 이번엔 레퍼런스 앵커 + 다중 front 동시 수정.
