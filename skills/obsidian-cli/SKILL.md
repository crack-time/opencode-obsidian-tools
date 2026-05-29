---
name: obsidian-cli
description: Guidelines for using Obsidian vault tools. Use when: (1) Need to search vault contents by full-text query, (2) Need to operate on frontmatter properties, (3) Need to inspect backlinks, orphans, or file lists.
---

# Obsidian Vault Usage

## Workflow (Must Follow)

When any task involves the vault, follow this order:

### Step 1 — Understand the Landscape (Graph-First)

Use `obsidian_graph type=links` recursively from a root entry to map the vault structure **before** touching any content.

```
obsidian_graph type=links file=<root>
# → get children

obsidian_graph type=links file=<child-1>
obsidian_graph type=links file=<child-2>
# → continue until no more links
```

This reveals the full knowledge tree: projects, areas, resources, and how they interconnect. **Do not** read files at this stage.

### Step 2 — Search for Relevance

Once you understand the structure, use `obsidian_search` to find where a concept lives:

```
obsidian_search query=<keyword>
# → array of matching file paths
```

**When searching LaTeX math expressions**, copy the exact character sequence as it appears in the source Markdown — including all `^`, `_`, `{`, `}`, `\`, and `*` symbols. Obsidian's full-text index stores these as literal text. Use the smallest unique substring (e.g. `D^0_{ij}`) rather than a full equation. If uncertain about the exact spelling, `read` the file first and copy the fragment directly into the query.

### Step 3 — Read Only What Matters

Now, and only now, use `read` on the files found in Steps 1–2.

---

## Tool Reference

| Tool | Purpose | When |
|------|--------|------|
| `obsidian_graph type=links` | Forward links — "what does this point to?" | Step 1: structure |
| `obsidian_graph type=backlinks` | Reverse links — "who points to this?" | Step 3: context |
| `obsidian_search` | Full-text search across vault | Step 2: locate |
| `read` | Read file content (standard file tool) | Step 3: after locating |
| `obsidian_files` | List files in the vault | Optional: browse files |
| `obsidian_folders` | List folders in the vault | Optional: browse folders |
| `obsidian_tags` | List tags in the vault | Optional: browse tags |
| `obsidian_recents` | List recently opened files | Optional: browse recent files |

## Notes

- Use `path` and `limit` with `obsidian_search` to narrow scope in large vaults.
- `obsidian_search` uses Obsidian's full-text index — faster than filesystem search and excludes non-note attachments.
