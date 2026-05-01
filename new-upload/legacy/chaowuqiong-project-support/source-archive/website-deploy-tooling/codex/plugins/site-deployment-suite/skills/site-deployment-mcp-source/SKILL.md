---
name: site-deployment-mcp-source
description: Inspect and adapt the imported 超无穹 CodeEditor MCP source from D:\网站部署 for Codex. Use when the task involves MCP client/service/context/tools/transport code, converting MCP source into a Codex plugin, or understanding what the imported MCP module already implements.
---

# Site Deployment MCP Source

Primary source:

- `D:\网站部署\codex\vendor_imports\site-deployment\codeeditor-mcp-source`

Important files:

- `index.ts` for module exports
- `types.ts` for protocol and capability types
- `transport.ts` for stdio / SSE / websocket / HTTP transport logic
- `client.ts` for MCP client logic
- `service.ts` for extension and connection management
- `context.ts` for context handling
- `tools.ts` for tool registration

Current state:

- imported as source code
- not yet a live Codex `.mcp.json` server entry

When adapting it, be explicit about the gap between source-level MCP support and a runnable Codex MCP server.
