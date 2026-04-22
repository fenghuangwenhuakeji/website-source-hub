---
name: site-deployment-llm-proxy
description: Inspect and adapt the imported llm-proxy route from D:\网站部署 for Codex-related AI gateway work. Use when the task involves chat proxy routing, SSE streaming chat responses, membership or points gating before LLM usage, or replacing the mock implementation with real model calls.
---

# Site Deployment LLM Proxy

Primary source:

- `D:\网站部署\llm-proxy.js`

This file currently provides:

- a standard chat route
- a streaming chat route
- membership and points checks before usage
- mock LLM responses instead of real model provider calls

Use this skill when the user wants to convert that route into a real model gateway or reuse its logic in Codex-connected tooling.
