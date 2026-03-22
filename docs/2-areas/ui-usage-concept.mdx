# UI Usage Concept — 예상도

> **이 문서는 실제 존재하는 코드가 아닙니다.** interactive-os UI 컴포넌트를 사용자에게 어떻게 제공할지 구상하는 컨셉 문서입니다. "이렇게 제공해볼 생각입니다"의 밑그림.

---

## 원칙

```
<Component>  =  behavior(뼈대)
              + plugins(기능)
              + renderItem(피부)
              + keyMap(커스텀 단축키)
```

- **plugins 조합이 기능을 결정한다.** 같은 `<ListBox>`도 plugins에 따라 읽기 전용 셀렉터가 되기도 하고, 풀 CRUD 에디터가 되기도 한다.
- **renderItem이 디자인을 결정한다.** components.css의 ARIA 셀렉터가 base style을 제공하고, renderItem으로 커스텀한다.
- **keyMap이 도메인을 결정한다.** Todo의 Space 토글, 파일의 Enter 열기 등 도메인별 동작을 주입한다.
- **CSS는 0줄.** 모든 상태(hover/focus/selected/expanded)는 ARIA 속성으로 자동 스타일링.

---

## Usage 1: TodoList

### Minimal — 5줄

```tsx
<ListBox data={todos} onChange={setTodos} />
```

화살표로 탐색, 클릭으로 선택. 끝.

### + 편집 — prop 하나

```tsx
<ListBox data={todos} onChange={setTodos} enableEditing />
```

Delete 삭제, F2 이름변경, Alt+Arrow 순서변경, Ctrl+Z undo.

### + 클립보드

```tsx
<ListBox
  data={todos}
  onChange={setTodos}
  plugins={[core(), history(), clipboard()]}
  enableEditing
/>
```

Ctrl+C 복사, Ctrl+X 잘라내기, Ctrl+V 붙여넣기.

### + 완료 토글 + 커스텀 렌더

```tsx
<ListBox
  data={todos}
  onChange={setTodos}
  plugins={[core(), history(), clipboard()]}
  keyMap={{
    'Delete': (ctx) => crudCommands.remove(ctx.focused),
    'F2': (ctx) => renameCommands.startRename(ctx.focused),
    'Alt+ArrowUp': (ctx) => dndCommands.moveUp(ctx.focused),
    'Alt+ArrowDown': (ctx) => dndCommands.moveDown(ctx.focused),
    'Space': (ctx) => ({
      type: 'UPDATE_ENTITY',
      id: ctx.focused,
      data: (prev) => ({ ...prev, done: !prev.done }),
    }),
  }}
  renderItem={(item, state) => {
    const { label, done } = item.data as { label: string; done?: boolean }
    return (
      <span className="item-inner item-spread">
        <span style={{
          textDecoration: done ? 'line-through' : 'none',
          color: done ? 'var(--text-muted)' : undefined,
        }}>
          {done ? '✓' : '○'} {label}
        </span>
      </span>
    )
  }}
/>
```

| 키 | 동작 |
|---|------|
| ↑ ↓ | 탐색 |
| Space | 완료 토글 |
| Delete | 삭제 |
| F2 | 이름변경 |
| Alt+↑↓ | 순서변경 |
| Ctrl+C/X/V | 클립보드 |
| Ctrl+Z | Undo |

---

## Usage 2: 파일 탐색기

### Minimal — TreeView

```tsx
<TreeView data={fileTree} onChange={setFileTree} />
```

Arrow로 탐색, Left/Right로 접기/펼치기.

### + 편집 + 클립보드 + 타이프어헤드

```tsx
<TreeView
  data={fileTree}
  onChange={setFileTree}
  plugins={[core(), history(), clipboard(), typeahead({ key: 'name' })]}
  enableEditing
  renderItem={(item, state) => (
    <span className="item-inner">
      <span className="item-chevron--tree">
        {state.expandable ? (state.expanded ? '▾' : '▸') : ' '}
      </span>
      {item.data.name}
    </span>
  )}
/>
```

| 키 | 동작 |
|---|------|
| ↑ ↓ | 탐색 |
| ← | 접기 또는 부모로 |
| → | 펼치기 또는 첫 자식으로 |
| F2 | 파일명 변경 |
| Delete | 파일 삭제 |
| Ctrl+C/V | 파일 복사/붙여넣기 |
| Ctrl+X | 파일 이동 (잘라내기→붙여넣기) |
| 타이핑 | 파일명으로 점프 |
| * | 같은 레벨 전체 펼치기 |

---

## Usage 3: 설정 패널

### Accordion — 섹션별 접기/펼치기

```tsx
<Accordion data={settings} onChange={setSettings} />
```

Enter/Space로 섹션 토글. 한 번에 하나만 열림.

### RadioGroup — 단일 선택 옵션

```tsx
<RadioGroup data={themeOptions} onChange={setThemeOptions} />
```

Arrow로 옵션 이동하면 자동 선택.

### SwitchGroup — on/off 토글

```tsx
<SwitchGroup data={preferences} onChange={setPreferences} />
```

Space로 개별 스위치 토글.

### 조합 — 설정 패널 전체

```tsx
<div>
  <h3>Theme</h3>
  <RadioGroup data={themeOptions} onChange={setThemeOptions} />

  <h3>Features</h3>
  <SwitchGroup data={featureFlags} onChange={setFeatureFlags} />

  <h3>Advanced</h3>
  <Accordion data={advancedSettings} onChange={setAdvancedSettings} />
</div>
```

CSS 0줄. 각 컴포넌트가 ARIA role에 맞는 base style을 자동 적용.

---

## Usage 4: 데이터 테이블

