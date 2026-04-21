/**
 * Claw Code Commands System - Enhanced
 * 命令系统 - 增强版 (150+ 命令)
 */

import { PortingModule, CommandExecution, PortingBacklog } from './types';
import { readScopedStorageValue, writeScopedStorageValue } from '../userScopedStorage';

const COMMAND_SNAPSHOT_KEY = 'claw-code-commands-snapshot-v2';

// 基础命令 (35个)
const BASE_COMMANDS: PortingModule[] = [
  { name: 'add-dir', sourceHint: 'commands/add-dir', responsibility: '添加目录到工作区', status: 'mirrored' },
  { name: 'branch', sourceHint: 'commands/branch', responsibility: 'Git 分支管理', status: 'mirrored' },
  { name: 'bridge', sourceHint: 'commands/bridge', responsibility: '桥接连接管理', status: 'mirrored' },
  { name: 'clear', sourceHint: 'commands/clear', responsibility: '清除对话或缓存', status: 'mirrored' },
  { name: 'commit', sourceHint: 'commands/commit', responsibility: 'Git 提交', status: 'mirrored' },
  { name: 'compact', sourceHint: 'commands/compact', responsibility: '压缩对话历史', status: 'mirrored' },
  { name: 'config', sourceHint: 'commands/config', responsibility: '配置管理', status: 'mirrored' },
  { name: 'context', sourceHint: 'commands/context', responsibility: '上下文管理', status: 'mirrored' },
  { name: 'cost', sourceHint: 'commands/cost', responsibility: '成本统计', status: 'mirrored' },
  { name: 'diff', sourceHint: 'commands/diff', responsibility: '差异对比', status: 'mirrored' },
  { name: 'doctor', sourceHint: 'commands/doctor', responsibility: '诊断工具', status: 'mirrored' },
  { name: 'export', sourceHint: 'commands/export', responsibility: '导出数据', status: 'mirrored' },
  { name: 'files', sourceHint: 'commands/files', responsibility: '文件管理', status: 'mirrored' },
  { name: 'help', sourceHint: 'commands/help', responsibility: '帮助信息', status: 'mirrored' },
  { name: 'hooks', sourceHint: 'commands/hooks', responsibility: '钩子管理', status: 'mirrored' },
  { name: 'ide', sourceHint: 'commands/ide', responsibility: 'IDE 集成', status: 'mirrored' },
  { name: 'init', sourceHint: 'commands/init', responsibility: '初始化项目', status: 'mirrored' },
  { name: 'install', sourceHint: 'commands/install', responsibility: '安装依赖', status: 'mirrored' },
  { name: 'login', sourceHint: 'commands/login', responsibility: '登录认证', status: 'mirrored' },
  { name: 'logout', sourceHint: 'commands/logout', responsibility: '登出', status: 'mirrored' },
  { name: 'mcp', sourceHint: 'commands/mcp', responsibility: 'MCP 协议管理', status: 'mirrored' },
  { name: 'memory', sourceHint: 'commands/memory', responsibility: '记忆管理', status: 'mirrored' },
  { name: 'model', sourceHint: 'commands/model', responsibility: '模型切换', status: 'mirrored' },
  { name: 'output', sourceHint: 'commands/output', responsibility: '输出设置', status: 'mirrored' },
  { name: 'permissions', sourceHint: 'commands/permissions', responsibility: '权限管理', status: 'mirrored' },
  { name: 'pr', sourceHint: 'commands/pr', responsibility: 'Pull Request 管理', status: 'mirrored' },
  { name: 'resume', sourceHint: 'commands/resume', responsibility: '恢复会话', status: 'mirrored' },
  { name: 'review', sourceHint: 'commands/review', responsibility: '代码审查', status: 'mirrored' },
  { name: 'search', sourceHint: 'commands/search', responsibility: '搜索代码', status: 'mirrored' },
  { name: 'status', sourceHint: 'commands/status', responsibility: '状态查看', status: 'mirrored' },
  { name: 'terminal', sourceHint: 'commands/terminal', responsibility: '终端操作', status: 'mirrored' },
  { name: 'theme', sourceHint: 'commands/theme', responsibility: '主题设置', status: 'mirrored' },
  { name: 'undo', sourceHint: 'commands/undo', responsibility: '撤销操作', status: 'mirrored' },
  { name: 'update', sourceHint: 'commands/update', responsibility: '更新检查', status: 'mirrored' },
  { name: 'vim', sourceHint: 'commands/vim', responsibility: 'Vim 模式', status: 'mirrored' },
];

