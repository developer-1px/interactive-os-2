---
id: GOAL
type: note
slug: goal
title: 'GOAL — interactive-os'
tags: [x]
created: 2026-03-23
updated: 2026-04-07
summary: '작성일: 2026-03-23 갱신일: 2026-04-08 맥락: "FE의 엔진" 비전 재설정. 엔진 + SaaS 2층 구조 합의.'
legacy:
  status: meta
  kind: note
  topics: [x]
  relates: []
  supersedes: []
---
# GOAL — interactive-os

> 작성일: 2026-03-23
> 갱신일: 2026-04-08
> 맥락: "FE의 엔진" 비전 재설정. 엔진 + SaaS 2층 구조 합의.

## 한 줄 목표

**조작형 UI의 엔진.** 패턴과 데이터를 선언하면 제품급 UI가 나온다.

## 비전: 2층 구조

| 층 | 무엇 | 비유 |
|----|------|------|
| **Engine (SDK)** | Store + Command + Axis + Pattern + UI + ax() | Unity 런타임 |
| **SaaS (바이브코드)** | 챗봇 → A2UI 선언 → 조작 가능한 UI → 제품 | Unity Editor + Made with Unity |

SaaS는 조작형 도구를 만드는 조작형 도구. 도구 자체도 엔진 위에서 돌아간다 (재귀 구조).

## 핵심 과제: Pit of Success

LLM이 "검색 리스트 만들어"라고만 해도 제품급 UI가 나와야 한다. 엔진이 소유하는 범위가 넓을수록 LLM/개발자의 부담이 줄어든다.

| 엔진이 소유 | 상태 |
|------------|------|
| 인터랙션 (ARIA, 키보드, focus) | ✅ 해결 |
| 상태 관리 (Command, undo/redo) | ✅ 해결 |
| 디자인 (ax() 기본 프리셋) | 🔧 축적 중 |
| 제품급 기본값 (컴포넌트별 완성된 모습) | 🔧 축적 중 |

## 차별점: Bolt/v0와의 차이

Bolt/v0는 LLM이 **React 코드를 생성**한다 → 품질이 LLM 코딩 실력에 의존.
interactive-os는 LLM이 **A2UI 선언(JSON)만 출력** → 엔진이 ARIA/키보드/디자인을 보장. 생성 표면적이 작아서 정확도가 높다.

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
