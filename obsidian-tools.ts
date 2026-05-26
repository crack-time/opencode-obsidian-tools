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
import fs from "fs"
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
function findPluginPath(): string | null {
  const homeDir = os.homedir()
  const possibleDirs = [
    path.join(homeDir, ".config", "opencode", "node_modules", "@opencode-ai", "plugin"),
    path.join(homeDir, ".cache", "opencode", "node_modules", "@opencode-ai", "plugin"),
  ]
  for (const dir of possibleDirs) {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      return dir
    }
  }
  return null
}

export default async function ObsidianToolsPlugin(ctx) {
  // Resolve plugin path before import (variable avoids esbuild static analysis)
  const pluginPath = findPluginPath()
  if (!pluginPath) {
    throw new Error("Cannot find @opencode-ai/plugin. Please ensure OpenCode is installed.")
  }
  const { tool } = await import(path.join(pluginPath, "dist", "index.js"))
  
  return {
    // Register tools
    tool: {
      obsidian_read: tool({
        description: "Read a file from the Obsidian vault",
        args: {
          file: tool.schema.string().describe("Relative path to file"),
        },
        async execute(args) {
          const vaultArg = VAULT ? `--vault "${VAULT}"` : ""
          const result = await Bun.$`"${OBSIDIAN}" read file=${args.file} ${vaultArg}`.text()
          return result
        },
      }),

      obsidian_write: tool({
        description: "Create a file in the Obsidian vault",
        args: {
          name: tool.schema.string(),
          path: tool.schema.string().optional(),
          content: tool.schema.string().optional(),
        },
        async execute(args) {
          const vaultArg = VAULT ? `--vault "${VAULT}"` : ""
          if (args.content) {
            const result = await Bun.$`"${OBSIDIAN}" create name=${args.name} path=${args.path} content=${args.content} ${vaultArg}`.text()
            return result
          } else {
            const result = await Bun.$`"${OBSIDIAN}" create name=${args.name} path=${args.path} ${vaultArg}`.text()
            return result
          }
        },
      }),

      obsidian_append: tool({
        description: "Append content to a file",
        args: {
          file: tool.schema.string(),
          content: tool.schema.string(),
        },
        async execute(args) {
          const vaultArg = VAULT ? `--vault "${VAULT}"` : ""
          const result = await Bun.$`"${OBSIDIAN}" append content=${args.content} file=${args.file} ${vaultArg}`.text()
          return result
        },
      }),

      obsidian_search: tool({
        description: "Search the vault",
        args: {
          query: tool.schema.string(),
          path: tool.schema.string().optional(),
          limit: tool.schema.number().optional(),
        },
        async execute(args) {
          const vaultArg = VAULT ? `--vault "${VAULT}"` : ""
          if (args.path && args.limit) {
            const result = await Bun.$`"${OBSIDIAN}" search query=${args.query} path=${args.path} limit=${args.limit} format=json ${vaultArg}`.text()
            return result
          } else if (args.path) {
            const result = await Bun.$`"${OBSIDIAN}" search query=${args.query} path=${args.path} format=json ${vaultArg}`.text()
            return result
          } else if (args.limit) {
            const result = await Bun.$`"${OBSIDIAN}" search query=${args.query} limit=${args.limit} format=json ${vaultArg}`.text()
            return result
          } else {
            const result = await Bun.$`"${OBSIDIAN}" search query=${args.query} format=json ${vaultArg}`.text()
            return result
          }
        },
      }),

      obsidian_list: tool({
        description: "List files, folders, tags, or recents",
        args: {
          type: tool.schema.enum(["files", "folders", "tags", "recents"]),
          path: tool.schema.string().optional(),
        },
        async execute(args) {
          const vaultArg = VAULT ? `--vault "${VAULT}"` : ""
          if (args.path) {
            const result = await Bun.$`"${OBSIDIAN}" ${args.type} path=${args.path} ${vaultArg}`.text()
            return result
          } else {
            const result = await Bun.$`"${OBSIDIAN}" ${args.type} ${vaultArg}`.text()
            return result
          }
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
        async execute(args) {
          const vaultArg = VAULT ? `--vault "${VAULT}"` : ""
          if (args.action === "set" && args.value && args.type) {
            const result = await Bun.$`"${OBSIDIAN}" property:set name=${args.name} value=${args.value} type=${args.type} file=${args.file} ${vaultArg}`.text()
            return result
          } else if (args.action === "set" && args.value) {
            const result = await Bun.$`"${OBSIDIAN}" property:set name=${args.name} value=${args.value} file=${args.file} ${vaultArg}`.text()
            return result
          } else if (args.action === "remove") {
            const result = await Bun.$`"${OBSIDIAN}" property:remove name=${args.name} file=${args.file} ${vaultArg}`.text()
            return result
          } else {
            const result = await Bun.$`"${OBSIDIAN}" property:read name=${args.name} file=${args.file} ${vaultArg}`.text()
            return result
          }
        },
      }),

      obsidian_graph: tool({
        description: "Get graph information",
        args: {
          type: tool.schema.enum(["backlinks", "links", "unresolved", "orphans", "deadends"]),
          file: tool.schema.string().optional(),
        },
        async execute(args) {
          const vaultArg = VAULT ? `--vault "${VAULT}"` : ""
          if (args.file) {
            const result = await Bun.$`"${OBSIDIAN}" ${args.type} file=${args.file} ${vaultArg}`.text()
            return result
          } else {
            const result = await Bun.$`"${OBSIDIAN}" ${args.type} ${vaultArg}`.text()
            return result
          }
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