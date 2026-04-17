# Implementation Plan: DungeonSpire Full Integration

## Overview

本实现计划将已创建的后端系统（LLM 聊天、装备生成、成就系统等）完整集成到前端主页面。采用渐进式集成策略，每个阶段完成后都可以独立测试。

## Tasks

- [x] 1. UI 布局重构与聊天面板框架
  - [x] 1.1 重构 index.html 布局，添加右侧聊天面板容器
    - 修改 game-view 区域为左右分栏布局
    - 添加 chat-panel 容器和折叠按钮
    - _Requirements: 11.1, 1.1_
  - [x] 1.2 创建 css/chat-panel.css 聊天面板样式
    - 聊天消息列表样式
    - 输入框和发送按钮样式
    - NPC 选择器样式
    - 折叠/展开动画
    - _Requirements: 11.1, 11.3_
  - [x] 1.3 实现 ChatPanelComponent 类
    - 创建 js/components/ChatPanelComponent.js
    - 实现 render()、toggle()、appendMessage() 方法
    - 实现 NPC 选择和消息发送 UI 交互
    - _Requirements: 1.1, 1.4_

- [ ] 2. LLM 服务集成
  - [ ] 2.1 创建 js/services/LLMServiceAdapter.js 适配器
    - 封装 src/services/llm/LLMService.js
    - 添加错误处理和重试逻辑
    - 实现 fallback 到 MockLLMService
    - _Requirements: 1.3, 1.6_
  - [ ] 2.2 创建 js/services/MockLLMServiceAdapter.js
    - 从 NPC reactions 和 starters 中选择回复
    - 模拟打字延迟效果
    - _Requirements: 1.6_
  - [ ]* 2.3 编写 LLM 服务属性测试
    - **Property 3: Action Marker Parsing**
    - **Validates: Requirements 1.5, 10.1**

- [ ] 3. 聊天管理器集成
  - [ ] 3.1 创建 js/systems/EnhancedChatManager.js
    - 集成 LLMServiceAdapter
    - 实现会话初始化和历史管理
    - 加载 NPC profiles 配置
    - _Requirements: 1.2, 1.7_
  - [ ] 3.2 创建 js/systems/ActionParserAdapter.js
    - 封装 src/systems/chat/ActionParser.js
    - 连接到游戏引擎执行动作
    - _Requirements: 1.5, 10.1_
  - [ ] 3.3 创建 js/systems/TriggerSystemAdapter.js
    - 封装 src/systems/chat/TriggerSystem.js
    - 注册游戏事件触发器
    - _Requirements: 10.2_
  - [ ]* 3.4 编写聊天历史属性测试
    - **Property 2: Chat History Accumulation**
    - **Validates: Requirements 1.7**

- [ ] 4. Checkpoint - 聊天系统基础功能
  - 确保聊天面板可以显示和折叠
  - 确保可以选择 NPC 并发送消息
  - 确保 AI 回复正确显示
  - 如有问题请询问用户

- [ ] 5. RAG 知识增强集成
  - [ ] 5.1 创建 js/services/RAGServiceAdapter.js
    - 封装 src/services/llm/RAGService.js
    - 实现知识库加载（从 data/lore/, data/characters/knowledge/）
    - 实现关键词搜索和上下文检索
    - _Requirements: 2.1, 2.2_
  - [ ] 5.2 实现 prompt 增强逻辑
    - 在 EnhancedChatManager 中集成 RAG
    - 实现角色特定知识优先级
    - _Requirements: 2.3, 2.4_
  - [ ]* 5.3 编写 RAG 属性测试
    - **Property 4: RAG Context Relevance**
    - **Property 6: Character Knowledge Prioritization**
    - **Validates: Requirements 2.2, 2.4**

- [ ] 6. 动态装备生成系统
  - [ ] 6.1 创建 js/systems/EnhancedLootGenerator.js
    - 封装 src/systems/loot/LootGenerator.js
    - 加载 data/affixes/prefixes/ 和 suffixes/ 数据
    - 实现完整的词缀应用逻辑
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [ ] 6.2 实现等级缩放系统
    - 根据楼层等级调整装备属性
    - 实现稀有度决定词缀数量逻辑
    - _Requirements: 3.5_
  - [ ] 6.3 创建装备展示 UI 组件
    - 在奖励界面显示生成的装备
    - 显示完整名称、属性、词缀效果
    - _Requirements: 3.6_
  - [ ]* 6.4 编写装备生成属性测试
    - **Property 7: Affix Application Correctness**
    - **Property 8: Rarity-Based Affix Count**
    - **Property 9: Level Scaling Monotonicity**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5**

