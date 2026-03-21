# Retro: CMS Tab Container — 2026-03-22

## 비교 기준
- **PRD:** docs/superpowers/specs/2026-03-22-cms-tab-container-prd.md
- **Diff 범위:** 08055dd..87cbbb6
- **커밋 수:** 7
- **변경 파일:** 10 (src/)

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| ① | 동기 | ✅ | — | — |
| ② | 산출물 | ✅ | — | — |
| ③ | 인터페이스 | 🔀 | Home/End 키 미구현 (jsdom에서 spatial nav 검증 불가) | L1 |
| ④ | 경계 | ✅ | 프레젠트 모드 = out of scope으로 선언됨 | — |
| ⑤ | 원칙 대조 | ✅ | — | — |
| ⑥ | 부작용 | ✅ | — | — |
| ⑦ | 금지 | ✅ | — | — |
| ⑧ | 검증 | 🔀 | V10(Mod+탭순서 변경), V13(root에 tab-group 추가) 미검증 | L1 |

**일치율:** 6/8

## 갭 상세

### 🔀 의도와 다르게 구현됨

1. **③ Home/End 키**: PRD에 명시했지만 구현에서 별도 처리 없음. spatial nav의 findNearest가 DOM position 기반으로 처리하나, jsdom에서는 getBoundingClientRect가 0을 반환하여 테스트 불가. 실제 브라우저에서는 동작할 수 있음.

2. **⑧ V10, V13**: 통합 테스트에 Mod+ArrowDown 순서 변경, root에 template으로 tab-group 추가 시나리오 부재. 기능 자체는 기존 CRUD/template 인프라가 처리하나 명시적 테스트 없음.

## 계층별 개선 제안

### L1 코드 — /backlog
- [ ] Home/End: 실제 브라우저 검증 (/reproduce 활용) → spatial nav가 처리하는지 확인
- [ ] V10/V13 테스트 추가: Mod+ArrowDown 탭 순서 변경, templateToCommand('tab-group') 검증

### L2~L4: 해당 없음

### L5 사용자 피드백: 해당 없음

## 다음 행동
- L1 → backlog 저장 (Home/End 브라우저 검증, 추가 테스트)
- 프레젠트 모드 탭 전환 → 별도 backlog
