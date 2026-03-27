// ② 2026-03-27-component-creator-prd.md

import React, { Suspense, useMemo } from 'react'
import type { RegistryEntry } from './componentRegistry'
import styles from './PageComponentCreator.module.css'

interface ComponentCanvasProps {
  entry: RegistryEntry
}

/**
 * Renders a variant × size matrix of the selected component.
 * If no variants → single "default" row.
 * If no sizes → single "base" column.
 */
export function ComponentCanvas({ entry }: ComponentCanvasProps) {
  // React.lazy per entry — Suspense handles loading
  const LazyComponent = useMemo(
    () => React.lazy(async () => {
      const Component = await entry.loadComponent()
      return { default: Component }
    }),
    [entry],
  )

  return (
    <Suspense fallback={<div className={`flex-row items-center justify-center ${styles.canvasEmpty}`}>Loading...</div>}>
      <CanvasMatrix entry={entry} Component={LazyComponent} />
    </Suspense>
  )
}

interface CanvasMatrixProps {
  entry: RegistryEntry
  Component: React.ComponentType<Record<string, unknown>>
}

function CanvasMatrix({ entry, Component }: CanvasMatrixProps) {

  const variants = entry.variants.length > 0 ? entry.variants : ['default']
  const sizes = entry.sizes.length > 0 ? entry.sizes : ['base']

  return (
    <div className={`flex-col gap-xl ${styles.canvas}`}>
      {/* Header row: size labels */}
      <div className={`flex-row gap-lg items-end ${styles.matrixHeader}`}>
        <div className={styles.matrixLabel} />
        {sizes.map((size) => (
          <div key={size} className={styles.matrixColLabel}>{size}</div>
        ))}
      </div>

      {/* Variant rows */}
      {variants.map((variant) => (
        <div key={variant} className={`flex-row gap-lg items-center ${styles.matrixRow}`}>
          <div className={styles.matrixLabel}>{variant}</div>
          {sizes.map((size) => (
            <div key={`${variant}-${size}`} className={styles.matrixCell}>
              <ComponentInstance
                Component={Component}
                variant={variant === 'default' ? undefined : variant}
                size={size === 'base' ? undefined : size}
                name={entry.name}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

interface ComponentInstanceProps {
  Component: React.ComponentType<Record<string, unknown>>
  variant?: string
  size?: string
  name: string
}

/** Render a single component instance with variant + size props */
function ComponentInstance({ Component, variant, size, name }: ComponentInstanceProps) {
  // Build props based on component type
  const props: Record<string, unknown> = {}

  if (variant) props.variant = variant
  if (size) props.size = size

  // Provide sensible defaults for common props
  if (name === 'Button' || name === 'Toggle') {
    props.children = name
  }
  if (name === 'TextInput') {
    props.placeholder = 'Type here...'
  }

  return (
    <div className={styles.instanceWrap}>
      <Component {...props} />
    </div>
  )
}