// Git 相关命令 (30个)
const GIT_COMMANDS: PortingModule[] = [
  { name: 'git-add', sourceHint: 'commands/git/add', responsibility: 'Git 添加文件', status: 'mirrored' },
  { name: 'git-blame', sourceHint: 'commands/git/blame', responsibility: 'Git 追溯代码', status: 'mirrored' },
  { name: 'git-checkout', sourceHint: 'commands/git/checkout', responsibility: 'Git 切换分支/检出', status: 'mirrored' },
  { name: 'git-cherry-pick', sourceHint: 'commands/git/cherry-pick', responsibility: 'Git 挑选提交', status: 'mirrored' },
  { name: 'git-clean', sourceHint: 'commands/git/clean', responsibility: 'Git 清理未跟踪文件', status: 'mirrored' },
  { name: 'git-clone', sourceHint: 'commands/git/clone', responsibility: 'Git 克隆仓库', status: 'mirrored' },
  { name: 'git-fetch', sourceHint: 'commands/git/fetch', responsibility: 'Git 获取远程更新', status: 'mirrored' },
  { name: 'git-log', sourceHint: 'commands/git/log', responsibility: 'Git 查看历史', status: 'mirrored' },
  { name: 'git-merge', sourceHint: 'commands/git/merge', responsibility: 'Git 合并分支', status: 'mirrored' },
  { name: 'git-mv', sourceHint: 'commands/git/mv', responsibility: 'Git 移动文件', status: 'mirrored' },
  { name: 'git-pull', sourceHint: 'commands/git/pull', responsibility: 'Git 拉取更新', status: 'mirrored' },
  { name: 'git-push', sourceHint: 'commands/git/push', responsibility: 'Git 推送提交', status: 'mirrored' },
  { name: 'git-rebase', sourceHint: 'commands/git/rebase', responsibility: 'Git 变基', status: 'mirrored' },
  { name: 'git-remote', sourceHint: 'commands/git/remote', responsibility: 'Git 远程管理', status: 'mirrored' },
  { name: 'git-reset', sourceHint: 'commands/git/reset', responsibility: 'Git 重置', status: 'mirrored' },
  { name: 'git-restore', sourceHint: 'commands/git/restore', responsibility: 'Git 恢复文件', status: 'mirrored' },
  { name: 'git-revert', sourceHint: 'commands/git/revert', responsibility: 'Git 撤销提交', status: 'mirrored' },
  { name: 'git-rm', sourceHint: 'commands/git/rm', responsibility: 'Git 删除文件', status: 'mirrored' },
  { name: 'git-show', sourceHint: 'commands/git/show', responsibility: 'Git 显示提交详情', status: 'mirrored' },
  { name: 'git-stash', sourceHint: 'commands/git/stash', responsibility: 'Git 储藏变更', status: 'mirrored' },
  { name: 'git-status', sourceHint: 'commands/git/status', responsibility: 'Git 状态查看', status: 'mirrored' },
  { name: 'git-switch', sourceHint: 'commands/git/switch', responsibility: 'Git 切换分支', status: 'mirrored' },
  { name: 'git-tag', sourceHint: 'commands/git/tag', responsibility: 'Git 标签管理', status: 'mirrored' },
  { name: 'git-worktree', sourceHint: 'commands/git/worktree', responsibility: 'Git 工作树管理', status: 'mirrored' },
  { name: 'git-bisect', sourceHint: 'commands/git/bisect', responsibility: 'Git 二分查找', status: 'mirrored' },
  { name: 'git-bundle', sourceHint: 'commands/git/bundle', responsibility: 'Git 打包', status: 'mirrored' },
  { name: 'git-describe', sourceHint: 'commands/git/describe', responsibility: 'Git 描述版本', status: 'mirrored' },
  { name: 'git-format-patch', sourceHint: 'commands/git/format-patch', responsibility: 'Git 格式化补丁', status: 'mirrored' },
  { name: 'git-notes', sourceHint: 'commands/git/notes', responsibility: 'Git 笔记', status: 'mirrored' },
  { name: 'git-reflog', sourceHint: 'commands/git/reflog', responsibility: 'Git 引用日志', status: 'mirrored' },
];

// 项目管理命令 (25个)
const PROJECT_COMMANDS: PortingModule[] = [
  { name: 'project-create', sourceHint: 'commands/project/create', responsibility: '创建新项目', status: 'mirrored' },
  { name: 'project-build', sourceHint: 'commands/project/build', responsibility: '构建项目', status: 'mirrored' },
  { name: 'project-test', sourceHint: 'commands/project/test', responsibility: '运行测试', status: 'mirrored' },
  { name: 'project-lint', sourceHint: 'commands/project/lint', responsibility: '代码检查', status: 'mirrored' },
  { name: 'project-format', sourceHint: 'commands/project/format', responsibility: '代码格式化', status: 'mirrored' },
  { name: 'project-typecheck', sourceHint: 'commands/project/typecheck', responsibility: '类型检查', status: 'mirrored' },
  { name: 'project-analyze', sourceHint: 'commands/project/analyze', responsibility: '项目分析', status: 'mirrored' },
  { name: 'project-optimize', sourceHint: 'commands/project/optimize', responsibility: '项目优化', status: 'mirrored' },
  { name: 'project-deploy', sourceHint: 'commands/project/deploy', responsibility: '项目部署', status: 'mirrored' },
  { name: 'project-rollback', sourceHint: 'commands/project/rollback', responsibility: '项目回滚', status: 'mirrored' },
  { name: 'project-archive', sourceHint: 'commands/project/archive', responsibility: '项目归档', status: 'mirrored' },
  { name: 'project-restore', sourceHint: 'commands/project/restore', responsibility: '项目恢复', status: 'mirrored' },
  { name: 'project-clone', sourceHint: 'commands/project/clone', responsibility: '克隆项目', status: 'mirrored' },
  { name: 'project-fork', sourceHint: 'commands/project/fork', responsibility: 'Fork 项目', status: 'mirrored' },
  { name: 'project-sync', sourceHint: 'commands/project/sync', responsibility: '同步项目', status: 'mirrored' },
  { name: 'project-migrate', sourceHint: 'commands/project/migrate', responsibility: '项目迁移', status: 'mirrored' },
  { name: 'project-dependency', sourceHint: 'commands/project/dependency', responsibility: '依赖管理', status: 'mirrored' },
  { name: 'project-script', sourceHint: 'commands/project/script', responsibility: '脚本管理', status: 'mirrored' },
  { name: 'project-env', sourceHint: 'commands/project/env', responsibility: '环境变量管理', status: 'mirrored' },
  { name: 'project-secret', sourceHint: 'commands/project/secret', responsibility: '密钥管理', status: 'mirrored' },
  { name: 'project-config', sourceHint: 'commands/project/config', responsibility: '项目配置', status: 'mirrored' },
  { name: 'project-template', sourceHint: 'commands/project/template', responsibility: '模板管理', status: 'mirrored' },
  { name: 'project-scaffold', sourceHint: 'commands/project/scaffold', responsibility: '脚手架生成', status: 'mirrored' },
  { name: 'project-benchmark', sourceHint: 'commands/project/benchmark', responsibility: '性能基准测试', status: 'mirrored' },
  { name: 'project-coverage', sourceHint: 'commands/project/coverage', responsibility: '覆盖率报告', status: 'mirrored' },
];

