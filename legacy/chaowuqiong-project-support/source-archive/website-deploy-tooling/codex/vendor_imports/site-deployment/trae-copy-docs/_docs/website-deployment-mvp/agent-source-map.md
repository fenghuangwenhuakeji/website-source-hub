# Agent Source Map

## 主使用入口

优先使用：

- `D:\网站部署\.trae\skills`
- `D:\网站部署\trae复制\skills`

## 当前可追踪来源

- 主技能树：`D:\网站部署\.trae\skills`
- 本轮新增技能：`D:\网站部署\.trae\skills\website-deployment-mvp-agent`
- 镜像副本：`D:\网站部署\trae复制\skills`
- Agent 生成体系参考：`D:\网站部署\Agent+Agent制造机\Agent阵法\.trae\skills`
- 参考型 Agent 资料：`D:\网站部署\reference\mixed\超无穹`
- Codex 本地 Agent：`D:\网站部署\codex-agents`

## 说明

这次已经把“当前最有复用价值的经验”统一沉淀到 `.trae` 和 `trae复制`。

历史散落 Agent 没有在这一轮全部做物理迁移，原因是：

- 某些路径被现有工具链引用
- 某些目录本身就是参考素材，不适合直接改动
- 激进迁移会增加路径断裂风险

后续的迁移原则是：

1. 先在 `.trae` 做主沉淀
2. 再镜像到 `trae复制`
3. 历史 Agent 先做索引，再择机迁移