- [ ] 7. Checkpoint - 装备生成系统
  - 确保战斗胜利后生成动态装备
  - 确保装备名称包含词缀
  - 确保属性正确缩放
  - 如有问题请询问用户

- [ ] 8. Roguelike 地图系统
  - [ ] 8.1 创建 js/systems/RoguelikeMapSystem.js
    - 实现多层分支地图生成算法
    - 实现节点类型分配（Enemy, Elite, Boss, Event, Rest, Shop, Treasure）
    - 加载 data/map/nodes/ 配置
    - _Requirements: 4.1, 4.2_
  - [ ] 8.2 实现地图导航逻辑
    - 节点可访问性计算
    - 节点完成和解锁逻辑
    - 当前位置追踪
    - _Requirements: 4.3, 4.4_
  - [ ] 8.3 创建地图 UI 组件
    - 修改 map-modal 显示新地图
    - 节点图标和连线渲染
    - 当前位置高亮
    - _Requirements: 4.5, 4.6_
  - [ ]* 8.4 编写地图系统属性测试
    - **Property 10: Map Connectivity**
    - **Property 11: Node Type Distribution**
    - **Property 12: Node Completion State Transition**
    - **Validates: Requirements 4.1, 4.2, 4.4**

- [ ] 9. 成就系统集成
  - [ ] 9.1 创建 js/systems/AchievementManager.js
    - 加载 data/achievements/ 所有成就定义
    - 实现成就条件检查逻辑
    - 连接到 EventBus 监听游戏事件
    - _Requirements: 5.1, 5.2_
  - [ ] 9.2 创建成就 UI 组件
    - 添加成就按钮到顶部栏
    - 创建成就列表弹窗（按类别分组）
    - 实现解锁通知动画
    - _Requirements: 5.3, 5.4, 5.5_
  - [ ]* 9.3 编写成就系统属性测试
    - **Property 13: Achievement Condition Checking**
    - **Validates: Requirements 5.2**

- [ ] 10. Checkpoint - 地图和成就系统
  - 确保地图正确生成和显示
  - 确保可以在地图上导航
  - 确保成就可以解锁和显示
  - 如有问题请询问用户

- [ ] 11. 角色互动与好感度系统
  - [ ] 11.1 创建 js/systems/RelationshipSystem.js
    - 封装 src/systems/CharacterGrowthSystem.js
    - 实现好感度点数追踪
    - 实现等级阈值和解锁逻辑
    - _Requirements: 6.1, 6.2_
  - [ ] 11.2 实现礼物系统
    - 加载 NPC 礼物偏好配置
    - 实现礼物赠送和好感度变化
    - _Requirements: 6.3_
  - [ ] 11.3 创建关系 UI 组件
    - 在 NPC 信息中显示好感度等级和进度
    - 显示可用的互动选项
    - _Requirements: 6.4_
  - [ ]* 11.4 编写好感度系统属性测试
    - **Property 14: Relationship Point Accumulation**
    - **Property 15: Gift Preference Effect**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [ ] 12. 新副本区域集成
  - [ ] 12.1 创建 js/systems/DungeonAreaManager.js
    - 加载 data/dungeons/ 配置（sky_city, abyss 等）
    - 实现区域解锁条件检查
    - 管理当前区域状态
    - _Requirements: 7.1_
  - [ ] 12.2 实现区域主题切换
    - 根据区域配置切换背景和音乐
    - 应用区域特定的视觉风格
    - _Requirements: 7.2_
  - [ ] 12.3 实现区域敌人和 Boss 生成
    - 修改敌人生成逻辑使用区域配置
    - 实现区域 Boss 战斗
    - _Requirements: 7.3, 7.4_
  - [ ]* 12.4 编写副本区域属性测试
    - **Property 16: Dungeon Area Enemy Restriction**
    - **Property 17: Area Boss Correctness**
    - **Validates: Requirements 7.3, 7.4**

