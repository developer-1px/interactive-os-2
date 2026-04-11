import { useState } from 'react'
import { DatePicker } from '../../ui/DatePicker'
import { ax } from '@styles/ax'

// APG #16: Date Picker Combobox
// https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-datepicker/
// Consumes DatePicker ui/ component — no primitives direct usage

export function DatePickerCombobox() {
  const [date, setDate] = useState<Date | null>(null)

  return (
    <div>
      <label id="dp-label" className={ax({ textStyle: 'label' })}>Date</label>
      <DatePicker
        value={date}
        onChange={setDate}
        aria-label="Date"
      />
      {date && <p className={ax({ textStyle: 'caption', text: 'muted' })}>Selected: {date.toDateString()}</p>}
    </div>
  )
}
