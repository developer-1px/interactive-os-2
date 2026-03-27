// ② 2026-03-27-component-creator-prd.md

/**
 * Parse a 3-block recipe module.css string into ComponentMeta.
 *
 * Block 1 (base): .root — declares shape/type/motion bundles + --_bg/--_fg references
 * Block 2 (variant): classes that declare --_bg or --_fg scoped properties
 * Block 3 (size): classes that override --shape-*-radius or --shape-*-py
 */

export interface ComponentMeta {
  name: string
  base: string
  variants: string[]
  sizes: string[]
  tokens: {
    shape: string | null
    type: string | null
    motion: string | null
  }
}

// Match top-level class selectors: .name { ... }
// Skips pseudo-selectors, attribute selectors, nested selectors
const CLASS_BLOCK_RE = /^\.([a-zA-Z][\w-]*)\s*\{([^}]*)\}/gm

// Token level extractors
const SHAPE_LEVEL_RE = /--shape-(\w+)-radius/
const TYPE_LEVEL_RE = /--type-(\w+)-size/
const MOTION_LEVEL_RE = /--motion-(\w+)-duration/

// Block 2 identifier: declares --_bg or --_fg
const VARIANT_RE = /--_bg\s*:|--_fg\s*:/

// Block 3 identifier: overrides shape bundle
const SIZE_RE = /--shape-\w+-(?:radius|py)/

export function parseComponentCSS(css: string, name: string): ComponentMeta {
  const meta: ComponentMeta = {
    name,
    base: 'root',
    variants: [],
    sizes: [],
    tokens: { shape: null, type: null, motion: null },
  }

  let match: RegExpExecArray | null
  const regex = new RegExp(CLASS_BLOCK_RE.source, CLASS_BLOCK_RE.flags)

  while ((match = regex.exec(css)) !== null) {
    const className = match[1]
    const body = match[2]

    if (className === 'root' || (meta.variants.length === 0 && meta.sizes.length === 0 && !VARIANT_RE.test(body) && !SIZE_RE.test(body))) {
      // Block 1: base — extract token levels
      if (className === 'root') meta.base = 'root'

      const shapeMatch = body.match(SHAPE_LEVEL_RE)
      if (shapeMatch) meta.tokens.shape = shapeMatch[1]

      const typeMatch = body.match(TYPE_LEVEL_RE)
      if (typeMatch) meta.tokens.type = typeMatch[1]

      const motionMatch = body.match(MOTION_LEVEL_RE)
      if (motionMatch) meta.tokens.motion = motionMatch[1]
    } else if (VARIANT_RE.test(body)) {
      // Block 2: variant — declares --_bg or --_fg
      meta.variants.push(className)
    } else if (SIZE_RE.test(body)) {
      // Block 3: size — overrides shape bundle
      meta.sizes.push(className)
    }
  }

  return meta
}
