# FE × AI UI Layer

클라우드팀 FE 성과 아이템: AI 에이전트 출력을 사람이 쓸 수 있는 UI로 바꾸는 레이어.

## 문서

| 문서 | 내용 |
|------|------|
| 53-[decision]feAiUiLayerStrategy.md | 논의 전체 정리 — 5단계 흐름, 결론, 산출물, 다음 행동 |
| 25-[design]llmEraUiParadigms.md | LLM 시대 UI 3가지 패러다임 (Generative / Agentic / Ambient) |
| 26-[design]generativeInteractiveUi.md | Generative Interactive UI 사례와 기술 (Thesys, CopilotKit, Claude) |

## 프로토타입

| 파일 | 내용 |
|------|------|
| src/pages/PageIncidentInterface.tsx | 인시던트 인터페이스 v3 (채팅 블록 + 컨텍스트 패널) |
| src/pages/PageIncidentInterface.module.css | 스타일 |
| 라우트: /incident | 브라우저에서 확인 |

## 백로그 (BACKLOGS.md)

- [P0] 채팅 블록 필수 7개
- [P1] 채팅 블록 확장 4개
- [P2] Ops 특화 3개
