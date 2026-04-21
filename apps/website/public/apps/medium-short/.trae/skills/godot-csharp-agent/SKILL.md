---
name: "godot-csharp-agent"
description: "Ultimate C# development expert for Godot 4.x. Provides complete code patterns, best practices, performance optimization, design patterns, and architectural guidance for 2D/3D game development using C# and .NET."
---

# Godot C# Agent - C#开发专家

## 核心理念

**强类型的严谨，游戏开发的灵活。用C#的专业，打造高性能游戏。**

Godot C# Agent 是一个专业级Godot C#开发助手，提供从基础语法到高级架构的完整开发指导，帮助开发者写出高效、健壮、可维护的C#游戏代码。

## 核心工作流程

```
需求分析 → 架构设计 → 代码实现 → 性能优化 → 测试验证 → 输出
```

## C#基础规范

### 代码风格

| 规范 | 说明 | 示例 |
|------|------|------|
| **缩进** | 4个空格 | 统一缩进风格 |
| **命名** | camelCase | `playerSpeed`, `healthPoints` |
| **常量** | PascalCase | `MaxHealth`, `Pi` |
| **类名** | PascalCase | `PlayerController`, `EnemyAI` |
| **接口** | IPascalCase | `IDamageable`, `IInteractable` |
| **私有** | _camelCase | `_privateField`, `_helperMethod` |

### 类型系统

```csharp
// 基础类型
public int Health { get; set; } = 100;
public float Speed { get; set; } = 5.0f;
public string PlayerName { get; set; } = "Player1";
public bool IsAlive { get; set; } = true;

// 复杂类型
public List<Item> Inventory { get; set; } = new List<Item>();
public Dictionary<string, int> Stats { get; set; } = new Dictionary<string, int>();
public Vector2 Position { get; set; } = Vector2.Zero;
public Transform2D Transform { get; set; } = Transform2D.Identity;

// 方法
public void TakeDamage(int amount)
{
    Health -= amount;
}

public int GetHealth()
{
    return Health;
}

public float CalculateDamage(int baseDamage, float multiplier)
{
    return baseDamage * multiplier;
}
```

### 导出变量

```csharp
// 基础导出
[Export] public float Speed { get; set; } = 200.0f;
[Export] public int MaxHealth { get; set; } = 100;
[Export] public string CharacterName { get; set; } = "Hero";

// 范围限制
[Export(PropertyHint.Range, "0,100")] public float HealthPercent { get; set; } = 100.0f;
[Export(PropertyHint.Range, "0,10,0.5")] public float AttackSpeed { get; set; } = 1.0f;

// 枚举
public enum State { Idle, Walk, Attack, Dead }
[Export] public State CurrentState { get; set; } = State.Idle;

// 节点引用
[Export] public NodePath TargetNode { get; set; }
[Export] public Texture2D SpriteTexture { get; set; }

// 分组
[ExportGroup("Movement")]
[Export] public float WalkSpeed { get; set; } = 100.0f;
[Export] public float RunSpeed { get; set; } = 200.0f;

[ExportGroup("Combat")]
[Export] public int AttackDamage { get; set; } = 10;
[Export] public float AttackCooldown { get; set; } = 0.5f;
```

## 常用代码模式

### 玩家控制器

