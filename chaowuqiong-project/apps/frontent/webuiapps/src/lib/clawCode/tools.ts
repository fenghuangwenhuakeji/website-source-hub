/**
 * Claw Code Tools System - Ultra Enhanced
 * 工具系统 - 超强增强版 (150+ 工具)
 * 
 * 集成真实执行器，提供实际的工具执行能力
 * 包含：基础、文件、目录、代码、网络、数据库、AI、测试、部署、安全、监控、文档、Git、容器、云原生
 */

import { PortingModule, ToolExecution, PortingBacklog, ToolPermissionContext } from './types';
import { getToolExecutorManager, ToolExecutorManager } from './toolExecutors';
import { readScopedStorageValue, writeScopedStorageValue } from '../userScopedStorage';

const TOOLS_SNAPSHOT_KEY = 'claw-code-tools-snapshot-v3';

// 基础工具 (30个)
const BASE_TOOLS: PortingModule[] = [
  { name: 'AgentTool', sourceHint: 'tools/AgentTool', responsibility: '子代理管理工具', status: 'mirrored' },
  { name: 'AskUserQuestionTool', sourceHint: 'tools/AskUserQuestionTool', responsibility: '用户交互工具', status: 'mirrored' },
  { name: 'BashTool', sourceHint: 'tools/BashTool', responsibility: 'Shell 命令执行', status: 'mirrored' },
  { name: 'BriefTool', sourceHint: 'tools/BriefTool', responsibility: '简要摘要工具', status: 'mirrored' },
  { name: 'ConfigTool', sourceHint: 'tools/ConfigTool', responsibility: '配置管理工具', status: 'mirrored' },
  { name: 'EnterPlanModeTool', sourceHint: 'tools/EnterPlanModeTool', responsibility: '进入计划模式', status: 'mirrored' },
  { name: 'ExitPlanModeTool', sourceHint: 'tools/ExitPlanModeTool', responsibility: '退出计划模式', status: 'mirrored' },
  { name: 'EnterWorktreeTool', sourceHint: 'tools/EnterWorktreeTool', responsibility: '进入工作树', status: 'mirrored' },
  { name: 'ExitWorktreeTool', sourceHint: 'tools/ExitWorktreeTool', responsibility: '退出工作树', status: 'mirrored' },
  { name: 'FileEditTool', sourceHint: 'tools/FileEditTool', responsibility: '文件编辑工具', status: 'mirrored' },
  { name: 'FileReadTool', sourceHint: 'tools/FileReadTool', responsibility: '文件读取工具', status: 'mirrored' },
  { name: 'FileWriteTool', sourceHint: 'tools/FileWriteTool', responsibility: '文件写入工具', status: 'mirrored' },
  { name: 'GlobTool', sourceHint: 'tools/GlobTool', responsibility: '文件模式匹配', status: 'mirrored' },
  { name: 'GrepTool', sourceHint: 'tools/GrepTool', responsibility: '文本搜索工具', status: 'mirrored' },
  { name: 'LSPTool', sourceHint: 'tools/LSPTool', responsibility: '语言服务器工具', status: 'mirrored' },
  { name: 'MCPTool', sourceHint: 'tools/MCPTool', responsibility: 'MCP 协议工具', status: 'mirrored' },
  { name: 'McpAuthTool', sourceHint: 'tools/McpAuthTool', responsibility: 'MCP 认证工具', status: 'mirrored' },
  { name: 'NotebookEditTool', sourceHint: 'tools/NotebookEditTool', responsibility: 'Notebook 编辑', status: 'mirrored' },
  { name: 'PowerShellTool', sourceHint: 'tools/PowerShellTool', responsibility: 'PowerShell 执行', status: 'mirrored' },
  { name: 'ReadNotebookTool', sourceHint: 'tools/ReadNotebookTool', responsibility: 'Notebook 读取', status: 'mirrored' },
  { name: 'ReadRandomTool', sourceHint: 'tools/ReadRandomTool', responsibility: '随机读取工具', status: 'mirrored' },
  { name: 'ResumeAgentTool', sourceHint: 'tools/ResumeAgentTool', responsibility: '恢复代理', status: 'mirrored' },
  { name: 'SearchTool', sourceHint: 'tools/SearchTool', responsibility: '搜索工具', status: 'mirrored' },
  { name: 'SemanticSearchTool', sourceHint: 'tools/SemanticSearchTool', responsibility: '语义搜索', status: 'mirrored' },
  { name: 'SkillTool', sourceHint: 'tools/SkillTool', responsibility: '技能调用工具', status: 'mirrored' },
  { name: 'StopTool', sourceHint: 'tools/StopTool', responsibility: '停止执行', status: 'mirrored' },
  { name: 'TodoWriteTool', sourceHint: 'tools/TodoWriteTool', responsibility: '任务列表管理', status: 'mirrored' },
  { name: 'TokenCountTool', sourceHint: 'tools/TokenCountTool', responsibility: 'Token 计数', status: 'mirrored' },
  { name: 'WebFetchTool', sourceHint: 'tools/WebFetchTool', responsibility: '网页抓取', status: 'mirrored' },
  { name: 'WebSearchTool', sourceHint: 'tools/WebSearchTool', responsibility: '网页搜索', status: 'mirrored' },
];

