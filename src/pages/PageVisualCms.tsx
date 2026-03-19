import { useState } from 'react'
import './PageVisualCms.css'
import type { NormalizedData } from '../interactive-os/core/types'
import { cmsStore } from './cms-store'
import CmsCanvas from './cms/CmsCanvas'

export default function PageVisualCms() {
  const [data, setData] = useState<NormalizedData>(cmsStore)

  return <CmsCanvas data={data} onDataChange={setData} locale="ko" />
}
