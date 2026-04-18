import{o as e}from"./chunk-CFjPhJqf.js";import{t}from"./react-nm2Ru1Pt.js";import{t as n}from"./index-CZ4T_dVD.js";import{t as r}from"./ax-4rdbEknh.js";import{t as i}from"./FileViewer-Cyt96aDZ.js";var a=e(t(),1),o=n(),s={slug:`file-viewer`,category:`ui`,label:`FileViewer`},c=`function fibonacci(n: number): number {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}

console.log(fibonacci(10))`;function l(){let e=(0,a.useRef)(null);return(0,a.useEffect)(()=>{e.current?.dispatch({type:`open`,content:c})},[]),(0,o.jsx)(`div`,{className:r({layout:`stack`}),children:(0,o.jsx)(i,{ref:e,filename:`fibonacci.ts`})})}export{l as Demo,s as meta};