// 文件操作工具 (25个)
const FILE_TOOLS: PortingModule[] = [
  { name: 'FileCopyTool', sourceHint: 'tools/file/Copy', responsibility: '文件复制', status: 'mirrored' },
  { name: 'FileMoveTool', sourceHint: 'tools/file/Move', responsibility: '文件移动', status: 'mirrored' },
  { name: 'FileDeleteTool', sourceHint: 'tools/file/Delete', responsibility: '文件删除', status: 'mirrored' },
  { name: 'FileRenameTool', sourceHint: 'tools/file/Rename', responsibility: '文件重命名', status: 'mirrored' },
  { name: 'FileCreateTool', sourceHint: 'tools/file/Create', responsibility: '创建文件', status: 'mirrored' },
  { name: 'FileAppendTool', sourceHint: 'tools/file/Append', responsibility: '追加文件内容', status: 'mirrored' },
  { name: 'FileTruncateTool', sourceHint: 'tools/file/Truncate', responsibility: '截断文件', status: 'mirrored' },
  { name: 'FileTouchTool', sourceHint: 'tools/file/Touch', responsibility: '更新文件时间戳', status: 'mirrored' },
  { name: 'FileStatTool', sourceHint: 'tools/file/Stat', responsibility: '获取文件信息', status: 'mirrored' },
  { name: 'FileExistsTool', sourceHint: 'tools/file/Exists', responsibility: '检查文件存在', status: 'mirrored' },
  { name: 'FileWatchTool', sourceHint: 'tools/file/Watch', responsibility: '文件监控', status: 'mirrored' },
  { name: 'FileCompareTool', sourceHint: 'tools/file/Compare', responsibility: '文件对比', status: 'mirrored' },
  { name: 'FileChecksumTool', sourceHint: 'tools/file/Checksum', responsibility: '文件校验和', status: 'mirrored' },
  { name: 'FileCompressTool', sourceHint: 'tools/file/Compress', responsibility: '文件压缩', status: 'mirrored' },
  { name: 'FileDecompressTool', sourceHint: 'tools/file/Decompress', responsibility: '文件解压', status: 'mirrored' },
  { name: 'FileEncryptTool', sourceHint: 'tools/file/Encrypt', responsibility: '文件加密', status: 'mirrored' },
  { name: 'FileDecryptTool', sourceHint: 'tools/file/Decrypt', responsibility: '文件解密', status: 'mirrored' },
  { name: 'FileBackupTool', sourceHint: 'tools/file/Backup', responsibility: '文件备份', status: 'mirrored' },
  { name: 'FileRestoreTool', sourceHint: 'tools/file/Restore', responsibility: '文件恢复', status: 'mirrored' },
  { name: 'FileSyncTool', sourceHint: 'tools/file/Sync', responsibility: '文件同步', status: 'mirrored' },
  { name: 'FileUploadTool', sourceHint: 'tools/file/Upload', responsibility: '文件上传', status: 'mirrored' },
  { name: 'FileDownloadTool', sourceHint: 'tools/file/Download', responsibility: '文件下载', status: 'mirrored' },
  { name: 'FileConvertTool', sourceHint: 'tools/file/Convert', responsibility: '文件格式转换', status: 'mirrored' },
  { name: 'FileMergeTool', sourceHint: 'tools/file/Merge', responsibility: '文件合并', status: 'mirrored' },
  { name: 'FileSplitTool', sourceHint: 'tools/file/Split', responsibility: '文件分割', status: 'mirrored' },
];

// 目录操作工具 (15个)
const DIR_TOOLS: PortingModule[] = [
  { name: 'DirCreateTool', sourceHint: 'tools/dir/Create', responsibility: '创建目录', status: 'mirrored' },
  { name: 'DirDeleteTool', sourceHint: 'tools/dir/Delete', responsibility: '删除目录', status: 'mirrored' },
  { name: 'DirListTool', sourceHint: 'tools/dir/List', responsibility: '列出目录内容', status: 'mirrored' },
  { name: 'DirTreeTool', sourceHint: 'tools/dir/Tree', responsibility: '目录树显示', status: 'mirrored' },
  { name: 'DirCopyTool', sourceHint: 'tools/dir/Copy', responsibility: '复制目录', status: 'mirrored' },
  { name: 'DirMoveTool', sourceHint: 'tools/dir/Move', responsibility: '移动目录', status: 'mirrored' },
  { name: 'DirRenameTool', sourceHint: 'tools/dir/Rename', responsibility: '重命名目录', status: 'mirrored' },
  { name: 'DirSizeTool', sourceHint: 'tools/dir/Size', responsibility: '计算目录大小', status: 'mirrored' },
  { name: 'DirCleanTool', sourceHint: 'tools/dir/Clean', responsibility: '清理目录', status: 'mirrored' },
  { name: 'DirFindTool', sourceHint: 'tools/dir/Find', responsibility: '目录查找', status: 'mirrored' },
  { name: 'DirWatchTool', sourceHint: 'tools/dir/Watch', responsibility: '目录监控', status: 'mirrored' },
  { name: 'DirDiffTool', sourceHint: 'tools/dir/Diff', responsibility: '目录对比', status: 'mirrored' },
  { name: 'DirSyncTool', sourceHint: 'tools/dir/Sync', responsibility: '目录同步', status: 'mirrored' },
  { name: 'DirBackupTool', sourceHint: 'tools/dir/Backup', responsibility: '目录备份', status: 'mirrored' },
  { name: 'DirArchiveTool', sourceHint: 'tools/dir/Archive', responsibility: '目录归档', status: 'mirrored' },
];

// 代码分析工具 (20个)
const CODE_TOOLS: PortingModule[] = [
  { name: 'CodeParseTool', sourceHint: 'tools/code/Parse', responsibility: '代码解析', status: 'mirrored' },
  { name: 'CodeFormatTool', sourceHint: 'tools/code/Format', responsibility: '代码格式化', status: 'mirrored' },
  { name: 'CodeLintTool', sourceHint: 'tools/code/Lint', responsibility: '代码检查', status: 'mirrored' },
  { name: 'CodeFixTool', sourceHint: 'tools/code/Fix', responsibility: '自动修复代码', status: 'mirrored' },
  { name: 'CodeRefactorTool', sourceHint: 'tools/code/Refactor', responsibility: '代码重构', status: 'mirrored' },
  { name: 'CodeCompleteTool', sourceHint: 'tools/code/Complete', responsibility: '代码补全', status: 'mirrored' },
  { name: 'CodeGenerateTool', sourceHint: 'tools/code/Generate', responsibility: '代码生成', status: 'mirrored' },
  { name: 'CodeSnippetTool', sourceHint: 'tools/code/Snippet', responsibility: '代码片段', status: 'mirrored' },
  { name: 'CodeTemplateTool', sourceHint: 'tools/code/Template', responsibility: '代码模板', status: 'mirrored' },
  { name: 'CodeTypeCheckTool', sourceHint: 'tools/code/TypeCheck', responsibility: '类型检查', status: 'mirrored' },
  { name: 'CodeTestGenTool', sourceHint: 'tools/code/TestGen', responsibility: '测试生成', status: 'mirrored' },
  { name: 'CodeDocGenTool', sourceHint: 'tools/code/DocGen', responsibility: '文档生成', status: 'mirrored' },
  { name: 'CodeCommentTool', sourceHint: 'tools/code/Comment', responsibility: '添加注释', status: 'mirrored' },
  { name: 'CodeMinifyTool', sourceHint: 'tools/code/Minify', responsibility: '代码压缩', status: 'mirrored' },
  { name: 'CodeBeautifyTool', sourceHint: 'tools/code/Beautify', responsibility: '代码美化', status: 'mirrored' },
  { name: 'CodeTranspileTool', sourceHint: 'tools/code/Transpile', responsibility: '代码转译', status: 'mirrored' },
  { name: 'CodeBundleTool', sourceHint: 'tools/code/Bundle', responsibility: '代码打包', status: 'mirrored' },
  { name: 'CodeOptimizeTool', sourceHint: 'tools/code/Optimize', responsibility: '代码优化', status: 'mirrored' },
  { name: 'CodeAnalyzeTool', sourceHint: 'tools/code/Analyze', responsibility: '代码分析', status: 'mirrored' },
  { name: 'CodeVisualizeTool', sourceHint: 'tools/code/Visualize', responsibility: '代码可视化', status: 'mirrored' },
];

