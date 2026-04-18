---
id: samples/release-note
title: Release Notes
status: sample
kind: note
created: 2026-04-09
updated: 2026-04-09
summary: '---'
topics: [samples]
relates: []
supersedes: []
---
# Release Notes

---

## v0.3.0 — 2026-04-09

### 하이라이트

Story Living Spec 뷰어를 도입하여 유저스토리를 실행 가능한 사양서로 전환했다.
전체 코드베이스의 레거시 CSS를 ax() 디자인 시스템으로 소급 전환 완료.

### 새 기능

- **Story Living Spec 뷰어** — `/viewer/story` 라우트에서 유저스토리 맵을 인터랙티브하게 탐색
  - Before: 스토리는 마크다운 문서로만 존재, 실행 결과와 분리
  - After: 스토리 항목 클릭 시 해당 데모가 인라인 실행되고 완료 상태가 실시간 반영
- **ax() 소급 전환 CLI** — `pnpm score:design`으로 전환율 측정 가능
  - Before: `structure.css`, `style={}`, 산발적 className 혼용
  - After: ax() 12축 단일 API로 시각·구조 속성 통합 선언

### 개선

- indicators/, examples/, pages/ 잔여 `structure.css` → ax() 전수 소급
- ui/ 레거시 raw CSS 클래스를 ax() 디자인 시스템으로 전환
- Lightbox 풀스크린 뷰어 — 머메이드/이미지 클릭 시 전체화면 modal
- `layout:'wrap'` + `placement:'relative'` 축 추가

### 버그 수정

- TreeGrid에서 row 모드 ↔ cell 모드 전환 시 포커스가 유실되던 문제 수정
- Combobox 필터링 후 빈 리스트에서 Enter 키가 에러를 발생시키던 문제 수정

### Breaking Changes

- `structure.css` import 제거됨 — ax() 마이그레이션 필수
- `style={}` prop 사용 시 lint 에러 발생 (last-mile module.css만 허용)

### 마이그레이션 가이드

```diff
- import './structure.css'
- <div className="flex-row gap-md padding-lg">
+ <div className={ax({ layout: 'row', gap: 'md', pd: 'lg' })}>
```

기존 `style={}` 사용처는 ax() 축으로 대체하거나, 축에 없는 속성만 `*.module.css`로 이동.

---

## v0.2.0 — 2026-03-15

### 하이라이트

Pipeline Dashboard로 서비스 기획 파이프라인 진행 상태를 한눈에 파악할 수 있게 되었다.
MillerColumns 파일 브라우저로 계층 탐색 UX를 대폭 개선.

### 새 기능

- **Pipeline Dashboard** — `/viewer/pipeline` 라우트에서 트리×단계 매트릭스 제공
  - Before: 각 PRD/스토리의 진행 상태를 파일 시스템에서 수동 확인
  - After: story→ia→wireframe→prd→do 5단계를 셀 단위로 시각화, 파일 존재 = 완료 상태
- **MillerColumns 파일 브라우저** — 3컬럼 계층 탐색 UI
  - Before: 트리뷰에서 깊은 폴더를 열면 전체 구조 파악 어려움
  - After: 선택한 폴더의 자식이 다음 컬럼에 즉시 표시, 경로가 항상 가시적

### 개선

- ListBox 가상 스크롤 적용으로 1,000+ 아이템에서도 60fps 유지
- useEngine hook에 `getVisibleNodes` 캐싱 추가
- Workspace 패널 간 드래그 앤 드롭 안정화

### 버그 수정

- MillerColumns에서 키보드 좌우 이동 시 스크롤 위치가 초기화되던 문제 수정
- Pipeline Dashboard 셀 클릭 시 빈 파일이 생성되던 문제 수정
- focusRecovery 플러그인이 삭제된 노드 ID를 참조하던 메모리 누수 수정
