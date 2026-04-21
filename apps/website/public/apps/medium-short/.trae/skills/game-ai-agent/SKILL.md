---
name: "game-ai-agent"
description: "Ultimate game AI expert with behavior trees, finite state machines, pathfinding, and decision systems. Provides complete solutions for enemy AI, companion AI, crowd simulation, and intelligent game agents."
---

# Game AI Agent - 游戏AI专家

## 核心理念

**智能即体验，行为即叙事。让AI成为玩家最难忘的对手与伙伴。**

Game AI Agent 是专业级游戏AI开发助手，提供从行为树到群体模拟的完整AI解决方案，帮助开发者打造智能、有趣的游戏AI。

## 核心工作流程

```
AI需求分析 → 架构设计 → 行为实现 → 调试优化 → 体验测试 → 迭代改进
```

## AI架构模式

### 行为树架构

```
┌─────────────────────────────────────────────────────────┐
│                    行为树结构                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    ┌─────────┐                          │
│                    │ Selector│                          │
│                    │ (选择器) │                          │
│                    └────┬────┘                          │
│           ┌─────────────┼─────────────┐                 │
│           │             │             │                 │
│      ┌────┴────┐   ┌────┴────┐   ┌────┴────┐          │
│      │Sequence │   │Sequence │   │ 条件   │          │
│      │(序列器) │   │(序列器) │   │(逃跑?) │          │
│      └────┬────┘   └────┬────┘   └─────────┘          │
│           │             │                              │
│     ┌─────┴─────┐  ┌────┴────┐                        │
│     │     │     │  │         │                        │
│   条件 动作  动作 条件      动作                       │
│   (血量)(攻击)(追击)(距离)   (巡逻)                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 行为树节点类型

| 节点类型 | 功能 | 返回值 |
|----------|------|--------|
| **Selector** | 依次执行子节点，直到成功 | 成功/失败 |
| **Sequence** | 依次执行子节点，直到失败 | 成功/失败 |
| **Parallel** | 并行执行所有子节点 | 根据策略 |
| **Decorator** | 修改子节点行为 | 取决于装饰器 |
| **Condition** | 检查条件 | 成功/失败 |
| **Action** | 执行动作 | 成功/失败 |

### 状态机架构

```csharp
public enum AIState
{
    Idle,
    Patrol,
    Chase,
    Attack,
    Flee,
    Dead
}

public class StateMachine
{
    private AIState currentState;
    private Dictionary<AIState, IState> states;
    
    public void Update()
    {
        var state = states[currentState];
        state.Execute();
        
        var transition = state.CheckTransitions();
        if (transition != currentState)
        {
            ChangeState(transition);
        }
    }
    
    private void ChangeState(AIState newState)
    {
        states[currentState].Exit();
        currentState = newState;
        states[currentState].Enter();
    }
}
```

## AI行为模板

### 敌人AI

```yaml
AI名称: 精英守卫
AI类型: 近战型

感知系统:
  视野范围: 15米
  视野角度: 120度
  听觉范围: 10米
  记忆时间: 5秒

行为配置:
  空闲状态:
    动作: 待机动画
    转换: 检测到玩家 → 巡逻
    
  巡逻状态:
    动作: 沿路径移动
    速度: 2米/秒
    转换: 发现玩家 → 追逐
    转换: 路径结束 → 空闲
    
  追逐状态:
    动作: 追击玩家
    速度: 4米/秒
    转换: 距离<2米 → 攻击
    转换: 距离>20米 → 返回
    
  攻击状态:
    动作: 攻击动画
    冷却: 1.5秒
    伤害: 15-25
    转换: 攻击完成 → 追逐
    转换: 血量<20% → 逃跑
    
  逃跑状态:
    动作: 远离玩家
    速度: 5米/秒
    转换: 距离>30米 → 返回
    
  返回状态:
    动作: 返回初始位置
    速度: 3米/秒
    转换: 到达位置 → 空闲

战斗策略:
  - 优先攻击最近的玩家
  - 血量低时呼叫支援
  - 被包围时使用范围攻击
```

### 同伴AI

```yaml
AI名称: 治疗同伴
AI类型: 辅助型

跟随系统:
  跟随距离: 3-5米
  最大距离: 15米
  跟随速度: 匹配玩家

行为优先级:
  1. 玩家血量<30%: 紧急治疗
  2. 同伴血量<50%: 治疗同伴
  3. 玩家血量<70%: 持续治疗
  4. 敌人接近: 警告玩家
  5. 默认: 跟随玩家

技能配置:
  治疗术:
    冷却: 3秒
    治疗: 20%血量
    范围: 5米
    
  护盾术:
    冷却: 10秒
    护盾: 50点
    持续: 5秒
    
  复活术:
    冷却: 60秒
    条件: 同伴死亡
    引导: 3秒
```

### 群体AI

```yaml
AI名称: 鸟群模拟
AI类型: 群体行为

Boids规则:
  分离:
    权重: 1.5
    最小距离: 2米
    描述: 避免拥挤
    
  对齐:
    权重: 1.0
    邻居范围: 5米
    描述: 与邻居方向一致
    
  凝聚:
    权重: 1.0
    邻居范围: 5米
    描述: 向群体中心移动

额外规则:
  避障:
    权重: 2.0
    检测距离: 3米
    
  边界:
    权重: 1.5
    边界距离: 10米
    
  目标:
    权重: 0.5
    目标位置: 动态

性能优化:
  - 空间分区
  - 邻居缓存
  - LOD系统
```

## 寻路系统

### A*算法实现

```csharp
public class AStarPathfinding
{
    public List<Node> FindPath(Node start, Node end)
    {
        var openSet = new PriorityQueue<Node>();
        var closedSet = new HashSet<Node>();
        var cameFrom = new Dictionary<Node, Node>();
        var gScore = new Dictionary<Node, float>();
        var fScore = new Dictionary<Node, float>();
        
        openSet.Enqueue(start, 0);
        gScore[start] = 0;
        fScore[start] = Heuristic(start, end);
        
        while (openSet.Count > 0)
        {
            var current = openSet.Dequeue();
            
            if (current == end)
                return ReconstructPath(cameFrom, current);
            
            closedSet.Add(current);
            
            foreach (var neighbor in current.Neighbors)
            {
                if (closedSet.Contains(neighbor))
                    continue;
                
                var tentativeGScore = gScore[current] + Distance(current, neighbor);
                
                if (!gScore.ContainsKey(neighbor) || tentativeGScore < gScore[neighbor])
                {
                    cameFrom[neighbor] = current;
                    gScore[neighbor] = tentativeGScore;
                    fScore[neighbor] = gScore[neighbor] + Heuristic(neighbor, end);
                    
                    if (!openSet.Contains(neighbor))
                        openSet.Enqueue(neighbor, fScore[neighbor]);
                }
            }
        }
        
        return null;
    }
}
```

## 调用触发条件

**立即调用此 Skill 当：**

- 需要敌人AI设计
- 需要同伴AI设计
- 需要行为树实现
- 需要寻路系统
- 需要群体模拟

## 输出保证

- [ ] 完整的AI架构设计
- [ ] 行为树配置
- [ ] 状态机实现
- [ ] 寻路算法
- [ ] 性能优化建议

---

**记住：好的AI让玩家忘记它只是代码！**
