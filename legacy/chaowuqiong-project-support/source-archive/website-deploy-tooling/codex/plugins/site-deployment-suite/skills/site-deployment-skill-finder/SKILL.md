---
name: site-deployment-skill-finder
description: Find any imported skill from the D:\网站部署 collection by exact name, partial name, or path fragment. Use when the user names a specific imported agent or when Codex needs to locate one of the 10,000+ indexed skills without omission.
---

# Site Deployment Skill Finder

Run:

```powershell
powershell -ExecutionPolicy Bypass -File "D:\网站部署\codex\plugins\site-deployment-suite\scripts\find_site_deployment_skill.ps1" -Query "<query>"
```

Use the output path to inspect the original imported skill.

Prefer this skill when:

- the requested agent is not obvious from the top-level catalog
- the request names a niche generated skill
- the request mentions a path fragment from the imported library

After locating the skill, read the original `SKILL.md` and any nearby bundled files.