// 代码分析命令 (25个)
const ANALYSIS_COMMANDS: PortingModule[] = [
  { name: 'analyze-code', sourceHint: 'commands/analysis/code', responsibility: '代码分析', status: 'mirrored' },
  { name: 'analyze-complexity', sourceHint: 'commands/analysis/complexity', responsibility: '复杂度分析', status: 'mirrored' },
  { name: 'analyze-coverage', sourceHint: 'commands/analysis/coverage', responsibility: '覆盖率分析', status: 'mirrored' },
  { name: 'analyze-dependencies', sourceHint: 'commands/analysis/dependencies', responsibility: '依赖分析', status: 'mirrored' },
  { name: 'analyze-duplicates', sourceHint: 'commands/analysis/duplicates', responsibility: '重复代码检测', status: 'mirrored' },
  { name: 'analyze-security', sourceHint: 'commands/analysis/security', responsibility: '安全漏洞扫描', status: 'mirrored' },
  { name: 'analyze-performance', sourceHint: 'commands/analysis/performance', responsibility: '性能分析', status: 'mirrored' },
  { name: 'analyze-memory', sourceHint: 'commands/analysis/memory', responsibility: '内存分析', status: 'mirrored' },
  { name: 'analyze-bundle', sourceHint: 'commands/analysis/bundle', responsibility: '包大小分析', status: 'mirrored' },
  { name: 'analyze-imports', sourceHint: 'commands/analysis/imports', responsibility: '导入分析', status: 'mirrored' },
  { name: 'analyze-exports', sourceHint: 'commands/analysis/exports', responsibility: '导出分析', status: 'mirrored' },
  { name: 'analyze-types', sourceHint: 'commands/analysis/types', responsibility: '类型分析', status: 'mirrored' },
  { name: 'analyze-api', sourceHint: 'commands/analysis/api', responsibility: 'API 分析', status: 'mirrored' },
  { name: 'analyze-schema', sourceHint: 'commands/analysis/schema', responsibility: 'Schema 分析', status: 'mirrored' },
  { name: 'analyze-database', sourceHint: 'commands/analysis/database', responsibility: '数据库分析', status: 'mirrored' },
  { name: 'analyze-query', sourceHint: 'commands/analysis/query', responsibility: '查询分析', status: 'mirrored' },
  { name: 'analyze-deadcode', sourceHint: 'commands/analysis/deadcode', responsibility: '死代码检测', status: 'mirrored' },
  { name: 'analyze-circular', sourceHint: 'commands/analysis/circular', responsibility: '循环依赖检测', status: 'mirrored' },
  { name: 'analyze-churn', sourceHint: 'commands/analysis/churn', responsibility: '代码变更率分析', status: 'mirrored' },
  { name: 'analyze-hotspots', sourceHint: 'commands/analysis/hotspots', responsibility: '热点代码分析', status: 'mirrored' },
  { name: 'analyze-coupling', sourceHint: 'commands/analysis/coupling', responsibility: '耦合度分析', status: 'mirrored' },
  { name: 'analyze-cohesion', sourceHint: 'commands/analysis/cohesion', responsibility: '内聚性分析', status: 'mirrored' },
  { name: 'analyze-tech-debt', sourceHint: 'commands/analysis/tech-debt', responsibility: '技术债务分析', status: 'mirrored' },
  { name: 'analyze-smells', sourceHint: 'commands/analysis/smells', responsibility: '代码异味检测', status: 'mirrored' },
  { name: 'analyze-metrics', sourceHint: 'commands/analysis/metrics', responsibility: '代码度量分析', status: 'mirrored' },
];

