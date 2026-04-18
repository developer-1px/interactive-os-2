import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { FilePreview } from './FilePreview'

export const meta = {
  slug: 'file-preview',
  category: 'ui',
  label: 'FilePreview',
}

const content = \`export function greet(name: string): string {
  return \\\`Hello, \\\${name}!\\\`
}

greet('World')\`

export function Demo() {
  return <FilePreview content={content} filename="greet.ts" />
}
`;export{t as n,n as t};