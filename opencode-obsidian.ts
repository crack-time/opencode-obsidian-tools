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

export const ObsidianPlugin: Plugin = async (ctx) => {
  const { $ } = ctx
  const vaultArg = VAULT ? `--vault "${VAULT}"` : ""
  const ObsidianSkillsDir = path.join(__dirname, "skills")

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

      obsidian_files: tool({
        description: "List files in the vault",
        args: {
          folder: tool.schema.string().optional(),
          ext: tool.schema.string().optional(),
          total: tool.schema.boolean().optional(),
        },
        execute: async ({ folder, ext, total }) => {
          return $`${OBSIDIAN} files ${flag("folder", folder)} ${flag("ext", ext)} ${total ? "total" : ""} ${vaultArg}`.text()
        },
      }),

      obsidian_folders: tool({
        description: "List folders in the vault",
        args: {
          folder: tool.schema.string().optional(),
          total: tool.schema.boolean().optional(),
        },
        execute: async ({ folder, total }) => {
          const raw = await $`${OBSIDIAN} folders ${flag("folder", folder)} ${total ? "total" : ""} ${vaultArg}`.text()
          return formatTree(raw)
        },
      }),

      obsidian_tags: tool({
        description: "List tags in the vault",
        args: {
          file: tool.schema.string().optional(),
          path: tool.schema.string().optional(),
          total: tool.schema.boolean().optional(),
          counts: tool.schema.boolean().optional(),
          sort: tool.schema.enum(["name", "count"]).optional(),
          format: tool.schema.enum(["json", "tsv", "csv"]).optional(),
          active: tool.schema.boolean().optional(),
        },
        execute: async ({ file, path: p, total, counts, sort, format, active }) => {
          return $`${OBSIDIAN} tags ${flag("file", file)} ${flag("path", p)} ${total ? "total" : ""} ${counts ? "counts" : ""} ${flag("sort", sort)} ${flag("format", format)} ${active ? "active" : ""} ${vaultArg}`.text()
        },
      }),

      obsidian_recents: tool({
        description: "List recently opened files",
        args: {
          total: tool.schema.boolean().optional(),
        },
        execute: async ({ total }) => {
          return $`${OBSIDIAN} recents ${total ? "total" : ""} ${vaultArg}`.text()
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
      config.skills = config.skills || {}
      config.skills.paths = config.skills.paths || []
      if (!config.skills.paths.includes(ObsidianSkillsDir)) {
        config.skills.paths.push(ObsidianSkillsDir)
      }
    },
  }
}
