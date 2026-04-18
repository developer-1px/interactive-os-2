---
id: 0-inbox/explain-camera-build-process
type: explain
slug: cameraBuildProcess
title: 'Camera 프리미티브 — 어떻게 만들었는가'
tags: [untagged]
created: 2026-04-18
updated: 2026-04-18
summary: '작성일: 2026-04-17 맥락: ZoomPane+ZoomPanCanvas 통합 작업(commit c9460d06)의 제작 과정 해설'
legacy:
  status: inbox
  kind: explain
  topics: [0-inbox]
  relates: []
  supersedes: []
---
# Camera 프리미티브 — 어떻게 만들었는가

> 작성일: 2026-04-17
> 맥락: ZoomPane+ZoomPanCanvas 통합 작업(commit c9460d06)의 제작 과정 해설

> - 한 세션에서 discuss → PRD → go 3단 파이프라인으로 Camera를 만들었다
> - 메인은 코드를 쓰지 않았다. 4개 리서치 에이전트 + 1개 구현 에이전트 + 2라운드 평가 에이전트가 썼다
> - 왜 PRD를 거치고 평가 루프를 돌리는가? "한 번에 제대로"를 위해서다
> - 핵심 장치는 이해도 테이블(discuss)·FRT 게이트(transition)·8단계 PRD·평가 루프 4개다

---

## "한 번에 제대로" 원칙이 파이프라인을 강제했다

AI 협업에서 "빠르게 실패하고 고치자"는 작동하지 않는다. 코드는 revert해도 **대화 컨텍스트의 오염은 되돌아가지 않는다**. 그래서 실행 전에 디테일을 채우는 3단 파이프라인이 필요하다.

```mermaid
flowchart LR
    D["/discuss\n왜·뭘"] --> P["/prd\n어떻게"]
    P --> G["/go\n실행"]
    G --> V["verify\n검증"]

    D -.->|12요소 이해도| P
    P -.->|8단계 명세| G
    G -.->|평가 루프 R1/R2| V

    style D fill:#fff3e0,stroke:#e65100
    style P fill:#e3f2fd,stroke:#1565c0
    style G fill:#e8f5e9,stroke:#2e7d32
```

| 단계 | 입력 | 출력 | 역할 |
|------|------|------|------|
| discuss | "zoompan 완성도" | 12요소 이해도 테이블 + FRT 게이트 | 숨은 의도 추출 |
| prd | discuss 결과 | 8단계 PRD 파일 | 실행 가능한 명세 |
| go | PRD | 코드 + 커밋 | 자율 구현 |

→ 각 단계가 다음 단계의 입력을 **구조적으로 강제**한다. PRD 없이 go로 넘어가면 에이전트가 해석 여지를 독자적으로 메운다.

---

## Discuss가 "완성도" 한 단어에서 설계 결정 9개를 추출했다

대화를 시작할 때 사용자의 입력은 **"zoompan 완성도"** 4글자였다. 이 시점의 이해도는 20% 🔴였다. 12요소 이해도 테이블이 갭 질문을 생성하며 5턴 만에 🟢로 올라왔다.

```mermaid
flowchart TD
    Q0["입력: zoompan 완성도"] --> Q1["갭: 완성의 정의?"]
    Q1 --> A1["사용자: 카메라 급 + 조작/뷰 모드"]
    A1 --> Q2["갭: 선언 vs 명령?"]
    Q2 --> A2["사용자: 선언형"]
    A2 --> Q3["갭: 즉시 vs 시퀀스?"]
    Q3 --> A3["사용자: 둘 다"]
    A3 --> Q4["갭: 시간 트리거만?"]
    Q4 --> A4["사용자: 종료 기반도"]
    A4 --> Q5["갭: takeover 정책?"]
    Q5 --> A5["사용자: 조작시 언제나 pause"]

    A5 --> FRT["FRT 게이트\n⑪→⑤/⑥/⑦/⑧/⑫ 역검증"]
    FRT --> OK["🟢 전환 가능"]

    style FRT fill:#fff3e0,stroke:#e65100
    style OK fill:#e8f5e9,stroke:#2e7d32
```

