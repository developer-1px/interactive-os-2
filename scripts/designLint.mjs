// ② 2026-03-26-design-lint-prd.md
/**
 * Design Lint — Browser Runner
 *
 * 브라우저에서 직접 실행하는 디자인 위반 감지 스크립트.
 * Claude in Chrome javascript_tool 주입 또는 콘솔 복붙용.
 *
 * Usage (javascript_tool):
 *   이 파일의 내용을 javascript_tool에 주입하면 LLM-readable 텍스트가 반환된다.
 *
 * Usage (console):
 *   이 파일 내용을 콘솔에 붙여넣으면 결과가 출력된다.
 *
 * Usage (Node.js — Playwright runner에서 import):
 *   import { runDesignLint, formatReport } from './designLintRules.mjs'
 */

import { runDesignLint, formatReport } from './designLintRules.mjs'

/**
 * Browser에서 바로 실행할 수 있는 self-contained 스크립트를 생성한다.
 * javascript_tool 주입 시 이 함수의 반환값을 사용한다.
 *
 * @returns {string} 실행 가능한 JS 소스코드 문자열
 */
export function getInjectableSource() {
  // runDesignLint와 formatReport의 소스를 합쳐서 self-contained IIFE를 만든다
  return `(function() {
  ${runDesignLint.toString()}
  ${formatReport.toString()}
  const result = runDesignLint(document.body);
  return formatReport(result);
})()`
}

/**
 * CLI에서 실행 시 injectable 소스를 stdout에 출력한다.
 * 사용법: node scripts/designLint.mjs > /tmp/design-lint.js
 */
const isMainModule = typeof process !== 'undefined' && process.argv[1]?.endsWith('designLint.mjs')
if (isMainModule) {
  console.log(getInjectableSource())
}
