# Retro: CMS Field Type System — 2026-03-24

## 비교 기준
- **PRD:** docs/superpowers/prds/2026-03-24-cms-field-type-system-prd.md
- **Diff 범위:** aeee153 (단일 커밋)
- **커밋 수:** 1
- **변경 파일:** 6 (cms-schema.ts, CmsDetailPanel.tsx, cms.css, PageVisualCms.module.css, + 테스트 2개)

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| ① | 동기 | ✅ | 3/3 완전 일치 | — |
| ② | 산출물 | ✅ | 모두 구현. PRD에 없던 `isValidUrl` 유틸 + `FIELD_TYPES` 런타임 가드 추가 (⚠️ PRD 미예측) | — |
| ③ | 인터페이스 | ✅ | 핵심 동작 모두 일치. commitOnEnter 통합은 /simplify에서 개선 | — |
| ④ | 경계 | ✅ | E1~E7 모두 코드에 반영. + FIELD_TYPES 런타임 가드가 E1을 강화 | — |
| ⑤ | 원칙 대조 | ✅ | 6개 원칙 모두 미위반 확인 | — |
| ⑥ | 부작용 | ⚠️ | S3(pre-line 범위) — PRD "전역 적용 금지" → 구현은 section-desc CSS class에만 적용 ✅. 역PRD가 "기존 데이터 줄바꿈" 부작용 발견 — PRD에 없었음 | L2 |
| ⑦ | 금지 | ✅ | F1~F5 모두 코드에서 준수 | — |
| ⑧ | 검증 | ✅ | V1~V10 중 V1,V2,V3,V4,V5,V6 테스트로 검증. V7~V10은 수동 검증 필요 (jsdom 한계) | — |

**일치율:** 7.5/8

## 갭 상세

### ⚠️ 구현됐는데 PRD에 없었음
- `FIELD_TYPES` 런타임 Set + `has()` 가드 — /simplify 과정에서 리뷰 피드백 반영하여 추가. PRD에는 "기본값 short-text fallback"만 있고 "잘못된 fieldType 값 방어"는 없었음
- `isValidUrl` 독립 함수 — PRD에서는 UrlField의 동작으로만 서술, 별도 유틸 추출은 언급 없음
- 기존 section-desc 데이터에 의도치 않은 `\n`이 있을 경우의 렌더링 변화 — ⑥ 부작용에서 누락

### 🔀 의도와 다르게 구현됨
- PRD ② "TextareaField" → 실제 구현명 "LongTextField". 네이밍은 fieldType 기반이 더 일관적이므로 이쪽이 나음
- PRD ② "cms-renderers.tsx 변경" → 실제로는 PageVisualCms.module.css에서 해결. LocalizedText 컴포넌트 수정 불필요

## 계층별 개선 제안

### L1 코드 — 없음
갭 없음. 모든 PRD 의도가 코드에 반영됨.

### L2 PRD 스킬
- ⑥ 부작용에서 "기존 데이터에 대한 CSS 변경 영향" 유형이 누락 가능. 하지만 이는 일반적으로 예측하기 어려운 유형이므로 스킬 수정 불필요.

### L3 스킬 — 없음

### L4 지식 — 없음
이번에 발견된 원칙은 이미 memory에 저장됨 (feedback_longtext_means_linebreak.md)

### L5 사용자 피드백 — 없음

## 다음 행동
- L1 백로그 없음
- PRD 아카이브 진행
