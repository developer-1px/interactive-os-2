---
id: 2-areas/design/prds/improve-design-prd
title: 'improve-design — PRD'
created: 2026-04-06
updated: 2026-04-08
summary: 'Discussion: LLM이 디자인 결과물을 스스로 채점하고, ax()/ui/ 경로만으로 수정하여 9/10+ 까지 올리는 자동 루프. 해치(module.css)로 점수를 올리면 실패.'
legacy:
  status: active
  kind: prd
  topics: [2-areas]
  relates: []
  supersedes: []
---
# improve-design — PRD

> Discussion: LLM이 디자인 결과물을 스스로 채점하고, ax()/ui/ 경로만으로 수정하여 9/10+ 까지 올리는 자동 루프. 해치(module.css)로 점수를 올리면 실패.

## ① 동기

### WHY

- **Impact**: LLM이 CSS를 수정할 때 해치(module.css 직접 값, style={})로 도망가는 악순환이 발생한다. 해치를 감지해도 "해치를 막는 코드"를 또 해치로 만든다. 디자인 품질이 수렴하지 않는다.
- **Forces**: ax() 12축 시스템은 입력을 강제하지만 출력(렌더링 결과) 검증이 없다. guardCssAxes.mjs가 축 소유 속성을 차단하지만 대체 경로 안내가 없어서 LLM이 다른 해치로 우회한다.
- **Decision**: 3계층 방어 — ① PreToolUse hook이 해치를 차단+대체 경로 안내, ② PostToolUse hook이 자동 채점, ③ /improve-design 스킬이 스크린샷 기반 시각 검증 루프. 기각: 채점만(차단 없이) → 해치 루프 반복. module.css 전면 금지 → last-mile 불가능.
- **Non-Goals**: 새 디자인 토큰 추가, ax.ts 축 확장, designLintRules.mjs 규칙 추가 (별도 작업)

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| 1 | LLM이 module.css에 `padding: 16px` 작성 | PreToolUse hook 실행 | block + "ax({ padding: 'lg' }) 사용" 안내 | |
| 2 | LLM이 module.css에 `display: flex` 작성 | PreToolUse hook 실행 | block + "ax({ layout: 'row' }) 사용" 안내 | |
| 3 | LLM이 module.css에 `transform: rotate(45deg)` 작성 | PreToolUse hook 실행 | 통과 (last-mile 허용) | |
| 4 | LLM이 .tsx 파일에서 ax() 사용하여 수정 | PostToolUse hook 실행 | `pnpm score:design` 자동 실행 → 점수 리포트 | |
| 5 | /improve-design 호출 | 스킬 시작 | 스크린샷→채점→ax/ui 수정→재촬영→9/10+ 달성까지 반복 | |
| 6 | module.css에 `var()` 토큰 참조 작성 | PreToolUse hook 실행 | 통과 (토큰 바인딩 허용) | |
| 7 | 해치 사용량이 증가하는 수정 | PostToolUse 채점 | 해치 증가 경고 + 감점 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `guardCssAxes.mjs` 개선 | 기존 hook에 **축별 대체 경로 안내** 추가. 현재는 "ax()로 이동"만 출력 → 속성별 구체적 ax() 코드 제안 | |
| `checkDesignScore.mjs` (신규) | PostToolUse hook. CSS/TSX 수정 후 `designScoreVisual.mjs` 실행 → 점수 리포트. 해치 증가 감지 | |
| `/improve-design` 스킬 (신규) | `.claude/skills/improve-design/SKILL.md`. MCP 스크린샷→채점→수정→재촬영 루프 | |

완성도: 🟢

## ③ 인터페이스

