/**
 * Obsidian Tools Plugin for OpenCode
 *
 * Provides integration with Obsidian vault via Obsidian CLI.
 *
 * Configuration:
 * - Set OBSIDIAN_VAULT_PATH environment variable for vault path
 * - Set OBSIDIAN_CLI_PATH environment variable for Obsidian CLI executable
 */

import { type Plugin, tool } from "@opencode-ai/plugin"
import path from "path"
import { fileURLToPath } from "url"
import {
  formatTree,
  formatSearchResults,
  formatRelatedGraph,
} from "./formatUtils.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Get configuration from environment variables
const OBSIDIAN = process.env.OBSIDIAN_CLI_PATH || "obsidian"
const VAULT = process.env.OBSIDIAN_VAULT_PATH || ""

// Helper: only produces key=value when value is truthy
const flag = (key: string, value: any) => value ? `${key}=${value}` : ""

export const ObsidianToolsPlugin: Plugin = async (ctx) => {
  const { $ } = ctx

  const vaultArg = VAULT ? `--vault "${VAULT}"` : ""

  return {
    // Register tools
    tool: {
      obsidian_search: tool({
        description: "Search the vault",
        args: {
          query: tool.schema.string(),
          path: tool.schema.string().optional(),
          limit: tool.schema.number().optional(),
        },
        execute: async ({ query, path: p, limit }) => {
          const raw = await $`${OBSIDIAN} search query=${query} ${flag("path", p)} ${flag("limit", limit)} format=json ${vaultArg}`.text()
          const paths = JSON.parse(raw) as string[]
          return await formatSearchResults(paths, query, VAULT)
        },
      }),

      obsidian_list: tool({
        description: "List files, folders, tags, or recents",
        args: {
          type: tool.schema.enum(["files", "folders", "tags", "recents"]),
          path: tool.schema.string().optional(),
        },
        execute: async ({ type, path: p }) => {
          const raw = await $`${OBSIDIAN} ${type} ${flag("path", p)} ${vaultArg}`.text()
          if (type === "folders") {
            return formatTree(raw)
          }
          return raw
        },
      }),

      obsidian_property: tool({
        description: "Manage frontmatter properties",
        args: {
          action: tool.schema.enum(["read", "set", "remove"]),
          name: tool.schema.string(),
          file: tool.schema.string(),
          value: tool.schema.string().optional(),
          type: tool.schema.enum(["text", "list", "number", "date", "checkbox"]).optional(),
        },
        execute: ({ action, name, file, value, type }) => {
          const cmd = `property:${action}`
          return $`${OBSIDIAN} ${cmd} name=${name} ${flag("value", value)} ${flag("type", type)} file=${file} ${vaultArg}`.text()
        },
      }),

      obsidian_graph: tool({
        description: "Get graph information",
        args: {
          type: tool.schema.enum(["backlinks", "links", "unresolved", "orphans", "deadends", "related"]),
          file: tool.schema.string().optional(),
        },
        execute: async ({ type, file }) => {
          if (type === "related") {
            if (!file) {
              return 'Error: "file" is required when type="related"'
            }
            const [backlinksRaw, linksRaw] = await Promise.all([
              $`${OBSIDIAN} backlinks ${flag("file", file)} ${vaultArg}`.text(),
              $`${OBSIDIAN} links ${flag("file", file)} ${vaultArg}`.text(),
            ])
            return formatRelatedGraph(backlinksRaw, linksRaw)
          }
          return $`${OBSIDIAN} ${type} ${flag("file", file)} ${vaultArg}`.text()
        },
      }),
    },

    // Register skills path
    config: async (config) => {
      const skillsDir = path.join(__dirname, "skills")
      config.skills = config.skills || {}
      config.skills.paths = config.skills.paths || []
      if (!config.skills.paths.includes(skillsDir)) {
        config.skills.paths.push(skillsDir)
      }
    },
  }
}
