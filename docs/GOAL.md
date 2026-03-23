# GOAL — interactive-os 홈페이지

> 작성일: 2026-03-23
> 맥락: walkthrough → visual test runner → UI SDK 완성품 → 홈페이지 구조 논의에서 도출

## 한 줄 목표

**interactive-os를 공부하고 쓸 개발자를 위한 공식 홈페이지** (shadcn/ui 수준)

## 핵심 원칙

1. **테스트 = 데모 = showcase** — 별개가 아니라 하나로 수렴
2. **UI SDK 완성품(behavior + design)** — renderItem 주입 없이 동작하는 완성품
3. **visual test runner** — vitest 코드를 서비스 페이지에서 브라우저 실행, 눈으로 검증
4. **구조는 big-bang, 컨텐츠는 점진** — 맥락 오염 방지

## 이상적 라우트 구조

```
/                          Landing: "이게 뭔가" + 컴포넌트 그리드
/docs                      Getting Started, 설치, 핵심 개념
/ui                        UI 완성품 카탈로그
  /ui/listbox              완성품 + visual test runner + API + keyboard 표
  /ui/treegrid
  /ui/kanban
  /ui/tabs
  /ui/combobox
  /ui/grid
  /ui/accordion
  /ui/dialog
  ...
/examples                  완성품 조합 예시
  /examples/cms            Visual CMS (TreeGrid + Tabs + DetailPanel)
  /examples/viewer         문서 뷰어

── 외부 개발자용 ↑ / 내부 개발용 ↓ ──

/internals                 내부 구조 (개발/학습)
  /internals/store         Store Inspector
  /internals/engine        Engine Pipeline, History
  /internals/axis          navigate, select, activate, expand, trap
  /internals/pattern       accordion, disclosure, switch, tabs, ...
  /internals/plugin        crud, clipboard, history, dnd, rename, typeahead
  /internals/components    Aria, Cell, Hooks
```

## /ui/{name} 페이지 구성

```
┌──────────────────────────────────────┐
│ {ComponentName}                      │
│ 설명 한 줄                            │
├──────────────────────────────────────┤
│ ┌──────────────────────────────────┐ │
│ │  [실제 컴포넌트 — render area]     │ │  ← visual test runner
│ └──────────────────────────────────┘ │
│                                      │
│ ▶ Run Test    9 passed  9 total      │  ← auto run on load
│  ● navigation                        │
│    ● ArrowDown moves focus...        │
│  ● selection                         │
│    ● Space toggles...                │
├──────────────────────────────────────┤
│ ## Usage                             │
│ <ListBox data={data} />              │  ← 완성품이니까 이게 전부
├──────────────────────────────────────┤
│ ## Keyboard                          │
│ | Key | Action |                     │  ← APG 키보드 표
└──────────────────────────────────────┘
```

## 실행 Phase

### Phase 1: 구조 big-bang (한번에) ✅
- [x] 라우트 구조 전환 (/, /docs, /ui/*, /examples/*, /internals/*)
- [x] 기존 페이지를 새 위치로 이동 (내용은 그대로)
- [x] ActivityBar 재구성 (외부용 / 내부용 분리)
- [x] Landing placeholder 페이지
- [x] Docs placeholder 페이지
- [x] 빈 /ui/* 페이지들 (기존 컴포넌트 연결)

### Phase 2: UI 완성품 (컴포넌트별 점진) ✅
- [x] 15종 UI 컴포넌트 CSS module 내장 렌더링
- [x] 각 완성품에 visual test runner 연결 (18/23 testPath)
- [x] TestRunnerPanel showcase ComponentDemo 통합
- [ ] 남은 5개 testPath 연결 (checkbox, toggle, toggleGroup, toaster, i18n)

### Phase 3: 문서 + 랜딩 ✅
- [x] Landing 페이지 — hero + component grid + stats
- [x] Getting Started 문서 — install + Quick Start + Core Concepts + Architecture
- [x] 완성품 API — showcase Usage 섹션에 통합 (test=demo=showcase 원칙)

## 배경 지식 (discussion에서 도출)

- **visual test runner**: vitest shim(describe/it/expect)을 Vite 플러그인으로 교체, 기존 테스트 코드 변경 없이 브라우저 실행. 프로토타입 완성 (listbox 9/9 passed)
- **test fixture 편향**: renderItem 주입 → 테스트/데모 괴리. UI 완성품이면 구조적으로 해소
- **pattern + collection = UI**: 모듈(axis/plugin)은 분리, UI에서는 하나. 별도 라우트 불필요
- **LLM 시대 FE 검증**: 테스트 pass는 데이터일 뿐, 눈으로 봐야 신뢰 가능
- **부분 검사는 누락을 숨김**: 실제 페이지를 렌더해야 진짜 갭이 보임
