# 星语心伴 (StarWhispers) 架构设计文档

## 1. 设计原则
严格复刻 `WriterCenterArchon` 的架构模式（DDD + Clean Architecture）。

## 2. 模块划分 (待参考项目确认后微调)

### 2.1 Domain Layer (核心业务领域)
- **UserDomain**: 
  - 实体: User, UserProfile, AgeGroup, ParentAccount
  - 逻辑: 年龄段判定、家庭组绑定
- **PersonalityDomain**:
  - 实体: NPTIResult, HoroscopeConfig, VirtualCharacter
  - 逻辑: NPTI问卷评分算法、星座运势计算、角色生成工厂
- **SafetyDomain**:
  - 实体: SafetyRule, BlockList, CrisisProtocol
  - 逻辑: 敏感词过滤、熔断机制

### 2.2 Application Layer (应用服务)
- **ChatService**: 
  - 负责对话流转
  - 调用 Infrastructure 的 LLM 接口
  - 集成 SafetyDomain 进行前置/后置检查
- **AnalysisService**: 
  - 处理测评请求
  - 生成情绪报告

### 2.3 Infrastructure Layer (基础设施)
- **LLMAdapter**: 统一的大模型调用接口（支持路由切换）
- **Persistence**: 数据库仓储实现
- **External**: 星座数据源接口

## 3. 开发路线图
1. **Phase 1**: 基础骨架搭建 (Scaffolding)
2. **Phase 2**: 核心领域模型实现 (User, Personality)
3. **Phase 3**: 基础设施对接 (LLM, DB)
4. **Phase 4**: 业务流程串联 (Chat, Safety)
