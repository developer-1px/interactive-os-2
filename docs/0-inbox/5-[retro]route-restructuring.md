# Retro: Route Restructuring — 2026-03-19

## 비교 기준
- **PRD:** docs/superpowers/specs/2026-03-19-route-restructuring-prd.md
- **Diff 범위:** bfc7d99..d48c37c
- **커밋 수:** 1
- **변경 파일:** 18

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| 1 | 유저 스토리 | ✅ | US1-4 모두 구현됨 | — |
| 2 | 화면 구조 | ✅ | 8그룹, 라우트 매핑 정확 | — |
| 3 | 인터랙션 맵 | ✅ | 라우트 변경만, 기존 인터랙션 유지 | — |
| 4 | 상태 전이 | ✅ | N/A 그대로 | — |
| 5 | 시각적 피드백 | ⚠️ | ActivityBar 라벨 제거 + 아이콘 크기 변경 (PRD에 없음) | L1 |
| 6 | 데이터 모델 | ⚠️ | 공유 데이터 모듈 추출 (PRD에 없었으나 /simplify에서 추가) | L2 |
| 7 | 경계 조건 | ✅ | catch-all, basePath 등 일치 | — |
| 8 | 접근성 | ✅ | 기존 ARIA 유지, title 속성 추가 | — |
| 9 | 검증 기준 | ✅ | V1-V8 모두 충족 | — |

**일치율:** 7/9

## 갭 상세

### ⚠️ 구현됐는데 PRD에 없었음

1. **ActivityBar 라벨 제거 (항목 5)** — 아이콘 15px→16px, 텍스트 라벨 제거, `title` 속성 추가. 이 변경은 커밋 전 working tree에 이미 존재하던 미커밋 변경이 함께 커밋됨. 라우트 구조 변경과 무관한 UI 변경.

2. **공유 데이터 모듈 추출 (항목 6)** — `shared-tree-data.ts`, `shared-list-data.ts`, `shared-combobox-data.tsx`, `shared-grid-data.ts`, `SharedTreeComponents.tsx`. PRD에는 없었으나 /simplify 리뷰에서 Nav/Collection 버전 간 데이터 중복이 발견되어 추출됨. 올바른 엔지니어링 판단.

3. **Combobox status wip→ready** — Collection의 combobox가 `'wip'`에서 `'ready'`로 변경. 기존 wip 표시가 더 이상 유효하지 않아 수정.

### ❌ PRD에 있는데 구현 안 됨
(없음)

### 🔀 의도와 다르게 구현됨
(없음)

## 계층별 개선 제안

### L1 코드 — 백로그
- (없음 — 모든 PRD 항목 구현 완료)

### L2 PRD 스킬 — 제안 (확인 필요)
- PRD 데이터 모델 항목에 "기존 코드 간 중복 처리 계획" 체크리스트 추가 권장. Nav/Collection 분리처럼 같은 데이터의 두 버전을 만들 때 공유 모듈 추출이 예측 가능함.

### L5 사용자 피드백
- 💬 커밋 시 working tree에 라우트 구조와 무관한 변경(ActivityBar 라벨 제거)이 있었으나 함께 커밋됨. 관련 없는 변경은 별도 커밋으로 분리하면 retro 정확도가 올라감.

## 다음 행동
- L1 백로그 없음 — 코드 갭 없음 (verify에서 선처리됨)
- L2 ⚠️ 2건 → PRD 업데이트 완료 (시각적 피드백 + 공유 데이터 모듈)
- L5 피드백 1건 — 참고용
