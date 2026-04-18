---
id: 1-projects/viewer/doc-browsing/miller-columns/discuss
type: note
slug: discuss
title: 'Doc Browsing — Strategy'
tags: [untagged]
created: 2026-04-09
updated: 2026-04-09
legacy:
  status: active
  kind: note
  topics: [1-projects]
  relates: []
  supersedes: []
---
# Doc Browsing — Strategy

## 유저스토리

> 개발자는 docs/ 폴더의 문서를 Finder처럼 계층적으로 탐색하고, 선택한 문서를 즉시 프리뷰할 수 있다.

## 수용조건

- 폴더 구조가 Miller Columns로 표시된다
- 폴더 선택 시 하위 항목이 다음 컬럼에 나타난다
- 파일 선택 시 마크다운 프리뷰가 표시된다
- 키보드(화살표)로 완전 탐색 가능하다

## 정보구조

```
/ (root)
├── 0-inbox/
├── 1-projects/
│   ├── cms/
│   ├── viewer/
│   └── ...
├── 2-areas/
├── 3-resources/
└── PROGRESS.md
```

## 피처 분해

| ID | 피처 | 설명 |
|----|------|------|
| F1 | miller-columns | Finder 스타일 컬럼 탐색 + 프리뷰 |
| F2 | search | 문서 제목/내용 검색 (백로그) |
| F3 | breadcrumb | 현재 경로 표시 (백로그) |

#kind/note #topic/viewer
