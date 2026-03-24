좋은 주제다. 플러그인이 keyMap을 오버라이드할 때 기존 동작이 깨지는 문제 -- 이건 이 프로젝트에서 이미 여러 번 만난 문제이고, 확립된 원칙이 있다. 정리부터 하자.

---

| 요소 | 내용 | 이해도 |
|------|------|--------|
| 목적 | SDK API에서 사용자가 플러그인으로 행동(keyMap)을 확장 가능하게 만들되, 기존 동작의 안정성을 보장 | 🟡 70% |
| 배경 | 현재 하드코딩된 keyMap이 트리뷰/그리드/리스트 3개 컴포넌트에서 공유됨. 플러그인 시스템 도입을 고려 중 | 🟡 65% |
| 이상적 결과 | 플러그인이 keyMap을 확장/오버라이드해도 기존 behavior가 깨지지 않는 구조 | 🟡 55% |
| 현실 | 하드코딩된 keyMap, 3개 컴포넌트에서 사용 중 | 🔴 40% |

---

이 프로젝트에서 이미 같은 문제를 거쳐 나온 설계가 있다. 핵심을 먼저 밝히겠다.

### 제 판단: **3계층 분리 + chain of responsibility**가 답이다.

**이유:** 이 프로젝트에서 clipboard keyMap 3줄이 5곳에 복붙되다가 6번째(CmsSidebar)에서 누락되어 "복사 안 됨" 버그가 터진 적이 있다. "플러그인은 commands만 제공하고 keyMap은 알아서 가져다 써라"는 잘못된 책임 분리다. 반대로 플러그인에게 무제한 오버라이드 권한을 주면 당신이 걱정하는 "기존 동작 깨짐"이 발생한다. 해법은 계층별 우선순위 체인이다.

**구조:**

```
1. 축(axis)    = 순수 ARIA 행동 (nav, select, activate, expand, trap, value)
                 → 이건 깨지면 안 되는 기본 동작
2. 패턴(pattern) = 축의 조합 → treeview = nav + depth + select
                 → 컴포넌트별 behavior
3. 플러그인 keyMap = clipboard, history, crud 등
                 → 컴포넌트 레벨에서 useAria({ keyMap }) override
```

**키 충돌 해소 = chain of responsibility:**
- 키가 눌리면 위에서부터 순회: `plugin.keyMap → pattern.keyMap → axis.keyMap`
- 각 핸들러가 `Command | void`를 반환
- 첫 번째 non-void Command가 승리
- 이벤트 버블링 가드: `if (event.defaultPrevented) return`이 첫 번째 가드

이 구조에서 플러그인은:
- **자기 키바인딩을 소유한다** (commands + keyMap을 함께 제공)
- **기존 축 동작을 대체하지 않는다** (체인에서 상위에 있을 뿐, 기존 키를 void로 반환하면 다음 레이어가 처리)
- **명시적 override만 가능하다** (특정 키를 가로채려면 Command를 반환해야 함)

### 당신의 걱정 "플러그인이 기존 동작을 깨뜨릴 수 있다"에 대해

이건 정당한 걱정이고, chain of responsibility가 정확히 이걸 해결한다:

| 플러그인 의도 | 반환값 | 결과 |
|---|---|---|
| 새 키 추가 (Ctrl+C) | Command | 플러그인이 처리 |
| 기존 키 그대로 | void | 아래 레이어(axis)가 처리 |
| 기존 키 대체 | Command | 플러그인이 가로챔 (명시적 의도) |

void 반환이 기본이므로, 플러그인이 **명시적으로 Command를 반환하지 않는 한** 기존 동작은 그대로 유지된다. "실수로 깨뜨리는" 경로가 구조적으로 차단된다.

### 합성 우선순위

이미 확립된 원칙: `behavior.keyMap → plugin.keyMap → options.keyMap`

- **behavior.keyMap**: axis에서 오는 ARIA 기본 동작 (ArrowDown, Enter, Space 등)
- **plugin.keyMap**: clipboard(Ctrl+C/V), history(Ctrl+Z) 등 플러그인이 소유하는 키
- **options.keyMap**: 소비자가 마지막에 덮어쓸 수 있는 탈출구

이 3단계 체인 덕에 축 동작은 가장 낮은 우선순위로 항상 fallback 역할을 하고, 플러그인은 중간에서 자기 영역만 처리하며, 최종 소비자는 필요하면 뭐든 오버라이드할 수 있다.

---

**갭 질문:**

지금 "하드코딩된 keyMap이 3개 컴포넌트에서 쓰인다"고 했는데, 구체적으로 알고 싶다:

1. **현재의 keyMap 구조**: 3개 컴포넌트가 하나의 keyMap 객체를 공유하는 건지, 각각 다른 keyMap을 가지고 있는데 중복 코드가 있는 건지? (이게 현실 요소의 핵심 -- 공유냐 복붙이냐에 따라 마이그레이션 경로가 달라진다)

2. **"확장"의 범위**: 플러그인이 추가할 행동이 주로 어떤 종류인지? 예를 들어:
   - A) 새로운 키바인딩 추가 (Ctrl+C 같은) -- 기존 키와 충돌 가능성 낮음
   - B) 기존 키의 동작 변경 (Enter 눌렀을 때 다른 일) -- 충돌 가능성 높음
   - C) 둘 다

   **제 판단: C일 가능성이 높다.** 이유: clipboard는 A, edit(F2/Enter 편집 진입)은 B에 해당하고, 실제 SDK에서는 두 유형 모두 필요하다. 다르게 보시면 말씀해주세요.
