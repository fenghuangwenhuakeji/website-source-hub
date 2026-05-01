# Source Archive

This directory keeps source-like support material imported from `D:\网站部署` that is useful for engineering handoff but should not participate in the default build path.

## Current Imported Support Set

- `website-deploy-root-support/docs`
- `website-deploy-root-support/ops`
- `website-deploy-root-support/workspace-audit`
- `website-deploy-root-support/mobile-adaptation-center`
- `website-deploy-root-support/root-files`
- `website-deploy-tooling/Agent+Agent制造机/Agent阵法/.trae`
- `website-deploy-tooling/codex` (current source-bearing subset)
- `website-deploy-tooling/codex-agents`
- `website-deploy-tooling/codex-migration`

## Import Rules

- imported read-only from the original Windows workspace
- excludes `node_modules`, `dist*`, `build`, `release`, `win-unpacked`, logs, and backup-style folders
- kept under `legacy` so the normalized product build contract stays unchanged
