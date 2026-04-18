---
id: '4-archive/meta/archive/65-[question]claudeCodeWebUiReadability'
title: '클로드 코드 웹 UI 가독성 — 2026-03-30'
status: archived
kind: note
created: 2026-03-31
updated: 2026-04-11
topics: [4-archive, question]
relates: []
supersedes: []
---
# 클로드 코드 웹 UI 가독성 — 2026-03-30

## 배경

터미널은 일반 대중에게 공포스러운 경험이다. 클로드 코드를 인스타 DM 같은 친숙한 채팅 기반으로 전환하여 비개발자도 쓸 수 있게 하려는 논의에서 나왔다.

## 내용

### 목적

터미널 패러다임(명령→출력) → DM 패러다임(사람↔사람 대화)으로 전환.
전형적인 LLM 채팅 UI(마크다운, 코드블록, thinking 노출)가 아니라 인스타그램 DM처럼 짧은 버블, 낮은 인지 부하.

### 레퍼런스 UX

- 인스타그램 DM
- 짧은 메시지 버블
- 사람↔사람 대화 패러다임
- Progressive disclosure 없이 모든 정보를 노출하면 오히려 역효과

### 핵심 난제 (미결)

Claude Code 출력 3종류를 DM UI에서 어떻게 처리할 것인가:

| 출력 종류 | DM 친화성 | 처리 방법 |
|-----------|-----------|-----------|
| 대화 텍스트 ("파일 읽고 있어요") | ✅ 자연스럽다 | 버블 그대로 |
| Tool call (bash/file edit/read) | ❌ 기술적 | 미결 |
| 코드 블록 / diff / 파일 트리 | ❌ 정보 밀도 높음 | 미결 |

### 열린 선택지 (Tool call & 코드 결과 표현)

- **A)** 기본 숨김 + 탭하면 펼치기 (GitHub PR diff 스타일)
- **B)** 요약 버블 ("파일 3개 수정됨") + 상세는 별도 화면
- **C)** 아예 안 보여줌 — 결과 메시지만 ("작업 완료")
- **D)** 기타

## 다음 행동

- Tool call / 코드 결과 표현 방식 결정 후 `/prd`로 전환
- 관련 메모리: `project_chat_module_gen_ui`, `project_fe_value_ai_ui_layer`, `feedback_animation_buys_time`
