export interface TreeNode {
  id: string
  name: string
  type: 'file' | 'directory'
  children?: TreeNode[]
}

export async function fetchTree(root: string): Promise<TreeNode[]> {
  const res = await fetch(`/api/fs/tree?root=${encodeURIComponent(root)}`)
  return res.json()
}

export async function fetchFile(path: string): Promise<string> {
  const res = await fetch(`/api/fs/file?path=${encodeURIComponent(path)}`)
  return res.text()
}
