# SplitPane Resize 안정화 — PRD

> Discussion: SplitPane의 flex:1 pane과 resize 로직 불일치로 인한 크기 드리프트 해결. sizes 배열에 `'flex'` 리터럴로 flex pane 선언.

## ① 동기

### WHY

- **Impact**: 사용자가 birdseye 3패널 separator를 드래그하면 크기가 드리프트하고, 페이지 리로드 시 초기값으로 리셋된다.
- **Forces**: 하나의 pane은 반드시 `flex:1`이어야 separator 공간을 흡수하는데, resize 로직이 모든 pane을 동일하게(명시적 %) 취급. flex pane의 숫자 크기가 state에 있지만 렌더링에 반영 안 됨.
- **Decision**: sizes 배열에 `'flex'` 리터럴을 도입하여 구조(어떤 pane이 flex)와 크기를 단일 배열로 선언. `flexPane` prop 불필요. VS Code priority 모델은 YAGNI로 기각.
- **Non-Goals**: useAria 크래시 수정 (별도 이슈), localStorage 영속 (소비자 책임), 컨테이너 resize 대응 (ratio 기반이라 자동).

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | sizes=[0.15, 'flex', 0.35] | sep 0 드래그로 좌측 확대 | sizes[0]만 증가, 'flex' 유지, sizes[2] 불변 | |
| S2 | sizes=[0.15, 'flex', 0.35] | sep 1 드래그로 우측 확대 | sizes[2]만 감소, 'flex' 유지, sizes[0] 불변 | |
| S3 | sizes=[0.15, 0.50, 'flex'] | sep 0 드래그 | sizes[0], sizes[1] 조절, 'flex' 흡수 | |
| S4 | sizes=[0.5, 'flex'] (2패널) | sep 드래그 | sizes[0] 변경, 'flex' 유지 | |
| S5 | sizes=[0.15, 'flex', 0.35] | sep 0 드래그 반복 10회 | 드리프트 없음 — 숫자 값만 변경, 'flex' 고정 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `SplitPane.tsx` 수정 | sizes 타입을 `(number \| 'flex')[]`로 변경, resize 로직 flex-aware | |
| `SplitPane.module.css` | 변경 없음 | |
| `BirdseyeLayout.tsx` 수정 | sizes를 `[0.15, 'flex', 0.35]`로 변경 | |
| `workspaceStore.ts` 수정 | `SplitData.sizes` 타입 변경, createSplit 초기값 `[0.5, 'flex']` | |
| `splitpane.integration.test.tsx` 수정 | flex 시나리오 테스트 추가, 기존 테스트 sizes 형식 전환 | |

완성도: 🟢

## ③ 인터페이스

### API 변경

```ts
type PaneSize = number | 'flex'

interface SplitPaneProps {
  direction: 'horizontal' | 'vertical'
  sizes: PaneSize[]          // sizes[i] = pane i의 크기. 'flex'는 CSS flex:1
  onResize: (sizes: PaneSize[]) => void
  children: React.ReactNode
  minRatio?: number          // 기본 0.1
}
```

**sizes 배열 규칙:**
- `sizes.length === children.length`
- 정확히 1개만 `'flex'`
- 숫자 값은 0~1 비율
- onResize 콜백은 동일 구조 반환 ('flex' 위치 불변, 숫자만 변경)

