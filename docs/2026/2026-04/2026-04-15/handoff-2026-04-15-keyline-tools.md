---
id: 4-archive/handoffs/handoff-2026-04-15-keyline-tools
title: 'Handoff: Key Line 정적 분석 + Inspector 도구'
created: 2026-04-15
updated: 2026-04-15
summary: '디자인 피드백 루프를 빠르게 하기 위한 결정적 도구의 첫 번째 세트 — ax() 정적 분석 CLI와 visual inspector overlay 테스트 페이지를 구현했다.'
legacy:
  created_at: 2026-04-15
  consumed_by: 2026-04-15-keyline-resume
  consumed_at: 2026-04-15
  status: archived
  kind: handoff
  topics: [4-archive]
  relates: []
  supersedes: []
---
# Handoff: Key Line 정적 분석 + Inspector 도구

> 디자인 피드백 루프를 빠르게 하기 위한 결정적 도구의 첫 번째 세트 — ax() 정적 분석 CLI와 visual inspector overlay 테스트 페이지를 구현했다.

## 완료

| 커밋 | 내용 |
|------|------|
| `2d1e9f8f` | keylineCheck.mjs CLI + /test/keyline 페이지 + inspector overlay |

### 구체적 산출물
- `scripts/keylineCheck.mjs` — ax() 호출 정적 파싱, role 누락/sizing override/축 값 검증. `pnpm check:keyline` / `--json`
- `src/pages/keyline/PageKeylineTest.tsx` — import.meta.glob으로 224개 demo 전체 로드, role별 그룹핑, inline/block 토글
- `src/pages/keyline/PageKeylineTest.module.css` — inspector overlay (.rl-control=빨강, .rl-item=파랑, .rl-badge=초록)
- `src/pages/keyline/keylineMap.json` — component→role 정적 매핑

### discuss에서 합의된 설계 방향
- 3레벨 스크린샷: L1 부품 / L2 위젯 / L3 레이아웃 (이번은 L1)
- key line = 보이지 않는 정렬선 (height, baseline, padding). role 축이 SSOT
- 검증 3층: L0 정적(AST) → L1 Pretext(font metrics) → L2 Puppeteer(실측). 이번은 L0 구현
- Salt Design System의 `--salt-size-base` 모델이 가장 가까운 선례
- "size variant를 제거하고 단일로 맞춘 뒤 수평 확장" 전략 확정

## 남은 것

### 즉시 (다음 세션 첫 작업)
1. /test/keyline 페이지를 스크린샷 찍어서 실제 key line 불일치 발견 → 수정 루프 시작

### 이후 (backlog)
- L2 위젯 레벨 스크린샷 도구
- L3 레이아웃 레벨 스크린샷 도구
- Puppeteer 실측 CLI (L0 정적 대비 실렌더 검증)
- size variant 수평 확장 시스템 설계
- unmapped 100개 컴포넌트 분류 (indicators, panels 등)
- 기존 도구(xray, designLint) LLM 친화적 리뉴얼

## 컨텍스트

- **외부 조사 결과**: Salt size token, Material keylines, Galen Framework assertion DSL, Pretext 텍스트 레이아웃 라이브러리
- **주의**: keylineMap.json은 keylineCheck.mjs --json에서 수동 생성. 컴포넌트 추가 시 재생성 필요 (`node scripts/keylineCheck.mjs --json | node -e "..."`)
- **기존 에러**: typecheck 2건(Timeline/incident), test 15건(i18n-editor), deps 318건 — 전부 기존, 이 세션 변경과 무관

## 이어받는 법

다음 세션에서 `/handoff`를 치면 이 파일을 자동으로 찾아 읽는다.
구체적 첫 행동: `/test/keyline` 페이지에서 inspector ON으로 key line 불일치를 찾고 수정 시작

#kind/handoff #archived
