import { describe, it, expect } from 'vitest'
import { nodeSchemas, childRules } from '../pages/writer/writerSchema'

describe('writerSchema', () => {
  it('defines document, heading, paragraph node types', () => {
    expect(nodeSchemas.document).toBeDefined()
    expect(nodeSchemas.heading).toBeDefined()
    expect(nodeSchemas.paragraph).toBeDefined()
  })

  it('heading validates level 1-6 and content string', () => {
    const valid = nodeSchemas.heading.safeParse({ type: 'heading', level: 2, content: 'Hello' })
    expect(valid.success).toBe(true)

    const invalid = nodeSchemas.heading.safeParse({ type: 'heading', level: 7, content: 'Hello' })
    expect(invalid.success).toBe(false)
  })

  it('paragraph validates content string', () => {
    const valid = nodeSchemas.paragraph.safeParse({ type: 'paragraph', content: 'Some text' })
    expect(valid.success).toBe(true)
  })

  it('childRules allows heading and paragraph under document', () => {
    const headingData = { type: 'heading', level: 1, content: 'Title' }
    const paragraphData = { type: 'paragraph', content: 'Text' }
    expect(childRules.document.safeParse([headingData, paragraphData]).success).toBe(true)
  })
})
