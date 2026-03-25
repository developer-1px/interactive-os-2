import { runAll, getRegistry, type TestResult, type TestGroup } from './vitestShim'
import { setDemoMode } from './rtlShim'

export type { TestResult, TestGroup }

export type RunTestResult = {
  groups: TestGroup[]
  results: TestResult[]
}

let runCounter = 0

async function importTest(testPath: string) {
  runCounter++
  await import(/* @vite-ignore */ `/${testPath}.tsx?browser&_r=${runCounter}`)
}

/**
 * Import a test file and render only the first test's component (demo preview).
 * Stops execution after the first render() call — no assertions, no user events.
 */
export async function demoTest(testPath: string, renderTarget?: HTMLElement): Promise<RunTestResult> {
  setDemoMode(true)
  await importTest(testPath)
  const { groups } = getRegistry()
  const results = await runAll(renderTarget, { demoOnly: true })
  setDemoMode(false)
  return { groups, results }
}

/**
 * Import a test file, execute all tests, and return results.
 */
export async function runTest(testPath: string, renderTarget?: HTMLElement): Promise<RunTestResult> {
  setDemoMode(false)
  await importTest(testPath)
  const { groups } = getRegistry()
  const results = await runAll(renderTarget)
  return { groups, results }
}
