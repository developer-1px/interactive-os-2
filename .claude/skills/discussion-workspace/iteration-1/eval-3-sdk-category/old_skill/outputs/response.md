메모리와 기존 문서를 확인했습니다. 이 주제에 대해 이미 상당한 기록이 있네요.

## 이해도 테이블

| 요소 | 내용 | 이해도 |
|------|------|--------|
| 목적 | 15개 컴포넌트를 3개 카테고리로 묶어 SDK로 내보내기. LLM/사용자가 쉽게 찾고 쓸 수 있게 하려는 것. | 🟢 90% |
| 배경 | UI SDK 카탈로그(uiSdkCatalog.md)에서 이미 Element/Pattern/Composition 3층 위계가 확립됨. 현재 32개 중 8개 완성. v1 과도한 추상화 실패 교훈 있음. | 🟢 95% |
| 이상적 결과 | 3개 카테고리로 분류된 SDK export 구조가 확정되고, 실제 코드에 반영됨 | 🟡 60% |
| 현실 | 이미 Element(시각)/Pattern(인터랙션)/Composition(조립) 3층이 문서화되어 있고, 이 분류가 **용도 기준**임. behavior 기준 분류는 feedback_ui_sdk_principles에서 명시적으로 금지됨. | 🟢 90% |
| 문제 | "behavior vs 용도" 트레이드오프라고 하셨지만, 기존 결정과 메모리를 보면 이 트레이드오프는 이미 결론이 난 상태. 15개가 구체적으로 어떤 컴포넌트인지, 기존 32개 카탈로그와 어떻게 매핑되는지 불명확. | 🟡 50% |
| 원인 | 기존 결정이 있다는 것을 잊었거나, "15개"가 기존 카탈로그의 부분집합이 아닌 다른 맥락일 수 있음 | 🔴 30% |
| 제약 | v1 교훈: 범용 추상화 금지. behavior 기준 분류 금지 (확정된 원칙). | 🟢 90% |
| 목표 | 15개 컴포넌트의 정체 파악 후 3층 위계에 배치, export 구조 확정 | 🟡 50% |
| 해결 | 기존 Element/Pattern/Composition 3층을 그대로 적용하되, 15개의 구체적 목록에 맞게 export 구조 설계 | 🟡 50% |
| 부작용 | 미정 | 🔴 20% |

## 응답

**핵심부터 말씀드리면: "behavior vs 용도" 트레이드오프는 이미 결론이 났습니다.**

기존 메모리(feedback_ui_sdk_principles)에 명시적으로 기록되어 있습니다:

> "같은 behavior라도 용도가 다르면 별개 완성품. behavior 기준 분류 금지."

그리고 uiSdkCatalog.md에서 이미 3층 위계가 확립되어 있습니다:

- **Element** (시각) -- behavior 없음. 데이터 -> 표시 (FileIcon, CodeBlock, Breadcrumb 등)
- **Pattern** (인터랙션) -- os behavior 기반. hook-first (NavList, TreeView, DataGrid 등)
- **Composition** (조립) -- Element + Pattern 조합 (FileViewerModal, CommandPalette 등)

이 3층은 behavior 기준이 아니라 **"인터랙션의 유무와 조립 수준"**이라는 용도 기준입니다. v1이 behavior 기준 추상화로 실패한 교훈이 직접적으로 반영된 구조입니다.

따라서 트레이드오프를 새로 논의할 필요 없이, **기존 결정을 "15개 컴포넌트"에 적용하는 것**이 실제 과제입니다. 그런데 여기서 갭이 있습니다 -- "15개 컴포넌트"가 정확히 뭔지 모릅니다.

## 갭 질문

**제 판단: "15개"가 기존 카탈로그 32개의 부분집합(현재 완성/진행 중인 것들)일 가능성이 높습니다.** 하지만 다른 맥락일 수도 있어서 확인이 필요합니다.

1. **15개 컴포넌트의 구체적 목록은 무엇인가요?** 기존 uiSdkCatalog.md의 32개 중 현재 SDK로 내보낼 15개를 골라놓은 건지, 아니면 별도의 컴포넌트 셋인지요?

2. **"SDK로 내보낸다"의 의미가 npm 패키지 export 구조인지, /ui 카탈로그 페이지 구조인지?**
   - A) npm 패키지의 entry point 구조 (e.g., `@aria/ui/element`, `@aria/ui/pattern`, `@aria/ui/composition`) -- 물리적 import path
   - B) /ui 라우트의 카탈로그 페이지 분류 -- 시각적 정리
   - C) 둘 다

   제 판단: A. 이유: "내보내야 해"라는 표현이 export/import path를 의미하는 것으로 보입니다.

📎 References: docs/5-backlogs/uiSdkCatalog.md, docs/0-inbox/28-[vision]ui-component-hierarchy.md
