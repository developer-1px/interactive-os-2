/* eslint-disable react-refresh/only-export-components -- 사이드이펙트 전용 register 모듈: defineFileRenderer 호출 */
import { useMemo } from 'react'
import { Info } from 'lucide-react'
import { defineFileRenderer, type FileRenderProps } from '@os/ui/fileRenderers'
import { MarkdownPreview, parseFrontmatter } from '@os/ui/MarkdownPreview'
import { FrontmatterCard } from '@os/ui/FrontmatterCard'
import { Popover } from '@os/ui/Popover'
import { Button } from '@os/ui/Button'
import { ax } from '@styles/ax'
import { showcaseMdConfig } from './mdConfig'

function MdRenderer({ content }: FileRenderProps) {
  const { data } = useMemo(() => parseFrontmatter(content), [content])
  const hasFrontmatter = Object.keys(data).length > 0

  return (
    <div className={ax({ placement: 'relative' })}>
      {hasFrontmatter && (
        <div className={ax({ placement: 'top-end' })}>
          <Popover content={<FrontmatterCard data={data} />} placement="bottom">
            <Button variant="ghost" icon aria-label="File properties">
              <Info size={16} />
            </Button>
          </Popover>
        </div>
      )}
      <MarkdownPreview
        content={content}
        config={showcaseMdConfig}
        className="markdown-file"
        showFrontmatter={false}
      />
    </div>
  )
}

defineFileRenderer(['md'], {
  source: 'text',
  render: (props) => <MdRenderer {...props} />,
})