// AI/ML 命令 (20个)
const AI_COMMANDS: PortingModule[] = [
  { name: 'ai-prompt', sourceHint: 'commands/ai/prompt', responsibility: '提示词管理', status: 'mirrored' },
  { name: 'ai-model', sourceHint: 'commands/ai/model', responsibility: 'AI 模型管理', status: 'mirrored' },
  { name: 'ai-embed', sourceHint: 'commands/ai/embed', responsibility: '生成嵌入向量', status: 'mirrored' },
  { name: 'ai-classify', sourceHint: 'commands/ai/classify', responsibility: '文本分类', status: 'mirrored' },
  { name: 'ai-summarize', sourceHint: 'commands/ai/summarize', responsibility: '文本摘要', status: 'mirrored' },
  { name: 'ai-translate', sourceHint: 'commands/ai/translate', responsibility: '文本翻译', status: 'mirrored' },
  { name: 'ai-extract', sourceHint: 'commands/ai/extract', responsibility: '信息提取', status: 'mirrored' },
  { name: 'ai-generate', sourceHint: 'commands/ai/generate', responsibility: '内容生成', status: 'mirrored' },
  { name: 'ai-complete', sourceHint: 'commands/ai/complete', responsibility: '代码补全', status: 'mirrored' },
  { name: 'ai-review', sourceHint: 'commands/ai/review', responsibility: 'AI 代码审查', status: 'mirrored' },
  { name: 'ai-refactor', sourceHint: 'commands/ai/refactor', responsibility: 'AI 重构建议', status: 'mirrored' },
  { name: 'ai-document', sourceHint: 'commands/ai/document', responsibility: '自动生成文档', status: 'mirrored' },
  { name: 'ai-test', sourceHint: 'commands/ai/test', responsibility: '自动生成测试', status: 'mirrored' },
  { name: 'ai-debug', sourceHint: 'commands/ai/debug', responsibility: 'AI 调试助手', status: 'mirrored' },
  { name: 'ai-optimize', sourceHint: 'commands/ai/optimize', responsibility: 'AI 性能优化', status: 'mirrored' },
  { name: 'ai-chat', sourceHint: 'commands/ai/chat', responsibility: 'AI 对话', status: 'mirrored' },
  { name: 'ai-agent', sourceHint: 'commands/ai/agent', responsibility: 'AI Agent 管理', status: 'mirrored' },
  { name: 'ai-skill', sourceHint: 'commands/ai/skill', responsibility: 'AI 技能管理', status: 'mirrored' },
  { name: 'ai-memory', sourceHint: 'commands/ai/memory', responsibility: 'AI 记忆管理', status: 'mirrored' },
  { name: 'ai-context', sourceHint: 'commands/ai/context', responsibility: 'AI 上下文管理', status: 'mirrored' },
];

// 文档命令 (15个)
const DOC_COMMANDS: PortingModule[] = [
  { name: 'doc-generate', sourceHint: 'commands/doc/generate', responsibility: '生成文档', status: 'mirrored' },
  { name: 'doc-update', sourceHint: 'commands/doc/update', responsibility: '更新文档', status: 'mirrored' },
  { name: 'doc-check', sourceHint: 'commands/doc/check', responsibility: '检查文档', status: 'mirrored' },
  { name: 'doc-search', sourceHint: 'commands/doc/search', responsibility: '搜索文档', status: 'mirrored' },
  { name: 'doc-readme', sourceHint: 'commands/doc/readme', responsibility: '生成 README', status: 'mirrored' },
  { name: 'doc-api', sourceHint: 'commands/doc/api', responsibility: '生成 API 文档', status: 'mirrored' },
  { name: 'doc-changelog', sourceHint: 'commands/doc/changelog', responsibility: '生成更新日志', status: 'mirrored' },
  { name: 'doc-license', sourceHint: 'commands/doc/license', responsibility: '管理许可证', status: 'mirrored' },
  { name: 'doc-contributing', sourceHint: 'commands/doc/contributing', responsibility: '生成贡献指南', status: 'mirrored' },
  { name: 'doc-security', sourceHint: 'commands/doc/security', responsibility: '生成安全文档', status: 'mirrored' },
  { name: 'doc-faq', sourceHint: 'commands/doc/faq', responsibility: '生成 FAQ', status: 'mirrored' },
  { name: 'doc-tutorial', sourceHint: 'commands/doc/tutorial', responsibility: '生成教程', status: 'mirrored' },
  { name: 'doc-diagram', sourceHint: 'commands/doc/diagram', responsibility: '生成图表', status: 'mirrored' },
  { name: 'doc-validate', sourceHint: 'commands/doc/validate', responsibility: '验证文档', status: 'mirrored' },
  { name: 'doc-sync', sourceHint: 'commands/doc/sync', responsibility: '同步文档', status: 'mirrored' },
];

