---
id: 1-projects/book/prds/hook-catalog-book-fixes-task
title: Hook Catalog + Book Fixes
created: 2026-04-07
updated: 2026-04-08
legacy:
  status: active
  kind: plan
  topics: [1-projects]
  relates: []
  supersedes: []
---
# Hook Catalog + Book Fixes

## 작업 1: 훅 카탈로그 삽입
1. ui/ 컴포넌트 파일에 `/** @catalog 용도 설명 */` JSDoc 추가
2. guardOsPatterns.mjs의 `listComponents()` → `listComponentsWithCatalog()` 확장
3. 차단 메시지에 "이름 — 용도" 형태로 출력

## 작업 2: Book 버그 수정
1. Breadcrumb root="" 잘림 — 이미 수정됨 (Breadcrumb.tsx:6)
2. 링크 이탈 — MarkdownViewer에 link 변환 핸들러 추가 또는 Book에서 처리
3. Quick Open Enter — 기존 QuickOpen 컴포넌트 재사용 또는 keyMap에 Enter 추가
4. End 키 범위 — page-level keyMap에 Home/End 추가

## 제약
- pages/에서 raw <input>, onKeyDown, addEventListener 금지 (훅)
- os 부품 재사용 우선

#kind/plan #topic/book
