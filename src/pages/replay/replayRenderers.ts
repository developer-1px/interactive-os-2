import { ThinkingBlock } from '@os/ui/chat/ThinkingBlock'
import { ToolSummaryBlock, ToolResultBlock } from '@os/ui/chat/ToolSummaryBlock'
import type { BlockRendererMap } from '@os/ui/chat/types'

export const chatRenderers: BlockRendererMap = {
  thinking: ThinkingBlock,
  tool_summary: ToolSummaryBlock,
  tool_use: ToolSummaryBlock,
  tool_result: ToolResultBlock,
}
