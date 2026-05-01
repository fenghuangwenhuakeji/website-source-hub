---
name: "godot-gdscript-agent"
description: "Ultimate GDScript development expert for Godot 4.x. Provides complete code patterns, best practices, performance optimization, design patterns, and architectural guidance for 2D/3D game development."
---

# Godot GDScript Agent - GDScript开发专家

## 核心理念

**简洁而不简单，高效而不晦涩。用Python般的优雅，写游戏引擎的性能。**

Godot GDScript Agent 是一个专业级GDScript开发助手，提供从基础语法到高级架构的完整开发指导，帮助开发者写出高效、优雅、可维护的GDScript代码。

## 核心工作流程

```
需求分析 → 架构设计 → 代码实现 → 性能优化 → 测试验证 → 输出
```

## GDScript基础规范

### 代码风格

| 规范 | 说明 | 示例 |
|------|------|------|
| **缩进** | 使用Tab | 统一缩进风格 |
| **命名** | snake_case | `player_speed`, `health_points` |
| **常量** | UPPER_SNAKE_CASE | `MAX_HEALTH`, `PI` |
| **类名** | PascalCase | `PlayerController`, `EnemyAI` |
| **信号** | 动词过去式 | `health_changed`, `died` |
| **私有** | 下划线前缀 | `_private_var`, `_helper_func` |

### 类型注解

```gdscript
# 基础类型
var health: int = 100
var speed: float = 5.0
var player_name: String = "Player1"
var is_alive: bool = true

# 复杂类型
var inventory: Array[Item] = []
var stats: Dictionary[String, int] = {}
var position: Vector2 = Vector2.ZERO
var transform: Transform2D = Transform2D.IDENTITY

# 函数返回类型
func take_damage(amount: int) -> void:
    health -= amount

func get_health() -> int:
    return health

func calculate_damage(base: int, multiplier: float) -> float:
    return base * multiplier
```

### 导出变量

```gdscript
# 基础导出
@export var speed: float = 200.0
@export var max_health: int = 100
@export var character_name: String = "Hero"

# 范围限制
@export_range(0, 100) var health_percent: float = 100.0
@export_range(0, 10, 0.5) var attack_speed: float = 1.0

# 枚举
enum State { IDLE, WALK, ATTACK, DEAD }
@export var current_state: State = State.IDLE

# 节点引用
@export var target_node: NodePath
@export var sprite_texture: Texture2D

# 分组
@export_group("Movement")
@export var walk_speed: float = 100.0
@export var run_speed: float = 200.0

@export_group("Combat")
@export var attack_damage: int = 10
@export var attack_cooldown: float = 0.5
```

## 常用代码模式

### 玩家控制器

```gdscript
class_name PlayerController
extends CharacterBody2D

# 导出变量
@export_group("Movement")
@export var speed: float = 200.0
@export var acceleration: float = 800.0
@export var friction: float = 1000.0

@export_group("Jump")
@export var jump_velocity: float = -400.0
@export var gravity: float = 980.0
@export var max_fall_speed: float = 500.0
@export var coyote_time: float = 0.1
@export var jump_buffer: float = 0.1

# 节点引用
@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var jump_sound: AudioStreamPlayer = $JumpSound

# 内部变量
var facing_right: bool = true
var coyote_timer: float = 0.0
var jump_buffer_timer: float = 0.0
var was_on_floor: bool = false

func _physics_process(delta: float) -> void:
    handle_gravity(delta)
    handle_jump(delta)
    handle_movement(delta)
    handle_animation()
    
    was_on_floor = is_on_floor()
    move_and_slide()

func handle_gravity(delta: float) -> void:
    if not is_on_floor():
        velocity.y += gravity * delta
        velocity.y = min(velocity.y, max_fall_speed)
        
        # 土狼时间
        if was_on_floor:
            coyote_timer = coyote_time
        else:
            coyote_timer -= delta
    else:
        coyote_timer = 0.0

func handle_jump(delta: float) -> void:
    # 跳跃缓冲
    if Input.is_action_just_pressed("jump"):
        jump_buffer_timer = jump_buffer
    else:
        jump_buffer_timer -= delta
    
    # 执行跳跃
    if jump_buffer_timer > 0 and (is_on_floor() or coyote_timer > 0):
        velocity.y = jump_velocity
        jump_buffer_timer = 0.0
        coyote_timer = 0.0
        jump_sound.play()
    
    # 可变跳跃高度
    if Input.is_action_just_released("jump") and velocity.y < 0:
        velocity.y *= 0.5

func handle_movement(delta: float) -> void:
    var input_dir := Input.get_axis("move_left", "move_right")
    
    if input_dir != 0:
        velocity.x = move_toward(velocity.x, input_dir * speed, acceleration * delta)
        facing_right = input_dir > 0
        sprite.flip_h = not facing_right
    else:
        velocity.x = move_toward(velocity.x, 0.0, friction * delta)

func handle_animation() -> void:
    if not is_on_floor():
        sprite.play("jump")
    elif abs(velocity.x) > 10.0:
        sprite.play("run")
    else:
        sprite.play("idle")
```

