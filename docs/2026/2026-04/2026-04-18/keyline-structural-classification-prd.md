---
id: 2-areas/design/prds/keyline-structural-classification-prd
type: prd
slug: keylineStructuralClassification
title: 'Keyline Structural Classification — PRD'
tags: [untagged]
created: 2026-04-18
updated: 2026-04-18
summary: 'Discussion: keyline 테스트 페이지를 "LLM이 어떻게 조립해도 시각 일관성이 보장된다"는 디자인 시스템의 자기 증명으로 고도화'
legacy:
  status: active
  kind: prd
  topics: [2-areas]
  relates: []
  supersedes: []
---
# Keyline Structural Classification — PRD

> Discussion: keyline 테스트 페이지를 "LLM이 어떻게 조립해도 시각 일관성이 보장된다"는 디자인 시스템의 자기 증명으로 고도화

## WHY (discuss FRT)

- **Impact**: 현재 keyline 페이지는 "높이가 맞는가"(L3 실측)만 봄. `style={{height:36}}`로 우연히 맞춘 것과 `ax({role:'control'})`로 시스템이 보장하는 것을 구분 불가. LLM 바이브코딩에서 role 축 없이 높이를 하드코딩하면 시스템 일관성이 깨지지만 경고 없음.
- **Forces**: role 축이 크기 SSOT(`tokens.css:230 --control-height: 36px` → `ax.css:255 .rl-control { min-height: var(--control-height) }`). 3계층 검증(정적 gate + positive trace + value check) 중 positive trace 부재.
- **Assets**: `keylineCheck.mjs`(정적 negative gate), `PageKeylineTest`(L3 런타임 실측), `tokens.css`(L1 토큰), `ax.css`(L2 축 파생), 139 demo
- **Decision**: classList + computedStyle로 런타임 원인 분류. CDP `getMatchedStylesForNode` 기각 (Playwright 의존, 브라우저 페이지 내 불가, 별도 인프라 필요)
- **Non-Goals**: keylineMap.json 자동 생성, 프로덕션 컴포넌트 수정, ax.css/tokens.css 변경

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | 컴포넌트가 `ax({role:'control'})`을 사용하여 `.rl-control` 클래스 보유 | keyline 페이지 로드 후 측정 완료 | 🟢 **structural**로 분류 — "시스템이 보장" | |
| S2 | 컴포넌트가 role 없이 높이 36px (style 또는 다른 CSS로) | keyline 페이지 로드 후 측정 완료 | 🟡 **coincidental**로 분류 — "높이는 맞지만 role 없음" | |
| S3 | 컴포넌트 높이가 기대값과 1px 초과 차이 | keyline 페이지 로드 후 측정 완료 | 🔴 **broken**으로 분류 — "높이 불일치" | |
| S4 | 데모 DOM에서 rl-* 또는 ia-* 요소를 찾을 수 없음 | keyline 페이지 로드 후 측정 시도 | ⬜ **uncovered**로 분류 — "측정 불가" | |
| S5 | 페이지 전체 로드 및 측정 완료 | 헤더 요약 확인 | `🟢 structural 85% · 🟡 coincidental 3% · 🔴 broken 1% · ⬜ uncovered 11%` 형태로 구조적 커버리지 표시 | |
| S6 | 특정 role 섹션 내 컴포넌트들 | 각 컴포넌트 옆 확인 | 분류 badge + 토큰 출처 표시 (예: `🟢 36px ← .rl-control`) | |

완성도: 🟢

## ② 산출물

| 산출물 | 위치 | 설명 | 역PRD |
|--------|------|------|-------|
| `Classification` 타입 | PageKeylineTest.tsx | `'structural' \| 'coincidental' \| 'broken' \| 'uncovered'` | |
| `classifyKeyline()` 함수 | PageKeylineTest.tsx | DOM 요소 → Classification 판정 (hasRoleClass + computedMinH + measuredH) | |
| `classifications` state | PageKeylineTest.tsx | `Record<string, Classification>` — 컴포넌트별 분류 결과 | |
| DemoSlot 확장 | PageKeylineTest.tsx:DemoSlot | 기존 onMeasure에 분류 로직 추가, 분류 badge 렌더링 | |
| RoleSection 확장 | PageKeylineTest.tsx:RoleSection | 분류별 카운트 표시 (structural N / coincidental N / ...) | |
| 헤더 요약 확장 | PageKeylineTest.tsx:PageKeylineTest | 전체 구조적 커버리지 % 표시 | |

