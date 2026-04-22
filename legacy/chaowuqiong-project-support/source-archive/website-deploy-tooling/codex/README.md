# Standalone Codex Home

This folder is a standalone Codex home for the `D:\网站部署` workspace.

## What is loaded

- Imported Trae skill tree
- Imported Agent+Agent skill tree
- Imported `trae复制` reference project
- Imported `超无穹` CodeEditor MCP source
- Imported `llm-proxy.js` reference path

## Key paths

- Skills root: `D:\网站部署\codex\skills`
- Mounted imports: `D:\网站部署\codex\skills\site-deployment-imports`
- Vendor references: `D:\网站部署\codex\vendor_imports\site-deployment`
- Manifest: `D:\网站部署\codex\vendor_imports\site-deployment\site-deployment-manifest.json`
- Skill index: `D:\网站部署\codex\vendor_imports\site-deployment\site-deployment-skill-index.json`

## How to use

PowerShell:

```powershell
$env:CODEX_HOME = 'D:\网站部署\codex'
codex
```

Or run:

```powershell
.\start-codex.ps1
```

## Notes

- The imported libraries are mounted with junctions to avoid duplicating thousands of generated skill folders.
- The CodeEditor MCP code is preserved as source and is not auto-started as a live MCP server.
