---
id: 1-projects/chat/prds/writer-analyze-task
title: Writer Sentence Role Analysis
created: 2026-04-04
updated: 2026-04-08
legacy:
  status: active
  kind: plan
  topics: [1-projects]
  relates: []
  supersedes: []
---
# Writer Sentence Role Analysis

## 요약
툴바 "Analyze" 버튼 → LLM이 sentence별 role(fact/interpretation/evidence/opinion) 판정 → 배지 칩으로 트리에 표기

## 액션 플랜

1. `writerSchema.ts` — sentence에 optional `role` 필드 추가
2. `writerAnalyze.ts` (신규) — `/api/writer/analyze` 호출, 응답 파싱, writerState에 role 주입
3. `PageWriter.tsx` — 툴바에 Analyze 버튼 + sentence 렌더링에 배지 칩 추가
4. `PageWriter.module.css` — 배지 칩 last-mile CSS
5. 테스트 — writer-transform 테스트에 role 필드 보존 확인

## 제약
- role은 MD에 없는 파생 데이터 → storeToMd에 포함 안 됨
- role은 sentence.data.role에만 존재

#kind/plan #topic/chat