5턴 동안 추출된 설계 결정:
1. 통합(ZoomPane+ZoomPanCanvas) / 2. 선언형+명령형 양쪽 / 3. interact/view 모드 분리 / 4. advance = time|end|signal / 5. target = Rect|Selector|Ref / 6. 사용자 조작 시 pause(α: 복귀 안 함) / 7. translate+scale 모델 / 8. autoplay 기본 true / 9. reduced-motion duration=0

→ 이 9개가 없었으면 에이전트가 9개 분기마다 추측했을 것이다.

---

## PRD 8단계가 에이전트 자율 실행을 가능하게 했다

Discuss 결과를 그대로 에이전트에 넘기면 "왜"만 있고 "어떻게"가 없다. PRD는 **③ 인터페이스 13행·④ 경계 9행·⑦ 금지 8항·⑧ 검증 12행**까지 명시해서 구현 여지를 좁혔다.

```mermaid
flowchart TD
    subgraph Research["Phase 1: 병렬 리서치 4 에이전트"]
        R1["구현 탐색\n기존 코드 파악"]
        R2["원칙 수집\nCLAUDE.md+memory"]
        R3["부작용 탐색\n마이그레이션 범위"]
        R4["UI 도메인\n웹 표준·접근성"]
    end

    Research --> Fill["Phase 2: 8단계 의존 체인 채움"]

    subgraph Pyramid["8단계 (의존 순서)"]
        S1["① 동기 Given-When-Then"]
        S2["② 산출물"]
        S3["③ 인터페이스 + 인과"]
        S4["④ 경계 + 인과"]
        S5["⑤ 원칙 대조"]
        S6["⑥ 부작용"]
        S7["⑦ 금지"]
        S8["⑧ 검증"]
        S1-->S2-->S3-->S4-->S5-->S6-->S7-->S8
    end

    Fill --> Pyramid
    Pyramid --> X["교차 검증\n①↔⑧ / ③↔② / ④↔⑧ / ⑦↔출처"]

    style Research fill:#e3f2fd
    style Pyramid fill:#f5f5f5
```

핵심은 **⑦ 금지 8항**이다. "하지 말 것"을 명시해서 평가 루프가 자동 체크리스트가 된다:
- #8 transform-origin 금지 → R1 평가에서 "L561 잔존" 감지
- #4 상수 duration 테이블 금지 → R1 평가에서 "400 폴백" 감지
- ②마이그레이션 명시 → R1 평가에서 "zoomActiveRef 12곳 잔존" 감지

→ PRD가 **자기 채점 기준**을 함께 제공하므로 평가 루프가 수렴한다.

---

## 평가 루프가 에이전트의 "합리적 적응"을 잡아냈다

구현 에이전트는 완료 보고에 "zoomActiveRef 유지 — 합리적 적응"이라고 썼다. PRD를 읽지 않은 평가자가 diff만 보고 판정했다.

```mermaid
sequenceDiagram
    participant Main as 메인
    participant Impl as 구현 에이전트
    participant Eval as 평가 에이전트

    Main->>Impl: PRD + 작업 목록 + 금지 규칙
    Impl->>Impl: worktree에서 구현
    Impl->>Main: "완료. 단, 몇 가지 합리적 적응..."
    Main->>Eval: PRD + diff (코드베이스는 안 줌)
    Eval->>Eval: ⑦ 금지 8항 체크
    Eval->>Main: "불합격 5건 — transform-origin 잔존 등"
    Main->>Impl: 재작업 지시 (R2)
    Impl->>Main: 수정 완료
    Main->>Eval: 재평가
    Eval->>Main: "합격 — 5건 전부 해소"
```

**평가 에이전트에게 코드베이스를 주지 않은 이유**: 코드를 읽으면 맥락에 설득당해 관대해진다. diff + PRD만 주면 **PRD 위반**만 본다.

R1 감지한 5건 위반:
| # | 위반 | 출처 |
|---|------|------|
| 1 | transformOrigin 잔존 | ⑦#8 금지 |
| 2 | zoomActiveRef 미제거 | ②산출물·⑥#3·⑧#12 |
| 3 | duration 상수 폴백 | ⑦#4 금지 |
| 4 | setMode prop 중복 | ③#10 |
| 5 | Lightbox 경로 이탈 | ⑥#2 |

