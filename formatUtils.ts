import { readFile } from 'fs/promises'
import path from 'path'

/**
 * Convert flat folder list (one path per line) into an indented ASCII tree.
 * Example input:
 *   /\n00-Inbox\n01-Projects\n01-Projects/博士論文
 * Example output:
 *   /\n├── 00-Inbox/\n└── 01-Projects/\n    └── 博士論文/\n
 */
export function formatTree(raw: string): string {
  const lines = raw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .sort()

  if (lines.length === 0) return ''

  interface TreeNode {
    name: string
    children: Map<string, TreeNode>
  }

  const root: TreeNode = { name: '', children: new Map() }

  for (const line of lines) {
    const parts = line.split('/').filter(p => p.length > 0)
    let current = root
    for (const part of parts) {
      if (!current.children.has(part)) {
        current.children.set(part, { name: part, children: new Map() })
      }
      current = current.children.get(part)!
    }
  }

  function render(node: TreeNode, prefix: string, isLast: boolean): string {
    const entries = Array.from(node.children.entries())
    if (entries.length === 0) return ''

    let result = ''
    for (let i = 0; i < entries.length; i++) {
      const [name, child] = entries[i]
      const isLastChild = i === entries.length - 1
      const connector = isLastChild ? '└── ' : '├── '
      const childPrefix = isLast ? '    ' : '│   '

      result += prefix + connector + name + '/\n'

      if (child.children.size > 0) {
        result += render(child, prefix + childPrefix, isLastChild)
      }
    }
    return result
  }

  const hasRoot = lines.some(l => l === '/')
  const treeBody = render(root, '', true)

  if (hasRoot) {
    return '/\n' + treeBody
  }

  const topEntries = Array.from(root.children.entries())
  let result = ''
  for (let i = 0; i < topEntries.length; i++) {
    const [name, child] = topEntries[i]
    const isLast = i === topEntries.length - 1
    result += (isLast ? '└── ' : '├── ') + name + '/\n'
    result += render(child, isLast ? '    ' : '│   ', true)
  }
  return result
}

/**
 * For each file path, read the file and extract a ~200-character snippet
 * around the first case-insensitive match of query.
 */
export async function formatSearchResults(
  paths: string[],
  query: string,
  vaultPath: string
): Promise<string> {
  if (paths.length === 0) {
    return 'No results found.'
  }

  const results = await Promise.all(
    paths.map(async (filePath) => {
      try {
        const fullPath = path.join(vaultPath, filePath)
        const content = await readFile(fullPath, 'utf-8')

        // Skip YAML frontmatter
        let body = content
        if (content.startsWith('---')) {
          const endIdx = content.indexOf('---', 3)
          if (endIdx !== -1) {
            body = content.slice(endIdx + 3)
          }
        }

        // Find first match (case-insensitive)
        const lowerBody = body.toLowerCase()
        const lowerQuery = query.toLowerCase()
        const matchIdx = lowerBody.indexOf(lowerQuery)

        if (matchIdx === -1) {
          return `File: ${filePath}\n  Snippet: (match not found in content)\n`
        }

        // Extract ~200-char snippet centered on match
        const start = Math.max(0, matchIdx - 80)
        const end = Math.min(body.length, matchIdx + query.length + 120)
        let snippet = body.slice(start, end).trim()
        if (start > 0) snippet = '...' + snippet
        if (end < body.length) snippet = snippet + '...'

        // Clean up newlines in snippet
        snippet = snippet.replace(/\n+/g, ' ').trim()

        return `File: ${filePath}\n  Snippet: "${snippet}"\n`
      } catch (err) {
        return `File: ${filePath}\n  Snippet: (unreadable: ${(err as Error).message})\n`
      }
    })
  )

  return results.join('\n')
}

/**
 * Merge backlinks and links raw outputs into a single view.
 */
export function formatRelatedGraph(
  backlinksRaw: string,
  linksRaw: string
): string {
  const parseLines = (raw: string): string[] =>
    raw
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)

  const parents = parseLines(backlinksRaw)
  const children = parseLines(linksRaw)

  let result = 'Parents (backlinks):\n'
  if (parents.length === 0) {
    result += '  None\n'
  } else {
    for (const p of parents) {
      result += `  - ${p}\n`
    }
  }

  result += '\nChildren (links):\n'
  if (children.length === 0) {
    result += '  None\n'
  } else {
    for (const c of children) {
      result += `  - ${c}\n`
    }
  }

  return result
}
