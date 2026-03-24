/**
 * RTL shim for browser test runner.
 *
 * In demo mode, render() executes normally (mounting the component to DOM)
 * then throws DemoComplete to halt the test — giving us a rendered preview
 * without running assertions or user interactions.
 */
export { cleanup, screen, act, fireEvent, waitFor } from '@testing-library/react'
export { render as rtlRender } from '@testing-library/react'

import { render as rtlRender } from '@testing-library/react'
import type { RenderResult, RenderOptions } from '@testing-library/react'

export class DemoComplete extends Error {
  name = 'DemoComplete'
}

let demoMode = false

export function setDemoMode(v: boolean) {
  demoMode = v
}

export function render(
  ui: React.ReactElement,
  options?: RenderOptions,
): RenderResult {
  const result = rtlRender(ui, options)
  if (demoMode) throw new DemoComplete()
  return result
}
