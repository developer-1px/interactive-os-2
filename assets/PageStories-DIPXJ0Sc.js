import{t as e}from"./ax-DELUmbyI.js";import{t}from"./arrow-right-oNHZHBLj.js";import{t as n}from"./jsx-runtime-BJXw1wCY.js";import{t as r}from"./StatusIndicator-CKv21QwC.js";import{n as i}from"./browser-Djx4bE3a.js";import{t as a}from"./PanelHeader-ByBalN-z.js";import{t as o}from"./ScrollArea-B42EwBos.js";var s=`title: "노드 텍스트 편집"
number: 2
scope:
  description: |
    캔버스 위의 텍스트 노드를 인라인 편집한다.
    더블클릭 또는 Enter로 편집 모드 진입.
  design: /screenshots/cms.png

behaviors:
  - given: 텍스트 노드 선택됨
    when: Enter 또는 더블클릭
    then: 인라인 편집 모드 진입, 커서 텍스트 끝에 위치
    status: done

  - given: 편집 모드
    when: Escape
    then: 편집 취소, 원래 텍스트 복원
    status: done

  - given: 편집 모드
    when: Enter (Shift 없이)
    then: 편집 확정, 선택 모드로 복귀
    status: done

  - given: 편집 모드에서 텍스트 변경
    when: 외부 클릭
    then: 편집 확정
    status: wip

  - given: 빈 텍스트로 편집 확정
    when: Enter
    then: 빈 문자열 허용? placeholder 표시?
    status: todo

decisions:
  - title: edit 축 사용
    why: Grid 편집은 editingKeyMap이 아닌 edit 축으로 통합
`,c=`title: "슬라이드 CRUD"
number: 1
scope:
  description: |
    캔버스에 슬라이드를 추가·삭제·이동·복제한다.
    모든 변경은 Command 패턴으로 undo/redo 가능.
  design: /screenshots/cms.png

behaviors:
  - given: CMS 캔버스에 슬라이드 N개
    when: Cmd+N 또는 "+" 버튼 클릭
    then: 선택된 슬라이드 다음에 빈 슬라이드 추가, 자동 선택
    status: done

  - given: 슬라이드 0개 (빈 캔버스)
    when: Cmd+N
    then: 첫 슬라이드 생성, 자동 선택
    status: done

  - given: 슬라이드 선택됨
    when: Delete 키
    then: 선택된 슬라이드 삭제, 이전 슬라이드로 포커스 이동
    status: done

  - given: 마지막 슬라이드 1개
    when: Delete 키
    then: 삭제 차단 (최소 1개 유지)
    status: wip

  - given: 슬라이드 선택됨
    when: Cmd+D
    then: 선택된 슬라이드 복제, 복제본 자동 선택
    status: todo

  - given: 슬라이드 2개 이상
    when: 드래그 앤 드롭
    then: 슬라이드 순서 변경, undo 가능
    status: done

decisions:
  - title: Command 패턴 사용
    why: 모든 변경이 직렬화 가능해야 undo/redo + 협업 가능
  - title: 최소 1개 슬라이드 유지
    why: 빈 캔버스 상태의 UI 복잡도를 제거
`,l=Object.assign({"/docs/1-projects/cms/stories/node-editing.story.yaml":s,"/docs/1-projects/cms/stories/slide-crud.story.yaml":c});function u(){return Object.entries(l).map(([e,t])=>({path:e,doc:i(t)}))}function d(e){return{total:e.behaviors.length,done:e.behaviors.filter(e=>e.status===`done`).length,wip:e.behaviors.filter(e=>e.status===`wip`).length,todo:e.behaviors.filter(e=>e.status===`todo`).length}}var f=n(),p={done:`success`,wip:`warning`,todo:`info`};function m({status:e}){return(0,f.jsx)(r,{tone:p[e]})}var h={table:`_table_1448f_1`};function g({children:t}){return(0,f.jsx)(`th`,{className:e({textStyle:`label`,weight:`semi`,text:`secondary`,padding:`sm`,content:`text`,surface:`sunken`}),children:t})}function _({children:t}){return(0,f.jsx)(`td`,{className:e({padding:`xs`}),children:(0,f.jsx)(`span`,{className:e({surface:`sunken`,shape:`md`,padding:`sm`,textStyle:`caption`,content:`text`}),children:t})})}function v({behaviors:n}){return(0,f.jsxs)(`table`,{className:`${e({width:`full`})} ${h.table}`,children:[(0,f.jsx)(`thead`,{children:(0,f.jsxs)(`tr`,{children:[(0,f.jsx)(g,{children:`Given`}),(0,f.jsx)(g,{children:`When`}),(0,f.jsx)(g,{children:`Then`}),(0,f.jsx)(g,{children:`Status`})]})}),(0,f.jsx)(`tbody`,{children:n.map((n,r)=>(0,f.jsxs)(`tr`,{children:[(0,f.jsx)(_,{children:n.given}),(0,f.jsx)(_,{children:n.when}),(0,f.jsx)(`td`,{className:e({padding:`xs`}),children:(0,f.jsxs)(`span`,{className:e({surface:`sunken`,shape:`md`,padding:`sm`,textStyle:`caption`,content:`text`,layout:`row`,gap:`xs`}),children:[(0,f.jsx)(t,{className:e({icon:`xs`,text:`muted`,flex:`none`})}),n.then]})}),(0,f.jsx)(`td`,{className:e({padding:`xs`}),children:(0,f.jsx)(m,{status:n.status})})]},r))})]})}function y({done:t,wip:n,todo:r}){return t+n+r===0?null:(0,f.jsxs)(`div`,{className:e({layout:`row`,gap:`sm`}),children:[(0,f.jsxs)(`span`,{className:e({textStyle:`caption`,tone:`success`}),children:[t,` done`]}),(0,f.jsxs)(`span`,{className:e({textStyle:`caption`,tone:`warning`}),children:[n,` wip`]}),(0,f.jsxs)(`span`,{className:e({textStyle:`caption`,text:`muted`}),children:[r,` todo`]})]})}function b({doc:t}){let n=d(t),r=t.number==null?t.title:`[ Story #${t.number} ] ${t.title}`;return(0,f.jsxs)(`div`,{className:e({layout:`stack`,surface:`display`,shape:`lg`,scroll:`hidden`}),children:[(0,f.jsxs)(`div`,{className:e({layout:`spread`,padding:`md`,tone:`accent`,surface:`action`}),children:[(0,f.jsx)(`span`,{className:e({textStyle:`label`,weight:`bold`}),children:r}),(0,f.jsx)(y,{...n})]}),(0,f.jsxs)(`div`,{className:e({layout:`row-fill`,gap:`lg`,padding:`lg`}),children:[(0,f.jsxs)(`div`,{className:e({layout:`stack`,gap:`md`,width:`sm`}),children:[(0,f.jsx)(`span`,{className:e({textStyle:`label`,weight:`semi`,text:`secondary`}),children:`In Scope`}),t.scope.design&&(0,f.jsx)(`img`,{src:t.scope.design,alt:`${t.title} design`,className:e({shape:`md`,width:`full`})}),(0,f.jsx)(`p`,{className:e({textStyle:`caption`,text:`secondary`}),children:t.scope.description}),t.decisions&&t.decisions.length>0&&(0,f.jsxs)(`div`,{className:e({layout:`stack`,gap:`sm`,border:`top`,padding:`sm`}),children:[(0,f.jsx)(`span`,{className:e({textStyle:`label`,weight:`semi`,text:`secondary`}),children:`Decisions`}),t.decisions.map((t,n)=>(0,f.jsxs)(`div`,{className:e({layout:`stack`,gap:`xs`}),children:[(0,f.jsx)(`span`,{className:e({textStyle:`caption`,weight:`medium`}),children:t.title}),(0,f.jsx)(`span`,{className:e({textStyle:`caption`,text:`muted`}),children:t.why})]},n))]})]}),(0,f.jsx)(`div`,{className:e({flex:`1`}),children:(0,f.jsx)(v,{behaviors:t.behaviors})})]})]})}var x=u();function S(){return(0,f.jsxs)(`div`,{className:e({layout:`stack`,flex:`1`}),children:[(0,f.jsxs)(a,{children:[(0,f.jsx)(`span`,{className:e({textStyle:`label`,weight:`semi`}),children:`Stories`}),(0,f.jsxs)(`span`,{className:e({textStyle:`caption`,text:`muted`}),children:[x.length,` stories`]})]}),(0,f.jsx)(o,{className:e({flex:`1`}),children:(0,f.jsx)(`div`,{className:e({layout:`stack`,gap:`lg`,padding:`lg`}),children:x.map(e=>(0,f.jsx)(b,{doc:e.doc},e.path))})})]})}export{S as default};