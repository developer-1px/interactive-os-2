/**
 * A2UI v0.9 Validation — checks support for input components
 *
 * Input components (TextField, CheckBox, Slider, ChoicePicker, DateTimeInput, Button)
 * can have a `checks` array of FunctionCall objects.
 * Each check returns boolean; if any returns false, the component shows an error.
 * Button checks: all must pass for the button to be enabled.
 */
import { resolveFunction } from './a2uiFunctions'

export interface A2UICheck {
  call: string
  args: Record<string, unknown>
  returnType?: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/** Run all checks against a value, return validation result */
export function runChecks(
  checks: A2UICheck[] | undefined,
  value: unknown,
  dataModel: Record<string, unknown> = {},
): ValidationResult {
  if (!checks || checks.length === 0) return { valid: true, errors: [] }

  const errors: string[] = []
  for (const check of checks) {
    const args = { ...check.args, value }
    const result = resolveFunction(check.call, args, dataModel)
    if (result === false) {
      errors.push(`${check.call} check failed`)
    }
  }

  return { valid: errors.length === 0, errors }
}

/** Check if all checks pass (for Button enabled state) */
export function allChecksPassed(
  checks: A2UICheck[] | undefined,
  dataModel: Record<string, unknown> = {},
): boolean {
  if (!checks || checks.length === 0) return true
  return runChecks(checks, undefined, dataModel).valid
}
