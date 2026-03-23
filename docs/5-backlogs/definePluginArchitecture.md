> ✅ 완료 — 2026-03-23

# clipboard keyMap → native event 전환 — 2026-03-23

## 배경

definePlugin 아키텍처 개선 중 발견: clipboard는 keyMap(Mod+C/X/V)이 아니라 onCopy/onCut/onPaste 네이티브 이벤트 경로가 올바름.
Aria 컴포넌트 변경이 수반되므로 definePlugin 작업과 분리.

## 내용

1. clipboard 플러그인에서 keyMap 제거
2. Aria 컴포넌트에 onCopy/onCut/onPaste 핸들러 추가
3. onPaste 핸들러에서 Zone의 canAccept를 사용하여 paste command dispatch

## 검증

- 기존 clipboard 테스트 전부 통과
- 브라우저에서 Ctrl+C/X/V가 native event로 동작 확인
- CMS와 일반 ListBox에서 각각 올바른 paste 경로 확인

## 출처

discussion: clipboard singleton 오염 + definePlugin 아키텍처 설계 (2026-03-23)
