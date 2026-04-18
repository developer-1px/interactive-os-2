---
id: samples/test-spec
type: note
slug: testSpec
title: 'Test Spec — CMS Slide CRUD'
tags: [samples]
created: 2026-04-09
updated: 2026-04-09
legacy:
  status: sample
  kind: note
  topics: [samples]
  relates: []
  supersedes: []
---
# Test Spec — CMS Slide CRUD

## 테스트 대상

CMS 슬라이드(section) 노드의 CRUD: 생성(Add), 읽기(렌더링), 수정(인라인 편집), 삭제(Delete), 복사/붙여넣기, Undo/Redo. 키보드 조작 중심.

## 테스트 전략

| 구분 | 선택 | 이유 |
|------|------|------|
| 순수 계산 | 단위 테스트 | canAccept, validate 등 스키마 파생 함수 |
| 인터랙션 | 통합 테스트 | user.keyboard() → DOM/ARIA 상태 검증. Test = Demo |

- mock 호출 검증(`toHaveBeenCalled`) 금지 — 결과 상태만 단언
- PageCms 전체 렌더링 후 키보드/클릭으로 조작

## 시나리오

| # | Given | When | Then | 검증 방법 |
|---|-------|------|------|-----------|
| 1 | 빈 section 선택 | `Enter` (Add child) | 새 card 노드 생성 | `querySelectorAll('[data-cms-id^="card-"]').length` 증가 |
| 2 | section 내 card 포커스 | `Delete` | card 제거, 포커스 인접 노드 이동 | DOM 노드 소멸 + `document.activeElement` 확인 |
| 3 | card 포커스 | `Ctrl+C` → 빈 section 포커스 → `Ctrl+V` | card 복제 | 대상 section 자식 수 증가 |
| 4 | card 포커스 | `Ctrl+X` → 다른 section → `Ctrl+V` | 원본 제거 + 대상에 삽입 | 원본 section 자식 감소, 대상 증가 |
| 5 | card 삭제 직후 | `Ctrl+Z` | card 복원 | 삭제 전 DOM 상태와 일치 |
| 6 | Undo 직후 | `Ctrl+Shift+Z` | 다시 삭제 상태 | Redo 후 card 부재 |
| 7 | text 노드 포커스 | `F2` (인라인 편집 진입) → 값 입력 → `Enter` | 값 반영 | `textContent` 또는 `aria-label` 변경 확인 |
| 8 | 삭제 불가 노드(루트 section) 선택 | `Delete` | 삭제 거부 | DOM 변화 없음 |
| 9 | card 2개 선택(Shift) | `Delete` | 2개 동시 삭제 | 자식 수 2 감소 |
| 10 | 복사 후 canAccept 불일치 대상에 붙여넣기 | `Ctrl+V` | 붙여넣기 무시 | DOM 변화 없음 |

## 커버리지 목표

- **분기 커버리지**: canAccept/canDelete 모든 노드 타입 조합
- **ARIA 상태**: 매 시나리오에서 `aria-selected`, `tabindex`, `role` 단언
- **포커스 복구**: 삭제/Undo/Redo 후 포커스가 유효한 노드에 있는지 필수 검증

## 테스트 데이터 (Fixture)

```ts
// cmsFixtures.ts — NormalizedData 형태
const fixture: NormalizedData = {
  nodes: {
    'section-1': { id: 'section-1', parentId: null, data: { type: 'section', variant: 'hero' } },
    'card-1':    { id: 'card-1', parentId: 'section-1', data: { type: 'card' } },
    'card-2':    { id: 'card-2', parentId: 'section-1', data: { type: 'card' } },
    'text-1':    { id: 'text-1', parentId: 'card-1', data: { type: 'text', role: 'heading', value: { ko: '제목', en: 'Title', ja: 'タイトル' } } },
    'section-2': { id: 'section-2', parentId: null, data: { type: 'section', variant: 'features' } },
  },
  rootIds: ['section-1', 'section-2'],
}
```

각 시나리오 전 `resetCmsData(fixture)` 호출로 상태 초기화.

#kind/note
