# Requirements Document

## Introduction

本文档定义了 DungeonSpire 项目的全功能集成需求。DungeonSpire 是一款 Roguelike 卡牌构筑游戏，已创建大量后端系统（LLM 聊天、装备生成、成就系统等），但前端仅实现了基础战斗。本规范旨在将所有已创建的后端系统完整集成到主页面，实现完整的游戏体验。

## Glossary

- **Chat_Panel**: 右侧聊天面板，用于与 NPC 进行 AI 对话
- **LLM_Service**: 大语言模型服务，负责调用 OpenAI 格式 API 生成 NPC 对话
- **RAG_Service**: 检索增强生成服务，从知识库检索相关上下文增强 AI 回复
- **Chat_Manager**: 聊天管理器，管理多角色对话会话和历史记录
- **Action_Parser**: 行为解析器，解析 AI 回复中的指令标记并执行游戏动作
- **Trigger_System**: 触发系统，根据对话内容触发游戏事件
- **Loot_Generator**: 装备生成器，动态生成带词缀的随机装备
- **Affix**: 词缀，包括前缀和后缀，为装备添加随机属性
- **Map_System**: 地图系统，管理 Roguelike 地图节点和探索
- **Achievement_System**: 成就系统，追踪和解锁游戏成就
- **Trading_System**: 交易系统，管理商店和经济
- **Character_Growth_System**: 角色养成系统，管理经验、升级和好感度
- **Mercenary_System**: 雇佣兵系统，管理可招募的战斗伙伴
- **NPC**: 非玩家角色，可与玩家进行 AI 对话的游戏角色
- **Dungeon**: 副本，包含特定敌人、Boss 和主题的游戏区域

## Requirements

### Requirement 1: AI 聊天面板集成

**User Story:** As a player, I want to chat with NPCs using AI, so that I can have immersive conversations and receive dynamic responses.

#### Acceptance Criteria

1. WHEN the game view is displayed, THE Chat_Panel SHALL render on the right side of the screen with a collapsible toggle button
2. WHEN a player clicks on an NPC or selects an NPC from the chat panel, THE Chat_Manager SHALL initialize a chat session with that NPC's system prompt and LLM configuration
3. WHEN a player sends a message, THE LLM_Service SHALL send the message to the configured API endpoint and return the AI response
4. WHEN the LLM_Service receives a response, THE Chat_Panel SHALL display the response with the NPC's avatar and name
5. WHEN the AI response contains action markers (e.g., [GIVE_ITEM: item_id]), THE Action_Parser SHALL parse and execute the corresponding game actions
6. IF the LLM API call fails, THEN THE Chat_Panel SHALL display a fallback message and allow retry
7. WHEN a chat session is active, THE Chat_Manager SHALL maintain conversation history for context continuity

### Requirement 2: RAG 知识增强

**User Story:** As a player, I want NPCs to have knowledge about the game world, so that conversations feel authentic and informative.

#### Acceptance Criteria

1. WHEN the game initializes, THE RAG_Service SHALL load knowledge from data/lore/, data/characters/knowledge/, and related directories
2. WHEN a player sends a message, THE RAG_Service SHALL search the knowledge base for relevant context using keyword matching
3. WHEN relevant context is found, THE RAG_Service SHALL inject the context into the system prompt before sending to LLM
4. WHEN an NPC has character-specific knowledge (e.g., KaelenKnowledge.js), THE RAG_Service SHALL prioritize that character's knowledge in retrieval

### Requirement 3: 动态装备生成

**User Story:** As a player, I want to receive randomly generated equipment with unique affixes, so that loot feels exciting and varied.

#### Acceptance Criteria

1. WHEN a combat victory occurs, THE Loot_Generator SHALL generate equipment based on floor level and rarity
2. WHEN generating equipment, THE Loot_Generator SHALL select a base item and apply prefixes/suffixes based on rarity tier
3. WHEN a prefix is applied, THE Loot_Generator SHALL modify the item name and stats according to the affix definition
4. WHEN a suffix is applied, THE Loot_Generator SHALL modify the item name and stats according to the affix definition
5. WHEN equipment is generated, THE Loot_Generator SHALL scale stats based on the current floor level
6. WHEN displaying generated equipment, THE UI SHALL show the full item name, stats, and affix effects

### Requirement 4: Roguelike 地图系统

**User Story:** As a player, I want to explore a procedurally generated map, so that each run feels unique and strategic.

#### Acceptance Criteria

1. WHEN a new run starts, THE Map_System SHALL generate a multi-floor map with branching paths
2. WHEN generating a map, THE Map_System SHALL place nodes of types: Enemy, Elite, Boss, Event, Rest, Shop, Treasure
3. WHEN a player clicks on an accessible node, THE Map_System SHALL transition to the corresponding encounter
4. WHEN a node is completed, THE Map_System SHALL mark it as visited and unlock connected nodes
5. WHEN displaying the map, THE UI SHALL show node types with distinct icons and highlight the current position
6. WHEN the player reaches a Boss node, THE Map_System SHALL trigger the act boss encounter