### Layer 1: PreToolUse hook (guardCssAxes.mjs 개선)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| module.css에 `padding: 16px` | 축 소유 속성 직접 값 | block + 대체 안내 | padding 축이 소유 → ax({ padding }) 사용 필수 | LLM이 ax()로 재작성 | |
| module.css에 `background: #fff` | 축 소유 속성 직접 값 | block + 대체 안내 | surface 축이 소유 → ax({ surface }) 사용 필수 | LLM이 ax()로 재작성 | |
| module.css에 `color: red` | 축 소유 속성 직접 값 | block + 대체 안내 | text/tone 축이 소유 → ax({ text/tone }) 사용 필수 | LLM이 ax()로 재작성 | |
| module.css에 `display: flex` | 축 소유 속성 직접 값 | block + 대체 안내 | layout 축이 소유 → ax({ layout: 'row' }) 사용 필수 | LLM이 ax()로 재작성 | |
| module.css에 `border: 1px solid` | 축 소유 속성 직접 값 | block + 대체 안내 | surface/border 축이 소유 → ax({ border: 'subtle' }) 사용 | LLM이 ax()로 재작성 | |
| module.css에 `:hover { ... }` | 상태 스타일 | block + 대체 안내 | interactive 축이 소유 → ax({ interactive: '...' }) 사용 | LLM이 ax()로 재작성 | |
| module.css에 `transform: scale(1.1)` | last-mile 속성 | 통과 | ax() 축에 없는 속성 → module.css 허용 | 파일 저장 성공 | |
| module.css에 `z-index: 10` | last-mile 속성 | 통과 | ax() 축에 없는 속성 → module.css 허용 | 파일 저장 성공 | |
| module.css에 `padding: var(--space-lg)` | 토큰 참조 | 통과 | var() 바인딩은 토큰 체계 내 → 허용 | 파일 저장 성공 | |

**대체 경로 매핑 (hook 메시지에 내장):**

| CSS 속성 | 소유 축 | 대체 코드 예시 |
|----------|---------|---------------|
| `background`, `background-color` | surface, tone | `ax({ surface: 'display' })` 또는 `ax({ tone: 'accent' })` |
| `border`, `border-*` | surface, border | `ax({ border: 'subtle' })` 또는 `ax({ surface: 'input' })` |
| `box-shadow` | surface | `ax({ surface: 'overlay' })` |
| `cursor` | surface | `ax({ surface: 'action' })` |
| `color` | text, tone | `ax({ text: 'secondary' })` 또는 `ax({ tone: 'danger' })` |
| `font-size`, `font-weight`, `line-height`, `letter-spacing` | textStyle | `ax({ textStyle: 'caption' })` |
| `border-radius` | shape, controlSize | `ax({ shape: 'md' })` 또는 `ax({ controlSize: 'md' })` |
| `opacity` | opacity | `ax({ opacity: 'dim' })` |
| `animation`, `animation-name` | motion | `ax({ motion: 'pulse' })` |
| `display`, `flex-direction`, `align-items`, `justify-content` | layout | `ax({ layout: 'row' })`, `ax({ layout: 'bar' })` |
| `gap`, `row-gap`, `column-gap` | gap | `ax({ gap: 'sm' })` |
| `padding`, `padding-*` | padding | `ax({ padding: 'md' })` |
| `width`, `min-width`, `max-width` | width | `ax({ width: 'full' })` |
| `flex`, `flex-grow`, `flex-shrink` | flex | `ax({ flex: '1' })` |
| `height`, `min-height`, `max-height` | size, controlSize | `ax({ size: 'md' })` 또는 `ax({ controlSize: 'md' })` |
| `text-overflow`, `white-space`, `-webkit-line-clamp` | clamp | `ax({ clamp: '1' })` |
| `overflow`, `overflow-x`, `overflow-y` | scroll | `ax({ scroll: 'y' })` |
| `position`, `top/bottom/left/right`, `inset` | placement | `ax({ placement: 'above' })` |
| `:hover`, `:focus`, `:active`, `:disabled` | interactive | `ax({ interactive: 'item' })` |

### Layer 2: PostToolUse hook (checkDesignScore.mjs)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| .tsx/.css 파일 수정됨 | 수정 완료 | designScoreVisual.mjs 해당 라우트 실행 | 수정이 디자인 품질에 영향을 줄 수 있으므로 자동 채점 | 점수 리포트 출력 | |
| 점수 9/10+ | 통과 | "✅ Design score: 9.2/10" 출력 | 목표 달성 | 정상 진행 | |
| 점수 9/10 미만 | 미달 | "⚠️ Design score: 6.5/10 — /improve-design 권장" 출력 | 목표 미달, 시각 검증 루프 필요 | 스킬 제안 | |
| 비-UI 파일 수정 | 대상 아님 | 스킵 | 디자인과 무관한 파일 | 무동작 | |

