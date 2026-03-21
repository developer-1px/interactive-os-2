# Retro: plugin-keymap — 2026-03-21

## 비교 기준
- **PRD:** `docs/superpowers/specs/2026-03-20-plugin-keymap-prd.md`
- **Diff 범위:** `be5c8df..57d6b2a`
- **커밋 수:** 1
- **변경 파일:** 13

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| 1 | 동기 | ✅ | 동기 3개 행 모두 코드에서 확인 가능. clipboard 수동 바인딩 5곳→plugin 소유로 전환. | — |
| 2 | 인터페이스 | ✅ | 합성 우선순위 behavior < plugin < options 정확히 구현됨 | — |
| 3 | 산출물 | 🔀 | kanban.ts에서 history keyMap(Mod+Z/Shift+Z) 수동 제거 안 됨 (의도적 — 주석 설명 있음) | L5 |
| 4 | 경계 | ✅ | optional keyMap, spread 순서, override 모두 구현 | — |
| 5 | 금지 | ✅ | middleware/commands 미변경, 뷰 고유 로직(Delete 가드 등) 보존 | — |
| 6 | 검증 | ⚠️ | diff에 테스트 파일 없음. PRD 검증 시나리오 6개에 대한 테스트 코드 부재 | L1 |

**일치율:** 4/6

## 갭 상세

### 🔀 의도와 다르게 구현됨

**3. 산출물 — kanban.ts history keyMap 잔존**

PRD 3절 "수동 keyMap 제거 대상"에 kanban.ts가 포함되어 있지만, 실제로는 clipboard(Mod+C/X/V)만 제거되고 history(Mod+Z/Shift+Z)는 behavior 레벨에 남겨졌다. 코드 주석: "kanban's cross-column move needs undo at behavior level."

이는 **의도적 이탈**이다. kanban behavior는 cross-column move 같은 복합 동작에서 undo/redo가 behavior-level keyMap에 있어야 올바르게 동작할 수 있다는 판단. 그러나 PRD에는 이 예외가 명시되지 않았다.

**판정:** PRD가 이 경계 조건을 놓쳤다 (behavior-level에서 plugin보다 먼저 keyMap을 써야 하는 경우). 구현은 올바르지만 PRD가 덜 촘촘했다. → L5 (사용자가 PRD 작성 시 behavior-specific override 케이스를 명시해야)

### ⚠️ 구현됐는데 PRD에 없었음

**useAria.ts에도 pluginKeyMaps 합성 로직 추가**

PRD 3절에서는 "useAriaZone에서 mergedKeyMap 계산 시 plugin keyMap 포함"만 언급했지만, 실제 diff에서는 `useAria.ts`에도 동일한 pluginKeyMaps 합성 로직이 추가됐다. useAria는 zone 없이 단독으로 쓰이는 경우를 위한 것이므로 올바른 구현이지만, PRD에는 언급되지 않았다.

**CmsLayout.tsx에서 sharedPlugins에 clipboard 추가**

PRD에는 "CmsLayout에 clipboard plugin을 등록한다"는 명시적 산출물이 없었지만, 구현에서는 `sharedPlugins: Plugin[] = [history(), clipboard()]`로 변경하고 CmsSidebar/CmsCanvas에 plugins prop을 전달했다. 이는 올바른 구현이지만 PRD 산출물 절에는 빠져있었다.

### ❌ PRD에 있는데 구현 안 됨

**6. 검증 — 테스트 코드 없음**

PRD 6절에 6개 검증 시나리오가 정의되어 있지만, diff에 테스트 파일이 하나도 없다. 검증이 수동으로만 이루어졌거나 기존 테스트가 커버하고 있을 수 있지만, 신규 기능에 대한 명시적 테스트가 없다.

## 계층별 개선 제안

### L1 코드 — 즉시 수정 또는 /backlog
- [ ] plugin keyMap 합성에 대한 테스트 추가: (1) clipboard plugin 등록 후 Mod+C/V 동작, (2) options.keyMap override, (3) 하위호환(keyMap 없는 plugin). 기존 통합 테스트가 커버하는지 먼저 확인 필요.

### L2 PRD 스킬
- 해당 없음 (PRD 6개 항목 구조 자체는 문제없었음)

### L3 스킬
- 해당 없음

### L4 지식
- 해당 없음

### L5 사용자 피드백
- "💬 behavior-level keyMap이 plugin keyMap보다 우선해야 하는 경우(kanban의 Mod+Z처럼)가 PRD에 명시되지 않았습니다. 향후 '제거 대상' 목록을 작성할 때, 각 항목에 '예외 가능성'을 명시하면 구현 시 의도적 이탈인지 실수인지 판별이 쉬워집니다."
- "💬 useAria.ts와 useAriaZone.ts 두 곳 모두에 합성 로직이 필요한 구조(zone 유/무)를 PRD 산출물에 명시하면, 한쪽이 누락되는 리스크를 줄일 수 있습니다."

## 다음 행동
- L1: 테스트 추가 → `/backlog`에 저장 권장
- L5: 사용자 참고