### Requirement 5: 成就系统

**User Story:** As a player, I want to unlock achievements for my accomplishments, so that I have long-term goals and recognition.

#### Acceptance Criteria

1. WHEN the game initializes, THE Achievement_System SHALL load all achievement definitions from data/achievements/
2. WHEN a tracked event occurs (combat victory, exploration, social interaction), THE Achievement_System SHALL check if any achievement conditions are met
3. WHEN an achievement is unlocked, THE UI SHALL display a notification with the achievement name and icon
4. WHEN viewing achievements, THE UI SHALL display all achievements organized by category (combat, exploration, social, collection, challenge)
5. WHEN an achievement is locked, THE UI SHALL show the unlock condition hint

### Requirement 6: 角色互动与好感度

**User Story:** As a player, I want to build relationships with NPCs, so that I can unlock special content and feel connected to characters.

#### Acceptance Criteria

1. WHEN interacting with an NPC, THE Character_Growth_System SHALL track relationship points
2. WHEN relationship points reach certain thresholds, THE Character_Growth_System SHALL unlock new dialogue options or events
3. WHEN a player gives a gift to an NPC, THE Character_Growth_System SHALL modify relationship based on gift preferences
4. WHEN displaying NPC information, THE UI SHALL show current relationship level and progress

### Requirement 7: 新副本区域

**User Story:** As a player, I want to explore new dungeon areas like Sky City and Abyss, so that I have more content and challenges.

#### Acceptance Criteria

1. WHEN the player meets unlock requirements, THE Map_System SHALL make new dungeon areas accessible
2. WHEN entering a new dungeon area, THE UI SHALL apply the area's theme (background, music, style)
3. WHEN in a dungeon area, THE Combat_System SHALL spawn enemies specific to that area
4. WHEN reaching the end of a dungeon area, THE Combat_System SHALL spawn the area's boss

### Requirement 8: 交易与经济系统

**User Story:** As a player, I want to buy and sell items in shops, so that I can customize my build and manage resources.

#### Acceptance Criteria

1. WHEN entering a shop node, THE Trading_System SHALL generate shop inventory based on current floor and player level
2. WHEN a player purchases an item, THE Trading_System SHALL deduct gold and add the item to inventory
3. WHEN a player sells an item, THE Trading_System SHALL add gold based on item value with depreciation
4. WHEN displaying shop items, THE UI SHALL show item details, price, and affordability status

### Requirement 9: 雇佣兵系统

**User Story:** As a player, I want to hire mercenaries to fight alongside me, so that I have additional tactical options.

#### Acceptance Criteria

1. WHEN in a shop or specific event, THE Mercenary_System SHALL offer mercenaries for hire
2. WHEN a mercenary is hired, THE Combat_System SHALL include the mercenary in battle with their own actions
3. WHEN a mercenary takes damage, THE Combat_System SHALL track their HP separately from the player
4. WHEN displaying mercenary information, THE UI SHALL show mercenary stats, skills, and contract duration

### Requirement 10: 对话触发游戏事件

**User Story:** As a player, I want my conversations with NPCs to affect the game world, so that dialogue feels meaningful.

#### Acceptance Criteria

1. WHEN an AI response contains action markers, THE Action_Parser SHALL execute actions like GIVE_ITEM, START_QUEST, UNLOCK_DOOR
2. WHEN the Trigger_System detects specific keywords in dialogue, THE Trigger_System SHALL fire registered event handlers
3. WHEN a quest is started via dialogue, THE Quest_System SHALL track quest progress and objectives
4. WHEN a door is unlocked via dialogue, THE Map_System SHALL update accessible areas

### Requirement 11: UI 布局重构

**User Story:** As a player, I want a well-organized interface, so that I can access all features easily.

#### Acceptance Criteria

1. THE UI SHALL display the game view with combat area on the left/center and chat panel on the right
2. THE UI SHALL provide quick access buttons for: Map, Deck, Shop, Achievements, Settings
3. WHEN the chat panel is collapsed, THE UI SHALL expand the combat area to full width
4. THE UI SHALL be responsive and maintain usability at different screen sizes

### Requirement 12: 数据持久化

**User Story:** As a player, I want my progress to be saved, so that I can continue my adventure later.

#### Acceptance Criteria

1. WHEN the player makes progress (floor completion, item acquisition, achievement unlock), THE Save_System SHALL persist the game state
2. WHEN loading a saved game, THE Save_System SHALL restore all game state including chat history, inventory, and map progress
3. WHEN displaying the main menu, THE UI SHALL show continue button if a valid save exists