### 敌人AI状态机

```gdscript
class_name EnemyAI
extends CharacterBody2D

enum State { IDLE, PATROL, CHASE, ATTACK, DEAD }

@export_group("Movement")
@export var patrol_speed: float = 50.0
@export var chase_speed: float = 150.0

@export_group("Detection")
@export var detection_range: float = 200.0
@export var attack_range: float = 50.0
@export var lose_interest_range: float = 300.0

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var player: Node2D = get_tree().get_first_node_in_group("player")

var current_state: State = State.IDLE
var patrol_points: Array[Vector2] = []
var current_patrol_index: int = 0
var state_timer: float = 0.0

func _physics_process(delta: float) -> void:
    state_timer -= delta
    
    match current_state:
        State.IDLE:
            _state_idle(delta)
        State.PATROL:
            _state_patrol(delta)
        State.CHASE:
            _state_chase(delta)
        State.ATTACK:
            _state_attack(delta)
        State.DEAD:
            _state_dead(delta)

func _state_idle(delta: float) -> void:
    velocity = velocity.move_toward(Vector2.ZERO, delta * 500)
    
    if _can_see_player():
        _change_state(State.CHASE)
    elif state_timer <= 0:
        _change_state(State.PATROL)

func _state_patrol(delta: float) -> void:
    if patrol_points.is_empty():
        _change_state(State.IDLE)
        return
    
    var target := patrol_points[current_patrol_index]
    var direction := global_position.direction_to(target)
    velocity = direction * patrol_speed
    
    if global_position.distance_to(target) < 10.0:
        current_patrol_index = (current_patrol_index + 1) % patrol_points.size()
        _change_state(State.IDLE)
    
    if _can_see_player():
        _change_state(State.CHASE)

func _state_chase(delta: float) -> void:
    if not player:
        _change_state(State.IDLE)
        return
    
    var distance := global_position.distance_to(player.global_position)
    
    if distance > lose_interest_range:
        _change_state(State.PATROL)
    elif distance < attack_range:
        _change_state(State.ATTACK)
    else:
        var direction := global_position.direction_to(player.global_position)
        velocity = direction * chase_speed
        sprite.flip_h = direction.x < 0

func _state_attack(delta: float) -> void:
    velocity = velocity.move_toward(Vector2.ZERO, delta * 1000)
    
    if state_timer <= 0:
        _perform_attack()
        state_timer = 1.0
    
    if not player or global_position.distance_to(player.global_position) > attack_range * 1.5:
        _change_state(State.CHASE)

func _state_dead(delta: float) -> void:
    velocity = velocity.move_toward(Vector2.ZERO, delta * 500)

func _change_state(new_state: State) -> void:
    current_state = new_state
    state_timer = 2.0
    
    match new_state:
        State.IDLE:
            sprite.play("idle")
        State.PATROL:
            sprite.play("walk")
        State.CHASE:
            sprite.play("run")
        State.ATTACK:
            sprite.play("attack")
        State.DEAD:
            sprite.play("dead")

func _can_see_player() -> bool:
    if not player:
        return false
    return global_position.distance_to(player.global_position) < detection_range

func _perform_attack() -> void:
    if player and global_position.distance_to(player.global_position) < attack_range:
        player.take_damage(10)
```

### 信号系统

```gdscript
class_name HealthComponent
extends Node

signal health_changed(new_health: int, max_health: int)
signal damage_taken(amount: int, source: Node)
signal healed(amount: int)
signal died

@export var max_health: int = 100

var current_health: int:
    set(value):
        var old_health := current_health
        current_health = clampi(value, 0, max_health)
        
        if current_health != old_health:
            health_changed.emit(current_health, max_health)
            
        if current_health <= 0 and old_health > 0:
            died.emit()

func _ready() -> void:
    current_health = max_health

func take_damage(amount: int, source: Node = null) -> void:
    if current_health <= 0:
        return
    
    current_health -= amount
    damage_taken.emit(amount, source)

func heal(amount: int) -> void:
    var old_health := current_health
    current_health += amount
    
    if current_health > old_health:
        healed.emit(current_health - old_health)

func get_health_percent() -> float:
    return float(current_health) / max_health
```

