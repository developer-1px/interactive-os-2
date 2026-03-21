# 경험 DB 출력 (테스트)

> 이 파일은 retro 스킬 Step 6 테스트 결과입니다. 실제 memory에는 기록하지 않습니다.

## 추출된 경험

| # | 도메인 | 상황 | 갭 | 교훈 | 빈도 | 최근 |
|---|--------|------|-----|------|------|------|
| 1 | plugin/keyMap | clipboard/history 수동 바인딩을 plugin.keyMap으로 교체 | kanban behavior의 Mod+Z가 의도적으로 남겨짐 — PRD 제거 목록에 예외 미명시 | behavior-level keyMap이 plugin보다 우선해야 하는 케이스(복합 동작의 undo)는 PRD 제거 목록에 예외로 명시해야 한다 | 1 | 2026-03-21 |
| 2 | useAria/useAriaZone | plugin keyMap 합성 로직 추가 | PRD가 useAriaZone만 언급했지만 useAria에도 동일 로직 필요 | useAria와 useAriaZone은 동일 기능의 단독/zone 버전이므로, 한쪽에 추가하는 기능은 반드시 양쪽 산출물로 명시해야 한다 | 1 | 2026-03-21 |
| 3 | CmsLayout/sharedPlugins | clipboard plugin을 sharedPlugins에 등록 | PRD에 "등록 위치" 산출물 누락 | plugin 추가 PRD에서는 plugin 정의뿐 아니라 "어디에 등록하는가"(sharedPlugins 배열)도 산출물에 포함해야 한다 | 1 | 2026-03-21 |

## 리트머스 판정

### 저장 대상 (프로젝트 고유)

1. **behavior-level vs plugin-level keyMap 우선순위 예외** -- `behavior`, `plugin`, `keyMap`, `kanban` 등 프로젝트 고유 타입/아키텍처 패턴이 포함됨. 이 프로젝트의 3계층 keyMap 합성(behavior < plugin < options) 구조에서만 발생하는 교훈. → **저장**

2. **useAria/useAriaZone 쌍둥이 패턴** -- `useAria`, `useAriaZone`은 이 프로젝트의 고유 훅. zone 유/무 두 버전이 존재하므로 기능 추가 시 양쪽 동시 변경이 필요하다는 것은 프로젝트 고유 지식. → **저장**

3. **plugin 등록 위치(sharedPlugins)도 산출물** -- `sharedPlugins`, `CmsLayout` 등 프로젝트 고유 구조체 포함. → **저장**

### 버린 것 (일반 코딩 지식)

- "테스트를 추가해야 한다" → 일반론. 모든 프로젝트에 해당. → **버림**
- "PRD에 예외를 명시하라" → 이것만으로는 일반론이지만, 위 1번처럼 구체적 맥락(behavior/plugin/keyMap 계층)과 결합하면 프로젝트 고유가 됨. 구체적 맥락 없이 추상적 교훈만 남기지 않도록 주의.

## 패턴 매칭

기존 경험 DB가 없으므로(experience_db.md 파일 미존재) 모두 신규 추가.

## 빈도 기반 승격

해당 없음 (모두 빈도 1, 승격 기준은 3회 이상).
