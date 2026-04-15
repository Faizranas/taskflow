# MCP Server Setup — Web Quality Preflight

This project uses an MCP (Model Context Protocol) server for running web quality reports (security, performance, accessibility, SEO, code quality) with Lighthouse integration.

## Prerequisites

- **Node.js** v18+ (via NVM or direct install)
- **Google Chrome** installed
- **MCP preflight tool** built locally — see [code-quality-mcp repo](../../../code-quality-mcp/)

## Setup

Create a `.mcp.json` file at the project root. Pick the config that matches your Node setup:

### Option A: Direct Node Install (no NVM) — Simpler

If you installed Node directly (via installer, Homebrew, or apt), `node` and `npm` are already in your system PATH. No extra PATH config needed.

```json
{
  "mcpServers": {
    "web-quality": {
      "command": "node",
      "args": ["<FULL_PATH_TO_PREFLIGHT_INDEX_JS>"],
      "transport": "stdio",
      "env": {
        "CHROME_PATH": "<FULL_PATH_TO_CHROME_BINARY>"
      }
    }
  }
}
```

### Option B: NVM Users — Extra Config Required

NVM dynamically sets the node path only in your shell session. MCP child processes don't inherit this, so you must provide the full node path and explicitly set PATH.

```json
{
  "mcpServers": {
    "web-quality": {
      "command": "<FULL_PATH_TO_NVM_NODE_BINARY>",
      "args": ["<FULL_PATH_TO_PREFLIGHT_INDEX_JS>"],
      "transport": "stdio",
      "env": {
        "CHROME_PATH": "<FULL_PATH_TO_CHROME_BINARY>",
        "PATH": "<NVM_NODE_BIN_DIRECTORY>:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
      }
    }
  }
}
```

**Why NVM needs extra config:** The MCP server spawns child processes (e.g., `npm run build`, `npm audit`) that need `node` and `npm`. With a direct install these live in `/usr/local/bin` which every process can find. With NVM, they live in a version-specific directory (e.g., `~/.nvm/versions/node/v20.x/bin/`) that only your shell knows about.

## How to Find Your Paths

### Node Binary

| Setup | Command | Example Output |
|-------|---------|----------------|
| NVM (Mac/Linux) | `nvm which current` | `/Users/you/.nvm/versions/node/v20.20.2/bin/node` |
| Direct install (Mac/Linux) | `which node` | `/usr/local/bin/node` |
| Windows | `where node` | `C:\Program Files\nodejs\node.exe` |

### Chrome Binary

| OS | Default Path |
|----|-------------|
| Mac | `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` |
| Windows | `C:\Program Files\Google\Chrome\Application\chrome.exe` |
| Linux | `/usr/bin/google-chrome` |

### PATH — NVM Users Only

> Direct install users can skip this section. PATH is only needed if you use NVM.

NVM puts `node` and `npm` in a version-specific directory that MCP child processes can't find on their own. You need to include that directory in PATH.

| OS | How to Get It |
|----|---------------|
| Mac/Linux | Run `dirname $(nvm which current)` — e.g., `/Users/you/.nvm/versions/node/v20.20.2/bin` |
| Windows | Run `nvm root` to find the base, then append `\v20.20.2` |

Append system paths after your NVM node directory:
- **Mac/Linux**: `<nvm_node_dir>:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`
- **Windows**: `<nvm_node_dir>;C:\Windows\system32;C:\Windows`

## Completed Examples

### Example A: Mac + Direct Node Install

```json
{
  "mcpServers": {
    "web-quality": {
      "command": "node",
      "args": ["/Users/you/projects/code-quality-mcp/preflight-build/dist/index.js"],
      "transport": "stdio",
      "env": {
        "CHROME_PATH": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      }
    }
  }
}
```

### Example B: Mac + NVM

```json
{
  "mcpServers": {
    "web-quality": {
      "command": "/Users/you/.nvm/versions/node/v20.20.2/bin/node",
      "args": ["/Users/you/projects/code-quality-mcp/preflight-build/dist/index.js"],
      "transport": "stdio",
      "env": {
        "CHROME_PATH": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "PATH": "/Users/you/.nvm/versions/node/v20.20.2/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
      }
    }
  }
}
```

### Example C: Windows + Direct Node Install

```json
{
  "mcpServers": {
    "web-quality": {
      "command": "node",
      "args": ["C:\\Users\\you\\projects\\code-quality-mcp\\preflight-build\\dist\\index.js"],
      "transport": "stdio",
      "env": {
        "CHROME_PATH": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      }
    }
  }
}
```

## Usage

After configuring `.mcp.json`, restart your AI tool (Claude Code / Cursor) and run:

```
preflight on frontend folder
```

This generates HTML, Markdown, and JSON reports in `frontend/preflight-reports/`.

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| MCP server not loading | Node path incorrect | Verify with `which node` or `nvm which current` |
| Performance score is 0 | Chrome not found or PATH missing npm | Check `CHROME_PATH` and ensure PATH includes node/npm directory |
| `npm: command not found` in logs | Child process can't find npm | Add node bin directory to `PATH` in env |
| Server works in terminal but not in AI tool | AI tool uses different shell env | Always use full absolute paths, never rely on shell aliases or NVM auto-switching |

## Important

`.mcp.json` contains machine-specific paths and should **not** be committed to git. Add it to `.gitignore`.
