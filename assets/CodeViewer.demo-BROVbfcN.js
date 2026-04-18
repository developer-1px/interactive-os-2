import{r as e}from"./chunk-CFjPhJqf.js";import{t}from"./CodeViewer-YFFddyq6.js";import{t as n}from"./ax-DELUmbyI.js";import{t as r}from"./jsx-runtime-BJXw1wCY.js";var i=e({Demo:()=>f,meta:()=>o}),a=r(),o={slug:`code-viewer`,category:`ui`,label:`CodeViewer`},s=`import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'

const data = createStore({
  entities: { a: { id: 'a', data: { label: 'Hello' } } },
  relationships: { [ROOT_ID]: ['a'] },
})`,c=`.sidebarHeader {
  height: 36px;
  padding: 0 var(--space-md);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-weight: 600;
}`,l=new Map([[1,`inserted`],[2,`inserted`],[3,`inserted`],[4,`inserted`]]),u=new Map([[1,`inserted`],[3,`deleted`],[5,`edited`],[7,`selected`]]),d=new Map([[1,`deleted`],[2,`deleted`],[3,`deleted`],[4,`deleted`]]);function f(){return(0,a.jsxs)(`div`,{className:n({layout:`stack`,gap:`lg`}),children:[(0,a.jsx)(p,{label:`preset=doc (default) — filename + region landmark`,children:(0,a.jsx)(t,{code:s,filename:`example.ts`,preset:`doc`})}),(0,a.jsx)(p,{label:`preset=presentation — mac chrome + large font`,children:(0,a.jsx)(t,{code:s,filename:`app.tsx`,preset:`presentation`})}),(0,a.jsx)(p,{label:`preset=chat — compact + wrap + no line numbers`,children:(0,a.jsx)(t,{code:s,preset:`chat`})}),(0,a.jsx)(p,{label:`preset=replay — compact + line numbers, plain figure`,children:(0,a.jsx)(t,{code:c,filename:`styles.css`,preset:`replay`,highlightLines:u})}),(0,a.jsx)(p,{label:`consecutive deleted (stronger tone)`,children:(0,a.jsx)(t,{code:c,filename:`styles.css`,highlightLines:d})}),(0,a.jsx)(p,{label:`consecutive inserted`,children:(0,a.jsx)(t,{code:c,filename:`styles.css`,highlightLines:l})}),(0,a.jsx)(p,{label:`mixed tones: inserted(1) / deleted(3) / edited(5) / selected(7)`,children:(0,a.jsx)(t,{code:c,filename:`styles.css`,highlightLines:u})}),(0,a.jsx)(p,{label:`startLine=42 — gutter starts at 42`,children:(0,a.jsx)(t,{code:s,filename:`example.ts`,startLine:42})}),(0,a.jsx)(p,{label:`no filename — aria-label='Code example, typescript'`,children:(0,a.jsx)(t,{code:s,preset:`doc`})})]})}function p({label:e,children:t}){return(0,a.jsxs)(`div`,{children:[(0,a.jsx)(`div`,{className:n({textStyle:`caption`}),children:e}),t]})}export{f as n,o as r,i as t};