완성도: 🟢

## ③ 인터페이스

> 데이터 변환: DOM 요소 → Classification

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| DOM 요소 발견, classList에 `rl-{role}` 있음 | measuredH == tokenH (±1px) | classify | `ax.css`의 `.rl-control { min-height: var(--control-height) }` 규칙이 적용됨 → 토큰 체인 성립 | 🟢 structural | |
| DOM 요소 발견, classList에 `rl-{role}` 있음 | measuredH != tokenH (>1px) | classify | rl-* 규칙은 있지만 module.css 오버라이드 또는 content에 의한 stretch | 🔴 broken | |
| DOM 요소 발견, classList에 `rl-{role}` 없음 | measuredH == expectedH (±1px) | classify | role 축 없이 다른 CSS로 높이가 우연히 일치 | 🟡 coincidental | |
| DOM 요소 발견, classList에 `rl-{role}` 없음 | measuredH != expectedH (>1px) | classify | role 축도 없고 높이도 불일치 | 🔴 broken | |
| DOM 요소 못 찾음 (ia-*/rl-* 셀렉터 실패) | — | classify | 데모가 래핑 div 안에 컴포넌트를 렌더링하여 셀렉터가 도달 불가 | ⬜ uncovered | |

### classifyKeyline 알고리즘

```
INPUT: container (HTMLElement), expectedRole (string)
OUTPUT: { classification: Classification, height: number | null, source: string }

1. el = container.querySelector('[class*="rl-"]') ?? container.querySelector('[class*="ia-"]')
2. if !el → return { uncovered, null, 'no rl-*/ia-* element' }
3. measuredH = Math.round(el.getBoundingClientRect().height)
4. roleClasses = ['rl-control','rl-control-group','rl-item','rl-badge']
5. hasRoleClass = roleClasses.some(c => el.classList.contains(c))
6. matchedRole = roleClasses.find(c => el.classList.contains(c)) // e.g. 'rl-control'
7. tokenH = ROLE_EXPECTED[expectedRole] // from keylineMap
8. if !tokenH → tokenH = mode(같은 role 높이들) // badge 등 기대값 미정의
9. heightMatch = tokenH != null && Math.abs(measuredH - tokenH) <= TOLERANCE

CLASSIFY:
  hasRoleClass && heightMatch  → structural,  source: `← .${matchedRole} (token: ${tokenH}px)`
  hasRoleClass && !heightMatch → broken,       source: `← .${matchedRole} but ${measuredH}px ≠ ${tokenH}px`
  !hasRoleClass && heightMatch → coincidental, source: `${measuredH}px (no .rl-* class)`
  !hasRoleClass && !heightMatch → broken,      source: `${measuredH}px ≠ ${tokenH}px (no .rl-* class)`
```

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| `rl-control-group` 내부의 `rl-control` (min-height unset) | ax.css:303 `.rl-control-group .rl-control { min-height: unset }` | 그룹 내 control은 그룹에 크기를 위임하므로 개별 측정 대상이 아님 | 데모 자체가 control-group 단위로 등록되므로 외곽 셸(`rl-control-group`)이 측정됨 → structural | |
| `badge` role (높이 고정값 없음) | ROLE_EXPECTED에 badge 미등록 | badge는 font-size + padding으로 높이 파생, 고정 토큰 없음 | mode(실측값들) 기반 판정. hasRoleClass 체크는 여전히 가능 → `rl-badge` 있으면 structural | |
| indicator 레벨 (1em, 부모 의존) | IndicatorSection으로 별도 렌더링 | indicator는 keyline 대상이 아님 (부모 font-size 상속) | classify 대상에서 제외 — IndicatorSection은 분류 badge 없음 | |
| 데모에 여러 rl-* 요소 | querySelector가 첫 번째 반환 | 데모의 최상위 인터랙티브 요소가 keyline 대상 | 첫 번째 rl-* 요소를 측정 (기존 동작 유지) | |
| 비키라인 레벨 (cell, composite, orchestrator 등) | LevelSection으로 렌더링, role 없음 | 이 레벨은 keyline 높이 제약이 없음 | LevelSection은 기존대로 높이 측정만, 분류 badge 없음 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | role 축 = 크기 SSOT (feedback_role_axis_design) | ③ classify 알고리즘 | ✅ 준수 — rl-* 클래스 존재를 구조적 보장의 증거로 사용 | — | |
| 2 | ax()만 사용, style={} 금지 (CLAUDE.md) | ② DemoSlot 확장 | ⚠️ 측정 도구용 inline style — 기존 VerticalRoleSection에서 backgroundImage guide line이 이미 inline style 사용 중. 측정/검사 도구는 예외 | 기존 패턴 답습 | |
| 3 | keyline 불일치 = 토큰/축 설계 결함 (project_keyline_audit_pipeline) | ① S3 broken 분류 | ✅ 준수 — broken 분류가 이 원칙을 가시화 | — | |
| 4 | 자동 파생이 본질 (feedback_auto_derivation_is_system) | ③ structural 분류 | ✅ 준수 — "role 클래스가 있는가"로 자동 파생 여부를 판정 | — | |
| 5 | test = demo, 통합 우선 (feedback_testing_principles) | ② 산출물 전체 | ✅ 준수 — 기존 demo를 그대로 사용, 별도 test fixture 불필요 | — | |
| 6 | 손 매핑 금지 (feedback_auto_derivation_is_system) | ③ step 5 hasRoleClass | ✅ 준수 — DOM classList에서 자동 탐지, keylineMap role 필드 의존 최소화 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | DemoSlot onMeasure 콜백 | 콜백 시그니처 확장 (height + classification) | 낮음 | 기존 measurements state와 별도 classifications state로 분리 — 기존 height 로직 불변 | |
| 2 | 헤더 요약 텍스트 | 기존 "N measured · all matched" → 분류별 % 표시로 변경 | 낮음 | 기존 mismatch 카운트는 broken 카운트로 대체 — 정보량 증가 | |
| 3 | 래핑 div 데모 (43개 uncovered) | uncovered %가 높아 보일 수 있음 | 중간 | uncovered는 별도 카운트 — "측정 가능한 것 중 structural %"도 병기 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| 1 | 프로덕션 컴포넌트(ui/) 수정 | ⑥-1 범위 제한 | keyline 분류를 위해 컴포넌트를 바꾸면 본말전도 | |
| 2 | ax.css / tokens.css 수정 | ⑤-1 role=SSOT | 토큰/축은 keyline의 측정 대상이지 수정 대상이 아님 | |
| 3 | keylineMap.json의 role 필드에 의존하여 분류 | ⑤-6 자동 파생 | DOM classList에서 자동 탐지해야 함 — keylineMap role은 검증용 대조만 | |
| 4 | coincidental을 structural로 승격하는 자동 수정 | ⑥-3 범위 | 분류는 보고 도구, 수정은 별도 작업 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①S1 | TextInput 데모 → classify | 🟢 structural (rl-control 클래스 있음, 36px) | |
| V2 | ①S1 | TabItem 데모 → classify | 🟢 structural (rl-control 클래스 있음, 36px) | |
| V3 | ①S1 | ListItem 데모 → classify | 🟢 structural (rl-item 클래스 있음, 28px) | |
| V4 | ①S4 | StreamFeed 데모 → classify | ⬜ uncovered (rl-* 요소 탐색 실패) | |
| V5 | ①S5 | 헤더 요약 | structural % + coincidental % + broken % + uncovered % = 100% | |
| V6 | ④E1 | DatePicker 데모 (control-group) → classify | 🟢 structural (rl-control-group 클래스 있음) | |
| V7 | ④E2 | Badge 데모 → classify | 🟢 structural (rl-badge 클래스 있음, mode 기반 높이) | |
| V8 | ④E5 | orchestrator 레벨 Accordion 데모 | 분류 badge 없음 (비키라인 레벨) | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