- [ ] 13. 交易与经济系统
  - [ ] 13.1 创建 js/systems/EnhancedTradingSystem.js
    - 封装 src/systems/TradingSystem.js
    - 实现商店库存生成（基于楼层和等级）
    - 实现购买和出售逻辑
    - _Requirements: 8.1, 8.2, 8.3_
  - [ ] 13.2 增强商店 UI
    - 修改 shop-modal 显示动态生成的物品
    - 显示物品详情、价格、可购买状态
    - 添加出售功能
    - _Requirements: 8.4_
  - [ ]* 13.3 编写交易系统属性测试
    - **Property 18: Transaction Integrity**
    - **Property 19: Shop Item Display Completeness**
    - **Validates: Requirements 8.2, 8.3, 8.4**

- [ ] 14. Checkpoint - 副本和交易系统
  - 确保新副本区域可以解锁和进入
  - 确保区域主题正确应用
  - 确保商店功能正常
  - 如有问题请询问用户

- [ ] 15. 雇佣兵系统
  - [ ] 15.1 创建 js/systems/MercenarySystemAdapter.js
    - 封装 src/systems/MercenarySystem.js
    - 加载 data/mercenaries/ 配置
    - 实现雇佣和合同管理
    - _Requirements: 9.1_
  - [ ] 15.2 集成雇佣兵到战斗系统
    - 修改战斗逻辑包含雇佣兵行动
    - 实现雇佣兵 HP 独立追踪
    - _Requirements: 9.2, 9.3_
  - [ ] 15.3 创建雇佣兵 UI
    - 在商店/事件中显示可雇佣的雇佣兵
    - 显示雇佣兵状态、技能、合同时长
    - _Requirements: 9.4_
  - [ ]* 15.4 编写雇佣兵系统属性测试
    - **Property 20: Mercenary HP Independence**
    - **Validates: Requirements 9.3**

- [ ] 16. 对话触发游戏事件
  - [ ] 16.1 完善 ActionParser 动作类型
    - 实现 GIVE_ITEM、START_QUEST、UNLOCK_DOOR 等动作
    - 连接到相应的游戏系统
    - _Requirements: 10.1_
  - [ ] 16.2 实现任务系统基础
    - 创建 js/systems/QuestSystem.js
    - 实现任务追踪和目标检查
    - _Requirements: 10.3_
  - [ ] 16.3 实现地图区域解锁
    - 通过对话解锁新区域
    - 更新地图可访问性
    - _Requirements: 10.4_
  - [ ]* 16.4 编写触发系统属性测试
    - **Property 21: Trigger System Keyword Detection**
    - **Validates: Requirements 10.2**

- [ ] 17. 数据持久化系统
  - [ ] 17.1 扩展 SaveManager
    - 添加新状态字段（聊天历史、成就、好感度等）
    - 实现自动保存触发点
    - _Requirements: 12.1_
  - [ ] 17.2 实现完整状态恢复
    - 加载时恢复所有游戏状态
    - 恢复聊天历史和 NPC 关系
    - _Requirements: 12.2_
  - [ ] 17.3 更新主菜单
    - 检测有效存档显示继续按钮
    - 实现存档槽位选择
    - _Requirements: 12.3_
  - [ ]* 17.4 编写存档系统属性测试
    - **Property 22: Save/Load Round-Trip**
    - **Validates: Requirements 12.1, 12.2**

- [ ] 18. 最终集成与优化
  - [ ] 18.1 集成所有系统到 main.js
    - 初始化所有管理器和服务
    - 连接 EventBus 事件
    - 确保系统间正确通信
    - _Requirements: All_
  - [x] 18.2 UI 响应式优化
    - 测试不同屏幕尺寸
    - 优化移动端体验
    - _Requirements: 11.4_
  - [ ] 18.3 性能优化
    - 懒加载非关键资源
    - 优化渲染性能
    - _Requirements: All_

- [ ] 19. Final Checkpoint - 完整功能验证
  - 确保所有系统正常工作
  - 确保数据正确保存和加载
  - 确保 UI 响应正常
  - 如有问题请询问用户

## Notes

- 任务标记 `*` 的为可选测试任务，可跳过以加快 MVP 开发
- 每个 Checkpoint 后应进行手动测试验证
- 属性测试使用 fast-check 库，每个测试至少运行 100 次迭代
- 所有新文件放在 js/ 目录下，保持与现有代码结构一致