### Grid — 정렬 가능한 테이블

```tsx
<Grid
  data={users}
  onChange={setUsers}
  columns={[
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role' },
    { key: 'status', header: 'Status' },
  ]}
  aria-label="User list"
/>
```

| 키 | 동작 |
|---|------|
| ↑ ↓ | 행 이동 |
| ← → | 셀 이동 |
| Home/End | 행의 첫/끝 셀 |
| Ctrl+Home | 테이블 첫 셀 |

### + 편집 + 클립보드

```tsx
<Grid
  data={users}
  onChange={setUsers}
  plugins={[core(), history(), clipboard()]}
  enableEditing
  columns={columns}
/>
```

F2로 셀 편집, Delete로 행 삭제, Ctrl+C/V로 행 복사.

---

## Usage 5: 프로젝트 보드 (Kanban)

```tsx
<Kanban
  data={board}
  onChange={setBoard}
  plugins={[core(), history(), clipboard()]}
  enableEditing
  aria-label="Sprint board"
/>
```

| 키 | 동작 |
|---|------|
| ↑ ↓ | 같은 컬럼 내 카드 이동 |
| ← → | 컬럼 간 이동 (spatial) |
| Alt+↑↓ | 카드 순서 변경 |
| Alt+←→ | 카드를 다른 컬럼으로 이동 |
| F2 | 카드 제목 변경 |
| Delete | 카드 삭제 |

---

## Usage 6: 커맨드 팔레트

### Combobox — 필터링 + 선택

```tsx
<Combobox
  data={commands}
  onChange={setCommands}
  placeholder="Type a command..."
/>
```

타이핑하면 자동 필터링, Arrow로 탐색, Enter로 실행.

### + 커스텀 렌더 (아이콘 + 단축키 힌트)

```tsx
<Combobox
  data={commands}
  onChange={setCommands}
  placeholder="Type a command..."
  renderItem={(item) => (
    <span className="item-inner item-spread">
      <span>{item.data.icon} {item.data.label}</span>
      <kbd>{item.data.shortcut}</kbd>
    </span>
  )}
/>
```

---

## Usage 7: 탭 네비게이션

### TabList — 기본

```tsx
<TabList data={tabs} onChange={setTabs} />
```

Arrow로 탭 이동, Enter로 선택. 선택된 탭에 accent 밑줄.

### + 탭 닫기/추가

```tsx
<TabList
  data={tabs}
  onChange={setTabs}
  enableEditing
  renderItem={(item, state) => (
    <span className="item-inner">
      {item.data.label}
      {state.focused && <span onClick={() => closeTab(item.id)}>×</span>}
    </span>
  )}
/>
```

---

## Usage 8: 도구모음

### Toolbar — 기본

```tsx
<Toolbar data={actions} onChange={setActions} />
```

Arrow로 버튼 간 이동. Enter/Space로 실행.

### ToggleGroup — 다중 토글

```tsx
<ToggleGroup data={formatting} onChange={setFormatting} />
```

Bold/Italic/Underline — 각각 독립적으로 on/off. `aria-pressed` 상태.

---

## Plugin 총정리

| Plugin | import | 추가되는 기능 |
|--------|--------|-------------|
| `core()` | 기본 포함 | 탐색, 선택, 확장, 포커스 |
| `history()` | 기본 포함 | Ctrl+Z undo, Ctrl+Shift+Z redo |
| `crud()` | `plugins/crud` | Delete 삭제, 자동 포커스 복구 |
| `rename()` | `plugins/rename` | F2/Enter 인라인 편집 |
| `dnd()` | `plugins/dnd` | Alt+Arrow 순서 변경 |
| `clipboard()` | `plugins/clipboard` | Ctrl+C/X/V 복사/잘라내기/붙여넣기 |
| `typeahead()` | `plugins/typeahead` | 타이핑으로 아이템 점프 |
| `focusRecovery()` | `plugins/focusRecovery` | 삭제 후 포커스 자동 복구 |

### enableEditing이 켜는 것

`enableEditing` prop은 keyMap 축약어입니다:

```tsx
// enableEditing={true}는 아래와 동일:
keyMap={{
  'Delete': (ctx) => crudCommands.remove(ctx.focused),
  'Enter': (ctx) => renameCommands.startRename(ctx.focused),
  'F2': (ctx) => renameCommands.startRename(ctx.focused),
  'Alt+ArrowUp': (ctx) => dndCommands.moveUp(ctx.focused),
  'Alt+ArrowDown': (ctx) => dndCommands.moveDown(ctx.focused),
}}
```

더 세밀한 제어가 필요하면 keyMap을 직접 전달합니다.

---

## renderItem 패턴

### 기본 — label만

```tsx
renderItem={(item) => <span>{item.data.label}</span>}
```

### 아이콘 + label

```tsx
renderItem={(item) => (
  <span className="item-inner">
    <FileIcon name={item.data.name} />
    {item.data.label}
  </span>
)}
```

### label + 설명

```tsx
renderItem={(item) => (
  <span className="item-inner" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
    <span>{item.data.label}</span>
    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.data.description}</span>
  </span>
)}
```

### label + 우측 뱃지

```tsx
renderItem={(item) => (
  <span className="item-inner item-spread">
    <span>{item.data.label}</span>
    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.data.count}</span>
  </span>
)}
```

### 상태 반응

```tsx
renderItem={(item, state) => (
  <span className="item-inner" style={{
    fontWeight: state.selected ? 600 : 400,
    color: state.selected ? 'var(--primary)' : undefined,
  }}>
    {state.selected ? '● ' : '○ '}{item.data.label}
  </span>
)}
```
