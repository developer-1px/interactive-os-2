import React from 'react'

import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { listbox } from '../pattern/roles/listbox'
import { form as formPlugin } from '../plugins/form'
import type { FormOptions } from '../plugins/form'
import { getFieldErrors } from '../plugins/form'
import { rename } from '../plugins/rename'
import { edit } from '../plugins/edit'
import styles from './Form.module.css'

interface FormProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  entityRules: FormOptions['entityRules']
  renderField?: (
    props: React.HTMLAttributes<HTMLElement>,
    item: Record<string, unknown>,
    state: NodeState,
    errors: Record<string, string> | undefined,
  ) => React.ReactElement
  'aria-label'?: string
}

const defaultRenderField = (
  props: React.HTMLAttributes<HTMLElement>,
  item: Record<string, unknown>,
  _state: NodeState,
  errors: Record<string, string> | undefined,
): React.ReactElement => {
  const data = item.data as Record<string, unknown> | undefined
  const label = (data?.label as string) ?? item.id
  const value = (data?.value as string) ?? ''
  const fieldError = errors?.value

  return (
    <div {...props} className={styles.field}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>
        <Aria.Editable field="value" placeholder="Enter value...">
          {value}
        </Aria.Editable>
      </span>
      {fieldError && <span className={styles.error} role="alert">{fieldError}</span>}
    </div>
  )
}

const EMPTY_PLUGINS: Plugin[] = []

export function Form({
  data,
  plugins = EMPTY_PLUGINS,
  onChange,
  entityRules,
  renderField = defaultRenderField,
  'aria-label': ariaLabel,
}: FormProps) {
  const pattern = React.useMemo(() => listbox(), [])

  const mergedPlugins = React.useMemo(
    () => [
      ...plugins,
      rename(),
      edit(),
      formPlugin({ entityRules }),
    ],
    [plugins, entityRules],
  )

  const storeRef = React.useRef(data)
  storeRef.current = data

  const handleChange = React.useCallback((next: NormalizedData) => {
    storeRef.current = next
    onChange?.(next)
  }, [onChange])

  const renderWithErrors = React.useCallback(
    (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState) => {
      const store = storeRef.current
      const errors = getFieldErrors(store, item.id as string)
      return renderField(props, item, state, errors)
    },
    [renderField],
  )

  return (
    <Aria
      pattern={pattern}
      data={data}
      plugins={mergedPlugins}
      onChange={handleChange}
      aria-label={ariaLabel}
    >
      <Aria.Item render={renderWithErrors} />
    </Aria>
  )
}
