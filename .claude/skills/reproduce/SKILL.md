---
description: 실제 브라우저에서 버그를 재현하거나 앱을 탐색적으로 사용해보는 스킬. agent-browser로 앱을 직접 조작하여 재현 증거(스크린샷, 접근성 트리, DOM 상태)를 수집한다. "재현해봐", "이거 진짜 되는지 확인해봐", "CMS에서 Delete 누르면 크래시 나는데", "이 페이지 한번 써봐", "/reproduce" 등을 말할 때 사용. 버그 리포트가 들어왔을 때, 구현 완료 후 실제로 동작하는지 확인할 때, 탐색적으로 버그를 찾고 싶을 때 모두 사용.
---

## 역할

너는 **QA 테스터**다. 실제 브라우저에서 앱을 직접 사용하여 버그를 재현하거나 탐색적으로 발견한다. 코드를 읽지 않고, 사용자처럼 앱을 조작한다.

## 왜 브라우저 재현인가

jsdom 테스트는 "코드가 맞는가"를 검증하지만 "실제로 동작하는가"는 다른 문제다. 포커스 이동, 키보드 인터랙션, 레이아웃 크래시, 접근성 트리 노출 같은 문제는 실제 브라우저에서만 확인할 수 있다.

```
버그 제보 → 브라우저에서 재현 → 증거 수집 → 재현 성공/실패 보고
```

## 도구: agent-browser

`agent-browser`는 headless Chromium CLI로, AI가 브라우저를 직접 조작할 수 있게 해준다.

### 핵심 명령어

```bash
agent-browser open <url>              # 페이지 열기
agent-browser snapshot                # 접근성 트리 (전체)
agent-browser snapshot -i             # 인터랙티브 요소만 (@ref 포함)
agent-browser snapshot -c             # 빈 구조 요소 제거
agent-browser click @e3               # ref로 클릭
agent-browser press ArrowDown         # 키 입력
agent-browser press Meta+z            # 수정자 키 조합
agent-browser press Enter             # Enter
agent-browser eval "JS 표현식"         # DOM 상태 확인
agent-browser screenshot /tmp/x.png   # 스크린샷 캡처
agent-browser focus @e5               # 요소에 포커스
```

### 유용한 eval 패턴

```bash
# 현재 포커스 위치
agent-browser eval "document.activeElement?.tagName + '|' + document.activeElement?.getAttribute('role') + '|' + document.activeElement?.textContent?.slice(0,50)"

# 특정 role 요소 개수
agent-browser eval "document.querySelectorAll('[role=option]').length"

# aria 속성 확인
agent-browser eval "document.activeElement?.getAttribute('aria-selected')"

# 콘솔 에러 캡처 (페이지 로드 직후 주입)
agent-browser eval "window.__errors=[]; window.addEventListener('error', e => __errors.push(e.message))"
agent-browser eval "window.__errors"
```

## 실행 흐름

### Step 0: 입력 파악

사용자의 요청에서 두 가지를 파악한다:

| 모드 | 입력 | 예시 |
|------|------|------|
| **재현 모드** | 버그 설명 + 재현 단계 | "Delete 연타하면 하얀 화면" |
| **탐색 모드** | 대상 페이지/기능 | "CMS 한번 써봐" |

### Step 1: 앱 띄우기

```bash
# dev server 확인
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173

# 안 떠있으면 시작
pnpm dev &>/dev/null &
sleep 3
```

```bash
agent-browser open http://localhost:5173/<경로>
```

### Step 2: 초기 상태 캡처

```bash
agent-browser screenshot /tmp/reproduce-initial.png
agent-browser snapshot -c                    # 접근성 트리
agent-browser snapshot -i                    # 인터랙티브 요소 목록
```

- 스크린샷을 읽어서 초기 상태를 확인한다
- 접근성 트리에서 이상한 점이 있는지 확인한다 (`[object Object]`, 빈 라벨 등)

### Step 3A: 재현 모드

버그 설명의 재현 단계를 agent-browser 명령으로 변환하여 실행한다.

```
재현 단계: "hero 섹션에서 Delete 5번 연타"
→ agent-browser click @e34      (hero에 포커스)
→ agent-browser press Escape     (섹션 레벨로)
→ agent-browser press Delete     (×5)
→ agent-browser screenshot       (결과 캡처)
→ agent-browser eval "..."       (DOM 상태 확인)
```

**매 단계마다:**
1. 명령 실행
2. `eval`로 상태 변화 확인 (포커스 위치, 요소 수, aria 속성)
3. 예상과 다르면 스크린샷 캡처

### Step 3B: 탐색 모드

PRD/스펙이 있으면 읽고 유저 스토리를 체크리스트로 변환한다. 없으면 페이지 구조를 보고 자율적으로 탐색한다.

**탐색 전략 (순서대로):**

1. **기본 동선** — 화면에 보이는 인터랙티브 요소를 하나씩 사용해본다
2. **키보드 네비게이션** — Tab, Arrow, Enter, Escape로 이동해본다
3. **CRUD 사이클** — 추가 → 수정 → 삭제 → Undo
4. **경계 테스트**:
   - 빈 상태 (전부 삭제)
   - 빠른 연타
   - 역방향 동선 (끝→처음→끝)
   - 포커스 이탈 후 복귀
   - 예상 밖 키 (Ctrl+Z, F5, Tab)
5. **상태 전환** — 모드 진입/탈출 (Presentation, 모바일 뷰포트 등)

### Step 4: 증거 수집

버그를 발견하면 즉시 증거를 수집한다:

```bash
agent-browser screenshot /tmp/reproduce-bug-N.png    # 시각적 증거
agent-browser snapshot -c                              # 접근성 트리 상태
agent-browser eval "document.activeElement?...."       # DOM 상태
```

### Step 5: 보고

발견한 내용을 정리하여 보고한다.

**재현 모드 보고 형식:**

```markdown
## 재현 결과: [버그 제목]

**재현 성공/실패**: ✅ 재현됨 / ❌ 재현 안 됨

**재현 단계:**
1. [수행한 동작]
2. [수행한 동작]
3. ...

**기대 결과:** [이렇게 되어야 했음]
**실제 결과:** [이렇게 됨]

**증거:**
- 스크린샷: /tmp/reproduce-bug-1.png
- DOM 상태: [eval 결과]
- 접근성 트리: [이상한 점]
```

**탐색 모드 보고 형식:**

```markdown
## 탐색 QA 결과: [페이지명]

### 발견된 이슈

| # | 심각도 | 이슈 | 재현 단계 |
|---|--------|------|----------|
| 1 | 🔴 Critical | ... | ... |
| 2 | 🟡 Medium | ... | ... |
| 3 | 🟡 Low | ... | ... |

### 정상 동작 확인
- [확인된 기능 1]
- [확인된 기능 2]
```

## 주의사항

- **modifier 키 제한**: headless Chromium에서 Cmd+D 같은 조합이 브라우저 단축키로 가로채질 수 있다. modifier 키 조합이 안 먹으면 false positive일 수 있으니 기록만 하고 "브라우저 제한 가능성" 표시
- **페이지 리로드 후 재시도**: 하얀 화면이나 크래시가 나면 `agent-browser open`으로 리로드하고 계속 탐색
- **ref 갱신**: 페이지 상태가 바뀌면 ref(@e1 등)가 변한다. 상호작용 후 `snapshot -i`로 새 ref를 확인
- **코드를 읽지 않는다**: 이 스킬의 목적은 사용자 관점 검증. 코드 분석은 다음 단계(debugging 스킬)에서 한다
