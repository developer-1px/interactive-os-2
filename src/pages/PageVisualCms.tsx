import './PageVisualCms.css'
import { cmsStore } from './cms-store'
import CmsCanvas from './cms/CmsCanvas'
import { useEngine } from '../interactive-os/hooks/useEngine'
import { history } from '../interactive-os/plugins/history'
import type { Plugin } from '../interactive-os/core/types'

const plugins: Plugin[] = [history()]

export default function PageVisualCms() {
  const { engine, store } = useEngine({ data: cmsStore, plugins })

  return <CmsCanvas engine={engine} store={store} locale="ko" />
}
