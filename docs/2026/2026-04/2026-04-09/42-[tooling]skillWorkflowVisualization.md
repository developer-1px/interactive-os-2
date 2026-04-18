---
id: '3-resources/42-[tooling]skillWorkflowVisualization'
title: '스킬 워크플로우 전체 시각화 — 2026-04-08'
created: 2026-04-09
updated: 2026-04-11
legacy:
  status: reference
  kind: tooling
  topics: [3-resources, tooling]
  relates: []
  supersedes: []
---
# 스킬 워크플로우 전체 시각화 — 2026-04-08

## 배경

보유한 모든 스킬의 연결 관계와 파이프라인을 시각화하여, 전체 워크플로우의 구조를 한눈에 파악한다. 3명의 탐색 에이전트(a-f, g-p, q-z)와 1명의 평가 에이전트가 조사한 결과를 종합했다.

## 스킬 인벤토리 (32개)

| 분류 | 스킬 |
|------|------|
| **기획 파이프라인** | discuss, story, ia, wireframe, prd, cast, go, do |
| **품질 루프** | improve, improve-design, improve-skill, demo-coverage, screen-test, design-review |
| **디자인** | design-extract, design-implement |
| **문제 해결** | fix, reframe, conflict, doubt |
| **코드 품질** | simplify, srp, ocp, refactor-collect, antipattern |
| **문서/정리** | inbox, para, publish, area, close, explain, backlog |
| **제품 검증** | use |
| **유틸리티** | ideal |

## 전체 워크플로우

```mermaid
flowchart TB
  subgraph PLANNING["🔵 기획 파이프라인"]
    direction TB
    discuss["discuss\n문제 구조화"]
    story["story\n유저스토리 맵"]
    ia["ia\n정보 구조 설계"]
    wireframe["wireframe\n부품 매칭"]
    prd["prd\n요구사항 명세"]
    cast["cast\n에이전트 편성"]
    go["go\n자율 실행"]
    do["do\nos 기반 개발"]

    discuss --> story
    story --> ia
    ia --> wireframe
    wireframe --> prd
    story -.->|"작은 기능"| prd
    prd --> cast
    cast --> go
    go --> do
  end

  subgraph QUALITY["🟢 품질 루프"]
    direction TB
    improve["improve\n릴리즈 품질"]
    improveDesign["improve-design\n디자인 점수"]
    improveSkill["improve-skill\n스킬/훅 패치"]
    demoCov["demo-coverage\n커버리지"]
    screenTest["screen-test\n화면 검증"]
    designReview["design-review\n디자인 리뷰"]

    designReview --> improveDesign
    improveDesign -.->|"9/10 미달"| improveDesign
  end

  subgraph PROBLEM["🟡 문제 해결"]
    direction TB
    fix["fix\n자동 디버깅"]
    reframe["reframe\n문제 재정의"]
    conflict["conflict\n대립 해소"]
    doubt["doubt\n불필요 제거"]
  end

  subgraph CODE_QUALITY["🟠 코드 품질"]
    direction TB
    simplify["simplify\n코드 정리"]
    srp["srp\n단일 책임"]
    ocp["ocp\n개방-폐쇄"]
    refactorCollect["refactor-collect\n컨벤션 수집"]
    antipattern["antipattern\n훅 하네스"]
  end

  subgraph DOCS["🔴 문서/정리"]
    direction TB
    inbox["inbox\n문서 저장"]
    para["para\nPARA 분류"]
    publish["publish\n문서 완전성"]
    area["area\nArea 갱신"]
    closeSkill["close\n사이클 마무리"]
    explain["explain\n해설 문서"]
    backlog["backlog\n백로그 관리"]

    inbox --> para
  end

  subgraph DESIGN["🟣 디자인"]
    direction TB
    designExtract["design-extract\n토큰 추출"]
    designImpl["design-implement\nax() 구현"]
  end

  subgraph PRODUCT["⚪ 제품 검증"]
    use["use\n브라우저 QA"]
    ideal["ideal\n이상 시뮬레이션"]
  end

  %% Cross-group chains
  go -->|"Verify"| screenTest
  go -->|"Verify"| simplify
  go -->|"Retrospect"| closeSkill
  closeSkill --> publish
  closeSkill --> area
  publish --> area
  improveSkill -.->|"retro 결과"| antipattern

  use --> discuss
  use -->|"deep"| prd

  discuss -.->|"제약 정체"| conflict
  discuss -.->|"이상 결과"| ideal

  improve --> designImpl
  designReview --> improveDesign
  designExtract -.-> designImpl

  go -->|"Verify"| demoCov

  %% Styling
  classDef planning fill:#dbeafe,stroke:#3b82f6
  classDef quality fill:#dcfce7,stroke:#22c55e
  classDef problem fill:#fef9c3,stroke:#eab308
  classDef codeq fill:#ffedd5,stroke:#f97316
  classDef docs fill:#fee2e2,stroke:#ef4444
  classDef design fill:#f3e8ff,stroke:#a855f7
  classDef product fill:#f1f5f9,stroke:#94a3b8

  class discuss,story,ia,wireframe,prd,cast,go,do planning
  class improve,improveDesign,improveSkill,demoCov,screenTest,designReview quality
  class fix,reframe,conflict,doubt problem
  class simplify,srp,ocp,refactorCollect,antipattern codeq
  class inbox,para,publish,area,closeSkill,explain,backlog docs
  class designExtract,designImpl design
  class use,ideal product
```

## 핵심 파이프라인 3개

### 1. 메인 기획→실행 파이프라인
```
discuss → story → ia → wireframe → prd → cast → go → do
                                                  ↓
                                        verify (screenTest, simplify, demoCov)
                                                  ↓
                                        retrospect → close → publish → area
```

### 2. 제품 검증 루프
```
use (브라우저 QA) → discuss → prd → go → ... (메인 파이프라인 합류)
```

### 3. 디자인 품질 루프
```
design-extract → design-implement → design-review → improve-design ⟳ (9/10+까지)
```

## 독립 스킬 (파이프라인 밖)

| 스킬 | 진입 조건 |
|------|-----------|
| fix | 고장 신고 |
| reframe | 수정 방향 불만 |
| conflict | A vs B 딜레마 |
| doubt | 불필요한 것 제거 |
| srp / ocp | 파일 책임 점검 |
| refactor-collect | 코드리뷰 중 |
| antipattern | 안티패턴 발견 |
| explain | 해설 요청 |
| backlog | "나중에" |
| ideal | 이상 결과 시뮬레이션 |

## 다음 행동

- 이 다이어그램을 기반으로 누락된 연결이나 불필요한 스킬이 없는지 `/doubt` 검증
- 파이프라인 진입점 가이드 문서 작성 (어떤 상황에서 어떤 스킬로 시작?)

#kind/note #topic/tooling