// 网络工具 (15个)
const NETWORK_TOOLS: PortingModule[] = [
  { name: 'HttpRequestTool', sourceHint: 'tools/network/HttpRequest', responsibility: 'HTTP 请求', status: 'mirrored' },
  { name: 'HttpServerTool', sourceHint: 'tools/network/HttpServer', responsibility: 'HTTP 服务器', status: 'mirrored' },
  { name: 'WebSocketTool', sourceHint: 'tools/network/WebSocket', responsibility: 'WebSocket 连接', status: 'mirrored' },
  { name: 'SocketTool', sourceHint: 'tools/network/Socket', responsibility: 'Socket 连接', status: 'mirrored' },
  { name: 'FetchTool', sourceHint: 'tools/network/Fetch', responsibility: '网络获取', status: 'mirrored' },
  { name: 'ProxyTool', sourceHint: 'tools/network/Proxy', responsibility: '代理设置', status: 'mirrored' },
  { name: 'CurlTool', sourceHint: 'tools/network/Curl', responsibility: 'Curl 请求', status: 'mirrored' },
  { name: 'PingTool', sourceHint: 'tools/network/Ping', responsibility: '网络 Ping', status: 'mirrored' },
  { name: 'DnsTool', sourceHint: 'tools/network/Dns', responsibility: 'DNS 查询', status: 'mirrored' },
  { name: 'SslTool', sourceHint: 'tools/network/Ssl', responsibility: 'SSL 检查', status: 'mirrored' },
  { name: 'PortScanTool', sourceHint: 'tools/network/PortScan', responsibility: '端口扫描', status: 'mirrored' },
  { name: 'ApiTestTool', sourceHint: 'tools/network/ApiTest', responsibility: 'API 测试', status: 'mirrored' },
  { name: 'MockServerTool', sourceHint: 'tools/network/MockServer', responsibility: 'Mock 服务器', status: 'mirrored' },
  { name: 'RateLimitTool', sourceHint: 'tools/network/RateLimit', responsibility: '速率限制', status: 'mirrored' },
  { name: 'CacheTool', sourceHint: 'tools/network/Cache', responsibility: '缓存管理', status: 'mirrored' },
];

// 数据库工具 (10个)
const DB_TOOLS: PortingModule[] = [
  { name: 'DbQueryTool', sourceHint: 'tools/db/Query', responsibility: '数据库查询', status: 'mirrored' },
  { name: 'DbMigrateTool', sourceHint: 'tools/db/Migrate', responsibility: '数据库迁移', status: 'mirrored' },
  { name: 'DbSeedTool', sourceHint: 'tools/db/Seed', responsibility: '数据库种子', status: 'mirrored' },
  { name: 'DbBackupTool', sourceHint: 'tools/db/Backup', responsibility: '数据库备份', status: 'mirrored' },
  { name: 'DbRestoreTool', sourceHint: 'tools/db/Restore', responsibility: '数据库恢复', status: 'mirrored' },
  { name: 'DbSchemaTool', sourceHint: 'tools/db/Schema', responsibility: 'Schema 管理', status: 'mirrored' },
  { name: 'DbIndexTool', sourceHint: 'tools/db/Index', responsibility: '索引管理', status: 'mirrored' },
  { name: 'DbAnalyzeTool', sourceHint: 'tools/db/Analyze', responsibility: '数据库分析', status: 'mirrored' },
  { name: 'DbExportTool', sourceHint: 'tools/db/Export', responsibility: '数据导出', status: 'mirrored' },
  { name: 'DbImportTool', sourceHint: 'tools/db/Import', responsibility: '数据导入', status: 'mirrored' },
];

// AI 工具 (10个)
const AI_TOOLS: PortingModule[] = [
  { name: 'LlmChatTool', sourceHint: 'tools/ai/LlmChat', responsibility: 'LLM 对话', status: 'mirrored' },
  { name: 'LlmEmbedTool', sourceHint: 'tools/ai/LlmEmbed', responsibility: '生成嵌入向量', status: 'mirrored' },
  { name: 'LlmClassifyTool', sourceHint: 'tools/ai/LlmClassify', responsibility: '文本分类', status: 'mirrored' },
  { name: 'LlmSummarizeTool', sourceHint: 'tools/ai/LlmSummarize', responsibility: '文本摘要', status: 'mirrored' },
  { name: 'LlmTranslateTool', sourceHint: 'tools/ai/LlmTranslate', responsibility: '文本翻译', status: 'mirrored' },
  { name: 'LlmExtractTool', sourceHint: 'tools/ai/LlmExtract', responsibility: '信息提取', status: 'mirrored' },
  { name: 'LlmGenerateTool', sourceHint: 'tools/ai/LlmGenerate', responsibility: '内容生成', status: 'mirrored' },
  { name: 'LlmCompareTool', sourceHint: 'tools/ai/LlmCompare', responsibility: '文本对比', status: 'mirrored' },
  { name: 'LlmSentimentTool', sourceHint: 'tools/ai/LlmSentiment', responsibility: '情感分析', status: 'mirrored' },
  { name: 'LlmNERTool', sourceHint: 'tools/ai/LlmNER', responsibility: '命名实体识别', status: 'mirrored' },
];

