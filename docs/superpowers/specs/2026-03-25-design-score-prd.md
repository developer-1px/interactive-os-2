# Design Score — PRD

> Discussion: UI 완성품 디자인 시스템 누락을 기계적으로 감지하여 LLM 자가성장 루프의 objective function으로 사용

## ① 동기

### WHY

- **Impact**: LLM이 theme 쇼케이스 컴포넌트의 디자인 완성도를 판단할 때, 매번 브라우저를 눈으로 보고 주관적으로 판단해야 한다. 같은 페이지를 봐도 다른 이슈를 찾거나, 찾았던 걸 놓칠 수 있고, "개선됐다"는 주장에 증거가 없다.
- **Forces**: 디자인 시스템(5번들 + surface 토큰 + DESIGN.md 조합 규칙)은 이미 구축 완료. 규칙은 있으나 **코드로 검증되지 않아** "빠뜨렸나"를 기계적으로 감지할 수 없음. 디자인 "품질" 판단은 주관적이라 자동화 불가.
- **Decision**: Playwright(puppeteer-core) 스크립트로 런타임 DOM에서 누락 체크. 기각 대안: CSS 정적 분석 — computed style(cursor, size, hover 변화 등) 체크 불가하므로 기각. 런타임 체크가 필수.
- **Non-Goals**: 디자인 품질 판단 안 함. "잘했나"가 아니라 "빠뜨렸나"만. binary(있다/없다)만 감지.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | dev 서버가 실행 중 | `pnpm score:design` 실행 | 컴포넌트 × 규칙 매트릭스 JSON 출력 + 총점 | |
| S2 | Slider에 cursor:pointer가 없음 | 스크립트 실행 | `Slider.cursor: FAIL` 포함 | |
| S3 | LLM이 Slider CSS를 수정하여 cursor 추가 | 스크립트 재실행 | `Slider.cursor: PASS`로 변경, 총점 상승 | |
| S4 | 모든 컴포넌트가 모든 규칙 통과 | 스크립트 실행 | 총점 100%, 모든 항목 PASS | |
| S5 | dev 서버가 꺼져 있음 | 스크립트 실행 | 에러 메시지 + exit code 1 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `scripts/designScore.mjs` | puppeteer-core 스크립트. `/internals/theme` 열고 DOM 순회하며 6개 규칙 체크 → JSON stdout | |
| `package.json` `score:design` 스크립트 | `node scripts/designScore.mjs` 실행 | |

출력 JSON 구조:

```json
{
  "summary": { "total": 120, "pass": 98, "score": "81.7%" },
  "components": {
    "Slider": {
      "surface": "PASS",
      "cursor": "FAIL",
      "minSize": "PASS",
      "hover": "FAIL",
      "focusVisible": "PASS",
      "score": "3/5"
    }
  }
}
```

완성도: 🟢

## ③ 인터페이스

이 기능은 키보드/마우스 UI가 아니라 **CLI 스크립트**이므로, 입력은 CLI 실행, 결과는 stdout JSON.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `pnpm score:design` | dev 서버 실행 중 | headless Chrome으로 `/internals/theme` 열기 → 전체 DOM 로드 대기 → 컴포넌트 카드 10개 식별 → 각 카드 내 인터랙티브 요소에 6개 규칙 적용 | theme 쇼케이스가 모든 UI 완성품의 렌더링 결과를 한 페이지에 포함하므로, 이 페이지 하나로 전수 검사 가능 | JSON stdout + exit 0 (전부 PASS) or exit 0 (일부 FAIL — 점수 리포트) | |
| `pnpm score:design` | dev 서버 미실행 | connect 실패 | 스크립트가 페이지를 열 수 없으면 검사 자체 불가 | stderr 에러 + exit 1 | |

### 6개 규칙의 검사 로직

| # | 규칙 | 대상 선택 | 체크 방법 | PASS 조건 |
|---|------|----------|----------|----------|
| R1 | `data-surface` 존재 | 쇼케이스 카드 루트 (grid 직계 자식 10개) | `el.hasAttribute('data-surface')` | 속성 존재 |
| R2 | `cursor: pointer` | `[role=button], [role=tab], [role=option], [role=menuitem], [role=radio], [role=switch]` (직접 role만, 래퍼 제외) | `getComputedStyle(el).cursor` | `'pointer'` |
| R3 | 최소 클릭 영역 24×24 | R2와 동일 대상 | `getBoundingClientRect()` | width ≥ 24 && height ≥ 24 |
| R4 | hover 상태 변화 | R2와 동일 대상 | 요소에 마우스 hover 전후 `backgroundColor` 또는 `color` diff | diff 존재 |
| R5 | focus-visible 표현 | R2와 동일 대상 | 요소에 focus() 후 `outline`, `boxShadow`, `backgroundColor` 중 하나 변화 | diff 존재 |
| R6 | CSS 토큰 사용 | `src/interactive-os/ui/*.module.css` | 파일 내 디자인 속성(color, background, border, padding, margin, gap, font-size, border-radius, box-shadow)의 값에서 `var(--` 사용 비율 | 100% (raw 값 없음) |

