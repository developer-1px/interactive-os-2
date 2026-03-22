# Retro: Store Split Inspector — 2026-03-22

## 비교 기준
- **PRD:** docs/superpowers/specs/2026-03-22-store-split-inspector-prd.md
- **Diff 범위:** a1a6762~1..66eda59
- **커밋 수:** 6 (store 관련)
- **변경 파일:** 10

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| ① | 동기 | ✅ | M1~M4 모두 구현됨 | — |
| ② | 산출물 | ✅ | 7개 산출물 일치 | — |
| ③ | 인터페이스 | ✅ | 키보드/패널 연동 전부 구현 | — |
| ④ | 경계 | ✅ | E1,E5,E6 구현 (E7 삭제됨) | — |
| ⑤ | 원칙 대조 | ✅ | plugin_owns_keymap은 showcase 페이지 허용 범위 | — |
| ⑥ | 부작용 | ✅ | S1~S3 대응 완료 | — |
| ⑦ | 금지 | ⚠️ | 역PRD가 2개 추가 금지 사항 파악 (Inspector onChange 금지, storeToTree→data 직접 사용 금지) | L2 |
| ⑧ | 검증 | 🔀 | V6: history:undo 기대 → 실제 history:__restore 로그 | L2 |

**일치율:** 6/8

## 갭 상세

### ⚠️ 구현됐는데 PRD에 없었음
- ⑦ X4: Inspector에 onChange를 연결하면 storeToTree 결과로 원본 data가 파괴됨 — 금지 사항으로 명시 필요했음
- ⑦ X5: storeToTree 결과를 Editor data로 직접 사용 금지 — _e:/_r: 접두어 노드가 편집 대상이 됨

### 🔀 의도와 다르게 구현됨
- ⑧ V6: PRD는 "Log에 history:undo 표시" 기대. 실제로 history 미들웨어가 undo를 인터셉트하여 history:__restore로 변환 후 dispatch. logger는 최종 dispatch 결과만 캡처하므로 __restore가 보임. 이는 engine 내부 동작에 대한 PRD의 이해 부족.

## 계층별 개선 제안

### L1 코드 — 없음
구현 갭 없음.

### L2 PRD 스킬
- V6 갭의 근본 원인: PRD ③ 인터페이스 작성 시 **미들웨어 변환 체인**을 고려하지 않음. logger가 캡처하는 것은 "사용자가 입력한 커맨드"가 아니라 "미들웨어 체인을 통과한 최종 커맨드". 이 구분이 PRD에 없었음.
- ⑦ 금지 항목 누락: PRD 작성 시 "파생 데이터를 원본으로 역주입" 패턴에 대한 체크리스트가 없었음.

### L3 스킬 — 없음

### L4 지식 — 없음

### L5 사용자 피드백 — 없음

## 다음 행동
- L1: 없음
- L2: PRD V6 역PRD 열에 실제 결과 기입 완료
- 경험 DB 업데이트
- PRD 아카이브
