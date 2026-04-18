---
id: 2-areas/harness/prds/harness-convergence-task
title: '하네스 수렴 구조 개선'
created: 2026-04-05
updated: 2026-04-08
legacy:
  status: active
  kind: plan
  topics: [2-areas]
  relates: []
  supersedes: []
---
# 하네스 수렴 구조 개선

## 목표
guard hook의 block 메시지를 하드코딩에서 동적 디렉토리 스캔으로 전환하여, ui/ 부품 추가 시 hook 안내가 자동 반영되도록 한다.

## 액션 플랜

1. **guardOsPatterns.mjs** — `listComponents(subdir)` 유틸 추가, 모든 block 메시지 동적화
   - items/, panels/, indicators/, cells/ 디렉토리 스캔
   - role → component 매핑 (정적, 확실한 1:1만)
   - 완성품(ui/*.tsx) 목록도 동적 스캔

2. **guardBash.mjs** — 금지 메시지에 구체적 대안 추가
   - reset --hard → reset --soft / revert
   - clean -f → rm [파일명]
   - push --force → push --force-with-lease (위험 고지)

3. **guardCodePatterns.mjs** — mock 검증 금지에 구체 예시
   - toHaveBeenCalled → expect(el).toHaveAttribute('aria-selected', 'true') 등

## 제약
- .mjs → readdirSync만
- 기존 차단 로직 불변, 메시지만 변경

#kind/plan #topic/harness
