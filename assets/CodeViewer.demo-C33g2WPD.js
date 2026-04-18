import{t as e}from"./index-CZ4T_dVD.js";import{t}from"./ax-4rdbEknh.js";import{t as n}from"./CodeViewer-DOPWF_aV.js";var r=e(),i={slug:`code-viewer`,category:`ui`,label:`CodeViewer`},a=`import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'

const data = createStore({
  entities: { a: { id: 'a', data: { label: 'Hello' } } },
  relationships: { [ROOT_ID]: ['a'] },
})`,o=`.sidebarHeader {
  height: 36px;
  padding: 0 var(--space-md);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-weight: 600;
}`,s=new Map([[1,`inserted`],[2,`inserted`],[3,`inserted`],[4,`inserted`]]),c=new Map([[1,`inserted`],[3,`deleted`],[5,`edited`],[7,`selected`]]),l=new Map([[1,`deleted`],[2,`deleted`],[3,`deleted`],[4,`deleted`]]);function u(){return(0,r.jsxs)(`div`,{className:t({layout:`stack`,gap:`lg`}),children:[(0,r.jsx)(d,{label:`preset=doc (default) — filename + region landmark`,children:(0,r.jsx)(n,{code:a,filename:`example.ts`,preset:`doc`})}),(0,r.jsx)(d,{label:`preset=presentation — mac chrome + large font`,children:(0,r.jsx)(n,{code:a,filename:`app.tsx`,preset:`presentation`})}),(0,r.jsx)(d,{label:`preset=chat — compact + wrap + no line numbers`,children:(0,r.jsx)(n,{code:a,preset:`chat`})}),(0,r.jsx)(d,{label:`preset=replay — compact + line numbers, plain figure`,children:(0,r.jsx)(n,{code:o,filename:`styles.css`,preset:`replay`,highlightLines:c})}),(0,r.jsx)(d,{label:`consecutive deleted (stronger tone)`,children:(0,r.jsx)(n,{code:o,filename:`styles.css`,highlightLines:l})}),(0,r.jsx)(d,{label:`consecutive inserted`,children:(0,r.jsx)(n,{code:o,filename:`styles.css`,highlightLines:s})}),(0,r.jsx)(d,{label:`mixed tones: inserted(1) / deleted(3) / edited(5) / selected(7)`,children:(0,r.jsx)(n,{code:o,filename:`styles.css`,highlightLines:c})}),(0,r.jsx)(d,{label:`startLine=42 — gutter starts at 42`,children:(0,r.jsx)(n,{code:a,filename:`example.ts`,startLine:42})}),(0,r.jsx)(d,{label:`no filename — aria-label='Code example, typescript'`,children:(0,r.jsx)(n,{code:a,preset:`doc`})})]})}function d({label:e,children:n}){return(0,r.jsxs)(`div`,{children:[(0,r.jsx)(`div`,{className:t({textStyle:`caption`}),children:e}),n]})}export{u as Demo,i as meta};