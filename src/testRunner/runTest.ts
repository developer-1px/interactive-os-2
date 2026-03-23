import { runAll, getRegistry, type TestResult, type TestGroup } from './vitestShim'

export type { TestResult, TestGroup }

export type RunTestResult = {
  groups: TestGroup[]
  results: TestResult[]
}

let runCounter = 0

/**
 * Dynamically import a test file with ?browser query (triggers Vite plugin
 * to replace vitest imports with browser shims), then execute all registered
 * tests and return results.
 *
 * @param testPath — path relative to project root, e.g.
 *   'src/interactive-os/__tests__/listbox-keyboard.integration.test'
 */
export async function runTest(testPath: string): Promise<RunTestResult> {
  // Cache-bust so re-imports re-execute the module's top-level describe() calls
  runCounter++
  await import(/* @vite-ignore */ `/${testPath}.tsx?browser&_r=${runCounter}`)

  const { groups } = getRegistry()
  const results = await runAll()

  return { groups, results }
}