→ 전부 PRD 텍스트 grep만으로 잡히는 위반. 평가자는 코드 해석 없이 기계적으로 판정했다.

---

## 에이전트 7명이 병렬로 일했고 메인은 0줄 코드를 썼다

메인의 역할은 판단·디스패치·검증이다.

```mermaid
flowchart LR
    subgraph Disc["/discuss"]
        D[메인 대화]
    end
    subgraph PRD["/prd"]
        P1["리서치 4 (병렬)"]
        P2["메인: 종합·작성"]
    end
    subgraph Go["/go"]
        G1["구현 1 (worktree)"]
        G2["평가 R1"]
        G3["구현 재작업"]
        G4["평가 R2"]
        G5["simplify"]
        G1-->G2-->G3-->G4-->G5
    end

    D --> PRD
    PRD --> Go

    style P1 fill:#e3f2fd
    style G1 fill:#e8f5e9
    style G2 fill:#fff3e0
    style G4 fill:#fff3e0
```

| 에이전트 | 역할 | 산출물 |
|----------|------|--------|
| 리서치 구현 탐색 | 기존 코드 파악 | 파일 맵 + 패턴 |
| 리서치 원칙 수집 | memory feedback | 관련 원칙 12개 |
| 리서치 부작용 | 마이그레이션 범위 | 영향 파일 목록 |
| 리서치 UI 도메인 | 웹 표준 | 입력 매핑·접근성 |
| 구현 | Camera.tsx + 마이그레이션 | 1172+ 라인 |
| 평가 R1 | PRD 대비 diff 채점 | 불합격 5건 |
| 평가 R2 | 재작업 검증 | 합격 |

**병렬 리서치의 효과**: 4개 에이전트가 동시에 다른 영역을 조사했다. 직렬로 했으면 4배 시간. 또한 각자 전문 영역만 보므로 보고서 품질이 높다.

→ 메인은 **오케스트레이터**. 텍스트 생성 비용은 에이전트가 지불하고, 메인은 컨텍스트를 보존한다.

---

## 최종 구조: 파이프라인이 곧 품질 게이트였다

```mermaid
flowchart TD
    U["사용자: zoompan 완성도"] --> D["discuss\n이해도 🔴→🟢 + FRT 게이트"]
    D --> PRD["PRD 8단계\n⑦금지 + ⑧검증 = 자기 채점 기준"]
    PRD --> Impl["구현 에이전트\nworktree 격리"]
    Impl --> E1{평가 R1}
    E1 -->|불합격 5건| Impl
    E1 -->|합격| V["Verify\ntypecheck/lint/test"]
    Impl --> E2{평가 R2}
    E2 -->|합격| V
    V --> C["커밋 c9460d06"]

    style D fill:#fff3e0
    style PRD fill:#e3f2fd
    style E1 fill:#ffebee
    style E2 fill:#e8f5e9
    style C fill:#f5f5f5,stroke:#333,stroke-width:2px
```

각 게이트가 걸러낸 것:
- **discuss FRT 게이트** → 증거 필드 금지어("적절히"/"없음"/"TBD") 검사로 모호한 결론 차단
- **PRD 교차 검증** → ①↔⑧ 매핑·③↔② 일치성으로 구조적 누락 차단
- **평가 R1** → ⑦ 금지 위반 5건 기계적 감지
- **verify** → typecheck·lint로 마지막 회귀 차단

→ 각 게이트가 직전 단계의 오류를 잡으므로 **뒤로 갈수록 문제가 작아진다**. 이것이 "한 번에 제대로"의 실체다.

---

## 부록: 사용한 도구·스킬

- `/discuss` — 12요소 이해도 테이블
- `/prd` — 8단계 + 교차 검증
- `/go` — Cast→Execute→Verify 오케스트레이터
- Agent(general-purpose, Explore, code-simplifier) — 병렬 리서치·구현·평가
- isolation: worktree — 구현 에이전트 격리
- TaskCreate/TaskUpdate — 진행 추적
- Monitor — 장시간 명령 스트리밍

**커밋**: [c9460d06](c9460d06) `feat(ui): Camera 프리미티브 — ZoomPane/ZoomPanCanvas 통합` (12 files, +1172 / -392)
