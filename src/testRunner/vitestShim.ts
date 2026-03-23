import { cleanup } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TestResult = {
  group: string[]
  name: string
  status: 'pass' | 'fail'
  error?: string
  duration: number
}

export type TestGroup = {
  name: string
  tests: { name: string }[]
  children: TestGroup[]
}

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

type Hook = () => void | Promise<void>

type DescribeScope = {
  name: string
  beforeEachHooks: Hook[]
  afterEachHooks: Hook[]
  tests: RegisteredTest[]
  children: DescribeScope[]
}

type RegisteredTest = {
  groupPath: string[]
  name: string
  fn: () => void | Promise<void>
  beforeEachChain: Hook[]
  afterEachChain: Hook[]
}

let rootScope: DescribeScope = createScope('root')
let scopeStack: DescribeScope[] = [rootScope]

function createScope(name: string): DescribeScope {
  return {
    name,
    beforeEachHooks: [],
    afterEachHooks: [],
    tests: [],
    children: [],
  }
}

function currentScope(): DescribeScope {
  return scopeStack[scopeStack.length - 1]
}

function currentGroupPath(): string[] {
  // skip the implicit root
  return scopeStack.slice(1).map((s) => s.name)
}

function collectBeforeEachChain(): Hook[] {
  // hooks from outermost → innermost scope
  return scopeStack.slice(1).flatMap((s) => s.beforeEachHooks)
}

function collectAfterEachChain(): Hook[] {
  // hooks from innermost → outermost scope
  return scopeStack
    .slice(1)
    .flatMap((s) => s.afterEachHooks)
    .reverse()
}

// ---------------------------------------------------------------------------
// describe
// ---------------------------------------------------------------------------

export function describe(name: string, fn: () => void): void {
  const scope = createScope(name)
  currentScope().children.push(scope)
  scopeStack.push(scope)
  try {
    fn()
  } finally {
    scopeStack.pop()
  }
}

// ---------------------------------------------------------------------------
// it
// ---------------------------------------------------------------------------

export function it(name: string, fn: () => void | Promise<void>): void {
  const test: RegisteredTest = {
    groupPath: currentGroupPath(),
    name,
    fn,
    beforeEachChain: collectBeforeEachChain(),
    afterEachChain: collectAfterEachChain(),
  }
  currentScope().tests.push(test)
}

// ---------------------------------------------------------------------------
// beforeEach / afterEach
// ---------------------------------------------------------------------------

export function beforeEach(fn: Hook): void {
  currentScope().beforeEachHooks.push(fn)
}

export function afterEach(fn: Hook): void {
  currentScope().afterEachHooks.push(fn)
}

// ---------------------------------------------------------------------------
// expect
// ---------------------------------------------------------------------------

function formatValue(v: unknown): string {
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  if (typeof v === 'string') return JSON.stringify(v)
  return String(v)
}

export function expect(actual: unknown) {
  return {
    toBe(expected: unknown) {
      if (!Object.is(actual, expected)) {
        throw new Error(
          `Expected ${formatValue(expected)} but received ${formatValue(actual)}`,
        )
      }
    },

    toBeTruthy() {
      if (!actual) {
        throw new Error(
          `Expected value to be truthy but received ${formatValue(actual)}`,
        )
      }
    },

    toBeFalsy() {
      if (actual) {
        throw new Error(
          `Expected value to be falsy but received ${formatValue(actual)}`,
        )
      }
    },

    toBeNull() {
      if (actual !== null) {
        throw new Error(
          `Expected null but received ${formatValue(actual)}`,
        )
      }
    },

    toBeInstanceOf(cls: new (...args: unknown[]) => unknown) {
      if (!(actual instanceof cls)) {
        throw new Error(
          `Expected instance of ${cls.name} but received ${formatValue(actual)}`,
        )
      }
    },

    toHaveAttribute(attr: string, value?: string) {
      const el = actual as Element
      if (typeof el?.getAttribute !== 'function') {
        throw new Error('Expected a DOM element with getAttribute')
      }
      const attrValue = el.getAttribute(attr)
      if (attrValue === null) {
        throw new Error(
          `Expected element to have attribute "${attr}" but it was not found`,
        )
      }
      if (value !== undefined && attrValue !== value) {
        throw new Error(
          `Expected attribute "${attr}" to be ${formatValue(value)} but received ${formatValue(attrValue)}`,
        )
      }
    },
  }
}

// ---------------------------------------------------------------------------
// vi
// ---------------------------------------------------------------------------

function noop() {}

export const vi = {
  fn(): (...args: unknown[]) => unknown {
    return noop
  },

  mock(..._args: unknown[]): void {
    console.warn('vi.mock() is a noop in browser shim')
  },

  spyOn(..._args: unknown[]) {
    return {
      mockImplementation: noop,
      mockReturnValue: noop,
    }
  },
}

// ---------------------------------------------------------------------------
// Internal helpers — collect all tests from tree
// ---------------------------------------------------------------------------

function collectTests(scope: DescribeScope): RegisteredTest[] {
  const tests: RegisteredTest[] = [...scope.tests]
  for (const child of scope.children) {
    tests.push(...collectTests(child))
  }
  return tests
}

// ---------------------------------------------------------------------------
// runAll
// ---------------------------------------------------------------------------

export async function runAll(renderTarget?: HTMLElement): Promise<TestResult[]> {
  const allTests = collectTests(rootScope)
  const results: TestResult[] = []

  // Redirect render() output to renderTarget if provided
  const originalAppendChild = document.body.appendChild.bind(document.body)
  if (renderTarget) {
    document.body.appendChild = <T extends Node>(node: T): T => {
      return renderTarget.appendChild(node)
    }
  }

  for (const test of allTests) {
    // cleanup DOM before each test
    cleanup()
    if (renderTarget) renderTarget.innerHTML = ''

    // run beforeEach hooks (outermost → innermost)
    for (const hook of test.beforeEachChain) {
      await hook()
    }

    const start = performance.now()
    let status: 'pass' | 'fail' = 'pass'
    let error: string | undefined

    try {
      await test.fn()
    } catch (e) {
      status = 'fail'
      error = e instanceof Error ? e.message : String(e)
    }

    const duration = performance.now() - start

    // run afterEach hooks (innermost → outermost)
    for (const hook of test.afterEachChain) {
      try {
        await hook()
      } catch {
        // afterEach errors don't override the test result
      }
    }

    results.push({
      group: test.groupPath,
      name: test.name,
      status,
      error,
      duration,
    })
  }

  // Restore original appendChild
  if (renderTarget) {
    document.body.appendChild = originalAppendChild
  }

  // reset registry for next runAll call
  rootScope = createScope('root')
  scopeStack = [rootScope]

  return results
}

// ---------------------------------------------------------------------------
// getRegistry
// ---------------------------------------------------------------------------

function scopeToGroup(scope: DescribeScope): TestGroup {
  return {
    name: scope.name,
    tests: scope.tests.map((t) => ({ name: t.name })),
    children: scope.children.map(scopeToGroup),
  }
}

export function getRegistry(): { groups: TestGroup[] } {
  return {
    groups: rootScope.children.map(scopeToGroup),
  }
}