```csharp
using Godot;

public partial class PlayerController : CharacterBody2D
{
    [ExportGroup("Movement")]
    [Export] public float Speed { get; set; } = 200.0f;
    [Export] public float Acceleration { get; set; } = 800.0f;
    [Export] public float Friction { get; set; } = 1000.0f;

    [ExportGroup("Jump")]
    [Export] public float JumpVelocity { get; set; } = -400.0f;
    [Export] public float Gravity { get; set; } = 980.0f;
    [Export] public float MaxFallSpeed { get; set; } = 500.0f;
    [Export] public float CoyoteTime { get; set; } = 0.1f;
    [Export] public float JumpBuffer { get; set; } = 0.1f;

    private AnimatedSprite2D _sprite;
    private AudioStreamPlayer _jumpSound;

    private bool _facingRight = true;
    private float _coyoteTimer = 0.0f;
    private float _jumpBufferTimer = 0.0f;
    private bool _wasOnFloor = false;

    public override void _Ready()
    {
        _sprite = GetNode<AnimatedSprite2D>("AnimatedSprite2D");
        _jumpSound = GetNode<AudioStreamPlayer>("JumpSound");
    }

    public override void _PhysicsProcess(double delta)
    {
        HandleGravity(delta);
        HandleJump(delta);
        HandleMovement(delta);
        HandleAnimation();

        _wasOnFloor = IsOnFloor();
        MoveAndSlide();
    }

    private void HandleGravity(double delta)
    {
        if (!IsOnFloor())
        {
            Velocity = new Vector2(Velocity.X, Velocity.Y + Gravity * (float)delta);
            Velocity = new Vector2(Velocity.X, Mathf.Min(Velocity.Y, MaxFallSpeed));

            if (_wasOnFloor)
                _coyoteTimer = CoyoteTime;
            else
                _coyoteTimer -= (float)delta;
        }
        else
        {
            _coyoteTimer = 0.0f;
        }
    }

    private void HandleJump(double delta)
    {
        if (Input.IsActionJustPressed("jump"))
            _jumpBufferTimer = JumpBuffer;
        else
            _jumpBufferTimer -= (float)delta;

        if (_jumpBufferTimer > 0 && (IsOnFloor() || _coyoteTimer > 0))
        {
            Velocity = new Vector2(Velocity.X, JumpVelocity);
            _jumpBufferTimer = 0.0f;
            _coyoteTimer = 0.0f;
            _jumpSound?.Play();
        }

        if (Input.IsActionJustReleased("jump") && Velocity.Y < 0)
            Velocity = new Vector2(Velocity.X, Velocity.Y * 0.5f);
    }

    private void HandleMovement(double delta)
    {
        float inputDir = Input.GetAxis("move_left", "move_right");

        if (inputDir != 0)
        {
            Velocity = new Vector2(
                Mathf.MoveToward(Velocity.X, inputDir * Speed, Acceleration * (float)delta),
                Velocity.Y
            );
            _facingRight = inputDir > 0;
            _sprite.FlipH = !_facingRight;
        }
        else
        {
            Velocity = new Vector2(
                Mathf.MoveToward(Velocity.X, 0.0f, Friction * (float)delta),
                Velocity.Y
            );
        }
    }

    private void HandleAnimation()
    {
        if (!IsOnFloor())
            _sprite.Play("jump");
        else if (Mathf.Abs(Velocity.X) > 10.0f)
            _sprite.Play("run");
        else
            _sprite.Play("idle");
    }
}
```

### 敌人AI状态机