### 인터랙션

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| sep N 포인터 드래그 | sep 양쪽 중 하나가 'flex' | non-flex pane의 숫자만 조절 | flex pane은 CSS flex:1이 자동 흡수 | 'flex' 위치 불변 | |
| sep N 포인터 드래그 | sep 양쪽 모두 숫자 | 양쪽 숫자 동시 조절 | 두 pane 모두 명시적 %이므로 pair sum 보존 | pair sum 유지 | |
| sep N ArrowRight/Down | horizontal/vertical | non-flex 쪽 ±STEP(0.02) | 키보드도 포인터와 동일 규칙 | | |
| sep N ArrowLeft/Up | horizontal/vertical | non-flex 쪽 ∓STEP(0.02) | | | |
| sep N Home | — | 인접 non-flex pane → minRatio | 최소 크기까지 축소 | | |
| sep N End | — | 인접 non-flex pane → 최대 | 다른 pane minRatio까지 확대 | | |
| sep N 포인터 드래그 중 | 드래그 진행 중 | non-flex pane만 DOM 직접 업데이트, flex pane은 flex:1 유지 | React re-render 없이 부드러운 드래그 | pointerup에서 onResize 호출 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 'flex'가 0개 | 렌더 시점 | flex 없으면 separator 공간 흡수 불가 | 마지막 pane을 flex로 취급 (fallback) | 기본 동작 | |
| 'flex'가 2개 이상 | 렌더 시점 | 다중 flex는 비율 불확정 | 첫 'flex'만 인정, 나머지는 0으로 취급 + console.warn | 안전한 렌더 | |
| sizes 길이 ≠ children | 렌더 시점 | 불일치 방지 | console.warn + 가능한 범위만 적용 | graceful degradation | |
| minRatio에 의해 축소 불가 | 드래그 중 | 최소 크기 보장 | clamp | 최소 크기 유지 | |
| 드래그 중 flex pane | pointerMove | flex pane은 직접 DOM 안 건드림 | flex:1이 자동 흡수 | 시각적 점프 없음 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | os 기반 개발: UI 완성품 먼저 (CLAUDE.md) | ② SplitPane.tsx | ✅ 준수 | — | |
| 2 | 선언적 OCP (feedback) | ③ sizes 배열이 구조+크기 선언 | ✅ 준수 | — | |
| 3 | 원자적 리스트럭처 (feedback) | ② 산출물 | ✅ 준수 — 전체 사용처 한번에 전환 | — | |
| 4 | CSS 토큰 필수 (CLAUDE.md) | ② CSS | ✅ 준수 — CSS 변경 없음 | — | |
| 5 | 이벤트 버블링 가드 (feedback) | ③ 키보드 | ✅ 준수 — e.preventDefault() 유지 | — | |
| 6 | 최소 구현 수렴 (feedback) | 전체 | ✅ 준수 — 'flex' 리터럴 하나로 해결 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | BirdseyeLayout sizes 배열 | [0.15, 0.50, 0.35] → [0.15, 'flex', 0.35] | 중 | sizes 리터럴 수정 | |
| 2 | workspaceStore SplitData.sizes | number[] → (number \| 'flex')[] 타입 변경 | 중 | 타입 + createSplit 초기값 수정 | |
| 3 | workspaceStore resize 커맨드 | 'flex' 위치 보존 필요 | 중 | resize 로직에서 'flex' 항목 스킵 | |
| 4 | 기존 테스트 6개 | sizes 형식 변경 | 중 | [0.5, 0.5] → [0.5, 'flex'] 등으로 수정 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | SplitPane 내부에 localStorage | ⑤ 선언적 OCP | 영속은 소비자 책임 | |
| 2 | flex pane에 숫자 크기 저장 | 핵심 설계 | state↔렌더 불일치(드리프트)의 근본 원인 | |
| 3 | flex pane에 드래그 중 inline style | ⑤ 설계 | flex:1이 자동 흡수 | |
| 4 | onResize에서 'flex' 위치 변경 | ③ API 규칙 | 구조는 소비자가 선언, resize는 숫자만 변경 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 | 3패널 [0.15,'flex',0.35], sep 0 ArrowRight | [0.17,'flex',0.35] | |
| V2 | S2 | 3패널 [0.15,'flex',0.35], sep 1 ArrowLeft | [0.15,'flex',0.33] | |
| V3 | S3 | 3패널 [0.15,0.50,'flex'], sep 0 ArrowRight | [0.17,0.48,'flex'] | |
| V4 | S4 | 2패널 [0.5,'flex'], sep ArrowRight | [0.52,'flex'] | |
| V5 | S5 | 3패널 [0.15,'flex',0.35], sep 0 ArrowRight 10회 | [0.35,'flex',0.35], 드리프트 없음 | |
| V6 | ④ 경계 | 'flex' 0개 → 마지막 fallback | 크래시 없음 | |
| V7 | ④ 경계 | 드래그 중 flex pane에 inline style 미설정 | flex:1 유지 | |
| V8 | 기존 | 기존 테스트 sizes 전환 후 통과 | 동작 동일 | |
| V9 | ⑥-3 | Workspace resize 커맨드에서 'flex' 보존 | [0.6,'flex'] → undo → [0.5,'flex'] | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
