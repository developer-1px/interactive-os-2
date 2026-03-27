import { z } from 'zod'
import { parse as parseYaml } from 'yaml'

// ── Schema ──

const featureSchema = z.object({
  id: z.string(),
  feature: z.string(),
  screens: z.array(z.string()),
})

const linkSchema = z.object({
  label: z.string(),
  url: z.string(),
})

const storySchema = z.object({
  id: z.string(),
  story: z.string(),
  acceptance: z.string(),
  status: z.enum(['pending', 'active', 'done', 'blocked']),
  links: z.array(linkSchema).default([]),
  features: z.array(featureSchema),
})

const needSchema = z.object({
  id: z.string(),
  persona: z.string(),
  need: z.string(),
  description: z.string(),
  stories: z.array(storySchema),
})

const personaSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
})

const screenSchema = z.object({
  id: z.string(),
  name: z.string(),
})

const releaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  stories: z.array(z.string()),
})

export const storyMapSchema = z.object({
  personas: z.array(personaSchema),
  needs: z.array(needSchema),
  screens: z.array(screenSchema),
  releases: z.array(releaseSchema),
})

export type StoryMap = z.infer<typeof storyMapSchema>
export type Need = z.infer<typeof needSchema>
export type Story = z.infer<typeof storySchema>
export type Feature = z.infer<typeof featureSchema>
export type Screen = z.infer<typeof screenSchema>
export type Release = z.infer<typeof releaseSchema>

// ── Parser ──

export function parseStoryMap(raw: string): StoryMap {
  const data = parseYaml(raw)
  return storyMapSchema.parse(data)
}
