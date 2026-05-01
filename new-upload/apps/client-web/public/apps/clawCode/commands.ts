/**
 * Claw Code Commands System - Enhanced
 * 命令系统 - 增强版 (150+ 命令)
 */

import { PortingModule, CommandExecution, PortingBacklog } from './types';

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
  { name: 'project-deploy', sourceHint: 'commands/project/deploy', responsibility: '项目部署', status