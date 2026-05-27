/**
 * Obsidian Tools Plugin for OpenCode
 * 
 * Provides integration with Obsidian vault via Obsidian CLI.
 * 
 * Configuration:
 * - Set OBSIDIAN_VAULT_PATH environment variable for vault path
 * - Set OBSIDIAN_CLI_PATH environment variable for Obsidian CLI executable
 */

import path from "path"
import os from "os"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Get configuration from environment variables
const OBSIDIAN = process.env.OBSIDIAN_CLI_PATH || "obsidian"
const VAULT = process.env.OBSIDIAN_VAULT_PATH || ""

/**
 * Find @opencode-ai/plugin module by checking known OpenCode installation paths.
 * Returns the absolute path to the module directory (containing package.json).
 * Uses variable-based import so esbuild won't statically resolve it.
 */
function findPluginPath(): string {
  const homeDir = os.homedir()
  return path.join(homeDir, ".config", "opencode", "node_modules", "@opencode-ai", "plugin")
}

// Helper: only produces key=value when value is truthy
const flag = (key: string, value: any) => value ? `${key}=${value}` : ""

export default async function ObsidianToolsPlugin(ctx) {
  // Resolve plugin path before import (variable avoids esbuild static analysis)
  const pluginPath = findPluginPath()
  const { tool } = await import(path.join(pluginPath, "dist", "index.js"))

  const vaultArg = VAULT ? `--vault "${VAULT}"` : ""

  return {
    // Register tools
    tool: {
      obsidian_read: tool({
        description: "Read a file from the Obsidian vault",
        args: {
          file: tool.schema.string().describe("Relative path to file"),
        },
        execute: ({ file }) =>
          Bun.$`"${OBSIDIAN}" read file=${file} ${vaultArg}`.text(),
      }),

      obsidian_write: tool({
        description: "Create a file in the Obsidian vault",
        args: {
          name: tool.schema.string(),
          path: tool.schema.string().optional(),
          content: tool.schema.string().optional(),
        },
        execute: ({ name, path: p, content }) =>
          Bun.$`"${OBSIDIAN}" create name=${name} ${flag("path", p)} ${flag("content", content)} ${vaultArg}`.text(),
      }),

      obsidian_append: tool({
        description: "Append content to a file",
        args: {
          file: tool.schema.string(),
          content: tool.schema.string(),
        },
        execute: ({ file, content }) =>
          Bun.$`"${OBSIDIAN}" append content=${content} file=${file} ${vaultArg}`.text(),
      }),

      obsidian_search: tool({
        description: "Search the vault",
        args: {
          query: tool.schema.string(),
          path: tool.schema.string().optional(),
          limit: tool.schema.number().optional(),
        },
        execute: ({ query, path: p, limit }) =>
          Bun.$`"${OBSIDIAN}" search query=${query} ${flag("path", p)} ${flag("limit", limit)} format=json ${vaultArg}`.text(),
      }),

      obsidian_list: tool({
        description: "List files, folders, tags, or recents",
        args: {
          type: tool.schema.enum(["files", "folders", "tags", "recents"]),
          path: tool.schema.string().optional(),
        },
        execute: ({ type, path: p }) =>
          Bun.$`"${OBSIDIAN}" ${type} ${flag("path", p)} ${vaultArg}`.text(),
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
          return Bun.$`"${OBSIDIAN}" ${cmd} name=${name} ${flag("value", value)} ${flag("type", type)} file=${file} ${vaultArg}`.text()
        },
      }),

      obsidian_graph: tool({
        description: "Get graph information",
        args: {
          type: tool.schema.enum(["backlinks", "links", "unresolved", "orphans", "deadends"]),
          file: tool.schema.string().optional(),
        },
        execute: ({ type, file }) =>
          Bun.$`"${OBSIDIAN}" ${type} ${flag("file", file)} ${vaultArg}`.text(),
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