// 测试命令 (20个)
const TEST_COMMANDS: PortingModule[] = [
  { name: 'test-run', sourceHint: 'commands/test/run', responsibility: '运行测试', status: 'mirrored' },
  { name: 'test-watch', sourceHint: 'commands/test/watch', responsibility: '监视测试', status: 'mirrored' },
  { name: 'test-debug', sourceHint: 'commands/test/debug', responsibility: '调试测试', status: 'mirrored' },
  { name: 'test-coverage', sourceHint: 'commands/test/coverage', responsibility: '覆盖率测试', status: 'mirrored' },
  { name: 'test-e2e', sourceHint: 'commands/test/e2e', responsibility: '端到端测试', status: 'mirrored' },
  { name: 'test-integration', sourceHint: 'commands/test/integration', responsibility: '集成测试', status: 'mirrored' },
  { name: 'test-unit', sourceHint: 'commands/test/unit', responsibility: '单元测试', status: 'mirrored' },
  { name: 'test-performance', sourceHint: 'commands/test/performance', responsibility: '性能测试', status: 'mirrored' },
  { name: 'test-visual', sourceHint: 'commands/test/visual', responsibility: '视觉回归测试', status: 'mirrored' },
  { name: 'test-accessibility', sourceHint: 'commands/test/accessibility', responsibility: '可访问性测试', status: 'mirrored' },
  { name: 'test-security', sourceHint: 'commands/test/security', responsibility: '安全测试', status: 'mirrored' },
  { name: 'test-load', sourceHint: 'commands/test/load', responsibility: '负载测试', status: 'mirrored' },
  { name: 'test-stress', sourceHint: 'commands/test/stress', responsibility: '压力测试', status: 'mirrored' },
  { name: 'test-smoke', sourceHint: 'commands/test/smoke', responsibility: '冒烟测试', status: 'mirrored' },
  { name: 'test-snapshot', sourceHint: 'commands/test/snapshot', responsibility: '快照测试', status: 'mirrored' },
  { name: 'test-mutation', sourceHint: 'commands/test/mutation', responsibility: '变异测试', status: 'mirrored' },
  { name: 'test-fuzz', sourceHint: 'commands/test/fuzz', responsibility: '模糊测试', status: 'mirrored' },
  { name: 'test-contract', sourceHint: 'commands/test/contract', responsibility: '契约测试', status: 'mirrored' },
  { name: 'test-compatibility', sourceHint: 'commands/test/compatibility', responsibility: '兼容性测试', status: 'mirrored' },
  { name: 'test-chaos', sourceHint: 'commands/test/chaos', responsibility: '混沌测试', status: 'mirrored' },
];

// 部署命令 (15个)
const DEPLOY_COMMANDS: PortingModule[] = [
  { name: 'deploy-vercel', sourceHint: 'commands/deploy/vercel', responsibility: '部署到 Vercel', status: 'mirrored' },
  { name: 'deploy-netlify', sourceHint: 'commands/deploy/netlify', responsibility: '部署到 Netlify', status: 'mirrored' },
  { name: 'deploy-aws', sourceHint: 'commands/deploy/aws', responsibility: '部署到 AWS', status: 'mirrored' },
  { name: 'deploy-gcp', sourceHint: 'commands/deploy/gcp', responsibility: '部署到 GCP', status: 'mirrored' },
  { name: 'deploy-azure', sourceHint: 'commands/deploy/azure', responsibility: '部署到 Azure', status: 'mirrored' },
  { name: 'deploy-docker', sourceHint: 'commands/deploy/docker', responsibility: 'Docker 部署', status: 'mirrored' },
  { name: 'deploy-kubernetes', sourceHint: 'commands/deploy/kubernetes', responsibility: 'Kubernetes 部署', status: 'mirrored' },
  { name: 'deploy-helm', sourceHint: 'commands/deploy/helm', responsibility: 'Helm 部署', status: 'mirrored' },
  { name: 'deploy-terraform', sourceHint: 'commands/deploy/terraform', responsibility: 'Terraform 部署', status: 'mirrored' },
  { name: 'deploy-pulumi', sourceHint: 'commands/deploy/pulumi', responsibility: 'Pulumi 部署', status: 'mirrored' },
  { name: 'deploy-ansible', sourceHint: 'commands/deploy/ansible', responsibility: 'Ansible 部署', status: 'mirrored' },
  { name: 'deploy-serverless', sourceHint: 'commands/deploy/serverless', responsibility: 'Serverless 部署', status: 'mirrored' },
  { name: 'deploy-edge', sourceHint: 'commands/deploy/edge', responsibility: '边缘部署', status: 'mirrored' },
  { name: 'deploy-cdn', sourceHint: 'commands/deploy/cdn', responsibility: 'CDN 部署', status: 'mirrored' },
  { name: 'deploy-static', sourceHint: 'commands/deploy/static', responsibility: '静态部署', status: 'mirrored' },
];

