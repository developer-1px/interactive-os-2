# keyMap-only Aria — 선언적 OCP로 전역 단축키 처리

> 작성일: 2026-03-25
> 맥락: CMS에 `Cmd+\` preview 토글을 추가하면서, engine 없이 keyMap만으로 동작하는 Aria의 이상적 사용 패턴을 시뮬레이션한다.
> 선행 문서: `46-[explain]declarativeOcp.md` (선언적 OCP 3원칙)

---

## 도메인: 개발 (Code Usage 시뮬레이션)

### 핵심 원칙 재확인

선언적 OCP 3원칙:
1. **선언=등록** — Record 객체에 항목 추가가 곧 런타임 등록
2. **합성 런타임 불변** — mergedKeyMap 스프레드는 입력 변화에 무관
3. **중간 해석 계층 없음** — Command dispatcher 금지, 핸들러가 직접 효과 실행

---

## 시나리오 1: CMS 전역 단축키 (가장 흔한 사용)

```typescript
// CmsLayout.tsx

// 선언이 곧 등록 — 새 단축키 = 행 추가
const cmsGlobalKeyMap: KeyMap = {
  'Mod+\\': () => togglePresenting(),
}

<div className="cms-layout">
  <Aria keyMap={cmsGlobalKeyMap}>
    <div className="cms-body">
      <CmsSidebar ... />
      <CmsCanvas ... />
      <CmsDetailPanel ... />
    </div>
  </Aria>
  {presenting && <CmsPresentMode ... />}
</div>
```

**판단 기준:**
- ✅ 새 단축키 추가 시 기존 파일 수정 0 (행 추가만)
- ✅ dispatcher/switch-case 없음
- ✅ 기존 useAria의 keyMap-only 경로 그대로 사용

### 작동 메커니즘

```
사용자가 Cmd+\ 누름
  ↓
<Aria> containerProps.onKeyDown 발생
  ↓  (useAriaView.ts:258-264 — isKeyMapOnly 경로)
event.defaultPrevented 확인 → false
  ↓
handleKeyDown(event)
  ↓  (findMatchingKey에서 'Mod+\\' 매칭)
handler 실행 → togglePresenting() 직접 호출
  ↓
React state 갱신 → presenting 토글
```

---

## 시나리오 2: Present 모드에서도 동일하게 동작

```typescript
// CmsPresentMode.tsx — 현재 코드에 'Mod+\\' 한 줄 추가

const keyMap = useMemo((): KeyMap => ({
  Escape:    () => { onExit() },
  'Mod+\\':  () => { onExit() },   // ← 행 추가만
}), [onExit])

const { containerProps } = useAria({ data: EMPTY_DATA, keyMap })
```

**토글 흐름:**

```
편집 모드 → Cmd+\ → presenting=true → CmsPresentMode 마운트
                                          ↓
                                    Cmd+\ → onExit() → presenting=false
                                          ↓
                                    편집 모드 복귀
```

양방향 모두 `Mod+\\` 핸들러가 직접 state를 변경한다. dispatcher 없음.

---

## 시나리오 3: 미래 확장 — 전역 단축키 추가

```typescript
// 6개월 후 — 기존 코드 수정 0, 행만 추가

const cmsGlobalKeyMap: KeyMap = {
  'Mod+\\':       () => togglePresenting(),
  'Mod+Shift+\\': () => toggleSidebar(),      // 사이드바 토글
  'Mod+,':        () => openSettings(),        // 설정 열기
  'Mod+.':        () => toggleDetailPanel(),   // 디테일 패널 토글
}
```

| 변경 사항 | 수정 파일 수 | 패턴 |
|----------|:-----------:|------|
| 기존 | 0 | — |
| 새 단축키 1개 추가 | 0 (행 추가) | 선언=등록 |
| 새 단축키 4개 추가 | 0 (행 추가) | 선언=등록 |

---

## 시나리오 4: 엣지 케이스 — 내부 keyMap과의 버블링

```
<Aria keyMap={cmsGlobalKeyMap}>        ← Mod+\ 잡음
  <CmsCanvas>
    <useAriaZone keyMap={canvasKeyMap}> ← Mod+D, Delete 등 잡음
      <focused item>
