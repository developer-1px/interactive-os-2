# 구조적 CSS의 LLM 한계 + 설계 방향 미결정 — 2026-03-25

## 배경

Cmd+\ 전역 단축키 구현 → AriaRoute 설계 → page grid→flex 전환 → overflow/스크롤 부작용 연쇄. CSS 구조 변경 때마다 예측 불가한 부작용이 발생하고, LLM이 CSS↔JSX 교차 참조를 못해서 반복 실수.

## 내용

### 완료된 것

1. **선언적 OCP 설계 철학 정립** — 3원칙 문서화, memory 저장
2. **AriaRoute** — 라우트 스코프 전역 단축키, CMS Cmd+\ preview 토글
3. **page grid→flex** — gridColumn 반복 실수 구조적 제거
4. **/fix 스킬** — 최근 작업물 고장 시 자동 재현→디버깅
5. **CMS UI 정리** — 햄버거/drawer 제거, locale/i18n 디테일 패널 이동
6. **i18n editor 그리드** — 전체 너비 + 커스텀 컬럼 width

### 미해결: 구조적 CSS 근본 문제

- LLM이 CSS 파일과 JSX 분리 구조에서 레이아웃을 파악 못함
- 넓은 CSS 셀렉터(`:not` 등)가 의도하지 않은 요소를 잡아서 부작용
- `overflow: hidden` 같은 구조적 CSS가 자식에 예측 불가한 영향
- clean CSS 원칙 위반 — 구조적 셀렉터 대신 명시적 클래스 사용해야

### 해결 방향 후보 (미결정 — 골픽세이션 주의)

| 후보 | 상태 | 비고 |
|------|------|------|
| A) 목적별 Layout 컴포넌트 | 유력 | Panda CSS 참조, 의존성 0 |
| B) Tailwind | 기각 | escape hatch 남용, 토큰 이중 관리 |
| C) Panda CSS | 보류 | 빌드 파이프라인 비용 |
| D) 다른 접근 | 열림 | 아직 탐색 안 한 방향 있을 수 있음 |

### 관련 문서

- `docs/0-inbox/46-[explain]declarativeOcp.md`
- `docs/0-inbox/47-[ideal]keymapOnlyAria.md`
- `docs/3-resources/26-[pattern]globalShortcutArchitecture.md`
- `docs/3-resources/27-[pattern]routeScopedKeybinding.md`
- `docs/3-resources/28-[pattern]tailwindEscapeHatchProblem.md`

## 다음 행동

- 구조적 CSS 해결 방향을 열린 마음으로 재논의 (Layout 컴포넌트 외 대안 탐색)
- 현재 `.page-content` overflow:hidden은 임시 — clean CSS 원칙에 어긋남
