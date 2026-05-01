---
name: site-deployment-hub
description: Access and adapt the imported D:\网站部署 AI toolkit collection for Codex, including Trae skills, Agent+Agent generated agent libraries, 超无穹 CodeEditor MCP source, llm-proxy routes, and related theory or orchestration projects. Use when requests mention 网站部署, Trae, Agent制造机, 超无穹, MCP, llm-proxy, imported agents, imported skills, or converting these assets for Codex.
---

# Site Deployment Hub

Read `D:\网站部署\codex\vendor_imports\site-deployment\site-deployment-manifest.json` first to see the mounted sources and counts.

Read `D:\网站部署\codex\vendor_imports\site-deployment\site-deployment-skill-index.json` when you need to locate a specific imported skill by folder name instead of relying on damaged or mixed-encoding descriptions.

Use these mounted locations:

- `D:\网站部署\codex\skills\site-deployment-imports\trae-main` for the main Trae skill tree imported from `D:\网站部署\.trae\skills`.
- `D:\网站部署\codex\skills\site-deployment-imports\agent-plus-agent` for the Agent+Agent generated skill tree imported from `D:\网站部署\Agent+Agent制造机\Agent阵法\.trae\skills`.
- `D:\网站部署\codex\vendor_imports\site-deployment\trae-copy-docs` for orchestration scripts, indexes, and theory documents from `D:\网站部署\trae复制`.
- `D:\网站部署\codex\vendor_imports\site-deployment\codeeditor-mcp-source` for the preserved MCP source from `D:\网站部署\超无穹项目\chaowuqiong-project\apps\desktop\待打包\CodeEditor\mcp`.
- `D:\网站部署\llm-proxy.js` for the standalone LLM proxy route.

When a user asks for a specific imported agent or skill:

1. Search the mounted skill trees for the matching folder name or `SKILL.md`.
2. Prefer the directly mounted version before rewriting it.
3. Adapt only the parts needed for the user request instead of bulk-copying large generated libraries.

When a user asks about MCP or AI tooling from this collection:

1. Read the manifest.
2. Inspect the CodeEditor MCP source under the mounted vendor path.
3. Inspect `D:\网站部署\llm-proxy.js` and related project files if the request involves proxying or model routing.
4. Explain clearly whether the source is already live in Codex or is currently mounted as reference code that still needs runtime wiring.

Preserve source provenance in any follow-up work by citing the original mounted path you used.
