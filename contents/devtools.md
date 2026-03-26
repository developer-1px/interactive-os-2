# Devtools

> 크로스커팅 개발자 도구. 시스템 관찰, 버그 재현, 테스트 실행.

## 주기율표

| 모듈 | 핵심 export | 역할 | 상태 |
|------|-----------|------|------|
| REC | `createReproRecorder()`, `ReproRecorderOverlay` | ARIA tree 스냅샷 기반 버그 재현 녹화, LLM-readable 텍스트 출력 | 🟢 |
| Inspector | `PageStoreInspector` | NormalizedData 트리 라이브 탐색 + CRUD + 로그 | 🟢 |
| Test Runner | `TestRunnerPanel`, `runTest()` | 브라우저 내 vitest shim 실행, 시각 검증 | 🟢 |

## 핵심 개념

- **크로스커팅**: L1~L7 레이어와 직교. 특정 앱(CMS/Viewer)에도 속하지 않음
- **LLM-readable**: REC 출력은 JSON이 아니라 에이전틱 브라우저 패턴의 텍스트 형식. 토큰 효율 + 즉시 이해
- **브라우저 네이티브**: 모든 도구가 브라우저 런타임에서 동작. Node.js 의존 없음

## 라우트

| 경로 | 도구 |
|------|------|
| `/devtools/rec` | REC — 재현 녹화 |
| `/devtools/inspector` | Store Inspector |
| `/devtools/test-runner` | Test Runner |

## 갭

- REC: 실전 사용 후 출력 형식 개선 필요 (피드백 대기)
- Inspector: devtools 이동 후 Area 문서 갱신 필요
- Test Runner: 독립 페이지 UI 미구현 (현재 ShowcaseDemo 내장만)
