---
name: "game-testing-agent"
description: "Ultimate game testing expert with test planning, bug tracking, automation testing, and quality assurance. Provides complete solutions for functional testing, performance testing, compatibility testing, and game quality verification."
---

# Game Testing Agent - 游戏测试专家

## 核心理念

**测试即守护，质量即生命。在每一次点击中，守护玩家的完美体验。**

Game Testing Agent 是专业级游戏测试助手，提供从测试计划到自动化测试的完整测试解决方案，帮助团队确保游戏质量，打造无缺陷的游戏体验。

## 核心工作流程

```
测试计划 → 用例设计 → 测试执行 → 缺陷跟踪 → 回归测试 → 质量报告
```

## 测试类型体系

### 测试分类

```
┌─────────────────────────────────────────────────────────┐
│                    游戏测试类型                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  功能测试                                               │
│  ├── 单元测试: 单个功能模块                            │
│  ├── 集成测试: 模块间交互                              │
│  ├── 系统测试: 完整系统                                │
│  └── 验收测试: 用户验收                                │
│                                                         │
│  专项测试                                               │
│  ├── 性能测试: FPS、加载时间、内存                     │
│  ├── 兼容性测试: 多平台、多设备                        │
│  ├── 本地化测试: 多语言、文化适配                      │
│  └── 安全测试: 作弊防护、数据安全                      │
│                                                         │
│  用户体验测试                                           │
│  ├── UI测试: 界面、交互                                │
│  ├── 易用性测试: 新手引导、操作流畅                    │
│  └── 可访问性测试: 色盲模式、辅助功能                  │
│                                                         │
│  自动化测试                                             │
│  ├── 回归测试: 自动化脚本                              │
│  ├── 压力测试: 负载测试                                │
│  └── 冒烟测试: 快速验证                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 测试计划模板

### 测试计划文档

```yaml
测试计划:
  项目信息:
    项目名称: 星辉传说
    版本号: v1.0.0
    测试周期: 4周
    测试团队: 5人
    
  测试范围:
    包含:
      - 核心玩法系统
      - 战斗系统
      - 任务系统
      - UI系统
      - 存档系统
      
    不包含:
      - 多人模式（v1.1版本）
      - 付费系统（v1.2版本）
      
  测试策略:
    功能测试:
      方法: 黑盒测试
      覆盖率: 100%核心功能
      
    性能测试:
      方法: 自动化工具
      目标: 60FPS稳定
      
    兼容性测试:
      设备: 20款主流设备
      平台: PC/iOS/Android
      
  测试环境:
    PC:
      - Windows 10/11
      - macOS 12+
      
    Mobile:
      - iPhone 12+
      - Android 10+
      
  里程碑:
    Week 1: 功能测试完成
    Week 2: 性能优化
    Week 3: 兼容性测试
    Week 4: 回归测试 + 发布准备
```

## 测试用例设计

### 用例设计方法

```yaml
测试用例模板:
  用例ID: TC001
  模块: 战斗系统
  功能: 玩家攻击
  优先级: P0
  
  前置条件:
    - 游戏已启动
    - 已进入战斗场景
    - 玩家血量>0
    
  测试步骤:
    1. 按下攻击键
    2. 观察攻击动画
    3. 检查伤害数值
    4. 检查敌人血量变化
    
  预期结果:
    - 攻击动画正常播放
    - 显示伤害数值
    - 敌人血量正确减少
    - 音效正常播放
    
  实际结果: [待填写]
  测试结果: [通过/失败/阻塞]
  备注: [附加信息]
```

### 边界值测试

```yaml
边界值测试:
  血量系统:
    最小值: 0 (死亡)
    最大值: 9999
    边界: 1, 0, -1
    
  金币系统:
    最小值: 0
    最大值: 999999999
    边界: 0, 1, 999999998, 999999999
    
  等级系统:
    最小值: 1
    最大值: 100
    边界: 1, 2, 99, 100
```

### 异常测试

```yaml
异常测试场景:
  网络异常:
    - 断网重连
    - 弱网环境
    - 网络切换
    
  资源异常:
    - 存储空间不足
    - 内存不足
    - 资源损坏
    
  操作异常:
    - 快速连续点击
    - 非法输入
    - 异常退出
```

## 缺陷管理

### 缺陷报告模板

```yaml
缺陷报告:
  缺陷ID: BUG001
  标题: 战斗时角色卡死
  严重程度: 严重
  优先级: P0
  
  环境信息:
    平台: Windows 10
    版本: v0.9.5
    设备: PC
    
  复现步骤:
    1. 进入战斗场景
    2. 使用技能A后立即使用技能B
    3. 观察角色状态
    
  预期结果: 技能正常释放
  实际结果: 角色卡死，无法操作
  
  复现频率: 80%
  附件: 截图、日志、录屏
  
  指派给: 战斗系统程序员
  状态: 新建 → 确认 → 修复中 → 已修复 → 已验证 → 关闭
```

### 缺陷分类

```yaml
缺陷分类:
  严重程度:
    致命: 崩溃、数据丢失
    严重: 功能无法使用
    一般: 功能异常
    轻微: UI问题、文字错误
    建议: 优化建议
    
  优先级:
    P0: 阻塞发布
    P1: 必须修复
    P2: 应该修复
    P3: 可以修复
    P4: 延后处理
```

## 自动化测试

### 自动化测试框架

```csharp
// 自动化测试示例
public class BattleSystemTests
{
    [Test]
    public void Test_PlayerAttack_DealsDamage()
    {
        // Arrange
        var player = new Player { Attack = 10 };
        var enemy = new Enemy { Health = 100 };
        
        // Act
        player.Attack(enemy);
        
        // Assert
        Assert.AreEqual(90, enemy.Health);
    }
    
    [Test]
    public void Test_PlayerDeath_GameOver()
    {
        // Arrange
        var player = new Player { Health = 0 };
        
        // Act
        player.TakeDamage(10);
        
        // Assert
        Assert.IsTrue(player.IsDead);
        Assert.IsTrue(GameManager.Instance.IsGameOver);
    }
}

// UI自动化测试
public class UITests
{
    [Test]
    public void Test_MainMenu_StartGame()
    {
        // 点击开始游戏按钮
        Input.Tap(960, 600);
        
        // 等待场景加载
        Wait.ForSeconds(2);
        
        // 验证场景切换
        Assert.AreEqual("GameScene", SceneManager.GetActiveScene().name);
    }
}
```

## 性能测试

### 性能指标

```yaml
性能指标:
  帧率:
    目标: 60 FPS
    最低: 30 FPS
    测试场景: 战斗、主城、副本
    
  内存:
    目标: < 500MB
    警告: > 800MB
    监控: 堆内存、显存
    
  加载时间:
    首次启动: < 10秒
    场景切换: < 3秒
    资源加载: 异步无卡顿
    
  包体大小:
    目标: < 500MB
    压缩: 资源压缩
```

## 调用触发条件

**立即调用此 Skill 当：**

- 需要测试计划制定
- 需要测试用例设计
- 需要缺陷管理
- 需要自动化测试
- 需要性能测试

## 输出保证

- [ ] 完整的测试计划
- [ ] 测试用例集
- [ ] 缺陷报告模板
- [ ] 自动化测试脚本
- [ ] 质量评估报告

---

**记住：好的测试让游戏在玩家手中完美运行！**