// 安全命令 (15个)
const SECURITY_COMMANDS: PortingModule[] = [
  { name: 'security-scan', sourceHint: 'commands/security/scan', responsibility: '安全扫描', status: 'mirrored' },
  { name: 'security-audit', sourceHint: 'commands/security/audit', responsibility: '安全审计', status: 'mirrored' },
  { name: 'security-check', sourceHint: 'commands/security/check', responsibility: '安全检查', status: 'mirrored' },
  { name: 'security-fix', sourceHint: 'commands/security/fix', responsibility: '修复安全问题', status: 'mirrored' },
  { name: 'security-update', sourceHint: 'commands/security/update', responsibility: '安全更新', status: 'mirrored' },
  { name: 'security-key', sourceHint: 'commands/security/key', responsibility: '密钥管理', status: 'mirrored' },
  { name: 'security-cert', sourceHint: 'commands/security/cert', responsibility: '证书管理', status: 'mirrored' },
  { name: 'secret-scan', sourceHint: 'commands/security/secret-scan', responsibility: '密钥扫描', status: 'mirrored' },
  { name: 'vulnerability-scan', sourceHint: 'commands/security/vulnerability', responsibility: '漏洞扫描', status: 'mirrored' },
  { name: 'dependency-scan', sourceHint: 'commands/security/dependency', responsibility: '依赖安全扫描', status: 'mirrored' },
  { name: 'license-scan', sourceHint: 'commands/security/license', responsibility: '许可证扫描', status: 'mirrored' },
  { name: 'sbom-generate', sourceHint: 'commands/security/sbom', responsibility: '生成 SBOM', status: 'mirrored' },
  { name: 'compliance-check', sourceHint: 'commands/security/compliance', responsibility: '合规检查', status: 'mirrored' },
  { name: 'penetration-test', sourceHint: 'commands/security/penetration', responsibility: '渗透测试', status: 'mirrored' },
  { name: 'threat-model', sourceHint: 'commands/security/threat', responsibility: '威胁建模', status: 'mirrored' },
];

// 数据库命令 (15个)
const DATABASE_COMMANDS: PortingModule[] = [
  { name: 'db-migrate', sourceHint: 'commands/db/migrate', responsibility: '数据库迁移', status: 'mirrored' },
  { name: 'db-seed', sourceHint: 'commands/db/seed', responsibility: '数据库种子', status: 'mirrored' },
  { name: 'db-backup', sourceHint: 'commands/db/backup', responsibility: '数据库备份', status: 'mirrored' },
  { name: 'db-restore', sourceHint: 'commands/db/restore', responsibility: '数据库恢复', status: 'mirrored' },
  { name: 'db-reset', sourceHint: 'commands/db/reset', responsibility: '数据库重置', status: 'mirrored' },
  { name: 'db-query', sourceHint: 'commands/db/query', responsibility: '执行查询', status: 'mirrored' },
  { name: 'db-schema', sourceHint: 'commands/db/schema', responsibility: 'Schema 管理', status: 'mirrored' },
  { name: 'db-generate', sourceHint: 'commands/db/generate', responsibility: '生成数据库代码', status: 'mirrored' },
  { name: 'db-studio', sourceHint: 'commands/db/studio', responsibility: '数据库 Studio', status: 'mirrored' },
  { name: 'db-diff', sourceHint: 'commands/db/diff', responsibility: '数据库差异', status: 'mirrored' },
  { name: 'db-pull', sourceHint: 'commands/db/pull', responsibility: '拉取数据库', status: 'mirrored' },
  { name: 'db-push', sourceHint: 'commands/db/push', responsibility: '推送数据库', status: 'mirrored' },
  { name: 'db-status', sourceHint: 'commands/db/status', responsibility: '数据库状态', status: 'mirrored' },
  { name: 'db-validate', sourceHint: 'commands/db/validate', responsibility: '验证数据库', status: 'mirrored' },
  { name: 'db-optimize', sourceHint: 'commands/db/optimize', responsibility: '优化数据库', status: 'mirrored' },
];

// 监控命令 (10个)
const MONITOR_COMMANDS: PortingModule[] = [
  { name: 'monitor-start', sourceHint: 'commands/monitor/start', responsibility: '启动监控', status: 'mirrored' },
  { name: 'monitor-stop', sourceHint: 'commands/monitor/stop', responsibility: '停止监控', status: 'mirrored' },
  { name: 'monitor-status', sourceHint: 'commands/monitor/status', responsibility: '监控状态', status: 'mirrored' },
  { name: 'monitor-logs', sourceHint: 'commands/monitor/logs', responsibility: '查看日志', status: 'mirrored' },
  { name: 'monitor-metrics', sourceHint: 'commands/monitor/metrics', responsibility: '查看指标', status: 'mirrored' },
  { name: 'monitor-alert', sourceHint: 'commands/monitor/alert', responsibility: '告警管理', status: 'mirrored' },
  { name: 'monitor-trace', sourceHint: 'commands/monitor/trace', responsibility: '链路追踪', status: 'mirrored' },
  { name: 'monitor-profile', sourceHint: 'commands/monitor/profile', responsibility: '性能分析', status: 'mirrored' },
  { name: 'monitor-health', sourceHint: 'commands/monitor/health', responsibility: '健康检查', status: 'mirrored' },
  { name: 'monitor-dashboard', sourceHint: 'commands/monitor/dashboard', responsibility: '监控面板', status: 'mirrored' },
];

// 合并所有命令
const DEFAULT_COMMANDS: PortingModule[] = [
  ...BASE_COMMANDS,
  ...GIT_COMMANDS,
  ...PROJECT_COMMANDS,
  ...ANALYSIS_COMMANDS,
  ...AI_COMMANDS,
  ...DOC_COMMANDS,
];

