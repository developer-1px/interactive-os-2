# Composer Ghost Text Autocomplete — PRD

> Discussion: 스킬 자동완성 — `/` 타이핑 시 고스트 텍스트로 첫 매칭 스킬명 힌트, Tab으로 완성, 매칭 커맨드 하이라이트

## ① 동기

### WHY (discuss FRT에서 이식)

- **Impact**: 23개 스킬을 외워야 `/` 커맨드를 쓸 수 있다. 이름을 모르면 발견할 수 없고, 오타 시 서버가 "Unknown command" 에러를 반환한다.
- **Forces**: contentEditable 내부 수정은 IME 충돌 위험. Combobox 팝업은 입력 흐름을 끊는다. 고스트 텍스트는 둘 다 피한다.
- **Decision**: 오버레이 고스트 텍스트 + Tab 완성 + 커맨드 하이라이트. Combobox 팝업 기각 — 경량이고 입력 흐름 미중단.
- **Non-Goals**: 인자 자동완성, fuzzy search, 여러 후보 목록 표시, `@mention` 등 다른 트리거.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | Composer에 포커스 | `/dis` 입력 | `/dis` 하이라이트 + `cuss` 고스트 텍스트 | ✅ 일치 |
| S2 | 고스트 텍스트 보이는 상태 | Tab | 텍스트가 `/discuss`로 완성, 전체 하이라이트 | ✅ 일치 |
| S3 | 고스트 텍스트 보이는 상태 | 다른 키 입력 (예: `x`) | `/disx` — 매칭 없으면 하이라이트·고스트 모두 없음 | ✅ 일치 |
| S4 | 매칭 없는 입력 (`/xyz`) | 계속 타이핑 | 고스트·하이라이트 없이 일반 입력 | ✅ 일치 |
| S5 | `/`만 입력 | — | 알파벳 순 첫 스킬의 나머지가 고스트로 표시 | ✅ 일치 |
| S6 | `/discuss args` (완성 후 추가 텍스트) | — | `/discuss` 하이라이트 유지, ` args`는 일반 색, 고스트 없음 | ✅ 일치 |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `Composer.tsx` 확장 | `ghostText: string`, `commandHighlight: number` (하이라이트할 문자 수), `onGhostAccept: () => void`, `onTextChange: (text: string) => void` prop. 오버레이로 하이라이트+고스트 렌더. commandHighlight > 0이면 실제 텍스트 transparent, 오버레이가 대신 표시 | ✅ `Composer.tsx::Composer` |
| `Composer.module.css` 확장 | `.overlay` — position absolute, pointer-events: none, 동일 폰트. `.commandMatch` — `color: var(--tone-primary-base)`. `.ghost` — `color: var(--text-muted)`. `.overlayNormal` — 기본 텍스트 색 (인자 부분) | ✅ `Composer.module.css` |
| `ChatPane.tsx` 매칭 로직 | `onTextChange`에서 `/` prefix match → `commands[]`에서 첫 매칭. ghostText + commandHighlight 계산. `onGhostAccept`에서 텍스트를 완성된 커맨드로 교체 | ✅ `ChatPane.tsx::useCommandMatch` |
| `chatStore.ts` 확장 | `ChatSession.commands: string[]` 필드. init 메시지에서 수신 | ✅ `chatStore.ts::ChatSession` |
| `vite-plugin-agent-ops.ts` 확장 | init 시 `slash_commands`를 `session-ready` 메시지에 포함하여 클라이언트로 전달 | ✅ `vite-plugin-agent-ops.ts::session-ready` |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 문자 입력 | 텍스트가 `/` prefix | `onTextChange` 발화 → 매칭 계산 → ghostText+commandHighlight 갱신 | 타이핑마다 후보가 바뀌므로 실시간 갱신 | 매칭 있으면 하이라이트+고스트, 없으면 없음 | ✅ 일치 |
| Tab | 고스트 있음 | 고스트를 실제 텍스트에 삽입, `onGhostAccept` 호출 | ghost=확정 대기 힌트, Tab=확정 제스처 (IDE 관례) | 텍스트 완성, 고스트 사라짐, 하이라이트 유지 | ✅ 일치 |
| Tab | 고스트 없음 | 기본 동작 (포커스 이동) | 고스트 없으면 가로챌 이유 없음, 접근성 보존 | 변화 없음 | ✅ 일치 |
| Enter | 고스트 있음 | 일반 전송 (고스트 무시) | Enter=전송은 Composer 기본 계약, 고스트는 힌트일 뿐 | 메시지 전송, 고스트·하이라이트 사라짐 | ✅ 일치 |
| Escape | 고스트 있음 | 고스트 제거 | 사용자가 힌트를 명시적으로 거부 | 고스트 없음, 텍스트·하이라이트 유지 | ✅ 일치 |
| Escape | 고스트 없음 | N/A (기본 동작) | — | 변화 없음 | ✅ 일치 |
| Backspace | `/dis` → `/di` | `onTextChange` → 매칭 재계산 | 텍스트 변경이므로 동일 로직 | 새 매칭에 따라 하이라이트+고스트 갱신 | ✅ 일치 |
| ↑↓←→ | 고스트 있음 | 기본 커서 이동 (고스트 유지) | 방향키는 편집 동작, 완성과 무관 | 고스트·하이라이트 유지 | ✅ 일치 |
| Home/End | 고스트 있음 | 기본 커서 이동 | 편집 동작 | 고스트·하이라이트 유지 | ✅ 일치 |
| Space | `/discuss` 완성 후 | `onTextChange` → 커맨드 뒤 인자 영역 진입 | 공백 후는 인자, 고스트 대상 아님. 하이라이트는 커맨드 부분만 유지 | 고스트 사라짐, `/discuss` 하이라이트 유지 | ✅ 일치 |
| 한글 IME | `/` 뒤 조합 중 | compositionEnd 후에만 `onTextChange` | 조합 중 중간 값으로 매칭하면 깜빡임 | 조합 완료 후 매칭 | ✅ 일치 |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 세션 init 전 (commands 미수신) | commands=[] | 목록 없으면 매칭 불가, 에러보다 무동작이 안전 | 고스트·하이라이트 없이 일반 입력 | 변화 없음 | ✅ `EMPTY_COMMANDS` 상수 |
| `/` 단독 입력 | 텍스트="/" | 발견 가능성 제공 | 알파벳 순 첫 스킬 전체가 고스트 | 고스트 있음 | ✅ sorted + find |
| 정확히 일치 (`/discuss`) | 텍스트=완성 커맨드 | 이미 완성, 힌트 불필요 | 고스트 없음, 하이라이트만 | 하이라이트 유지 | ✅ `isExact` 체크 |
| disabled 상태 (AI 응답 중) | Composer disabled | 입력 불가 상태에서 고스트는 혼란 | 고스트·하이라이트 없음 | 변화 없음 | ✅ `contentEditable={!disabled}` |
| 빈 입력 | 텍스트="" | `/`로 시작하지 않으면 매칭 대상 아님 | 고스트·하이라이트 없음 | 변화 없음 | ✅ `startsWith('/')` 가드 |
| 멀티라인 (`Shift+Enter` 후 `/`) | 두 번째 줄에 `/` | 서버도 `^\/` — 문자열 시작만 인식, 중간 `/`는 커맨드 아님 | 첫 줄 첫 문자가 `/`일 때만 매칭 | 중간 줄 `/` 무시 | ✅ `split('\n')[0]` |
| 오버레이와 실제 텍스트 폰트 불일치 | — | 오버레이가 실제 텍스트를 덮으므로 1px 차이도 어긋남 | CSS 변수로 폰트/크기/패딩 공유, 동일 DOM 위치 | 정확히 겹침 | ✅ 동일 토큰 사용 |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | os 기반 개발: UI 완성품 사용 (CLAUDE.md) | ② Composer 확장 | 준수 — Composer는 ui/ 완성품, prop 확장 | — | ✅ 일치 |
| 2 | CSS 토큰 필수 (CLAUDE.md) | ② CSS | 준수 — 모든 색/간격이 토큰 | — | ✅ 일치 |
| 3 | contentEditable 내부 수정 금지 (discuss 제약) | ② 오버레이 방식 | 준수 — 실제 contentEditable DOM 미수정, 오버레이로 시각 처리 | — | ✅ 일치 |
| 4 | addEventListener 금지, KeyMap 선언 (CLAUDE.md) | ③ Tab 가로채기 | 주의 — Composer는 engine 바깥 컴포넌트이므로 KeyMap 적용 불가. onKeyDown 핸들러 내 분기로 처리 (기존 Enter 핸들링과 동일 패턴) | 허용 | ✅ 일치 |
| 5 | module.css 3블록 (feedback) | ② CSS | 준수 — base(형태) → variant(--_ 값) 구조 | — | ✅ 일치 |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | Composer.tsx — 기존 prop 인터페이스 | 새 optional prop 추가. 기존 사용처에 영향 없음 (optional) | 낮 | 허용 | ✅ 일치 |
| 2 | Composer onKeyDown — Tab 키 가로채기 | ghost 있을 때만 Tab 가로채므로, ghost 없으면 기존 동작 100% 유지 | 낮 | 허용 | ✅ 일치 |
| 3 | ChatPane.tsx — Composer 호출 변경 | 새 prop 전달 추가. 기존 onSubmit/disabled/placeholder 미변경 | 낮 | 허용 | ✅ 일치 |
| 4 | vite-plugin session-ready 메시지 | 기존 필드(sessionId, sdkSessionId)에 commands 추가. 클라이언트 기존 핸들러가 모르는 필드는 무시 | 낮 | 허용 | ✅ 일치 |
| 5 | 실제 텍스트 color: transparent | 커맨드 매칭 시에만. 오버레이 렌더 실패하면 텍스트가 안 보일 수 있음 | 중 | ④에 폰트 불일치 경계 추가 완료 | ✅ 일치 |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | contentEditable 내부에 `<span>` 삽입 | ⑤-3 제약 | IME 충돌, 커서/Selection API 복잡화 | ✅ 준수 |
| 2 | onTextChange를 composing 중 호출 | ③ IME 경계 | 한글 조합 중 깜빡임 | ✅ `isComposingRef` 가드 |
| 3 | ghost 없을 때 Tab 가로채기 | ⑤-4 접근성 | 포커스 이동 기본 동작 차단 | ✅ `ghostText &&` 가드 |
| 4 | 오버레이 폰트를 별도 지정 | ⑥-5 불일치 | CSS 변수로 Composer 에디터와 동일 값 공유 필수 | ✅ `font-family: inherit` |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①-S1 | `/dis` 입력 | 하이라이트 `/dis` + 고스트 `cuss` 표시 | ✅ `chat-module.test.tsx::renders overlay with command highlight and ghost text` |
| V2 | ①-S2 | 고스트 상태에서 Tab | 텍스트 `/discuss`로 완성, 하이라이트 유지 | ✅ `chat-module.test.tsx::Tab accepts ghost text via onGhostAccept` |
| V3 | ①-S3 | 고스트 상태에서 `x` 입력 | `/disx` — 매칭 없으면 하이라이트·고스트 없음 | ⚠️ 테스트 간접 커버 (onTextChange 테스트) |
| V4 | ①-S5 | `/` 단독 입력 | 첫 매칭 스킬의 나머지가 고스트 | ⚠️ 테스트 없음 — useCommandMatch 로직으로만 커버 |
| V5 | ①-S6 | `/discuss ` (공백 후 인자) | `/discuss` 하이라이트 유지, 인자 일반색, 고스트 없음 | ✅ `chat-module.test.tsx::renders command highlight with args portion in normal color` |
| V6 | ④-init전 | commands 미수신 상태에서 `/` 입력 | 고스트·하이라이트 없이 일반 입력 | ⚠️ 테스트 없음 — EMPTY_COMMANDS 로직으로만 커버 |
| V7 | ④-disabled | AI 응답 중 | Composer disabled, 고스트·하이라이트 없음 | ✅ `chat-module.test.tsx::disabled state shows no overlay` |
| V8 | ④-멀티라인 | Shift+Enter 후 두 번째 줄에 `/go` | 고스트·하이라이트 없음 (첫 줄 첫 문자만) | ⚠️ 테스트 없음 — split('\n') 로직으로만 커버 |
| V9 | ③-Enter | 고스트 상태에서 Enter | 일반 전송, 고스트 무시 | ✅ `chat-module.test.tsx::Enter submits normally, ignoring ghost` |
| V10 | ③-Escape | 고스트 상태에서 Escape | 고스트 제거, 텍스트 유지 | ✅ `chat-module.test.tsx::Escape dismisses ghost via onGhostDismiss` |
| V11 | ③-IME | `/` 뒤 한글 조합 중 | 조합 완료 전 고스트 변화 없음 | ⚠️ 테스트 없음 — isComposingRef 로직으로만 커버 |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
