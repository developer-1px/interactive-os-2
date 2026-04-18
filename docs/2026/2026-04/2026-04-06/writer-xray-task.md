---
id: 1-projects/chat/prds/writer-xray-task
title: 'Writer 엑스레이 — 구조 시각화 Phase 1'
status: active
kind: plan
created: 2026-04-06
updated: 2026-04-08
topics: [1-projects]
relates: []
supersedes: []
---
# Writer 엑스레이 — 구조 시각화 Phase 1

## 배경
Discussion에서 수렴: "글의 엑스레이" — 문장 역할을 색으로, 문장 간 관계를 선으로 보여주는 구조적 글쓰기 도구.

## 액션 플랜

### 1. 스키마 확장 (writerSchema.ts)
- sentence.role: 기존 4종 → 6종 (`claim`, `evidence`, `reasoning`, `context`, `counter`, `transition`)
- sentence.relations 추가: `Array<{ target: string, type: 'supports' | 'contradicts' | 'elaborates' | 'conditions' }>`

### 2. Command 정비 (PageWriter.tsx)
- `applyRoles`를 Command로 전환 (현재 writerState.setData 직접 호출 → history 우회 버그)
- `writerCommands.setRoles`: batch로 여러 문장의 role + relations를 한 번에 적용
- undo/redo 가능하게

### 3. AI 분석 확장 (writerAnalyze.ts)
- 프롬프트 확장: role 6종 + relations 동시 요청
- `extractAnalysis`: role map + relation map 동시 추출
- `applyAnalysis`: Command 기반 적용

### 4. 색상 시각화 (WriterTreeGrid 또는 새 컴포넌트)
- sentence role별 색상 코딩 (ax() tone/text 축 활용)
- claim=blue, evidence=green, reasoning=purple, context=gray, counter=orange, transition=dimmed
- 관계선은 Phase 1에서 생략 (복잡도 과다) → role 색상만 먼저

### 5. 검증
- 기존 writer 테스트 통과
- role 6종 AI 태깅 동작 확인
- undo/redo 정상 동작

## 파일 영향
- `src/pages/writer/writerSchema.ts` — role enum 확장, relations 추가
- `src/pages/writer/writerAnalyze.ts` — 프롬프트/추출/적용 로직
- `src/pages/writer/writerChatBridge.ts` — applyRoles → applyAnalysis
- `src/pages/writer/PageWriter.tsx` — Command 추가, 시각화
- `src/interactive-os/ui/WriterTreeGrid.tsx` — role 색상 렌더링 (있다면)
