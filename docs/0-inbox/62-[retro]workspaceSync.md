# Retro: Workspace Sync — 2026-03-28

## 비교 기준
- **PRD:** docs/superpowers/specs/2026-03-28-workspace-sync-prd.md
- **Diff 범위:** 348dc2f (단일 커밋)
- **커밋 수:** 1
- **변경 파일:** 7

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| ① | 동기 | 🔀 | S2 "균등 split" → 단일 tabgroup + 수동 split | L1 |
| ② | 산출물 | ⚠️ | splitAndAddTab, collectContentRefs filter, CodePanel 추가 (PRD 미예측) | L2 |
| ③ | 인터페이스 | ✅ | — | — |
| ④ | 경계 | ✅ | — | — |
| ⑤ | 원칙 대조 | ✅ | — | — |
| ⑥ | 부작용 | ✅ | — | — |
| ⑦ | 금지 | ✅ | — | — |
| ⑧ | 검증 | ⚠️ | V7~V10 페이지 통합 테스트 없음 | L1 |

**일치율:** 6/8

## 갭 상세

### 🔀 의도와 다르게 구현됨
- ① S2: PRD는 "균등 split"을 기대했지만, 구현은 단일 tabgroup에 모든 세션을 탭으로 추가. split은 사용자가 Cmd+D로 수동 실행. 이유: syncFromExternal은 탭 추가/제거만 담당하고 layout은 건드리지 않으므로 auto-split은 별도 로직이 필요. 현재 구현이 더 단순하고 사용자 제어권이 높음.

### ⚠️ 구현됐는데 PRD에 없었음
- splitAndAddTab 헬퍼: /simplify에서 3곳 중복 코드 추출
- collectContentRefs filter 옵션: AgentViewer의 timeline/file 탭 구분에 필요
- CodePanel 분리: sourceTab 상태를 code panel 내부로 이동 (렌더 최적화)
- chatStore createSession → string 반환: split + addTab에 즉시 sessionId 필요

### ❌ PRD에 있는데 구현 안 됨
- V7~V10 페이지 수준 통합 테스트: syncFromExternal 단위 테스트(V1~V6)는 있으나 페이지 렌더링 통합 테스트 미작성

## 계층별 개선 제안

### L1 코드
- [ ] S2 "균등 split" → 현재 동작이 더 합리적이므로 PRD 시나리오 수정 (S2 Given/Then 업데이트)
- [ ] V7~V10 통합 테스트 → `/backlog`에 저장 (페이지 수준 렌더링 테스트는 별도 세션)

### L2 PRD 스킬
- /simplify에서 발견되는 리팩토링 산출물(헬퍼 추출, 컴포넌트 분리)을 PRD가 예측하지 못함. 이는 PRD의 한계라기보다 자연스러운 구현-정제 루프의 결과. 스킬 수정 불필요.

### L5 사용자 피드백
- 없음

## 다음 행동
- L1 백로그 항목 저장
- Areas 갱신
- PRD 아카이브