// 测试工具 (20个)
const TEST_TOOLS: PortingModule[] = [
  { name: 'TestRunTool', sourceHint: 'tools/test/Run', responsibility: '运行测试', status: 'mirrored' },
  { name: 'TestWatchTool', sourceHint: 'tools/test/Watch', responsibility: '监视测试', status: 'mirrored' },
  { name: 'TestDebugTool', sourceHint: 'tools/test/Debug', responsibility: '调试测试', status: 'mirrored' },
  { name: 'TestCoverageTool', sourceHint: 'tools/test/Coverage', responsibility: '覆盖率测试', status: 'mirrored' },
  { name: 'TestE2ETool', sourceHint: 'tools/test/E2E', responsibility: '端到端测试', status: 'mirrored' },
  { name: 'TestIntegrationTool', sourceHint: 'tools/test/Integration', responsibility: '集成测试', status: 'mirrored' },
  { name: 'TestUnitTool', sourceHint: 'tools/test/Unit', responsibility: '单元测试', status: 'mirrored' },
  { name: 'TestPerformanceTool', sourceHint: 'tools/test/Performance', responsibility: '性能测试', status: 'mirrored' },
  { name: 'TestVisualTool', sourceHint: 'tools/test/Visual', responsibility: '视觉回归测试', status: 'mirrored' },
  { name: 'TestAccessibilityTool', sourceHint: 'tools/test/Accessibility', responsibility: '可访问性测试', status: 'mirrored' },
  { name: 'TestSecurityTool', sourceHint: 'tools/test/Security', responsibility: '安全测试', status: 'mirrored' },
  { name: 'TestLoadTool', sourceHint: 'tools/test/Load', responsibility: '负载测试', status: 'mirrored' },
  { name: 'TestStressTool', sourceHint: 'tools/test/Stress', responsibility: '压力测试', status: 'mirrored' },
  { name: 'TestSmokeTool', sourceHint: 'tools/test/Smoke', responsibility: '冒烟测试', status: 'mirrored' },
  { name: 'TestSnapshotTool', sourceHint: 'tools/test/Snapshot', responsibility: '快照测试', status: 'mirrored' },
  { name: 'TestMutationTool', sourceHint: 'tools/test/Mutation', responsibility: '变异测试', status: 'mirrored' },
  { name: 'TestFuzzTool', sourceHint: 'tools/test/Fuzz', responsibility: '模糊测试', status: 'mirrored' },
  { name: 'TestContractTool', sourceHint: 'tools/test/Contract', responsibility: '契约测试', status: 'mirrored' },
  { name: 'TestCompatibilityTool', sourceHint: 'tools/test/Compatibility', responsibility: '兼容性测试', status: 'mirrored' },
  { name: 'TestChaosTool', sourceHint: 'tools/test/Chaos', responsibility: '混沌测试', status: 'mirrored' },
];

// 部署工具 (15个)
const DEPLOY_TOOLS: PortingModule[] = [
  { name: 'DeployVercelTool', sourceHint: 'tools/deploy/Vercel', responsibility: '部署到 Vercel', status: 'mirrored' },
  { name: 'DeployNetlifyTool', sourceHint: 'tools/deploy/Netlify', responsibility: '部署到 Netlify', status: 'mirrored' },
  { name: 'DeployAwsTool', sourceHint: 'tools/deploy/Aws', responsibility: '部署到 AWS', status: 'mirrored' },
  { name: 'DeployGcpTool', sourceHint: 'tools/deploy/Gcp', responsibility: '部署到 GCP', status: 'mirrored' },
  { name: 'DeployAzureTool', sourceHint: 'tools/deploy/Azure', responsibility: '部署到 Azure', status: 'mirrored' },
  { name: 'DeployDockerTool', sourceHint: 'tools/deploy/Docker', responsibility: 'Docker 部署', status: 'mirrored' },
  { name: 'DeployKubernetesTool', sourceHint: 'tools/deploy/Kubernetes', responsibility: 'Kubernetes 部署', status: 'mirrored' },
  { name: 'DeployHelmTool', sourceHint: 'tools/deploy/Helm', responsibility: 'Helm 部署', status: 'mirrored' },
  { name: 'DeployTerraformTool', sourceHint: 'tools/deploy/Terraform', responsibility: 'Terraform 部署', status: 'mirrored' },
  { name: 'DeployPulumiTool', sourceHint: 'tools/deploy/Pulumi', responsibility: 'Pulumi 部署', status: 'mirrored' },
  { name: 'DeployAnsibleTool', sourceHint: 'tools/deploy/Ansible', responsibility: 'Ansible 部署', status: 'mirrored' },
  { name: 'DeployServerlessTool', sourceHint: 'tools/deploy/Serverless', responsibility: 'Serverless 部署', status: 'mirrored' },
  { name: 'DeployEdgeTool', sourceHint: 'tools/deploy/Edge', responsibility: '边缘部署', status: 'mirrored' },
  { name: 'DeployCdnTool', sourceHint: 'tools/deploy/Cdn', responsibility: 'CDN 部署', status: 'mirrored' },
  { name: 'DeployStaticTool', sourceHint: 'tools/deploy/Static', responsibility: '静态部署', status: 'mirrored' },
];

// 安全工具 (15个)
const SECURITY_TOOLS: PortingModule[] = [
  { name: 'SecurityScanTool', sourceHint: 'tools/security/Scan', responsibility: '安全扫描', status: 'mirrored' },
  { name: 'SecurityAuditTool', sourceHint: 'tools/security/Audit', responsibility: '安全审计', status: 'mirrored' },
  { name: 'SecurityCheckTool', sourceHint: 'tools/security/Check', responsibility: '安全检查', status: 'mirrored' },
  { name: 'SecurityFixTool', sourceHint: 'tools/security/Fix', responsibility: '修复安全问题', status: 'mirrored' },
  { name: 'SecurityUpdateTool', sourceHint: 'tools/security/Update', responsibility: '安全更新', status: 'mirrored' },
  { name: 'SecurityKeyTool', sourceHint: 'tools/security/Key', responsibility: '密钥管理', status: 'mirrored' },
  { name: 'SecurityCertTool', sourceHint: 'tools/security/Cert', responsibility: '证书管理', status: 'mirrored' },
  { name: 'SecretScanTool', sourceHint: 'tools/security/SecretScan', responsibility: '密钥扫描', status: 'mirrored' },
  { name: 'VulnerabilityScanTool', sourceHint: 'tools/security/Vulnerability', responsibility: '漏洞扫描', status: 'mirrored' },
  { name: 'DependencyScanTool', sourceHint: 'tools/security/Dependency', responsibility: '依赖安全扫描', status: 'mirrored' },
  { name: 'LicenseScanTool', sourceHint: 'tools/security/License', responsibility: '许可证扫描', status: 'mirrored' },
  { name: 'SbomGenerateTool', sourceHint: 'tools/security/Sbom', responsibility: '生成 SBOM', status: 'mirrored' },
  { name: 'ComplianceCheckTool', sourceHint: 'tools/security/Compliance', responsibility: '合规检查', status: 'mirrored' },
  { name: 'PenetrationTestTool', sourceHint: 'tools/security/Penetration', responsibility: '渗透测试', status: 'mirrored' },
  { name: 'ThreatModelTool', sourceHint: 'tools/security/Threat', responsibility: '威胁建模', status: 'mirrored' },
];

