# Retro: Grid 범용화 + CMS i18n Table — 2026-03-23

## 비교 기준
- **PRD:** docs/superpowers/prds/2026-03-22-grid-i18n-prd.md
- **Diff 범위:** 99f028f..67ce904
- **커밋 수:** 5 (Grid 관련)
- **변경 파일:** 7 (src 6 + css 1)

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| ① | 동기 | ✅ | M1~M4 모두 역PRD에서 확인 | — |
| ② | 산출물 | ✅ | 5개 산출물 모두 구현. 역PRD가 테스트/CSS를 추가로 나열 | — |
| ③ | 인터페이스 | 🔀 | PRD는 모든 키(Mod+C/V/Z, Space, Tab, 클릭, 더블클릭) 나열. 구현은 plugin 위임으로 대부분 동작하나 **Mod+C/V/Z, Tab은 테스트 미검증** | L1 |
| ④ | 경계 | ❌ | PRD 10개 중 6개만 역PRD에서 확인. **rename 중 Tab, 행 1개에서 Delete, CMS 노드 삭제 시 행 제거** 미검증 | L1 |
| ⑤ | 원칙 대조 | ✅ | 원칙 위반 없음. P4(plugin keyMap 소유) 긴장은 양쪽 모두 인지 | — |
| ⑥ | 부작용 | ⚠️ | 역PRD가 **마우스 클릭 편집 경로 제거**를 부작용으로 지적 — PRD는 이를 언급 안 함 | L2 |
| ⑦ | 금지 | ✅ | N1~N5 모두 준수. 역PRD 4개 ≈ PRD 5개 | — |
| ⑧ | 검증 | ❌ | 13/15 커버. **V5(양방향 싱크 e2e), V6(undo), V9(노드 삭제→행 제거), V12(rename Tab)** 미검증 | L1 |

**일치율:** 5/8

## 갭 상세

### ❌ PRD에 있는데 구현 안 됨 (테스트 미검증)
- **V5**: i18n 편집 → CMS store 반영 통합 테스트 없음 (handleChange diff 로직은 구현됨, 테스트만 부재)
- **V6**: Mod+Z undo 통합 테스트 없음 (history plugin은 연결됨)
- **V9**: CMS 노드 삭제 → i18n Grid 행 자동 제거 테스트 없음 (useMemo reactive로 동작은 보장)
- **V12**: rename 중 Tab → 커밋 후 Grid 외부로 이동 테스트 없음

### ⚠️ 구현됐는데 PRD에 없었음
- **마우스 클릭 경로 변경**: 기존 `<td onClick>` → Aria.Editable `onDoubleClick`으로 전환. PRD ③에 "더블클릭" 행이 있었으나 i18n 특화 전환(클릭→더블클릭)은 명시 안 됨

### 🔀 의도와 다르게 구현됨
- **Key 컬럼 가드**: PRD는 "F2 keyMap에서 colIndex 체크"를 제안했으나, 구현은 "renderCell에서 Aria.Editable 미렌더링"으로 해결. 결과는 동일하나 메커니즘이 다름 (더 단순하고 올바른 접근)

## 계층별 개선 제안

### L1 코드 — /backlog에 저장
- [ ] V5: i18n 양방향 싱크 통합 테스트 (handleChange → engine.dispatch 경로)
- [ ] V6: Grid + history undo 통합 테스트
- [ ] V9: CMS 노드 삭제 → adapter 재계산 테스트 (unit으로 충분)
- [ ] V12: rename 중 Tab 동작 (jsdom 제약으로 Playwright 대상)

### L2 PRD 스킬
- **클릭→더블클릭 전환**: PRD ③ 인터페이스에 "클릭" vs "더블클릭" 행이 있었으나, 교체 시 기존 UX 변경(클릭 편집 → 더블클릭 편집)을 ⑥ 부작용에서 다루지 않음
- 제안: PRD ⑥ 부작용에 "기존 UX 경로 변경" 체크 항목 추가

### L4 지식
- 없음 (새 원칙 발견 안 됨)

### L5 사용자 피드백
- 없음

## 다음 행동
- L1 항목 4개 → /backlog에 저장
- L2 제안 → PRD 스킬 체크리스트 보강 검토
