import { composePattern } from '../composePattern'

// APG Alert: role="alert" live region. No keyboard interaction.
export const alert = composePattern(
  {
    role: 'none',
    childRole: 'alert',
    ariaAttributes: () => ({}),
  },
)
