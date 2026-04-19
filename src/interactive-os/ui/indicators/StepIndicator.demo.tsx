/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { StepIndicator } from './StepIndicator'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'step-indicator',
  category: 'indicator' as const,
  label: 'StepIndicator',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'bar' })}>
      <StepIndicator step={1} />
      <StepIndicator step={2} />
      <StepIndicator step={3} completed />
    </div>
  )
}
