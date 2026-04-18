var e=`// ② 2026-04-04-command-binding-registry-prd.md
import { useEffect, useCallback, useRef } from 'react'
import { registerBinding, unregisterBinding, type BindingEntry } from './bindingRegistry'

interface UseCommandOptions {
  input: string
  nodeId?: string | null
}

/**
 * Create a named command handler that registers in the binding registry.
 * Returns a stable callback suitable for onClick, onDoubleClick, etc.
 */
export function useCommand(
  command: string,
  handler: () => void,
  options: UseCommandOptions,
): () => void {
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    const entry: BindingEntry = { command, nodeId: options.nodeId ?? null, input: options.input }
    registerBinding(entry)
    return () => unregisterBinding(entry)
  }, [command, options.nodeId, options.input])

  return useCallback(() => {
    handlerRef.current()
  }, [])
}
`;export{e as default};