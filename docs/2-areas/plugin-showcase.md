# Plugin Showcase

> 최종 갱신: 2026-03-21 (retro: plugin-showcase-gap-phase2)

## 현재 구조

`/plugin` 레이어에 5개 페이지. 각 페이지는 하나의 플러그인 능력을 격리해서 보여주는 데모.

| 페이지 | 플러그인 | UI 컴포넌트 | 데모 데이터 |
|--------|---------|------------|-----------|
| `/plugin/crud` | core, crud, history, focusRecovery | **TreeGrid** | 2-depth tree (projects, docs) |
| `/plugin/clipboard` | core, crud, clipboard, history, focusRecovery | **TreeGrid** + cut dim + ID 표시 | 2-depth tree (warm, cool) |
| `/plugin/history` | core, crud, clipboard, rename, dnd, history, focusRecovery | ListBox + **Editable** | flat 6개 note |
| `/plugin/dnd` | core, dnd, history, focusRecovery | TreeGrid | 2-depth tree (todo, doing, done) |
| `/plugin/rename` | core, rename, history, focusRecovery | ListBox + Editable | flat 5개 bookmark |

## 핵심 규칙

1. **텍스트 = 스펙**: page-desc + page-section 텍스트가 약속하는 모든 기능은 데모에서 체험 가능해야 함
2. **플러그인 getter 패턴**: UI에 플러그인 내부 상태를 노출할 때는 읽기 전용 getter export (예: `getCutSourceIds()`)
3. **페이지 구조 일관성**: page-header → page-keys → card → page-section 패턴 유지
4. **데모 데이터 ≥ 텍스트 최소 조건**: subtree 설명 → tree 데이터 필수, rename 키힌트 → Editable 필수

## 미해결

(없음 — Phase 1 + Phase 2 완료)

## 관련 경험

- experience_db #1: showcase 데모 데이터가 텍스트 최소 조건 미충족
- experience_db #2: 키힌트와 UI 래퍼 불일치
