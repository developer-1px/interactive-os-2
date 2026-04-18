---
id: 1-projects/viewer/0-discovery
type: note
slug: discovery
title: 'Viewer — Discovery'
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
# Viewer — Discovery

## 왜 하는가

Mac Finder에서 영감받은 콘텐츠 뷰어. 프로젝트의 문서, 코드 구조, 메타 정보를 **탐색**하는 도구.

## 핵심 문제

- 프로젝트 산출물(docs, 코드, 백로그)이 흩어져 있어 전체상을 파악하기 어렵다
- 탐색 도구 없이는 파일 시스템을 직접 뒤져야 한다
- 문서를 작성해도 발견되지 않으면 죽은 문서가 된다

## 이해관계자

| 페르소나 | 욕구 |
|---------|------|
| 개발자 | 프로젝트 구조와 문서를 빠르게 탐색하고 싶다 |
| 기획자 | 현재 진행 상황과 백로그를 한눈에 보고 싶다 |
| 신규 멤버 | 프로젝트 전체상을 빠르게 파악하고 싶다 |

## 제약

- interactive-os 기반 (ax() + ui/ 컴포넌트만)
- 읽기 전용 (편집은 CMS 도메인)
- 기존 라우트: `/viewer/*`, `/docs`

#kind/note #topic/viewer
