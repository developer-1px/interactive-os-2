import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`# Book UI Floating Chrome

## 배경
book viewer의 header bar가 전체 너비를 차지하며 컨텐츠를 가림. "book은 컨텐츠 중심" 원칙에 따라 chrome을 최소화.

## 변경
1. header bar → 좌상단 floating pill [☰ Chapter · Section] + 우하단 floating badge [3/42]
2. kindle 모드 + mode switcher 제거
3. apple overlay TOC를 유일한 TOC로 유지
4. progress bar → 하단 edge 또는 제거

## 파일
- \`src/pages/book/PageBookViewer.tsx\` — JSX 구조 변경
- \`src/pages/book/PageBookViewer.module.css\` — 스타일 전환
`;export{t};