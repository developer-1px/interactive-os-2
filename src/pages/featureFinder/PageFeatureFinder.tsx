// defineFeature 실증 페이지. FinderApp(깡통 + FsFeature + MillerFeature + BookFeature)을 실제 렌더.

import { BaselineFinderApp } from '../../baselines/finder/BaselineFinderApp'
import { FinderApp } from '../../baselines/finder/FinderApp'

export default function PageFeatureFinder() {
  return <BaselineFinderApp app={FinderApp} />
}
