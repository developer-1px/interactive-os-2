# Gemma Prompt Tuning Loop — Ralph 자가 개선 orchestration

**포지션**: Phase 1-a 상위 메타 루프. `gemma-critique-loop.md`가 "디자인 → 평가"라면, 이 루프는 "평가 응답 → 프롬프트 개선". 관리 시스템 자체가 스스로를 갱신.

**철학 접속**:
- 사용자 재프레임: "평가는 점수의 또 다른 형태일 뿐. 관리 시스템 업그레이드가 목표"
- 이 루프는 **평가자(Gemma)의 행동 정의** 자체를 타겟. 평가자가 관찰자 역할을 정직하게 수행하도록 프롬프트 수렴

## 루프 수명

Ralph Loop(`/ralph-loop`)로 감싼다. completion promise: **`PROMPT_STABLE`**.

```
/ralph-loop 읽기: .claude/gemma-prompt-tuning-loop.md. 매 라운드 Step 1~6 수행. --max-iterations 5 --completion-promise PROMPT_STABLE
```

## 매 iteration 절차

### Step 1. 현재 프롬프트 + 최근 응답 N건 로드

- 입력 1: `scripts/gemmaCritique.mjs` 내 `PROMPT` 상수 (현재 버전)
- 입력 2: `docs/research/ax/gemmaCritique/*.md` 중 최근 iteration 리포트 전체

### Step 2. 응답 품질 관측 (정직함 축)

Claude가 응답들을 읽고 다음을 진단:

| 결함 종류 | 증상 | 개선 여부 |
|----------|------|---------|
| **Hallucination** | 이미지 없는데 점수 주기 / 이미지와 무관한 일반 상식 나열 | 프롬프트에 관찰 좌표 요구 + none 허용 강화 |
| **양 강제 효과** | "이슈 N-M개" 같은 수 제약이 억지 채움 유도 | 수 제약 제거 or 완화 |
| **기준 모호** | Overall 판정이 객관적 근거 없음 / 산술 규칙 의존 | 기준을 품질 서술로 재정의 |
| **좌표 부재** | "여백이 좁다"처럼 어디를 말하는지 불명 | "좌측 nav 3번째 아이템" 같은 위치 지시 의무화 |
| **과도한 제약** | Gemma가 모든 제약 다 지키느라 평가 자체를 희미하게 함 | 가장 중요한 3개만 남기고 삭제 |
| **일관성 부재** | 비슷한 화면에 다른 등급 | 판정 기준 사례 1~2개를 프롬프트에 고정 |

### Step 3. 단일 축 개선 (한 iteration = 한 축)

- 한 iteration에서 **위 표의 축 1개만** 수정
- 복수 축을 동시에 변경하면 다음 iteration에서 "어느 변경이 효과냈는지" 분리 불가능
- 수정 후 PROMPT 상수 교체 + 주석에 버전 번호(P-2, P-3, …)와 변경 사유 1줄

### Step 4. 재실행 (고정 샘플)

```
node scripts/gemmaCritique.mjs / /ui
```

라우트는 항상 동일 2개로 고정 — **프롬프트 변수만 조작**하는 A/B 비교.

### Step 5. Before/After 비교 → summary.md 기록

`docs/research/ax/gemmaCritique/summary.md`에 append:

```markdown
### 프롬프트 vP-N (YYYY-MM-DD)

**변경 축**: [Hallucination/양 강제/기준 모호/좌표 부재/과도한 제약/일관성]
**변경 내용**: [1~2줄]

| 지표 | vP-(N-1) | vP-N |
|------|--------|------|
| / 이슈 수 | … | … |
| /ui 이슈 수 | … | … |
| / Overall | … | … |
| /ui Overall | … | … |
| 좌표 구체성 | … | … |
| Hallucination 의심 | … | … |

**관찰**: [응답 품질이 어떻게 달라졌는지 1~2줄]
**다음 축 후보**: [남은 결함 중 우선순위 1개]
```

### Step 6. 완료 판정

**`PROMPT_STABLE` 조건**:
- 직전 2 iteration 연속으로 이슈 내용·Overall·구체성이 **동일 방향 수렴**
- 더 이상 축 개선으로 응답 품질 변화가 관측되지 않음

미달 시 다음 iteration (Ralph Loop이 같은 프롬프트 재공급).

## 엄수 규칙

| 규칙 | 이유 |
|------|------|
| 한 iteration = 한 축만 수정 | 개선 효과 분리 |
| 고정 샘플 라우트 (`/`, `/ui`) | A/B 비교 공정성 |
| 프롬프트 버전 주석 필수 (P-N) | 실험 이력 추적 |
| summary.md에 before/after 전문 인용 | `feedback_pyramid_preserve_original` |
| 사람이 Gemma 응답을 읽고 "신뢰도"를 판정하는 게 아님 | Claude가 관측 결과를 **구조적으로** 읽는다 |
| 점수(Overall)가 좋아졌다 = 개선 ❌ | Overall이 "관찰 품질"을 반영하는가가 평가 기준 |
| 3회 연속 동일 결함 잔존 | 프롬프트 한계 — 모델 교체 또는 평가 파이프라인 재설계 고려 |

## Phase 2 진입 조건

PROMPT_STABLE 도달 후:
- `summary.md`의 프롬프트 버전 섹션을 **메타 지표 재료**로 이관
- "프롬프트 변경 → 응답 분포 변화" 궤적이 **다른 도메인(sculpt, keyline-audit)**에도 일반화되는지 Phase 2에서 설계

## 관련 자산

- `scripts/gemmaCritique.mjs` — 평가 실행기 (PROMPT 상수가 튜닝 대상)
- `.claude/gemma-critique-loop.md` — 디자인 → 평가 루프 (이 루프의 **피평가자**)
- `docs/research/ax/gemmaCritique/summary.md` — 메타 로그 (버전 기록)
- `scripts/smokeTestPuppeteer.mjs` — 관측 파이프라인 pre-flight (G-5 산출)
- ralph-loop 플러그인 — 반복 실행 인프라
