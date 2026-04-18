import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`# Writer 인터랙션 확장 — scope + focusHistory + writer keyMap

## 배경
Discussion에서 수렴: 글쓰기 특유 인지 패턴에 맞는 조작이 부족. 새 축 불필요, 플러그인으로 해결.

## Agent A: scope 플러그인 + writer keyMap 확장
1. \`src/interactive-os/plugins/scope.ts\` — 서브트리 집중 모드
2. PageWriter에 scope 플러그인 등록 + keyMap 바인딩
3. writerKeys에 insert-before (Shift+Enter) 추가

## Agent B: focusHistory 플러그인
1. \`src/interactive-os/plugins/focusHistory.ts\` — 포커스 이동 이력 스택
2. PageWriter에 focusHistory 플러그인 등록
`;export{t};