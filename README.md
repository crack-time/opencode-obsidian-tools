# OpenCode Obsidian Tools

An OpenCode plugin that provides integration with Obsidian vault via the Obsidian CLI.

## Features

- **Read files** from your Obsidian vault
- **Create/Write** new notes
- **Append** content to existing notes
- **Search** vault contents with full-text search
- **List** files, folders, tags, and recent files
- **Manage** frontmatter properties
- **Query** graph information (backlinks, links, orphans, etc.)

## Installation

### Install from GitHub

Add to your `opencode.json`:

```json
{
  "plugin": [
    "opencode-obsidian-tools@git+https://github.com/crack-time/opencode-obsidian-tools.git"
  ]
}
```

Then restart OpenCode.

## Configuration

Set the following environment variables in your shell or system:

| Variable | Description | Example |
|----------|-------------|---------|
| `OBSIDIAN_CLI_PATH` | Path to Obsidian CLI executable | `/mnt/c/Users/username/AppData/Local/Programs/Obsidian/Obsidian.exe` |
| `OBSIDIAN_VAULT_PATH` | Path to your Obsidian vault | `/mnt/d/Desktop/MyVault` |

### WSL Example

For WSL users with Obsidian on Windows:

```bash
export OBSIDIAN_CLI_PATH="/mnt/c/Users/username/AppData/Local/Programs/Obsidian/Obsidian.exe"
export OBSIDIAN_VAULT_PATH="/mnt/d/Desktop/MyVault"
```

Add these to your `~/.bashrc` or `~/.zshrc` to make them persistent.

### macOS Example

```bash
export OBSIDIAN_CLI_PATH="/Applications/Obsidian.app/Contents/MacOS/Obsidian"
export OBSIDIAN_VAULT_PATH="/Users/username/Documents/ObsidianVault"
```

## Available Tools

After installation, the following tools will be available to OpenCode:

| Tool | Description |
|------|-------------|
| `obsidian_read` | Read a file from the vault |
| `obsidian_write` | Create a new file |
| `obsidian_append` | Append content to an existing file |
| `obsidian_search` | Full-text search the vault |
| `obsidian_list` | List files, folders, tags, or recents |
| `obsidian_property` | Read/set/remove frontmatter properties |
| `obsidian_graph` | Get backlinks, links, orphans, deadends |

## Usage Examples

Once configured, you can use natural language to interact with your vault:

> "Search for notes about machine learning"
> "Create a new note called 'Ideas' in my inbox"
> "Read the project overview file"
> "List all tags in my vault"

## Prerequisites

- [OpenCode](https://opencode.ai/) installed
- [Obsidian](https://obsidian.md/) with CLI enabled
- Obsidian vault configured

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.