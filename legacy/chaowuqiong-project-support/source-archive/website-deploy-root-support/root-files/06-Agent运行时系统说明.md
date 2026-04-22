# Agent 运行时系统说明

## 目标

把 `.trae` 下的 agent 从“静态技能目录”升级成“可运行、可成长、可待命、可孵化子体”的数字个体系统。

## 当前共享引擎

位置:
[runtime](/D:/网站部署/.trae/skills/_agent-system/runtime)

包含:
- `identity-engine.js`
- `memory-engine.js`
- `emotion-engine.js`
- `context-engine.js`
- `skill-evolution-engine.js`
- `lifecycle-engine.js`
- `pet-hatchery.js`
- `safety-engine.js`
- `agent-runtime.js`

## 每个 agent 的标准层

- `identity.json`
- `personality.json`
- `agent.manifest.json`
- `memory/`
- `state/`
- `context/`
- `skills/`
- `pets/`
- `safety.json`
- `brain.js`
- `run.js`

## 运行周期

1. `boot`
2. `understand`
3. `interact`
4. `execute`
5. `inspect`
6. `improve`
7. `update`
8. `standby`

后台静默循环:
- `learn`
- `dream`
- `compress`
- `self-check`

## 自动触发

自动触发依赖:
- `agent.manifest.json` 里的 `activation.keywords`
- `activation.intents`
- `context/current-context.json`
- `state/activation.json`

## 自成长

成长主要落在:
- `memory/learning-log.md`
- `memory/reflections.md`
- `memory/dreams.md`
- `skills/evolution.json`
- `pets/index.json`

## 下一步

- 做统一 runtime host
- 做 dream scheduler
- 做长期关系记忆压缩
- 做 child agent 真正的孵化模板
