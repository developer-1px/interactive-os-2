var e=`export interface TreeNode {
  id: string
  name: string
  type: 'file' | 'directory'
  loc?: number
  children?: TreeNode[]
}

export async function fetchTree(root: string): Promise<TreeNode[]> {
  const res = await fetch(\`/api/fs/tree?root=\${encodeURIComponent(root)}\`)
  return res.json()
}

export async function fetchFile(path: string): Promise<string> {
  const res = await fetch(\`/api/fs/file?path=\${encodeURIComponent(path)}\`)
  return res.text()
}

export type DepCounts = Record<string, { imports: number; importedBy: number }>

export async function fetchDepCounts(root: string): Promise<DepCounts> {
  const res = await fetch(\`/api/fs/dep-counts?root=\${encodeURIComponent(root)}\`)
  return res.json()
}

export interface FolderDeps {
  dirs: string[]
  edges: { from: string; to: string }[]
}

export async function fetchFolderDeps(root: string, folder: string): Promise<FolderDeps> {
  const res = await fetch(\`/api/fs/folder-deps?root=\${encodeURIComponent(root)}&folder=\${encodeURIComponent(folder)}\`)
  return res.json()
}
`;export{e as default};