```

**충돌 해소 메커니즘:**

1. 키 이벤트는 가장 안쪽(CmsCanvas의 useAriaZone)에서 먼저 처리
2. 매칭되면 `event.preventDefault()` 호출
3. 바깥(Aria keyMap-only)은 `event.defaultPrevented` 체크 후 스킵

```typescript
// useAriaView.ts:258-264 — keyMap-only 경로
if (isKeyMapOnly) {
  return {
    onKeyDown: (event: KeyboardEvent) => {
      if (event.defaultPrevented) return  // ← 내부에서 처리됐으면 스킵
      handleKeyDown(event)
    },
  }
}
```

`Mod+\`는 canvas keyMap에 없으므로 → `defaultPrevented=false` → 바깥 Aria가 잡음. ✅
`Mod+D`는 canvas keyMap에 있으므로 → `defaultPrevented=true` → 바깥 Aria 스킵. ✅

---

## `Mod+\\` 파싱 검증 필요

`useKeyboard.ts`의 `parseKeyCombo`가 백슬래시(`\`)를 올바르게 파싱하는지 확인이 필요하다.

```typescript
// useKeyboard.ts — parseKeyCombo 예상 동작
parseKeyCombo('Mod+\\')
// → { key: '\\', mod: true, shift: false, alt: false }

// KeyboardEvent.key for backslash:
// event.key === '\\'  (브라우저 표준)
```

이것은 구현 전 테스트로 검증해야 하는 항목이다.

---

## 역추출된 설계 요구사항

시뮬레이션에서 역추출한 것들:

| 요구사항 | 현재 상태 | 필요 작업 |
|---------|----------|----------|
| keyMap-only `<Aria>` | ✅ 코드 존재 (isKeyMapOnly 경로) | 실사용 검증 |
| `Mod+\\` 파싱 | ❓ 미검증 | parseKeyCombo 테스트 |
| CmsLayout에서 Aria wrapper | ❌ 미구현 | JSX에 `<Aria keyMap={...}>` 추가 |
| CmsPresentMode에 `Mod+\\` | ❌ 미구현 | keyMap에 행 1개 추가 |
| 버블링 순서 (내부→외부) | ✅ defaultPrevented 가드 존재 | 통합 테스트로 검증 |

---

## 발견된 갭

### 갭 1: keyMap-only Aria의 DOM 요소

`useAria`가 `containerProps`를 반환하는데, keyMap-only 경로에서는 `onKeyDown`만 포함한다 (line 258-264). 이것을 CmsLayout의 wrapper `<div>`에 spread하면:

- `tabIndex`가 없다 → 포커스를 받을 수 없다 → onKeyDown이 발화하지 않을 수 있다
- 해결: 기존 CmsLayout의 `<div className="cms-layout">`은 자식에 포커스가 있으므로 이벤트가 버블링으로 올라온다. 단, `onKeyDown`이 해당 div에 걸려 있어야 한다.

→ **검증 필요:** 자식 요소에 포커스가 있을 때, 부모의 onKeyDown으로 이벤트가 버블링되는지.

### 갭 2: useAria vs 직접 onKeyDown

현재 CmsPresentMode는 이미 `useAria({ data: EMPTY_DATA, keyMap })`으로 keyMap-only를 사용한다. CmsLayout에도 동일하게 `useAria`를 쓸지, 아니면 더 가벼운 방법(직접 `onKeyDown` + `findMatchingKey`)이 나을지.

- `useAria` 사용: 일관성 ✅, 하지만 EMPTY_DATA로 engine을 생성하는 오버헤드
- 직접 `onKeyDown`: 가벼움 ✅, 하지만 선언적 OCP 체계 바깥의 ad-hoc 코드

→ **제 판단:** `useAria`가 맞다. engine 오버헤드는 무시할 수준이고, 체계 안에 있어야 나중에 plugin keyMap 합성도 가능해진다. CmsPresentMode가 이미 이 패턴을 사용하므로 선례도 있다.

### 갭 3: presenting 상태와 keyMap 분리

편집 모드의 `cmsGlobalKeyMap`과 present 모드의 `keyMap`이 각각 다른 컴포넌트에 선언된다. `Mod+\\`가 양쪽에 중복 선언되는데, 이것이 DRY 위반인지 아니면 각 모드의 독립적 선언인지.

→ **제 판단:** 각 모드가 자신의 keyMap을 독립적으로 소유하는 것이 맞다. Present 모드의 `Mod+\\`은 "exit"이고, 편집 모드의 `Mod+\\`은 "enter presenting"이다. 의미가 다르므로 중복이 아니라 각자의 선언이다.