```csharp
using Godot;
using System.Collections.Generic;

public partial class EnemyAI : CharacterBody2D
{
    public enum State { Idle, Patrol, Chase, Attack, Dead }

    [ExportGroup("Movement")]
    [Export] public float PatrolSpeed { get; set; } = 50.0f;
    [Export] public float ChaseSpeed { get; set; } = 150.0f;

    [ExportGroup("Detection")]
    [Export] public float DetectionRange { get; set; } = 200.0f;
    [Export] public float AttackRange { get; set; } = 50.0f;
    [Export] public float LoseInterestRange { get; set; } = 300.0f;

    private AnimatedSprite2D _sprite;
    private Node2D _player;

    private State _currentState = State.Idle;
    private List<Vector2> _patrolPoints = new List<Vector2>();
    private int _currentPatrolIndex = 0;
    private float _stateTimer = 0.0f;

    public override void _Ready()
    {
        _sprite = GetNode<AnimatedSprite2D>("AnimatedSprite2D");
        _player = GetTree().GetFirstNodeInGroup("player") as Node2D;
    }

    public override void _PhysicsProcess(double delta)
    {
        _stateTimer -= (float)delta;

        switch (_currentState)
        {
            case State.Idle: StateIdle(delta); break;
            case State.Patrol: StatePatrol(delta); break;
            case State.Chase: StateChase(delta); break;
            case State.Attack: StateAttack(delta); break;
            case State.Dead: StateDead(delta); break;
        }
    }

    private void StateIdle(double delta)
    {
        Velocity = Velocity.MoveToward(Vector2.Zero, (float)delta * 500.0f);

        if (CanSeePlayer())
            ChangeState(State.Chase);
        else if (_stateTimer <= 0)
            ChangeState(State.Patrol);
    }

    private void StatePatrol(double delta)
    {
        if (_patrolPoints.Count == 0)
        {
            ChangeState(State.Idle);
            return;
        }

        Vector2 target = _patrolPoints[_currentPatrolIndex];
        Vector2 direction = GlobalPosition.DirectionTo(target);
        Velocity = direction * PatrolSpeed;

        if (GlobalPosition.DistanceTo(target) < 10.0f)
        {
            _currentPatrolIndex = (_currentPatrolIndex + 1) % _patrolPoints.Count;
            ChangeState(State.Idle);
        }

        if (CanSeePlayer())
            ChangeState(State.Chase);
    }

    private void StateChase(double delta)
    {
        if (_player == null)
        {
            ChangeState(State.Idle);
            return;
        }

        float distance = GlobalPosition.DistanceTo(_player.GlobalPosition);

        if (distance > LoseInterestRange)
            ChangeState(State.Patrol);
        else if (distance < AttackRange)
            ChangeState(State.Attack);
        else
        {
            Vector2 direction = GlobalPosition.DirectionTo(_player.GlobalPosition);
            Velocity = direction * ChaseSpeed;
            _sprite.FlipH = direction.X < 0;
        }
    }

    private void StateAttack(double delta)
    {
        Velocity = Velocity.MoveToward(Vector2.Zero, (float)delta * 1000.0f);

        if (_stateTimer <= 0)
        {
            PerformAttack();
            _stateTimer = 1.0f;
        }

        if (_player == null || GlobalPosition.DistanceTo(_player.GlobalPosition) > AttackRange * 1.5f)
            ChangeState(State.Chase);
    }

    private void StateDead(double delta)
    {
        Velocity = Velocity.MoveToward(Vector2.Zero, (float)delta * 500.0f);
    }

    private void ChangeState(State newState)
    {
        _currentState = newState;
        _stateTimer = 2.0f;

        switch (newState)
        {
            case State.Idle: _sprite.Play("idle"); break;
            case State.Patrol: _sprite.Play("walk"); break;
            case State.Chase: _sprite.Play("run"); break;
            case State.Attack: _sprite.Play("attack"); break;
            case State.Dead: _sprite.Play("dead"); break;
        }
    }

    private bool CanSeePlayer()
    {
        if (_player == null) return false;
        return GlobalPosition.DistanceTo(_player.GlobalPosition) < DetectionRange;
    }

    private void PerformAttack()
    {
        if (_player != null && GlobalPosition.DistanceTo(_player.GlobalPosition) < AttackRange)
        {
            // 调用玩家的受伤方法
        }
    }
}
```

### 信号系统

```csharp
using Godot;

public partial class HealthComponent : Node
{
    [Signal] public delegate void HealthChangedEventHandler(int newHealth, int maxHealth);
    [Signal] public delegate void DamageTakenEventHandler(int amount, Node source);
    [Signal] public delegate void HealedEventHandler(int amount);
    [Signal] public delegate void DiedEventHandler();

    [Export] public int MaxHealth { get; set; } = 100;

    private int _currentHealth;
    public int CurrentHealth
    {
        get => _currentHealth;
        set
        {
            int oldHealth = _currentHealth;
            _currentHealth = Mathf.Clamp(value, 0, MaxHealth);

            if (_currentHealth != oldHealth)
                EmitSignal(SignalName.HealthChanged, _currentHealth, MaxHealth);

            if (_currentHealth <= 0 && oldHealth > 0)
                EmitSignal(SignalName.Died);
        }
    }

    public override void _Ready()
    {
        CurrentHealth = MaxHealth;
    }

    public void TakeDamage(int amount, Node source = null)
    {
        if (CurrentHealth <= 0) return;

        CurrentHealth -= amount;
        EmitSignal(SignalName.DamageTaken, amount, source);
    }

    public void Heal(int amount)
    {
        int oldHealth = CurrentHealth;
        CurrentHealth += amount;

        if (CurrentHealth > oldHealth)
            EmitSignal(SignalName.Healed, CurrentHealth - oldHealth);
    }

    public float GetHealthPercent()
    {
        return (float)CurrentHealth / MaxHealth;
    }
}
```

### 对象池

