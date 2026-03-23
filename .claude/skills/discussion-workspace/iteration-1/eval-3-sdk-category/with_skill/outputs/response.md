## 이해도 테이블

| 요소 | 내용 | 이해도 |
|------|------|--------|
| 목적 | 15개 컴포넌트를 3개 카테고리로 묶어 SDK로 내보내기. 사용자가 컴포넌트를 찾고 쓸 때 분류가 길잡이 역할 | 🟡 70% |
| 배경 | UI SDK 카탈로그가 이미 32개 완성품 목표로 정리되어 있고, Element(8) / Pattern(19) / Composition(5) 3층 위계가 확립됨. v1의 과도한 추상화 실패 교훈이 있음. 현재 완성품 8/32 완료 | 🟢 90% |
| 이상적 결과 | 15개 컴포넌트가 3개 카테고리로 나뉘어 export되고, 사용자가 카테고리명만 보고 원하는 컴포넌트를 찾을 수 있음 | 🟡 60% |
| 현실 | 이미 3층 위계(Element / Pattern / Composition)가 존재하고, "behavior 기준 분류 금지"가 확정된 원칙. 15개가 정확히 어떤 컴포넌트인지 미확인 | 🟡 65% |
| 문제 | "behavior 기준 vs 용도 기준" 트레이드오프를 결정해야 함 | 🟡 70% |
| 원인 | 분류 축이 여러 개 가능하고, 각각 장단점이 있어서 선택이 필요 | 🟡 60% |
| 제약 | 확정된 원칙: behavior 기준 분류 금지 (feedback_ui_sdk_principles). v1 실패 교훈: 범용 추상화 금지 | 🟢 90% |
| 목표 | 15개 컴포넌트의 적절한 3-카테고리 분류 확정 + SDK export 구조 결정 | 🟡 60% |
| 해결 | 미정 | 🔴 30% |
| 부작용 | 미정 | 🔴 20% |

---

## 응답

이 트레이드오프는 사실 **이미 결정된 문제**입니다.

프로젝트에 확정된 원칙이 세 가지 있습니다:

1. **behavior 기준 분류 금지** — 같은 behavior라도 용도가 다르면 별개 완성품 (feedback_ui_sdk_principles)
2. **분류 기준 = 실제 앱의 표준 UI 어휘** — ARIA spec도 아니고 behavior도 아님
3. **v1 교훈** — behavior 기준 통합은 "아무 용도에도 맞지 않는 추상화"로 실패함

그리고 이미 **3층 위계가 확립**되어 있습니다:

| 레이어 | 기준 | 예시 |
|--------|------|------|
| **Element** | 인터랙션 없음. 데이터 -> 표시 | FileIcon, CodeBlock, Breadcrumb |
| **Pattern** | 인터랙션 있음. os behavior 기반 | NavList, TreeView, Tabs, DataGrid |
| **Composition** | Element + Pattern 조립 | FileViewerModal, CommandPalette |

이 분류는 behavior가 아니라 **"이 컴포넌트가 뭘 하느냐" (용도/성격)**로 나눈 것입니다. Element는 "보여주기만", Pattern은 "키보드/포커스 인터랙션", Composition은 "여러 개 조립". 용도 기준이면서 동시에 기술적으로도 명확한 경계입니다.

따라서 **제 판단: "behavior vs 용도" 트레이드오프는 존재하지 않습니다. 용도 기준이 이미 확정이고, 3층 위계도 이미 있습니다.** 실제로 해야 할 일은 "15개 컴포넌트를 기존 3층 위계에 배치하고 export 구조를 잡는 것"입니다.

다만 혹시 제가 놓치고 있는 게 있을 수 있어서 확인이 필요합니다.

---

## 갭 질문

1. **15개 컴포넌트가 구체적으로 어떤 것들인가요?** 카탈로그의 완료된 8개(FileIcon, CodeBlock, Breadcrumb, MarkdownViewer, NavList, TreeView, Tabs, FileViewerModal) + 추가 7개인지, 아니면 다른 기준으로 선별한 15개인지에 따라 배치가 달라집니다.

2. **"behavior 기준 분류"가 매력적으로 보인 구체적 이유가 있나요?** 이미 금지된 원칙인데 다시 트레이드오프로 떠올랐다면, 기존 3층 위계에 맞지 않는 케이스가 발견된 건 아닌지 확인하고 싶습니다. 예를 들어 ListBox와 NavList가 "같은 것 아닌가?"라는 의문이 생겼다면, 그건 분류 문제가 아니라 완성품 경계 문제입니다.

📎 References: docs/5-backlogs/uiSdkCatalog.md, docs/0-inbox/28-[vision]ui-component-hierarchy.md