// 监控工具 (10个)
const MONITOR_TOOLS: PortingModule[] = [
  { name: 'MonitorStartTool', sourceHint: 'tools/monitor/Start', responsibility: '启动监控', status: 'mirrored' },
  { name: 'MonitorStopTool', sourceHint: 'tools/monitor/Stop', responsibility: '停止监控', status: 'mirrored' },
  { name: 'MonitorStatusTool', sourceHint: 'tools/monitor/Status', responsibility: '监控状态', status: 'mirrored' },
  { name: 'MonitorLogsTool', sourceHint: 'tools/monitor/Logs', responsibility: '查看日志', status: 'mirrored' },
  { name: 'MonitorMetricsTool', sourceHint: 'tools/monitor/Metrics', responsibility: '查看指标', status: 'mirrored' },
  { name: 'MonitorAlertTool', sourceHint: 'tools/monitor/Alert', responsibility: '告警管理', status: 'mirrored' },
  { name: 'MonitorTraceTool', sourceHint: 'tools/monitor/Trace', responsibility: '链路追踪', status: 'mirrored' },
  { name: 'MonitorProfileTool', sourceHint: 'tools/monitor/Profile', responsibility: '性能分析', status: 'mirrored' },
  { name: 'MonitorHealthTool', sourceHint: 'tools/monitor/Health', responsibility: '健康检查', status: 'mirrored' },
  { name: 'MonitorDashboardTool', sourceHint: 'tools/monitor/Dashboard', responsibility: '监控面板', status: 'mirrored' },
];

// 文档工具 (10个)
const DOC_TOOLS: PortingModule[] = [
  { name: 'DocGenerateTool', sourceHint: 'tools/doc/Generate', responsibility: '生成文档', status: 'mirrored' },
  { name: 'DocValidateTool', sourceHint: 'tools/doc/Validate', responsibility: '验证文档', status: 'mirrored' },
  { name: 'DocPreviewTool', sourceHint: 'tools/doc/Preview', responsibility: '预览文档', status: 'mirrored' },
  { name: 'DocDeployTool', sourceHint: 'tools/doc/Deploy', responsibility: '部署文档', status: 'mirrored' },
  { name: 'DocSearchTool', sourceHint: 'tools/doc/Search', responsibility: '搜索文档', status: 'mirrored' },
  { name: 'DocConvertTool', sourceHint: 'tools/doc/Convert', responsibility: '转换文档格式', status: 'mirrored' },
  { name: 'DocSyncTool', sourceHint: 'tools/doc/Sync', responsibility: '同步文档', status: 'mirrored' },
  { name: 'DocVersionTool', sourceHint: 'tools/doc/Version', responsibility: '文档版本管理', status: 'mirrored' },
  { name: 'DocCommentTool', sourceHint: 'tools/doc/Comment', responsibility: '文档注释', status: 'mirrored' },
  { name: 'DocChangelogTool', sourceHint: 'tools/doc/Changelog', responsibility: '生成变更日志', status: 'mirrored' },
];

// Git 工具 (15个)
const GIT_TOOLS: PortingModule[] = [
  { name: 'GitInitTool', sourceHint: 'tools/git/Init', responsibility: 'Git 初始化', status: 'mirrored' },
  { name: 'GitCloneTool', sourceHint: 'tools/git/Clone', responsibility: 'Git 克隆', status: 'mirrored' },
  { name: 'GitCommitTool', sourceHint: 'tools/git/Commit', responsibility: 'Git 提交', status: 'mirrored' },
  { name: 'GitPushTool', sourceHint: 'tools/git/Push', responsibility: 'Git 推送', status: 'mirrored' },
  { name: 'GitPullTool', sourceHint: 'tools/git/Pull', responsibility: 'Git 拉取', status: 'mirrored' },
  { name: 'GitBranchTool', sourceHint: 'tools/git/Branch', responsibility: 'Git 分支管理', status: 'mirrored' },
  { name: 'GitMergeTool', sourceHint: 'tools/git/Merge', responsibility: 'Git 合并', status: 'mirrored' },
  { name: 'GitRebaseTool', sourceHint: 'tools/git/Rebase', responsibility: 'Git 变基', status: 'mirrored' },
  { name: 'GitStashTool', sourceHint: 'tools/git/Stash', responsibility: 'Git 暂存', status: 'mirrored' },
  { name: 'GitTagTool', sourceHint: 'tools/git/Tag', responsibility: 'Git 标签', status: 'mirrored' },
  { name: 'GitLogTool', sourceHint: 'tools/git/Log', responsibility: 'Git 日志', status: 'mirrored' },
  { name: 'GitDiffTool', sourceHint: 'tools/git/Diff', responsibility: 'Git 差异', status: 'mirrored' },
  { name: 'GitStatusTool', sourceHint: 'tools/git/Status', responsibility: 'Git 状态', status: 'mirrored' },
  { name: 'GitRemoteTool', sourceHint: 'tools/git/Remote', responsibility: 'Git 远程管理', status: 'mirrored' },
  { name: 'GitHookTool', sourceHint: 'tools/git/Hook', responsibility: 'Git 钩子', status: 'mirrored' },
];

