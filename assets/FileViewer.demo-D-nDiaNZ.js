import{o as e,r as t}from"./chunk-CFjPhJqf.js";import{t as n}from"./react-nm2Ru1Pt.js";import{t as r}from"./ax-DELUmbyI.js";import{t as i}from"./jsx-runtime-BJXw1wCY.js";import{t as a}from"./FileViewer-CEg8oZN7.js";var o=t({Demo:()=>d,meta:()=>l}),s=e(n(),1),c=i(),l={slug:`file-viewer`,category:`ui`,label:`FileViewer`},u=`function fibonacci(n: number): number {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}

console.log(fibonacci(10))`;function d(){let e=(0,s.useRef)(null);return(0,s.useEffect)(()=>{e.current?.dispatch({type:`open`,content:u})},[]),(0,c.jsx)(`div`,{className:r({layout:`stack`}),children:(0,c.jsx)(a,{ref:e,filename:`fibonacci.ts`})})}export{o as n,l as r,d as t};