왜 이 6개인가:
- R1: DESIGN.md surface 번들은 `data-surface`로 적용. 없으면 번들 누락
- R2: 인터랙티브 요소에 cursor 없으면 클릭 가능하다는 시각 피드백 누락
- R3: WCAG 2.5.8 최소 타겟 크기 24×24
- R4: hover 없으면 인터랙션 가능성의 시각 힌트 누락
- R5: focus-visible 없으면 키보드 사용자가 현재 위치를 알 수 없음
- R6: `feedback_all_values_must_be_tokens` — raw 값 자체가 위반

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| R2: `[role=switch]` 안에 `[role=switch]` 중첩 | SwitchGroup 래퍼가 switch role 가짐 | 래퍼를 체크하면 false positive — 실제 인터랙션 대상은 내부 switch | 자식에 동일 role이 있으면 부모 스킵 | R2/R3/R4/R5에서 래퍼 제외 | |
| R4: 의도적으로 hover 없는 요소 (disabled 등) | disabled 버튼은 hover 변화 없음이 정상 | disabled는 인터랙션 불가이므로 hover 불필요 | `aria-disabled=true` 또는 `disabled` 속성 있으면 R2/R3/R4 스킵 | SKIP (PASS도 FAIL도 아님) | |
| R6: CSS 속성 값이 `0`이나 `none` | `border: none`, `padding: 0` 등 | 0과 none은 "값이 없음"이므로 토큰 불필요 | `0`, `0px`, `none`, `inherit`, `transparent`, `currentColor` 등은 허용 | R6 예외 처리 | |
| R6: `calc()` 안에 토큰 사용 | `calc(var(--space-md) + 1px)` | calc 내부에 토큰이 있으면 정상 사용 | `calc(` 포함 시 내부에 `var(--` 존재 여부로 판정 | calc 내 토큰 사용 = PASS | |
| R1: 카드가 의도적으로 `outlined` (투명 배경) | InputGroupCard는 `data-surface="outlined"` | outlined는 디자인 시스템의 정의된 surface 레벨 | `data-surface` 속성이 존재하면 값 무관 PASS | PASS | |
| Chrome 없음 | macOS에 Chrome 미설치 | 스크립트 실행 불가 | `demoCoverage.mjs`와 동일 Chrome path 탐지 → 없으면 에러 메시지 | exit 1 + "Chrome not found" | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | CSS raw 값 금지 (feedback_all_values_must_be_tokens) | R6 | ✅ 준수 — R6이 이 원칙의 코드화 | — | |
| 2 | 테스트=데모=showcase 수렴 (feedback_test_equals_demo) | ② 산출물 | ✅ 준수 — theme 쇼케이스 페이지가 곧 테스트 대상 | — | |
| 3 | LLM 자가 검증 (feedback_self_verify) | S1~S4 | ✅ 준수 — pnpm score:design 통과 = 완료 | — | |
| 4 | 증거 링크 (feedback_evidence_link_workflow) | ② 역PRD | ✅ 준수 — JSON 출력이 곧 증거 | — | |
| 5 | 디자인 번들 단위 사용 (feedback_design_bundle_system) | R1 | ✅ 준수 — data-surface 체크가 번들 사용 검증 | — | |
| 6 | 파일명 = 주 export (feedback_filename_equals_export) | ② | ✅ 준수 — `designScore.mjs` | — | |
| 7 | demoCoverage.mjs 패턴 재사용 | ② | ✅ 준수 — Chrome path 탐지, puppeteer-core 패턴 동일 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | `package.json` scripts | 새 스크립트 추가뿐, 기존 스크립트 수정 없음 | 낮 | 허용 | |
| 2 | `/internals/theme` 페이지 | 스크립트가 읽기만 하므로 영향 없음 | 없음 | — | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| 1 | 스크립트 내에서 LLM 판단 사용 | ① Non-Goals | "잘했나"가 아니라 "빠뜨렸나"만. 모든 체크는 deterministic boolean | |
| 2 | UI 컴포넌트 코드 수정 | ⑥ 부작용 | 이 PRD 범위는 측정 도구만. 수정은 별도 사이클 | |
| 3 | Playwright(@playwright/test) 의존성 추가 | ⑤ 패턴 재사용 | 이미 puppeteer-core가 있음. 새 의존성 금지 | |
| 4 | threshold 판정 (밀도 등 주관적 기준) | ① Non-Goals | binary만. 임계값 논쟁이 생기는 규칙은 넣지 않음 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 | dev 서버 실행 + `pnpm score:design` | JSON 출력, 10개 컴포넌트 × 6개 규칙 = 최대 60개 체크 항목 (R6는 컴포넌트별이 아니라 파일별) | |
| V2 | S2 | 현재 상태에서 실행 시 Slider.cursor = FAIL | R2 규칙이 Slider 내 인터랙티브 요소의 cursor 누락 감지 | |
| V3 | S3 | Slider CSS에 cursor:pointer 추가 후 재실행 | Slider.cursor = PASS, 총점 상승 | |
| V4 | S5 | dev 서버 없이 실행 | 연결 에러 + exit 1 | |
| V5 | ④ 중첩 role | SwitchGroup의 중첩 switch | 내부 switch만 체크, 래퍼 스킵 | |
| V6 | ④ disabled | disabled 버튼 | SKIP 처리, FAIL 아님 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
