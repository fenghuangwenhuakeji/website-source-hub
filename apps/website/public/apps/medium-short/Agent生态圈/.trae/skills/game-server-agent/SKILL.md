---
name: "game-server-agent"
description: "Ultimate game server development expert with backend architecture, database design, API development, and server optimization. Provides complete solutions for game backends, player data management, leaderboards, and scalable server infrastructure."
---

# Game Server Agent - 游戏服务器开发专家

## 核心理念

**服务器即基石，架构即未来。用稳健的后端，支撑百万玩家的梦想。**

Game Server Agent 是专业级游戏服务器开发助手，提供从架构设计到性能优化的完整后端解决方案，帮助开发者打造稳定、可扩展的游戏服务器。

## 核心工作流程

```
需求分析 → 架构设计 → 数据库设计 → API开发 → 性能优化 → 部署运维
```

## 服务器架构

### 微服务架构

```
┌─────────────────────────────────────────────────────────┐
│                    游戏服务器架构                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  网关服务   │  │  负载均衡   │  │  CDN分发   │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                │                │             │
│         └────────────────┼────────────────┘             │
│                          │                              │
│  ┌───────────────────────┼───────────────────────┐     │
│  │                       │                       │     │
│  ▼                       ▼                       ▼     │
│ ┌─────────┐        ┌─────────┐        ┌─────────┐     │
│ │ 认证服务 │        │ 游戏服务 │        │ 社交服务 │     │
│ └────┬────┘        └────┬────┘        └────┬────┘     │
│      │                  │                  │           │
│  ┌───┴───┐          ┌───┴───┐          ┌───┴───┐     │
│  │ 用户DB │          │ 游戏DB │          │ 社交DB │     │
│  └───────┘          └───────┘          └───────┘     │
│                                                       │
│  ┌─────────┐        ┌─────────┐        ┌─────────┐   │
│  │ 匹配服务 │        │ 排行榜  │        │ 支付服务 │   │
│  └────┬────┘        └────┬────┘        └────┬────┘   │
│       │                  │                  │         │
│   ┌───┴───┐          ┌───┴───┐          ┌───┴───┐   │
│   │ Redis │          │ Redis │          │ 支付DB │   │
│   └───────┘          └───────┘          └───────┘   │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### 服务模块设计

```yaml
认证服务:
  功能:
    - 用户注册/登录
    - Token管理
    - 第三方登录
    - 设备绑定
    
  技术栈:
    - JWT认证
    - Redis缓存
    - OAuth2.0
    
游戏服务:
  功能:
    - 游戏逻辑处理
    - 玩家数据管理
    - 物品/背包系统
    - 成就系统
    
  技术栈:
    - WebSocket
    - 消息队列
    - 数据库分片
    
社交服务:
  功能:
    - 好友系统
    - 公会系统
    - 聊天系统
    - 举报系统
    
  技术栈:
    - Redis
    - MongoDB
    - WebSocket
    
匹配服务:
  功能:
    - 玩家匹配
    - 房间管理
    - 排位系统
    
  技术栈:
    - Redis
    - 自定义算法
    - 事件驱动
```

## 数据库设计

### 玩家数据模型

```sql
-- 玩家基础表
CREATE TABLE players (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    status TINYINT DEFAULT 1,
    INDEX idx_username (username),
    INDEX idx_email (email)
);

-- 玩家数据表
CREATE TABLE player_data (
    player_id BIGINT PRIMARY KEY,
    level INT DEFAULT 1,
    experience BIGINT DEFAULT 0,
    gold BIGINT DEFAULT 0,
    gems INT DEFAULT 0,
    vip_level INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id)
);

-- 玩家物品表
CREATE TABLE player_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    player_id BIGINT NOT NULL,
    item_id INT NOT NULL,
    quantity INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_player_id (player_id),
    FOREIGN KEY (player_id) REFERENCES players(id)
);

-- 排行榜表
CREATE TABLE leaderboards (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    player_id BIGINT NOT NULL,
    score BIGINT DEFAULT 0,
    rank_type TINYINT NOT NULL,
    season INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_player_rank (player_id, rank_type, season),
    INDEX idx_score (rank_type, season, score DESC),
    FOREIGN KEY (player_id) REFERENCES players(id)
);
```

### Redis缓存设计

```yaml
Redis数据结构:
  玩家缓存:
    键: player:{player_id}
    类型: Hash
    字段:
      - username
      - level
      - gold
      - gems
    过期: 1小时
    
  在线玩家:
    键: online_players
    类型: Set
    值: player_id列表
    
  排行榜:
    键: leaderboard:{type}:{season}
    类型: Sorted Set
    分数: 玩家分数
    成员: player_id
    
  匹配队列:
    键: match_queue:{mode}
    类型: List
    值: player_id
    
  聊天频道:
    键: chat:{channel_id}
    类型: List
    值: 消息JSON
    长度限制: 100条
```

## API设计

### RESTful API

```yaml
API端点设计:
  认证:
    POST /api/v1/auth/register:
      请求:
        username: string
        email: string
        password: string
      响应:
        success: boolean
        token: string
        
    POST /api/v1/auth/login:
      请求:
        username: string
        password: string
      响应:
        success: boolean
        token: string
        player: PlayerData
        
  玩家:
    GET /api/v1/player/{id}:
      响应:
        id: number
        username: string
        level: number
        gold: number
        
    PUT /api/v1/player/{id}:
      请求:
        level: number
        experience: number
      响应:
        success: boolean
        
  物品:
    GET /api/v1/player/{id}/items:
      响应:
        items: Item[]
        
    POST /api/v1/player/{id}/items:
      请求:
        item_id: number
        quantity: number
      响应:
        success: boolean
```

### WebSocket事件

```yaml
WebSocket事件:
  连接:
    事件: connection
    数据:
      token: string
      
  游戏事件:
    事件: game_action
    数据:
      action: string
      params: object
      
  聊天:
    事件: chat_message
    数据:
      channel: string
      message: string
      
  匹配:
    事件: match_found
    数据:
      room_id: string
      players: Player[]
```

## 性能优化

```yaml
性能优化策略:
  数据库:
    - 读写分离
    - 分库分表
    - 索引优化
    - 连接池
    
  缓存:
    - 多级缓存
    - 缓存预热
    - 缓存穿透防护
    - 缓存雪崩防护
    
  服务:
    - 异步处理
    - 消息队列
    - 限流熔断
    - 服务降级
    
  网络:
    - CDN加速
    - 就近接入
    - 协议优化
    - 压缩传输
```

## 调用触发条件

**立即调用此 Skill 当：**

- 需要游戏服务器架构设计
- 需要数据库设计
- 需要API开发
- 需要性能优化
- 需要部署方案

## 输出保证

- [ ] 完整的服务器架构设计
- [ ] 数据库设计文档
- [ ] API接口文档
- [ ] 性能优化方案
- [ ] 部署运维指南

---

**记住：稳定的服务器是游戏成功的基石！**