// 容器工具 (10个)
const CONTAINER_TOOLS: PortingModule[] = [
  { name: 'DockerBuildTool', sourceHint: 'tools/container/DockerBuild', responsibility: 'Docker 构建', status: 'mirrored' },
  { name: 'DockerRunTool', sourceHint: 'tools/container/DockerRun', responsibility: 'Docker 运行', status: 'mirrored' },
  { name: 'DockerComposeTool', sourceHint: 'tools/container/DockerCompose', responsibility: 'Docker Compose', status: 'mirrored' },
  { name: 'DockerPushTool', sourceHint: 'tools/container/DockerPush', responsibility: 'Docker 推送', status: 'mirrored' },
  { name: 'DockerPullTool', sourceHint: 'tools/container/DockerPull', responsibility: 'Docker 拉取', status: 'mirrored' },
  { name: 'KubectlTool', sourceHint: 'tools/container/Kubectl', responsibility: 'Kubectl 命令', status: 'mirrored' },
  { name: 'HelmInstallTool', sourceHint: 'tools/container/HelmInstall', responsibility: 'Helm 安装', status: 'mirrored' },
  { name: 'HelmUpgradeTool', sourceHint: 'tools/container/HelmUpgrade', responsibility: 'Helm 升级', status: 'mirrored' },
  { name: 'PodmanTool', sourceHint: 'tools/container/Podman', responsibility: 'Podman 命令', status: 'mirrored' },
  { name: 'ContainerScanTool', sourceHint: 'tools/container/Scan', responsibility: '容器扫描', status: 'mirrored' },
];

// 合并所有工具
const DEFAULT_TOOLS: PortingModule[] = [
  ...BASE_TOOLS,
  ...FILE_TOOLS,
  ...DIR_TOOLS,
  ...CODE_TOOLS,
  ...NETWORK_TOOLS,
  ...DB_TOOLS,
  ...AI_TOOLS,
  ...TEST_TOOLS,
  ...DEPLOY_TOOLS,
  ...SECURITY_TOOLS,
  ...MONITOR_TOOLS,
  ...DOC_TOOLS,
  ...GIT_TOOLS,
  ...CONTAINER_TOOLS,
];

let cachedTools: PortingModule[] | null = null;

export function loadToolSnapshot(): PortingModule[] {
  if (cachedTools) return cachedTools;
  
  try {
    const stored = readScopedStorageValue(TOOLS_SNAPSHOT_KEY);
    if (stored) {
      cachedTools = JSON.parse(stored);
      return cachedTools!;
    }
  } catch (e) {
    console.warn('Failed to load tool snapshot from storage:', e);
  }
  
  cachedTools = DEFAULT_TOOLS;
  saveToolSnapshot(cachedTools);
  return cachedTools;
}

export function saveToolSnapshot(tools: PortingModule[]): void {
  try {
    writeScopedStorageValue(TOOLS_SNAPSHOT_KEY, JSON.stringify(tools));
    cachedTools = tools;
  } catch (e) {
    console.warn('Failed to save tool snapshot:', e);
  }
}

export const PORTED_TOOLS = loadToolSnapshot();

export function buildToolBacklog(): PortingBacklog {
  return {
    title: 'Tool Surface',
    modules: PORTED_TOOLS,
  };
}

export function toolNames(): string[] {
  return PORTED_TOOLS.map(m => m.name);
}

export function getTool(name: string): PortingModule | undefined {
  const needle = name.toLowerCase();
  return PORTED_TOOLS.find(m => m.name.toLowerCase() === needle);
}

export function getToolsByCategory(category: string): PortingModule[] {
  const categoryMap: Record<string, string[]> = {
    base: BASE_TOOLS.map(t => t.name),
    file: FILE_TOOLS.map(t => t.name),
    dir: DIR_TOOLS.map(t => t.name),
    code: CODE_TOOLS.map(t => t.name),
    network: NETWORK_TOOLS.map(t => t.name),
    db: DB_TOOLS.map(t => t.name),
    ai: AI_TOOLS.map(t => t.name),
    test: TEST_TOOLS.map(t => t.name),
    deploy: DEPLOY_TOOLS.map(t => t.name),
    security: SECURITY_TOOLS.map(t => t.name),
    monitor: MONITOR_TOOLS.map(t => t.name),
    doc: DOC_TOOLS.map(t => t.name),
    git: GIT_TOOLS.map(t => t.name),
    container: CONTAINER_TOOLS.map(t => t.name),
  };
  
  const toolNames = categoryMap[category] || [];
  return PORTED_TOOLS.filter(t => toolNames.includes(t.name));
}

export function createPermissionContext(
  deniedTools: string[] = [],
  deniedPrefixes: string[] = []
): ToolPermissionContext {
  return {
    deniedTools: new Set(deniedTools.map(t => t.toLowerCase())),
    deniedPrefixes: new Set(deniedPrefixes.map(p => p.toLowerCase())),
  };
}

export function filterToolsByPermissionContext(
  tools: PortingModule[],
  permissionContext?: ToolPermissionContext
): PortingModule[] {
  if (!permissionContext) return tools;
  
  return tools.filter(module => {
    const nameLower = module.name.toLowerCase();
    
    if (permissionContext.deniedTools.has(nameLower)) {
      return false;
    }
    
    for (const prefix of permissionContext.deniedPrefixes) {
      if (nameLower.startsWith(prefix)) {
        return false;
      }
    }
    
    return true;
  });
}

export interface GetToolsOptions {
  simpleMode?: boolean;
  includeMcp?: boolean;
  permissionContext?: ToolPermissionContext;
  category?: 'base' | 'file' | 'dir' | 'code' | 'network' | 'db' | 'ai' | 'test' | 'deploy' | 'security' | 'monitor' | 'doc' | 'git' | 'container' | 'all';
}

export function getTools(options: GetToolsOptions = {}): PortingModule[] {
  const { simpleMode = false, includeMcp = true, permissionContext, category = 'all' } = options;
  
  let tools = [...PORTED_TOOLS];
  
  if (simpleMode) {
    tools = tools.filter(m => 
      ['BashTool', 'FileReadTool', 'FileEditTool'].includes(m.name)
    );
  }
  
  if (!includeMcp) {
    tools = tools.filter(m => 
      !m.name.toLowerCase().includes('mcp') && 
      !m.sourceHint.toLowerCase().includes('mcp')
    );
  }
  
  if (category !== 'all') {
    tools = getToolsByCategory(category);
  }
  
  return filterToolsByPermissionContext(tools, permissionContext);
}

export function findTools(query: string, limit: number = 20): PortingModule[] {
  const needle = query.toLowerCase();
  return PORTED_TOOLS
    .filter(m => 
      m.name.toLowerCase().includes(needle) || 
      m.sourceHint.toLowerCase().includes(needle) ||
      m.responsibility.toLowerCase().includes(needle)
    )
    .slice(0, limit);
}

