---
id: 2-areas/design/prds/keyline-audit-task
title: 'Keyline Audit 파이프라인'
status: active
kind: plan
created: 2026-04-15
updated: 2026-04-15
topics: [2-areas]
relates: []
supersedes: []
---
# Keyline Audit 파이프라인

## 배경

discuss 결론: keyline 기반 수렴 루프를 만든다.
- 역할이 같으면 같은 디자인 → 크기가 같은 것끼리 줄을 맞춰 모아두면 "함께 있어야 하는 것들인가"를 평가할 수 있다
- 미완성 컴포넌트에 keyline 검증은 무의미 → 시각적 완성도 판정이 선행
- 불일치 발견 시 수정 대상 = 개별 컴포넌트가 아니라 토큰/축 설계
- 1단계는 탐지+리포트만. 자동 수정은 워킹 확인 후

## 산출물

### B1: keylineCheck.mjs 확장

1. **designComplete 필터** — keylineMap.json에서 `designComplete: true`인 컴포넌트만 keyline 검증 대상
2. **수치 비교 판정** — role별 ROLE_KEYLINES 기대 수치 vs ax() 선언 비교 → 이탈 판정
3. **원인 분류** — 토큰 결함 / 축 설계 결함 / CSS 오염 / role 미선언 4종 분류
4. **JSON 리포트 출력** — `--audit` 플래그로 아래 형태 출력:
   ```json
   {
     "incomplete": [],
     "keylineViolations": [],
     "tokenGaps": [],
     "cssOverrides": [],
     "summary": { "complete": 0, "incomplete": 0, "violations": 0 }
   }
   ```
5. **keylineMap.json designComplete 필드** — `--sync-map` 시 기존 designComplete 값 보존 (AI 판정 캐시)

### B2: /keyline-audit 스킬

오케스트레이터 스킬:
1. `node scripts/keylineCheck.mjs --audit` 실행 → JSON 결과 읽기
2. PageKeylineTest (`/keyline`) 스크린샷 촬영
3. designComplete 미판정 컴포넌트 → WebSearch로 레퍼런스("Button component UI") 조회 → 스샷과 비교 → 완성도 판정
4. keylineMap.json에 designComplete 캐싱
5. 통합 리포트 출력

## 체크리스트

- [ ] `keylineCheck.mjs --audit`가 JSON 리포트를 stdout으로 출력한다
- [ ] designComplete: false인 컴포넌트는 keyline 위반에 포함되지 않는다
- [ ] `--sync-map`이 기존 designComplete 값을 보존한다
- [ ] badge의 minHeight 기대값이 ROLE_KEYLINES에 추가된다
- [ ] /keyline-audit 스킬이 전체 파이프라인을 오케스트레이션한다
- [ ] pnpm typecheck 0 에러