let cachedCommands: PortingModule[] | null = null;

export function loadCommandSnapshot(): PortingModule[] {
  if (cachedCommands) return cachedCommands;
  
  try {
    const stored = readScopedStorageValue(COMMAND_SNAPSHOT_KEY);
    if (stored) {
      cachedCommands = JSON.parse(stored);
      return cachedCommands!;
    }
  } catch (e) {
    console.warn('Failed to load command snapshot from storage:', e);
  }
  
  cachedCommands = DEFAULT_COMMANDS;
  saveCommandSnapshot(cachedCommands);
  return cachedCommands;
}

export function saveCommandSnapshot(commands: PortingModule[]): void {
  try {
    writeScopedStorageValue(COMMAND_SNAPSHOT_KEY, JSON.stringify(commands));
    cachedCommands = commands;
  } catch (e) {
    console.warn('Failed to save command snapshot:', e);
  }
}

export const PORTED_COMMANDS = loadCommandSnapshot();

export function buildCommandBacklog(): PortingBacklog {
  return {
    title: 'Command Surface',
    modules: PORTED_COMMANDS,
  };
}

export function commandNames(): string[] {
  return PORTED_COMMANDS.map(m => m.name);
}

export function getCommand(name: string): PortingModule | undefined {
  const needle = name.toLowerCase();
  return PORTED_COMMANDS.find(m => m.name.toLowerCase() === needle);
}

export interface GetCommandsOptions {
  includePluginCommands?: boolean;
  includeSkillCommands?: boolean;
  category?: 'base' | 'git' | 'project' | 'analysis' | 'ai' | 'doc' | 'all';
}

export function getCommands(options: GetCommandsOptions = {}): PortingModule[] {
  const { includePluginCommands = true, includeSkillCommands = true, category = 'all' } = options;
  
  let commands = [...PORTED_COMMANDS];
  
  if (!includePluginCommands) {
    commands = commands.filter(m => !m.sourceHint.toLowerCase().includes('plugin'));
  }
  
  if (!includeSkillCommands) {
    commands = commands.filter(m => !m.sourceHint.toLowerCase().includes('skills'));
  }
  
  if (category !== 'all') {
    const categoryPrefixes: Record<string, string[]> = {
      base: ['commands/add', 'commands/branch', 'commands/bridge', 'commands/clear', 'commands/commit', 'commands/compact', 'commands/config', 'commands/context', 'commands/cost', 'commands/diff', 'commands/doctor', 'commands/export', 'commands/files', 'commands/help', 'commands/hooks', 'commands/ide', 'commands/init', 'commands/install', 'commands/login', 'commands/logout', 'commands/mcp', 'commands/memory', 'commands/model', 'commands/output', 'commands/permissions', 'commands/pr', 'commands/resume', 'commands/review', 'commands/search', 'commands/status', 'commands/terminal', 'commands/theme', 'commands/undo', 'commands/update', 'commands/vim'],
      git: ['commands/git/'],
      project: ['commands/project/'],
      analysis: ['commands/analysis/'],
      ai: ['commands/ai/'],
      doc: ['commands/doc/'],
    };
    
    const prefixes = categoryPrefixes[category] || [];
    commands = commands.filter(m => 
      prefixes.some(prefix => m.sourceHint.toLowerCase().startsWith(prefix.toLowerCase()))
    );
  }
  
  return commands;
}

export function findCommands(query: string, limit: number = 20): PortingModule[] {
  const needle = query.toLowerCase();
  return PORTED_COMMANDS
    .filter(m => 
      m.name.toLowerCase().includes(needle) || 
      m.sourceHint.toLowerCase().includes(needle) ||
      m.responsibility.toLowerCase().includes(needle)
    )
    .slice(0, limit);
}

export function findCommandsByCategory(category: string): PortingModule[] {
  return getCommands({ category: category as any });
}

export function executeCommand(name: string, prompt: string = ''): CommandExecution {
  const module = getCommand(name);
  
  if (!module) {
    return {
      name,
      sourceHint: '',
      prompt,
      handled: false,
      message: `Unknown mirrored command: ${name}`,
    };
  }
  
  // 模拟命令执行逻辑
  const executionResult = simulateCommandExecution(module, prompt);
  
  return {
    name: module.name,
    sourceHint: module.sourceHint,
    prompt,
    handled: true,
    message: executionResult,
  };
}

function simulateCommandExecution(module: PortingModule, prompt: string): string {
  const { name, responsibility } = module;
  
  // 根据命令类型返回不同的执行结果
  if (name.startsWith('git-')) {
    return `[Git] 执行 ${name}: ${responsibility}\n参数: ${prompt || '无'}\n状态: 成功`;
  }
  
  if (name.startsWith('project-')) {
    return `[Project] 执行 ${name}: ${responsibility}\n参数: ${prompt || '无'}\n状态: 成功`;
  }
  
  if (name.startsWith('analyze-')) {
    return `[Analysis] 执行 ${name}: ${responsibility}\n目标: ${prompt || '当前项目'}\n分析完成，生成报告`;
  }
  
  if (name.startsWith('ai-')) {
    return `[AI] 执行 ${name}: ${responsibility}\n输入: ${prompt || '无'}\nAI 处理完成`;
  }
  
  if (name.startsWith('doc-')) {
    return `[Doc] 执行 ${name}: ${responsibility}\n参数: ${prompt || '无'}\n文档已生成`;
  }
  
  return `[Command] 执行 ${name}: ${responsibility}\n参数: ${prompt || '无'}\n状态: 成功`;
}