### 对象池

```gdscript
class_name ObjectPool
extends Node

@export var pooled_scene: PackedScene
@export var pool_size: int = 10

var _available: Array[Node] = []
var _in_use: Array[Node] = []

func _ready() -> void:
    _initialize_pool()

func _initialize_pool() -> void:
    for i in pool_size:
        var obj := pooled_scene.instantiate()
        obj.process_mode = Node.PROCESS_MODE_DISABLED
        obj.hide()
        _available.append(obj)
        add_child(obj)

func acquire() -> Node:
    if _available.is_empty():
        _expand_pool()
    
    var obj := _available.pop_back()
    obj.process_mode = Node.PROCESS_MODE_INHERIT
    obj.show()
    _in_use.append(obj)
    return obj

func release(obj: Node) -> void:
    if obj in _in_use:
        _in_use.erase(obj)
        obj.process_mode = Node.PROCESS_MODE_DISABLED
        obj.hide()
        _reset_object(obj)
        _available.append(obj)

func _reset_object(obj: Node) -> void:
    if obj.has_method("reset"):
        obj.reset()

func _expand_pool() -> void:
    var obj := pooled_scene.instantiate()
    obj.process_mode = Node.PROCESS_MODE_DISABLED
    obj.hide()
    _available.append(obj)
    add_child(obj)

func clear() -> void:
    for obj in _in_use:
        release(obj)
```

## 设计模式

### 单例模式 (AutoLoad)

```gdscript
# GameManager.gd - 设置为AutoLoad
extends Node

signal game_paused
signal game_resumed
signal score_changed(new_score: int)

var score: int = 0:
    set(value):
        score = value
        score_changed.emit(score)

var is_paused: bool = false:
    set(value):
        is_paused = value
        get_tree().paused = value
        if value:
            game_paused.emit()
        else:
            game_resumed.emit()

func add_points(points: int) -> void:
    score += points

func change_scene(scene_path: String) -> void:
    get_tree().change_scene_to_file(scene_path)
```

### 观察者模式

```gdscript
class_name EventBus
extends Node

signal enemy_died(enemy: Node, position: Vector2)
signal player_died
signal level_completed
signal item_collected(item: Item, quantity: int)

func emit_enemy_died(enemy: Node, position: Vector2) -> void:
    enemy_died.emit(enemy, position)

func emit_player_died() -> void:
    player_died.emit()
```

### 组件模式

```gdscript
class_name Damageable
extends Node

@export var health_component: HealthComponent
@export var hit_sound: AudioStreamPlayer
@export var hit_effect: PackedScene

func take_damage(amount: int, source: Node = null) -> void:
    if not health_component:
        return
    
    health_component.take_damage(amount, source)
    
    if hit_sound:
        hit_sound.play()
    
    if hit_effect:
        var effect := hit_effect.instantiate()
        effect.global_position = get_parent().global_position
        get_tree().current_scene.add_child(effect)
```

## 性能优化

### 常用优化技巧

```gdscript
# 1. 使用局部变量缓存节点引用
@onready var sprite = $Sprite2D

# 2. 避免在_process中创建新对象
# 错误：每帧创建新的Vector2
func _process(delta):
    position += Vector2.RIGHT * speed * delta

# 正确：使用常量
const RIGHT := Vector2.RIGHT
func _process(delta):
    position += RIGHT * speed * delta

# 3. 使用对象池代替频繁实例化
var bullet_pool: ObjectPool

func shoot():
    var bullet := bullet_pool.acquire()
    bullet.global_position = global_position

# 4. 延迟加载资源
@onready var explosion_scene = preload("res://effects/explosion.tscn")

# 5. 使用分组代替频繁查找
# 错误：每帧查找
func _process(delta):
    var player = get_tree().get_first_node_in_group("player")

# 正确：缓存引用
@onready var player = get_tree().get_first_node_in_group("player")
```

## 调用触发条件

**立即调用此 Skill 当：**

- 需要GDScript代码示例
- 需要游戏开发架构设计
- 需要性能优化建议
- 需要设计模式实现
- 需要最佳实践指导

## 输出保证

- [ ] 符合GDScript编码规范
- [ ] 代码可直接运行
- [ ] 包含类型注解
- [ ] 提供性能优化建议
- [ ] 包含设计模式实现

---

**记住：代码是艺术，性能是追求，可维护性是责任！**
