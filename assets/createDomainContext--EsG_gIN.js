var e=`import { createContext, useContext } from 'react'
import type { Provider } from 'react'

/**
 * FlatLayout widget용 도메인 context를 선언적으로 생성한다.
 *
 * @example
 * export const [CmsProvider, useCms] = createDomainContext<CmsContextValue>('Cms')
 */
export function createDomainContext<T>(name: string): [Provider<T>, () => T] {
  const Ctx = createContext<T | null>(null)

  function useValue(): T {
    const ctx = useContext(Ctx)
    if (!ctx) throw new Error(\`use\${name} must be used inside \${name}Provider\`)
    return ctx
  }

  return [Ctx.Provider as unknown as Provider<T>, useValue]
}
`;export{e as default};