// Minimal type declarations for packages used without @types
declare module 'unified' {
  export interface Processor {
    use(plugin: unknown, ...settings: unknown[]): Processor
    process(file: unknown): Promise<unknown>
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type Plugin<T extends unknown[] = any[], U = unknown> = (...settings: T) => (tree: U) => void
}

declare module 'mdast' {
  export interface Root {
    type: 'root'
    children: Content[]
  }
  export interface Code {
    type: 'code'
    lang?: string | null
    meta?: string | null
    value: string
  }
  export type Content = Root | Code | { type: string; [key: string]: unknown }
}
