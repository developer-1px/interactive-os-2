---
id: samples/artifact-pipeline
type: note
slug: artifactPipeline
title: '산출물 파이프라인 — N:M 관계도'
tags: [samples]
created: 2026-04-11
updated: 2026-04-11
legacy:
  status: sample
  kind: note
  topics: [samples]
  relates: []
  supersedes: []
---
# 산출물 파이프라인 — N:M 관계도

## 전체 흐름

```mermaid
graph TB
  %% ── 크로스커팅 ──
  DL[Decision Log]

  %% ── 기획 ──
  IDEA[Idea] --> SM[Story Map]
  SM --> IA[IA]
  SM --> ARCH[Architecture]
  IA --> WF1[Wireframe: 편집]
  IA --> WF2[Wireframe: 미리보기]
  IA --> WF3[Wireframe: 사이드바]
  WF1 --> DS1[Design Spec: Toolbar]
  WF2 --> DS1
  WF1 --> DS2[Design Spec: Canvas]
  WF3 --> DS3[Design Spec: TreeView]

  %% ── Living Spec 허브 ──
  ARCH --> LS1[Living Spec: 슬라이드 CRUD]
  ARCH --> LS2[Living Spec: 노드 편집]
  ARCH --> LS3[Living Spec: DnD 이동]
  DS1 --> LS1
  DS2 --> LS1
  DS2 --> LS2
  DS3 --> LS3

  %% ── 구현 ──
  LS1 --> TS1[Task: 슬라이드 추가]
  LS1 --> TS2[Task: 슬라이드 삭제]
  LS1 --> TS3[Task: 슬라이드 복제]
  LS2 --> TS4[Task: 인라인 편집]
  LS2 --> TS5[Task: 편집 취소]
  LS2 --> TS6[Task: 외부 클릭 확정]
  LS3 --> TS7[Task: 트리 이동]
  LS3 --> TS8[Task: 캔버스 이동]
  LS3 --> TS9[Task: undo 복원]

  TS1 --> CODE1[Code: addSlide.ts]
  TS1 --> CODE2[Code: CmsSidebar.tsx]
  TS2 --> CODE1
  TS3 --> CODE3[Code: duplicateSlide.ts]

  %% ── 검증 ──
  CODE1 --> TEST1[Test: slide-crud.test]
  CODE2 --> TEST1
  CODE3 --> TEST1
  CODE1 --> TEST2[Test: undo-redo.test]
  CODE2 --> DR1[Design Review: v0.3]
  CODE3 --> DR1

  %% ── 릴리즈 → 피드백 ──
  TEST1 --> RN1[Release: v0.3.0]
  DR1 --> RN1
  RN1 -.->|status 갱신| LS1
  RN1 -.->|status 갱신| LS2
  RN1 -.->|status 갱신| LS3

  %% ── Decision Log 크로스커팅 ──
  DL -.-> SM
  DL -.-> ARCH
  DL -.-> DS1
  DL -.-> LS1

  %% ── 스타일 ──
  classDef planning fill:#3b82f6,color:#fff,stroke:none
  classDef design fill:#8b5cf6,color:#fff,stroke:none
  classDef living fill:#f59e0b,color:#000,stroke:none
  classDef task fill:#6b7280,color:#fff,stroke:none
  classDef code fill:#10b981,color:#fff,stroke:none
  classDef verify fill:#ef4444,color:#fff,stroke:none
  classDef meta fill:#64748b,color:#fff,stroke:none,stroke-dasharray:5 5

  class IDEA,SM,IA planning
  class WF1,WF2,WF3,ARCH planning
  class DS1,DS2,DS3 design
  class LS1,LS2,LS3 living
  class TS1,TS2,TS3,TS4,TS5,TS6,TS7,TS8,TS9 task
  class CODE1,CODE2,CODE3 code
  class TEST1,TEST2,DR1 verify
  class RN1 verify
  class DL meta
```

## 산출물 유형

| 색상 | 단계 | 산출물 | 수명 | 팬아웃 |
|------|------|--------|------|--------|
| 🔵 | 기획 | Story Map, IA, Wireframe, Architecture | Living | 1 → N |
| 🟣 | 디자인 | Design Spec | Living | N:M (여러 화면이 공유) |
| 🟡 | **허브** | **Living Spec** (story.yaml) | **영속** | 기획 ↔ 구현 연결점 |
| ⚫ | 구현 | Task Spec | 1회성 | 1 Story → N Task |
| 🟢 | 코드 | Code | 영속 (git) | N Task → M 파일 |
| 🔴 | 검증 | Test, Design Review, Release Note | 누적 | 피드백 루프 |
| 점선 | 메타 | Decision Log | 영속 | 전 구간 크로스커팅 |

## N:M 관계 상세

| From | To | 관계 | 왜 N:M인가 |
|------|----|------|------------|
| Wireframe → Design Spec | N:M | 여러 화면이 같은 Toolbar 디자인 공유 |
| Design Spec → Living Spec | N:M | 하나의 디자인이 여러 Story에, 하나의 Story가 여러 디자인 참조 |
| Task Spec → Code | N:M | 여러 Task가 같은 파일 수정, 하나의 Task가 여러 파일 수정 |
| Code → Test | N:M | 여러 코드가 하나의 통합 테스트, 하나의 코드에 여러 테스트 |
| Release → Living Spec | 1:N | 릴리즈가 여러 Story의 status를 done으로 갱신 |

## 피드백 루프

```
Release Note
  → Living Spec status 갱신 (done/wip/todo)
    → 다음 Story Map 우선순위 조정
      → 새 Task Spec 생성
        → Code → Test → Release → ...
```

## 핵심 인사이트

**Living Spec이 허브다.**

- 위: 기획 4종(Story Map, IA, Architecture, Design Spec)이 흘러들어옴
- 아래: 구현 3종(Task, Code, Test)으로 팬아웃
- 옆: Release에서 피드백 루프로 돌아옴
- 관통: Decision Log이 모든 분기점에 기록

"우리 뭐가 구현되어 있지?" → **Living Spec을 열면 답이 나온다.**
