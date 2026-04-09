// A2UI v0.9 — Built-in functions (pure utility, no React)

// ---------------------------------------------------------------------------
// JSON Pointer resolution
// ---------------------------------------------------------------------------

export function resolveDataPath(model: Record<string, unknown>, path: string): unknown {
  if (!path.startsWith('/')) return undefined
  const segments = path.slice(1).split('/')
  let current: unknown = model
  for (const seg of segments) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[seg]
  }
  return current
}

// ---------------------------------------------------------------------------
// Dynamic value resolution
// ---------------------------------------------------------------------------

export function resolveDynamic(
  value: unknown,
  dataModel: Record<string, unknown>,
): unknown {
  if (value == null || typeof value !== 'object') return value

  const obj = value as Record<string, unknown>

  // {path: "/some/pointer"}
  if (typeof obj.path === 'string') {
    return resolveDataPath(dataModel, obj.path)
  }

  // {call: "functionName", args: {...}}
  if (typeof obj.call === 'string') {
    const args = (obj.args ?? {}) as Record<string, unknown>
    return resolveFunction(obj.call, args, dataModel)
  }

  return value
}

// ---------------------------------------------------------------------------
// Validation functions
// ---------------------------------------------------------------------------

function fnRequired(value: unknown): boolean {
  if (value == null) return false
  if (typeof value === 'string') return value.length > 0
  return true
}

function fnRegex(value: unknown, pattern: string): boolean {
  return new RegExp(pattern).test(String(value))
}

function fnEmail(value: unknown): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))
}

function fnLength(value: unknown, min?: number, max?: number): boolean {
  const len = typeof value === 'string' ? value.length : 0
  if (min != null && len < min) return false
  if (max != null && len > max) return false
  return true
}

function fnNumeric(value: unknown, min?: number, max?: number): boolean {
  const n = Number(value)
  if (Number.isNaN(n)) return false
  if (min != null && n < min) return false
  if (max != null && n > max) return false
  return true
}

// ---------------------------------------------------------------------------
// Logic functions
// ---------------------------------------------------------------------------

function fnAnd(values: boolean[]): boolean {
  return values.every(Boolean)
}

function fnOr(values: boolean[]): boolean {
  return values.some(Boolean)
}

function fnNot(value: boolean): boolean {
  return !value
}

// ---------------------------------------------------------------------------
// Formatting functions
// ---------------------------------------------------------------------------

function fnFormatString(
  value: string,
  dataModel: Record<string, unknown>,
): string {
  return value.replace(/\$\{(\/[^}]+)\}/g, (_, path: string) => {
    const resolved = resolveDataPath(dataModel, path)
    return resolved == null ? '' : String(resolved)
  })
}

function fnFormatNumber(
  value: unknown,
  grouping?: boolean,
  precision?: number,
): string {
  const n = Number(value)
  return new Intl.NumberFormat('en-US', {
    useGrouping: grouping ?? true,
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(n)
}

function fnFormatCurrency(value: unknown, currency?: string): string {
  const n = Number(value)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency ?? 'USD',
  }).format(n)
}

function fnFormatDate(value: unknown, format?: string): string {
  const date = new Date(value as string | number)
  if (format === 'iso') return date.toISOString()

  const options: Intl.DateTimeFormatOptions =
    format === 'date'
      ? { dateStyle: 'medium' }
      : format === 'time'
        ? { timeStyle: 'medium' }
        : { dateStyle: 'medium', timeStyle: 'short' }

  return new Intl.DateTimeFormat('en-US', options).format(date)
}

function fnPluralize(
  count: number,
  forms: { one: string; other: string },
): string {
  return count === 1 ? forms.one : forms.other
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

function fnOpenUrl(url: string): void {
  window.open(url, '_blank')
}

function fnNow(): string {
  return new Date().toISOString()
}

// ---------------------------------------------------------------------------
// Function dispatch
// ---------------------------------------------------------------------------

export function resolveFunction(
  call: string,
  args: Record<string, unknown>,
  dataModel: Record<string, unknown>,
): unknown {
  // Resolve all args that might be dynamic
  const r = (key: string) => resolveDynamic(args[key], dataModel)

  switch (call) {
    // Validation
    case 'required':
      return fnRequired(r('value'))
    case 'regex':
      return fnRegex(r('value'), String(r('pattern')))
    case 'email':
      return fnEmail(r('value'))
    case 'length':
      return fnLength(
        r('value'),
        r('min') as number | undefined,
        r('max') as number | undefined,
      )
    case 'numeric':
      return fnNumeric(
        r('value'),
        r('min') as number | undefined,
        r('max') as number | undefined,
      )

    // Logic
    case 'and':
      return fnAnd(
        (r('values') as boolean[] | undefined) ?? [],
      )
    case 'or':
      return fnOr(
        (r('values') as boolean[] | undefined) ?? [],
      )
    case 'not':
      return fnNot(r('value') as boolean)

    // Formatting
    case 'formatString':
      return fnFormatString(String(r('value')), dataModel)
    case 'formatNumber':
      return fnFormatNumber(
        r('value'),
        r('grouping') as boolean | undefined,
        r('precision') as number | undefined,
      )
    case 'formatCurrency':
      return fnFormatCurrency(r('value'), r('currency') as string | undefined)
    case 'formatDate':
      return fnFormatDate(r('value'), r('format') as string | undefined)
    case 'pluralize':
      return fnPluralize(
        r('count') as number,
        r('forms') as { one: string; other: string },
      )

    // Utility
    case 'openUrl':
      return fnOpenUrl(String(r('url')))
    case 'now':
      return fnNow()

    default:
      return undefined
  }
}

// Alias for external consumers
export const executeFunctionCall = resolveFunction