### Layer 3: /improve-design 스킬

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `/improve-design` 호출 | 페이지 존재 | MCP 스크린샷 촬영 | 렌더링 결과를 시각적으로 확인해야 위반 감지 가능 | 스크린샷 획득 | |
| 스크린샷 | 이미지 있음 | 10점 만점 채점 (위반 체크리스트) | 위반 감지로 공식화된 규칙 대조 | 점수 + 위반 목록 | |
| 위반 목록 | 감점 항목 존재 | ax()/ui/ 경로만으로 수정 | 해치 금지 — 수정 수단도 채점의 일부 | 코드 수정 완료 | |
| 수정 완료 | 코드 변경됨 | 재촬영 + 재채점 | 수정이 실제로 시각적 개선을 가져왔는지 확인 | 점수 비교 | |
| 점수 9/10+ | 목표 달성 | 루프 종료 | 충분한 품질 | 완료 | |
| 점수 9/10 미만 + 반복 3회 미만 | 목표 미달 | 다음 위반으로 돌아감 | 아직 개선 여지 있음 | 다음 반복 | |
| 점수 9/10 미만 + 반복 3회 도달 | 목표 미달 + 한계 | 루프 종료 + 사용자에게 잔여 위반 보고 | 자동 개선의 한계 도달 | 사람 판단 위임 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| CmsLanding.module.css (별도 토큰 체계) | landing 전용 var(--landing-*) 사용 | var() 참조는 토큰 바인딩 → 이미 허용 | guardCssAxes 통과 | 기존 동작 유지 | |
| module.css에 var()와 직접값 혼합 | `padding: 0 var(--space-sm)` | 직접값(0) + var() 혼합 → `0`은 허용 목록에 있음 | 통과 | 파일 저장 | |
| dev server 미실행 시 PostToolUse | 서버 없음 | Puppeteer 연결 실패 → 채점 불가 | 스킵 + 경고 "dev server 필요" | 무채점 | |
| MCP 확장 미연결 시 /improve-design | 브라우저 없음 | 스크린샷 불가 → 스킬 실행 불가 | 에러 + "MCP 연결 필요" 안내 | 스킬 중단 | |
| 수정 후 점수가 오히려 하락 | 역효과 | 수정이 다른 곳을 깨뜨림 → git checkout으로 원복 | 원복 + 다른 접근 시도 | 이전 상태 복구 | |
| module.css에 `:hover` 작성 | 상태 스타일 | interactive 축이 소유 → module.css 금지 | block + "ax({ interactive: '...' }) 사용" | LLM이 ax()로 수정 | |
| 동시 세션에서 같은 파일 수정 | 병렬 작업 | PostToolUse 채점이 다른 세션 변경 포함 | 자기 변경분만 책임 (activeSessions.sh) | 부분 책임 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | surface 소유 속성에 module.css last-mile 금지 (feedback_surface_no_lastmile) | ③ 대체 경로 매핑 | ✅ 준수 — surface 소유 속성(border/shadow/cursor/bg)을 차단 | — | |
| 2 | ax import는 @styles/ax (feedback_ax_import_path) | 대체 경로 안내 메시지 | ⚠️ 안내 메시지에 import 경로 포함해야 함 | 안내에 `import { ax } from '@styles/ax'` 추가 | |
| 3 | 선언=등록, 합성 런타임 불변 (feedback_declarative_ocp) | guardCssAxes 대체 경로 매핑 | ✅ 준수 — 매핑 테이블이 선언적 | — | |
| 4 | 나쁜 디자인 = 위반 감지로 공식화 (feedback_design_css_principles) | 전체 시스템 | ✅ 준수 — 체크리스트 기반 채점 | — | |
| 5 | CSS 수정 후 브라우저 스크린샷 필수 (feedback_design_css_principles) | Layer 3 스킬 | ✅ 준수 — 스크린샷 루프 핵심 | — | |
| 6 | 디자인=기능, 장식 아님 (feedback_design_css_principles) | 채점 체크리스트 | ✅ 준수 — 기능 없는 시각 = 감점 | — | |
| 7 | hooks regex 다중 하이픈 버그 (experience_db #4) | guardCssAxes replaceAll | ⚠️ 현재 코드는 이미 replaceAll 사용하지만 확인 필요 | 검증 후 필요 시 수정 | |
| 8 | chroma=행동 긴급도 (feedback_chroma_ladder) | 채점 시 tone 사용 판단 | ✅ 참조 — 채점에 포함하지 않으나 스킬 수정 시 참조 | — | |
| 9 | accent 1채널 규칙 (feedback_accent_budget) | 채점 체크리스트 | ✅ 위반 시 감점 항목으로 포함 | — | |
| 10 | style={}는 해치 (feedback_style_is_hatch) | PostToolUse | ⚠️ TSX에서 style={} 사용도 감지해야 함 | checkDesignScore에 style={} 감지 추가 | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | guardCssAxes.mjs (기존 hook) | 메시지 형식 변경 → 기존 워크플로우 익숙한 메시지 사라짐 | 낮음 | 기존 메시지 + 대체 경로를 **추가**. 기존 형식 유지 | |
| 2 | PostToolUse 실행 시간 | designScoreVisual.mjs는 Puppeteer 실행 → 느림 (5-10초) | 중간 | async hook으로 실행. 블로킹 아님 | |
| 3 | 기존 checkDesignTokens.mjs와 역할 중복 | raw px 감지가 두 곳에서 발생 | 낮음 | checkDesignTokens는 유지 (빠른 경고), checkDesignScore는 종합 채점 (느린 리포트) | |
| 4 | CmsLanding 별도 토큰 체계 | landing 페이지가 ax() 강제 대상이 되면 토큰 파괴 | 높음 | var() 참조는 이미 허용. guardCssAxes는 직접값만 차단하므로 영향 없음 | |

완성도: 🟡 75% — PostToolUse async 실행의 안정성은 실행 중 확인 필요

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | guardCssAxes 기존 block 로직 변경 | ⑥-1 | 기존 차단은 유지, 대체 경로만 **추가** | |
| 2 | PostToolUse hook을 동기(blocking)로 실행 | ⑥-2 | Puppeteer 5-10초 → 편집 흐름 차단 | |
| 3 | checkDesignTokens.mjs 제거 | ⑥-3 | 빠른 경고와 종합 채점은 별개 역할 | |
| 4 | designLintRules.mjs 규칙 수정 | Non-Goals | 이 PRD 범위 밖. 규칙 추가는 별도 작업 | |
| 5 | /improve-design 스킬에서 module.css 직접값 작성 | 전체 목적 | 해치로 점수 올리기 = 실패. 스킬이 이 원칙을 위반하면 자기모순 | |
| 6 | style={} 사용 | ⑤-10 | style={}는 해치. ax()만 사용 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| 1 | ①-1 | module.css에 `padding: 16px` 작성 시도 | block + "ax({ padding: 'lg' }) 사용. import { ax } from '@styles/ax'" 안내 | |
| 2 | ①-2 | module.css에 `display: flex; flex-direction: row` 작성 시도 | block + "ax({ layout: 'row' }) 사용" 안내 | |
| 3 | ①-3 | module.css에 `transform: rotate(45deg)` 작성 | 통과 (last-mile) | |
| 4 | ①-6 | module.css에 `padding: var(--space-lg)` 작성 | 통과 (토큰 참조) | |
| 5 | ①-4 | .tsx에서 ax() 수정 후 PostToolUse 실행 | 채점 리포트 출력 (async) | |
| 6 | ①-7 | module.css 행 수가 이전보다 증가하는 수정 | 해치 증가 경고 | |
| 7 | ①-5 | /improve-design 호출 → 스크린샷 → 채점 5/10 → 수정 → 재채점 8/10 → 수정 → 재채점 9.2/10 | 루프 2회 반복 후 종료 | |
| 8 | ④-hover | module.css에 `.root:hover { background: ... }` 작성 | block + "ax({ interactive: '...' }) 사용" 안내 | |
| 9 | ④-dev서버없음 | dev server 미실행 + PostToolUse | "dev server 필요" 경고 후 스킵 | |
| 10 | ④-점수하락 | 수정 후 점수 7→5 하락 | git checkout 원복 + 다른 접근 | |

완성도: 🟢

---

**전체 완성도:** 🟢 7.5/8 (⑥만 🟡)

## 채점 체크리스트 (/improve-design 스킬용)

스크린샷 기반 시각 채점 10점 만점:

| # | 항목 | 감점 | 감지 방법 |
|---|------|------|----------|
| 1 | 이모지/특수기호로 상태 표현 | -1 | 코드 grep |
| 2 | 간격 위계 불일치 (같은 위계 다른 gap) | -1 | 스크린샷 |
| 3 | surface 없이 border만으로 영역 구분 | -1 | 스크린샷 |
| 4 | accent 예산 위반 (selected=neutral 규칙) | -1 | 스크린샷 |
| 5 | 활성 요소 시각 피드백 없음 | -1 | 스크린샷 |
| 6 | 텍스트 위계 불명확 (textStyle 미분화) | -1 | 스크린샷 |
| 7 | 레이어 위반 (pages에서 primitives 직접) | -2 | 코드 grep |
| 8 | overflow 미처리 (텍스트 잘림/밀림) | -1 | 스크린샷 |
| 9 | 해치 사용 (module.css 축 소유 속성) | -2 | 코드 grep |
| 10 | style={} 사용 | -2 | 코드 grep |

#kind/prd #topic/design