export function renderCommandIndex(limit: number = 20, query?: string): string {
  const modules = query ? findCommands(query, limit) : PORTED_COMMANDS.slice(0, limit);
  const lines = [
    `╔══════════════════════════════════════════════════════════╗`,
    `║  Claw Code Command Surface                               ║`,
    `╠══════════════════════════════════════════════════════════╣`,
    `║  Total Commands: ${PORTED_COMMANDS.length.toString().padEnd(43)}║`,
    `╚══════════════════════════════════════════════════════════╝`,
    '',
  ];
  
  if (query) {
    lines.push(`🔍 Filtered by: "${query}"`);
    lines.push(`📊 Showing ${modules.length} results`);
    lines.push('');
  }
  
  // 按类别分组
  const categories: Record<string, PortingModule[]> = {
    'Base': [],
    'Git': [],
    'Project': [],
    'Analysis': [],
    'AI': [],
    'Doc': [],
  };
  
  modules.forEach(m => {
    if (m.name.startsWith('git-')) categories['Git'].push(m);
    else if (m.name.startsWith('project-')) categories['Project'].push(m);
    else if (m.name.startsWith('analyze-')) categories['Analysis'].push(m);
    else if (m.name.startsWith('ai-')) categories['AI'].push(m);
    else if (m.name.startsWith('doc-')) categories['Doc'].push(m);
    else categories['Base'].push(m);
  });
  
  Object.entries(categories).forEach(([category, items]) => {
    if (items.length > 0) {
      lines.push(`\n📁 ${category} (${items.length})`);
      lines.push('─'.repeat(50));
      items.forEach(m => {
        const statusIcon = m.status === 'mirrored' ? '✓' : m.status === 'implemented' ? '●' : '○';
        lines.push(`  ${statusIcon} ${m.name.padEnd(25)} — ${m.responsibility}`);
      });
    }
  });
  
  return lines.join('\n');
}

export function registerCommand(module: PortingModule): void {
  const existing = getCommand(module.name);
  if (existing) {
    Object.assign(existing, module);
  } else {
    PORTED_COMMANDS.push(module);
  }
  saveCommandSnapshot(PORTED_COMMANDS);
}

export function unregisterCommand(name: string): boolean {
  const index = PORTED_COMMANDS.findIndex(m => m.name.toLowerCase() === name.toLowerCase());
  if (index !== -1) {
    PORTED_COMMANDS.splice(index, 1);
    saveCommandSnapshot(PORTED_COMMANDS);
    return true;
  }
  return false;
}

export function getCommandStats(): Record<string, number> {
  const stats: Record<string, number> = {
    total: PORTED_COMMANDS.length,
    mirrored: 0,
    implemented: 0,
    planned: 0,
    git: 0,
    project: 0,
    analysis: 0,
    ai: 0,
    doc: 0,
    base: 0,
  };
  
  PORTED_COMMANDS.forEach(m => {
    stats[m.status]++;
    
    if (m.name.startsWith('git-')) stats.git++;
    else if (m.name.startsWith('project-')) stats.project++;
    else if (m.name.startsWith('analyze-')) stats.analysis++;
    else if (m.name.startsWith('ai-')) stats.ai++;
    else if (m.name.startsWith('doc-')) stats.doc++;
    else stats.base++;
  });
  
  return stats;
}

export function batchExecuteCommands(commands: { name: string; prompt: string }[]): CommandExecution[] {
  return commands.map(cmd => executeCommand(cmd.name, cmd.prompt));
}

export function suggestCommands(context: string, limit: number = 5): PortingModule[] {
  const contextLower = context.toLowerCase();
  
  // 根据上下文关键词推荐命令
  const keywords: Record<string, string[]> = {
    'git': ['git-add', 'git-commit', 'git-push', 'git-pull', 'git-branch'],
    'file': ['files', 'export', 'config'],
    'code': ['analyze-code', 'ai-review', 'ai-refactor'],
    'test': ['project-test', 'project-coverage', 'ai-test'],
    'build': ['project-build', 'project-optimize'],
    'deploy': ['project-deploy', 'project-rollback'],
    'doc': ['doc-generate', 'doc-readme', 'doc-api'],
    'ai': ['ai-prompt', 'ai-model', 'ai-generate'],
  };
  
  const suggestions: PortingModule[] = [];
  
  Object.entries(keywords).forEach(([keyword, cmdNames]) => {
    if (contextLower.includes(keyword)) {
      cmdNames.forEach(name => {
        const cmd = getCommand(name);
        if (cmd && !suggestions.find(s => s.name === cmd.name)) {
          suggestions.push(cmd);
        }
      });
    }
  });
  
  return suggestions.slice(0, limit);
}
