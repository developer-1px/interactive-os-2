# Retro: Gen UI Chat Module — 2026-03-27

## 비교 기준
- **PRD:** docs/superpowers/specs/2026-03-27-chat-module-prd.md
- **Diff 범위:** 60e0a28..10b9511
- **커밋 수:** 1
- **변경 파일:** 18 (843 추가, 369 삭제)

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| ① | 동기 | ✅ | — | — |
| ② | 산출물 | ✅ | FallbackBlock 추가(PRD 미명시), ChatCodeBlock 이름 변경 | L2 |
| ③ | 인터페이스 | 🔀 | 타이프라이터 미통합 (S5/③ isStreaming) | L1 |
| ④ | 경계 | ✅ | — | — |
| ⑤ | 원칙 대조 | 🔀 | P5 border-radius raw px → 수정 완료 | L1 |
| ⑥ | 부작용 | 🔀 | E1 파일 경로 클릭/loadOlder/세밀 페이싱 소실 (의도적 스코프 축소) | L1 |
| ⑦ | 금지 | ✅ | F7 위반 발견 → 수정 완료 | — |
| ⑧ | 검증 | 🔀 | V4 실제 store 인터랙션 미검증, V5 타이프라이터 미통합, V10 블록 클릭 미검증 | L1 |

**일치율:** 5/8

## 갭 상세

### 🔀 의도와 다르게 구현됨

1. **타이프라이터 미통합** (S5, ③, V5) — PRD는 "타이프라이터 애니메이션 + 스트리밍 인디케이터"를 명시했지만, ChatFeed는 StreamFeed의 스트리밍 인디케이터만 표시. useTypewriter를 TextBlock에 통합하는 작업이 필요.
2. **viewer 기능 회귀** (E1) — 파일 경로 클릭(splitByFilePaths), loadOlder 무한 스크롤, 타입별 차등 페이싱(usePacedReveal)이 포팅 과정에서 소실. 이는 의도적 스코프 축소이나 PRD E1에 "기존 동작 보장"으로 명시됨.
3. **V4/V10 테스트 범위** — storeKey 전달은 검증했지만 실제 store 바인딩 인터랙션과 블록 내 클릭 이벤트 격리는 미검증. 인터랙티브 블록 도입 시 추가 필요.

### ⚠️ 구현됐는데 PRD에 없었음

1. **FallbackBlock** — OCP 안전망으로 필수이지만 ② 산출물에 명시되지 않았음. PRD 작성 시 fallback/에러 처리 컴포넌트도 산출물에 포함해야 함.

## 계층별 개선 제안

### L1 코드 — /backlog

- [ ] viewer 파일 경로 클릭 기능 복원 — TextBlock 확장 또는 viewer 전용 TextBlock 래퍼
- [ ] viewer loadOlder 무한 스크롤 복원 — ChatFeed에 onScrollTop 콜백 추가
- [ ] 타이프라이터 통합 — ChatFeed에 마지막 assistant 메시지 타이프라이터 옵션
- [ ] V4 실제 store 인터랙션 테스트 — 인터랙티브 블록 도입 시

### L2 PRD 스킬

- PRD ② 산출물에 "에러/fallback 컴포넌트" 체크리스트 필요 — FallbackBlock 누락 원인
- 심각도: 낮 (FallbackBlock은 자연스럽게 추가됨)

### L4 지식

- 해당 없음 (새 원칙 발견 없음)

### L5 사용자 피드백

- 해당 없음

## 다음 행동
- L1 백로그 → viewer 기능 복원은 별도 사이클
- CSS 토큰 위반 → 이미 수정 완료
