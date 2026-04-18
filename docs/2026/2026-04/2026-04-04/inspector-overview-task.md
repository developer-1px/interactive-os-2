---
id: 1-projects/viewer/prds/inspector-overview-task
title: 'Inspector Overview 리디자인'
created: 2026-04-04
updated: 2026-04-08
legacy:
  status: active
  kind: plan
  topics: [1-projects]
  relates: []
  supersedes: []
---
# Inspector Overview 리디자인

## 배경
현재 InspectorWindow: 인스턴스 플랫 나열 + 우측에 bound/unbound 전부 + Info/State/KeyMap 혼재 → 한눈에 조망 불가

## 태스크

- [ ] T1: registry에 DOM element 노출 — AriaActions에 getElement() 추가, useAria에서 containerRef 연결
- [ ] T2: DOM 위계 트리 빌더 — contains()로 인스턴스 간 부모-자식 재구성, 라벨에 role+plugins 인라인
- [ ] T3: InspectResult에 clickMap 포함 — inspect()가 pattern.clickMap도 반환
- [ ] T4: 우측 2탭 UI — Interaction탭(bound 커맨드+키맵+마우스맵) / State탭(entities)
- [ ] T5: bound-only 필터 — unbound 커맨드 기본 숨김
- [ ] T6: Info 섹션 제거 — role/plugins는 트리 라벨로 이동 완료

## 의존 순서
T1 → T2 (DOM element 있어야 위계 구성)
T3 → T4 (clickMap 있어야 Interaction탭에 표시)
T5, T6은 T4와 병렬 가능

#kind/plan #topic/viewer
