# Sculpt Design Loop — 평가→귀납→깎기 자율 iteration

**목표:** 노맥락 평가 에이전트가 "Overall: good" 이상으로 평정할 때까지 디자인 시스템을 점진 개선.

## 매 iteration 절차

### 1. 평가 에이전트 디스패치

`general-purpose` subagent를 다음 프롬프트로 호출:

```
너는 일반 웹사이트 시각 디자인 비평가다. 프로젝트 맥락 없이 순수 시각 평가만.

1. mcp__claude-in-chrome__tabs_context_mcp (createIfEmpty: false) 호출, tabId 확인
2. 매 iteration마다 다른 라우트 2개 로테이션:
   iter 1: /, /ui
   iter 2: /chat, /replay
   iter 3: /ax-principles, /catalog
   iter 4: /agent, /viewer
   iter 5+: 반복 (디자인 개선 시 이전 라우트 재평가)
3. 각 URL: navigate → wait 3s → screenshot → scroll down → screenshot

리포트 형식 (Markdown 600자 이내):
  ## 화면: <url>
  ### 주요 이슈 3-5개
  1. **[제목]** — 정량 관찰(수치/비율). 깨진 원리.
  ### 좋은 점 1-2개

  ## Overall: <one of: "good" | "ok" | "needs improvement">
  (이유 1문장)

엄수:
- 프로젝트 맥락 모름 — 추측 없이 순수 시각 평가
- 수정 제안 금지 — 관찰만
- 정량 속성 우선 (spacing, 대비, 정렬, 위계, 라인 길이, icon weight, radius 등)
- "good": 이슈 ≤2개 & critical 없음
- "ok": 이슈 3-4개, 구조적 문제 없음
- "needs improvement": 이슈 5+ or 구조적 결함
```

### 2. 비평 → 액션 매핑

비평에서 얻은 각 이슈를 분류:

| 이슈 유형 | 액션 |
|-----------|------|
| 기존 측정에 이미 있음 (text-apca, surface-pairs 등 fail) | **sculpt 수정** (tokens.css/ax.css 변경) |
| 측정 가능한 새 패턴 | **새 측정 스크립트 추가** + baseline 편입 |
| 측정 어려움 (런타임 DOM, SVG 분석 등) | `docs/research/ax/agent-scope-issues.md`에 기록만 |

### 3. 수정 전략

**sculpt 수정 (기존 measurement의 fail 감소):**
- text-apca fail 24 → inverted surface용 --text-inverted 토큰, muted on dark 대비 상향
- surface-pairs fail 14 → stone 계열 L step 확대 또는 border/shadow 보완
- radius-usage 1 → var(--shape-*-radius) 치환
- modular-scale warnings → typography ratio 재정렬 (bottom_low 해소)

**새 측정 추가:** 기존 패턴 (scripts/measure*Contrast, scripts/verify*.mjs 참조)

### 4. 측정 + compare + 커밋

```
pnpm baseline:compare   # 회귀 검사
# 회귀 있으면 git checkout -- [파일] 롤백 + 다른 전략
# 회귀 0이면:
pnpm baseline:save
git add [수정 파일들만] ax-baseline.json
git commit -m "sculpt(design): <요약> (iter N)"
```

### 5. 완료 판정

평가 에이전트 Overall이 **"good"**이면 `<promise>GOOD_DESIGN_REACHED</promise>` 출력.

**단, 함정 회피:** 에이전트가 실수로 "good"이라고 해도 **실제 개선 근거**(이전 대비 이슈 수 감소, baseline metric 개선)가 있어야 인정. 단발성 good은 false promise 금지.

## 엄수 규칙

| 규칙 | 이유 |
|------|------|
| 수정 가능 파일: `src/styles/tokens.css`, `src/styles/ax.css`, `scripts/*.mjs`, `docs/research/ax/**`, `ax-baseline.json` | blast radius 통제 |
| `modular-scale.warnings` 증가 금지 | 타 metric 회귀 금지 |
| 기존 pass metric (focus-apca, spatial-grid, line-length) 회귀 금지 | hard ratchet |
| `git add -A` 금지 — 특정 파일만 | 워킹 디렉토리 오염 방지 |
| 1 iteration = 1~3 change | 회귀 원인 분리 |
| 같은 파일 무한 수정 금지 | 세션당 tokens.css 수정 ≤5회 |

## 전략 가이드 (우선순위)

1. **surface-pairs fail 14** — divider/shadow 토큰 추가 + .sf-* recipe에 편입 → 비평 Top1 "컨테이너 경계" 구조 해결
2. **text-apca fail 24** — 대부분 dark/muted + inverted 조합 → --text-muted 계층 조정 또는 --text-inverted 토큰
3. **radius-usage 1** — 단일 fix (scrollbar-thumb)
4. **modular-scale warnings 11** — typography 1.143 ratio → 1.25 Major Third 재정렬 (breaking change 조심)
5. **새 측정 추가** (chroma usage, icon weight 등 — iteration에서 비평 보고 결정)

## 참조

- `docs/research/ax/04-gap-plan.md` — 원리 × 7 layer 매트릭스
- `docs/research/ax/02-principles.md` — 20 원리 카드
- `.claude/skills/sculpt/SKILL.md` — ratchet 루프 방법론
- `ax-baseline.json` — 현재 고정 지표 (7 metric)