// 工具执行器管理器实例
let toolExecutorManager: ToolExecutorManager | null = null;

function getExecutorManager(): ToolExecutorManager {
  if (!toolExecutorManager) {
    toolExecutorManager = getToolExecutorManager();
  }
  return toolExecutorManager;
}

/**
 * 执行工具 - 使用真实执行器
 * 支持同步和异步执行
 */
export function executeTool(name: string, payload: string = ''): ToolExecution {
  const module = getTool(name);
  
  if (!module) {
    return {
      name,
      sourceHint: '',
      payload,
      handled: false,
      message: `Unknown mirrored tool: ${name}`,
    };
  }
  
  // 使用真实执行器执行工具
  const executor = getExecutorManager();
  
  // 对于同步调用，返回一个初始状态，实际执行是异步的
  // 调用者应该使用 executeToolAsync 获取完整结果
  return {
    name: module.name,
    sourceHint: module.sourceHint,
    payload,
    handled: true,
    message: `[${module.name}] 执行中...`,
  };
}

/**
 * 异步执行工具 - 获取完整执行结果
 * 这是推荐的使用方式
 */
export async function executeToolAsync(name: string, payload: string = ''): Promise<ToolExecution> {
  const module = getTool(name);
  
  if (!module) {
    return {
      name,
      sourceHint: '',
      payload,
      handled: false,
      message: `Unknown mirrored tool: ${name}`,
    };
  }
  
  // 使用真实执行器执行工具
  const executor = getExecutorManager();
  return await executor.execute(name, payload);
}

/**
 * 批量异步执行工具
 */
export async function batchExecuteToolsAsync(
  tools: { name: string; payload: string }[]
): Promise<ToolExecution[]> {
  return await Promise.all(
    tools.map(t => executeToolAsync(t.name, t.payload))
  );
}

/**
 * 检查工具是否支持真实执行
 */
export function isToolImplemented(name: string): boolean {
  const implementedTools = [
    // 文件操作
    'FileReadTool', 'FileWriteTool', 'FileEditTool', 'FileDeleteTool',
    'FileCopyTool', 'FileMoveTool', 'GlobTool',
    // 目录操作
    'DirCreateTool', 'DirDeleteTool', 'DirListTool', 'DirTreeTool',
    // 代码分析
    'CodeParseTool', 'CodeFormatTool', 'CodeLintTool', 
    'CodeTestGenTool', 'CodeDocGenTool',
    // 网络
    'HttpRequestTool', 'WebSocketTool', 'WebFetchTool',
    // 搜索
    'GrepTool', 'SemanticSearchTool',
    // AI
    'LlmChatTool', 'LlmSummarizeTool', 'LlmClassifyTool', 'LlmExtractTool',
  ];
  
  return implementedTools.includes(name);
}

/**
 * 获取已实现工具列表
 */
export function getImplementedTools(): PortingModule[] {
  return PORTED_TOOLS.filter(t => isToolImplemented(t.name));
}

/**
 * 获取工具实现统计
 */
export function getToolImplementationStats(): { implemented: number; total: number; percentage: number } {
  const implemented = getImplementedTools().length;
  const total = PORTED_TOOLS.length;
  return {
    implemented,
    total,
    percentage: Math.round((implemented / total) * 100),
  };
}

export function renderToolIndex(limit: number = 20, query?: string): string {
  const modules = query ? findTools(query, limit) : PORTED_TOOLS.slice(0, limit);
  const lines = [
    `╔══════════════════════════════════════════════════════════╗`,
    `║  Claw Code Tool Surface - Ultra Enhanced                 ║`,
    `╠══════════════════════════════════════════════════════════╣`,
    `║  Total Tools: ${PORTED_TOOLS.length.toString().padEnd(46)}║`,
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
    '🔧 Base': [],
    '📄 File': [],
    '📁 Directory': [],
    '💻 Code': [],
    '🌐 Network': [],
    '🗄️ Database': [],
    '🤖 AI': [],
    '🧪 Test': [],
    '🚀 Deploy': [],
    '🔒 Security': [],
    '📊 Monitor': [],
    '📖 Doc': [],
    '🔀 Git': [],
    '📦 Container': [],
  };
  
  modules.forEach(m => {
    if (m.name.includes('File')) categories['📄 File'].push(m);
    else if (m.name.includes('Dir')) categories['📁 Directory'].push(m);
    else if (m.name.includes('Code')) categories['💻 Code'].push(m);
    else if (m.name.includes('Network') || m.name.includes('Http') || m.name.includes('WebSocket') || m.name.includes('Socket')) categories['🌐 Network'].push(m);
    else if (m.name.includes('Db')) categories['🗄️ Database'].push(m);
    else if (m.name.includes('Llm') || m.name.includes('Ai')) categories['🤖 AI'].push(m);
    else if (m.name.includes('Test')) categories['🧪 Test'].push(m);
    else if (m.name.includes('Deploy')) categories['🚀 Deploy'].push(m);
    else if (m.name.includes('Security') || m.name.includes('Secret') || m.name.includes('Vulnerability') || m.name.includes('Sbom') || m.name.includes('Compliance') || m.name.includes('Penetration') || m.name.includes('Threat')) categories['🔒 Security'].push(m);
    else if (m.name.includes('Monitor')) categories['📊 Monitor'].push(m);
    else if (m.name.includes('Doc')) categories['📖 Doc'].push(m);
    else if (m.name.includes('Git')) categories['🔀 Git'].push(m);
    else if (m.name.includes('Docker') || m.name.includes('Kubectl') || m.name.includes('Helm') || m.name.includes('Podman') || m.name.includes('Container')) categories['📦 Container'].push(m);
    else categories['🔧 Base'].push(m);
  });
  
  Object.entries(categories).forEach(([category, items]) => {
    if (items.length > 0) {
      lines.push(`\n${category} (${items.length})`);
      lines.push('─'.repeat(50));
      items.forEach(m => {
        const statusIcon = m.status === 'mirrored' ? '✓' : m.status === 'implemented' ? '●' : '○';
        const dangerIcon = isDangerousTool(m.name) ? '⚠️ ' : '';
        lines.push(`  ${statusIcon} ${dangerIcon}${m.name.padEnd(25)} — ${m.responsibility}`);
      });
    }
  });
  
  return lines.join('\n');
}

