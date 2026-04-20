/* eslint-disable react-refresh/only-export-components */
// MillerFeature — context 의존 없이 props-first.

import { Columns3 } from 'lucide-react'
import { MillerColumns } from '@os/ui/MillerColumns'
import type { NormalizedData } from '@os/store/types'
import { defineFeature } from '@os/feature/defineFeature'

function MillerView({ data, onChange }: { data: NormalizedData; onChange: (next: NormalizedData) => void }) {
  return <MillerColumns data={data} onChange={onChange} aria-label="Miller columns" />
}

export const MillerFeature = defineFeature({
  id: 'miller',
  name: 'Miller Columns',
  version: '0.1.0',
  viewMode: {
    id: 'columns',
    label: 'Columns',
    icon: <Columns3 size={14} />,
    render: MillerView,
    layout: { hidePreview: true },
  },
})