```csharp
using Godot;
using System.Collections.Generic;

public partial class ObjectPool : Node
{
    [Export] public PackedScene PooledScene { get; set; }
    [Export] public int PoolSize { get; set; } = 10;

    private List<Node> _available = new List<Node>();
    private List<Node> _inUse = new List<Node>();

    public override void _Ready()
    {
        InitializePool();
    }

    private void InitializePool()
    {
        for (int i = 0; i < PoolSize; i++)
        {
            Node obj = PooledScene.Instantiate();
            obj.ProcessMode = ProcessModeEnum.Disabled;
            obj.Hide();
            _available.Add(obj);
            AddChild(obj);
        }
    }

    public Node Acquire()
    {
        if (_available.Count == 0)
            ExpandPool();

        Node obj = _available[_available.Count - 1];
        _available.RemoveAt(_available.Count - 1);
        obj.ProcessMode = ProcessModeEnum.Inherit;
        obj.Show();
        _inUse.Add(obj);
        return obj;
    }

    public void Release(Node obj)
    {
        if (_inUse.Contains(obj))
        {
            _inUse.Remove(obj);
            obj.ProcessMode = ProcessModeEnum.Disabled;
            obj.Hide();
            ResetObject(obj);
            _available.Add(obj);
        }
    }

    private void ResetObject(Node obj)
    {
        if (obj.HasMethod("Reset"))
            obj.Call("Reset");
    }

    private void ExpandPool()
    {
        Node obj = PooledScene.Instantiate();
        obj.ProcessMode = ProcessModeEnum.Disabled;
        obj.Hide();
        _available.Add(obj);
        AddChild(obj);
    }

    public void Clear()
    {
        foreach (Node obj in new List<Node>(_inUse))
            Release(obj);
    }
}
```

## 设计模式

### 单例模式 (AutoLoad)

```csharp
using Godot;

public partial class GameManager : Node
{
    [Signal] public delegate void GamePausedEventHandler();
    [Signal] public delegate void GameResumedEventHandler();
    [Signal] public delegate void ScoreChangedEventHandler(int newScore);

    public static GameManager Instance { get; private set; }

    private int _score;
    public int Score
    {
        get => _score;
        set
        {
            _score = value;
            EmitSignal(SignalName.ScoreChanged, _score);
        }
    }

    private bool _isPaused;
    public bool IsPaused
    {
        get => _isPaused;
        set
        {
            _isPaused = value;
            GetTree().Paused = value;
            if (value)
                EmitSignal(SignalName.GamePaused);
            else
                EmitSignal(SignalName.GameResumed);
        }
    }

    public override void _Ready()
    {
        Instance = this;
    }

    public void AddPoints(int points)
    {
        Score += points;
    }

    public void ChangeScene(string scenePath)
    {
        GetTree().ChangeSceneToFile(scenePath);
    }
}
```

### 观察者模式

```csharp
using Godot;

public partial class EventBus : Node
{
    [Signal] public delegate void EnemyDiedEventHandler(Node enemy, Vector2 position);
    [Signal] public delegate void PlayerDiedEventHandler();
    [Signal] public delegate void LevelCompletedEventHandler();
    [Signal] public delegate void ItemCollectedEventHandler(Item item, int quantity);

    public static EventBus Instance { get; private set; }

    public override void _Ready()
    {
        Instance = this;
    }

    public void EmitEnemyDied(Node enemy, Vector2 position)
    {
        EmitSignal(SignalName.EnemyDied, enemy, position);
    }

    public void EmitPlayerDied()
    {
        EmitSignal(SignalName.PlayerDied);
    }
}
```

## 性能优化

### 常用优化技巧

```csharp
// 1. 使用局部变量缓存节点引用
private AnimatedSprite2D _sprite;

public override void _Ready()
{
    _sprite = GetNode<AnimatedSprite2D>("AnimatedSprite2D");
}

// 2. 避免在_Process中创建新对象
// 错误：每帧创建新的Vector2
public override void _Process(double delta)
{
    Position += Vector2.Right * Speed * (float)delta;
}

// 正确：使用常量
private static readonly Vector2 Right = Vector2.Right;
public override void _Process(double delta)
{
    Position += Right * Speed * (float)delta;
}

// 3. 使用对象池代替频繁实例化
private ObjectPool _bulletPool;

public void Shoot()
{
    Node bullet = _bulletPool.Acquire();
    bullet.GlobalPosition = GlobalPosition;
}

// 4. 延迟加载资源
private PackedScene _explosionScene;

public override void _Ready()
{
    _explosionScene = GD.Load<PackedScene>("res://effects/explosion.tscn");
}
```

## 调用触发条件

**立即调用此 Skill 当：**

- 需要使用C#开发Godot游戏
- 需要C#代码示例
- 需要性能优化建议
- 需要架构设计指导
- 需要设计模式实现

## 输出保证

- [ ] 符合C#编码规范
- [ ] 代码可直接运行
- [ ] 包含类型注解
- [ ] 提供性能优化建议
- [ ] 包含设计模式实现

---

**记住：强类型是保护，设计模式是武器，性能优化是追求！**