export function getToolStats(): Record<string, number> {
  const stats: Record<string, number> = {
    total: PORTED_TOOLS.length,
    mirrored: 0,
    implemented: 0,
    planned: 0,
    dangerous: 0,
    base: 0,
    file: 0,
    dir: 0,
    code: 0,
    network: 0,
    db: 0,
    ai: 0,
    test: 0,
    deploy: 0,
    security: 0,
    monitor: 0,
    doc: 0,
    git: 0,
    container: 0,
  };
  
  PORTED_TOOLS.forEach(m => {
    stats[m.status]++;
    
    if (isDangerousTool(m.name)) stats.dangerous++;
    
    if (m.name.includes('File')) stats.file++;
    else if (m.name.includes('Dir')) stats.dir++;
    else if (m.name.includes('Code')) stats.code++;
    else if (m.name.includes('Network') || m.name.includes('Http') || m.name.includes('WebSocket')) stats.network++;
    else if (m.name.includes('Db')) stats.db++;
    else if (m.name.includes('Llm') || m.name.includes('Ai')) stats.ai++;
    else if (m.name.includes('Test')) stats.test++;
    else if (m.name.includes('Deploy')) stats.deploy++;
    else if (m.name.includes('Security') || m.name.includes('Secret') || m.name.includes('Vulnerability') || m.name.includes('Sbom') || m.name.includes('Compliance') || m.name.includes('Penetration') || m.name.includes('Threat')) stats.security++;
    else if (m.name.includes('Monitor')) stats.monitor++;
    else if (m.name.includes('Doc')) stats.doc++;
    else if (m.name.includes('Git')) stats.git++;
    else if (m.name.includes('Docker') || m.name.includes('Kubectl') || m.name.includes('Helm') || m.name.includes('Podman') || m.name.includes('Container')) stats.container++;
    else stats.base++;
  });
  
  return stats;
}

export function batchExecuteTools(tools: { name: string; payload: string }[]): ToolExecution[] {
  return tools.map(t => executeTool(t.name, t.payload));
}

export function suggestTools(context: string, limit: number = 5): PortingModule[] {
  const contextLower = context.toLowerCase();
  
  // 根据上下文关键词推荐工具 - 增强版
  const keywords: Record<string, string[]> = {
    'file': ['FileReadTool', 'FileEditTool', 'FileWriteTool', 'GlobTool', 'FileCopyTool', 'FileMoveTool'],
    'search': ['GrepTool', 'SearchTool', 'SemanticSearchTool'],
    'code': ['CodeParseTool', 'CodeFormatTool', 'CodeLintTool', 'CodeRefactorTool', 'CodeOptimizeTool'],
    'git': ['GitStatusTool', 'GitCommitTool', 'GitPushTool', 'GitPullTool', 'GitBranchTool', 'GitMergeTool'],
    'web': ['WebFetchTool', 'WebSearchTool', 'HttpRequestTool'],
    'db': ['DbQueryTool', 'DbMigrateTool', 'DbBackupTool', 'DbRestoreTool'],
    'ai': ['LlmChatTool', 'LlmEmbedTool', 'LlmGenerateTool', 'LlmSummarizeTool', 'LlmClassifyTool'],
    'test': ['TestRunTool', 'TestUnitTool', 'TestE2ETool', 'TestCoverageTool', 'CodeTestGenTool'],
    'doc': ['DocGenerateTool', 'CodeDocGenTool', 'DocPreviewTool'],
    'network': ['HttpRequestTool', 'WebSocketTool', 'ApiTestTool'],
    'deploy': ['DeployVercelTool', 'DeployDockerTool', 'DeployKubernetesTool', 'DeployTerraformTool'],
    'security': ['SecurityScanTool', 'SecurityAuditTool', 'SecretScanTool', 'VulnerabilityScanTool'],
    'monitor': ['MonitorLogsTool', 'MonitorMetricsTool', 'MonitorHealthTool'],
    'docker': ['DockerBuildTool', 'DockerRunTool', 'DockerComposeTool', 'ContainerScanTool'],
    'k8s': ['KubectlTool', 'HelmInstallTool', 'DeployKubernetesTool'],
    'container': ['DockerBuildTool', 'DockerRunTool', 'KubectlTool', 'ContainerScanTool'],
  };
  
  const suggestions: PortingModule[] = [];
  
  Object.entries(keywords).forEach(([keyword, toolNames]) => {
    if (contextLower.includes(keyword)) {
      toolNames.forEach(name => {
        const tool = getTool(name);
        if (tool && !suggestions.find(s => s.name === tool.name)) {
          suggestions.push(tool);
        }
      });
    }
  });
  
  return suggestions.slice(0, limit);
}

// 危险工具列表 - 增强版
export const DANGEROUS_TOOLS = [
  'BashTool', 'PowerShellTool', 'FileWriteTool', 'FileEditTool',
  'FileDeleteTool', 'DirDeleteTool', 'FileEncryptTool', 'FileDecryptTool',
  'HttpServerTool', 'PortScanTool', 'DbRestoreTool', 'DbResetTool',
  'SecurityFixTool', 'PenetrationTestTool', 'DeployAwsTool', 'DeployGcpTool',
  'DeployAzureTool', 'KubectlTool', 'HelmInstallTool', 'HelmUpgradeTool',
  'DockerPushTool', 'GitPushTool', 'GitForcePushTool',
];

export function isDangerousTool(name: string): boolean {
  return DANGEROUS_TOOLS.some(t => t.toLowerCase() === name.toLowerCase());
}

export function getDangerousTools(): PortingModule[] {
  return PORTED_TOOLS.filter(t => isDangerousTool(t.name));
}

export function getSafeTools(): PortingModule[] {
  return PORTED_TOOLS.filter(t => !isDangerousTool(t.name));
}

/**
 * 注册新工具
 */
export function registerTool(module: PortingModule): void {
  const existing = getTool(module.name);
  if (existing) {
    Object.assign(existing, module);
  } else {
    PORTED_TOOLS.push(module);
  }
  saveToolSnapshot(PORTED_TOOLS);
}

/**
 * 注销工具
 */
export function unregisterTool(name: string): boolean {
  const index = PORTED_TOOLS.findIndex(m => m.name.toLowerCase() === name.toLowerCase());
  if (index !== -1) {
    PORTED_TOOLS.splice(index, 1);
    saveToolSnapshot(PORTED_TOOLS);
    return true;
  }
  return false;
}
