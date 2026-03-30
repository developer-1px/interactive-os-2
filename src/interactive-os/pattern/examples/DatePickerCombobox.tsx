import { useState } from 'react'
import { DatePicker } from '../../ui/DatePicker'

// APG #16: Date Picker Combobox
// https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-datepicker/
// Consumes DatePicker ui/ component — no primitives direct usage

export function DatePickerCombobox() {
  const [date, setDate] = useState<Date | null>(null)

  return (
    <div>
      <label id="dp-label" style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: 'var(--type-body-size)', fontWeight: 'var(--type-label-weight)' }}>Date</label>
      <DatePicker
        value={date}
        onChange={setDate}
        aria-label="Date"
      />
      {date && <p style={{ marginTop: 'var(--space-sm)', fontSize: 'var(--type-caption-size)', color: 'var(--text-muted)' }}>Selected: {date.toDateString()}</p>}
    </div>
  )
}
