---
name: "godot-scene-agent"
description: "Ultimate Godot 4.x scene building expert with complete scene architecture, node hierarchy patterns, scene composition techniques, and performance optimization for 2D/3D games."
---

# Godot Scene Agent - Godot场景构建专家

## 核心理念

**场景是舞台，节点是演员，脚本是剧本。构建层次分明、性能优良、易于维护的游戏场景。**

Godot Scene Agent 是一个专业级Godot场景构建助手，提供完整的场景架构设计、节点层次规划、场景组织最佳实践，帮助开发者构建高效、灵活、可复用的游戏场景。

## 核心工作流程

```
需求分析 → 场景架构设计 → 节点层次规划 → 场景组合 → 脚本绑定 → 性能优化 → 输出
```

## 场景架构原则

### 单一职责原则
每个场景只负责一个明确的功能，通过场景实例化和组合构建复杂游戏。

### 组合优于继承
优先使用节点组合而非深度继承，保持灵活性。

### 信号解耦
使用信号进行节点间通信，降低耦合度，提高可维护性。

### 场景即对象
将场景视为可复用的对象，通过实例化创建多个实例。

## 节点层次设计模式

### 典型2D游戏场景结构

```
MainLevel (Node2D)
├── World (Node2D)
│   ├── ParallaxBackground
│   │   ├── ParallaxLayer (Sky) - MotionScale=0.1
│   │   ├── ParallaxLayer (FarMountains) - MotionScale=0.3
│   │   ├── ParallaxLayer (NearMountains) - MotionScale=0.5
│   │   └── ParallaxLayer (Trees) - MotionScale=0.8
│   ├── TileMapLayer (Ground)
│   ├── TileMapLayer (Walls)
│   ├── TileMapLayer (Decoration)
│   └── Objects (Node2D)
│       ├── Player (CharacterBody2D)
│       │   ├── AnimatedSprite2D
│       │   ├── CollisionShape2D
│       │   ├── Camera2D
│       │   └── Scripts
│       ├── Enemies (Node2D)
│       │   ├── Enemy1 (EnemyAI)
│       │   └── Enemy2 (EnemyAI)
│       ├── Items (Node2D)
│       │   ├── Coin (Area2D)
│       │   └── HealthPack (Area2D)
│       └── NPCs (Node2D)
├── UI (CanvasLayer)
│   ├── HUD (Control)
│   │   ├── HealthBar (TextureProgressBar)
│   │   ├── ManaBar (TextureProgressBar)
│   │   ├── ScoreLabel (Label)
│   │   └── Minimap (TextureRect)
│   ├── PauseMenu (Control)
│   └── DialogueBox (Control)
└── Systems (Node)
    ├── GameManager (AutoLoad)
    ├── AudioManager (AutoLoad)
    └── SceneTransition (CanvasLayer)
```

### 典型3D游戏场景结构

```
MainLevel3D (Node3D)
├── Environment (Node3D)
│   ├── WorldEnvironment
│   ├── DirectionalLight3D (Sun)
│   ├── AmbientLight
│   └── Fog
├── Terrain (StaticBody3D)
│   ├── MeshInstance3D
│   └── CollisionShape3D
├── Buildings (Node3D)
│   ├── Building1
│   └── Building2
├── Props (Node3D)
│   ├── Trees
│   ├── Rocks
│   └── Decorations
├── Characters (Node3D)
│   ├── Player (CharacterBody3D)
│   │   ├── MeshInstance3D
│   │   ├── CollisionShape3D
│   │   └── Camera3D
│   └── NPCs
└── UI (CanvasLayer)
```

## 场景组织最佳实践

### 命名规范

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| 场景文件 | PascalCase.tscn | `MainLevel.tscn`, `Player.tscn` |
| 根节点 | 与场景名一致 | `MainLevel`, `Player` |
| 功能节点 | 描述性PascalCase | `AnimatedSprite2D`, `CollisionShape2D` |
| 组节点 | 复数形式 | `Enemies`, `Items`, `NPCs` |
| 私有节点 | 下划线前缀 | `_sprite`, `_collision` |

### 分组管理

```gdscript
# 将节点添加到组
func _ready():
    add_to_group("enemies")
    add_to_group("damageable")

# 批量操作
func freeze_all_enemies():
    get_tree().call_group("enemies", "freeze")

# 获取组内节点
var enemies = get_tree().get_nodes_in_group("enemies")

# 场景切换时保留节点
add_to_group("persistent")
```

### 场景实例化

```gdscript
# 预加载场景
const ENEMY_SCENE = preload("res://scenes/enemy.tscn")
const COIN_SCENE = preload("res://scenes/coin.tscn")

# 实例化敌人
func spawn_enemy(position: Vector2) -> Node:
    var enemy = ENEMY_SCENE.instantiate()
    enemy.global_position = position
    enemy.health = 100
    add_child(enemy)
    return enemy

# 实例化带参数的敌人
func spawn_enemy_with_data(position: Vector2, data: Dictionary) -> Node:
    var enemy = ENEMY_SCENE.instantiate()
    enemy.global_position = position
    enemy.setup(data)
    add_child(enemy)
    return enemy
```

## 常用场景模式

### 状态场景模式

```gdscript
# GameState.tscn - 基础状态场景
class_name GameState
extends Node

signal state_entered
signal state_exited

func enter() -> void:
    emit_signal("state_entered")

func exit() -> void:
    emit_signal("state_exited")

func update(delta: float) -> void:
    pass

func physics_update(delta: float) -> void:
    pass
```

### UI场景模式

```gdscript
# BaseUI.tscn
class_name BaseUI
extends Control

signal ui_opened
signal ui_closed

@export var open_animation: String = "fade_in"
@export var close_animation: String = "fade_out"

var is_open: bool = false

func open() -> void:
    if is_open:
        return
    is_open = true
    show()
    play_animation(open_animation)
    emit_signal("ui_opened")

func close() -> void:
    if not is_open:
        return
    is_open = false
    play_animation(close_animation)
    emit_signal("ui_closed")
    await animation_finished
    hide()

func play_animation(anim_name: String) -> void:
    pass
```

### 对象池场景模式

```gdscript
# ObjectPool.tscn
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
        var obj = pooled_scene.instantiate()
        obj.process_mode = Node.PROCESS_MODE_DISABLED
        obj.hide()
        _available.append(obj)
        add_child(obj)

func acquire() -> Node:
    if _available.is_empty():
        _expand_pool()
    
    var obj = _available.pop_back()
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
```

## 场景切换系统

### 场景过渡

```gdscript
# SceneTransition.tscn (AutoLoad)
class_name SceneTransition
extends CanvasLayer

@onready var animation_player: AnimationPlayer = $AnimationPlayer
@onready var color_rect: ColorRect = $ColorRect

var is_transitioning: bool = false

func change_scene(scene_path: String) -> void:
    if is_transitioning:
        return
    
    is_transitioning = true
    
    # 淡出
    animation_player.play("fade_out")
    await animation_player.animation_finished
    
    # 切换场景
    get_tree().change_scene_to_file(scene_path)
    
    # 淡入
    animation_player.play("fade_in")
    await animation_player.animation_finished
    
    is_transitioning = false

func reload_current_scene() -> void:
    change_scene(get_tree().current_scene.scene_file_path)
```

### 场景加载

```gdscript
# SceneLoader.tscn (AutoLoad)
class_name SceneLoader
extends Node

signal scene_loaded(scene: PackedScene)
signal loading_progress(progress: float)

var _loader: ResourceLoader.ThreadLoadStatus
var _scene_path: String = ""

func load_scene_async(scene_path: String) -> void:
    _scene_path = scene_path
    ResourceLoader.load_threaded_request(scene_path)
    set_process(true)

func _process(delta: float) -> void:
    if _scene_path.is_empty():
        return
    
    var progress = []
    var status = ResourceLoader.load_threaded_get_status(_scene_path, progress)
    
    match status:
        ResourceLoader.ThreadLoadStatus.IN_PROGRESS:
            emit_signal("loading_progress", progress[0])
        ResourceLoader.ThreadLoadStatus.LOADED:
            var scene = ResourceLoader.load_threaded_get(_scene_path)
            emit_signal("scene_loaded", scene)
            _scene_path = ""
            set_process(false)
        ResourceLoader.ThreadLoadStatus.FAILED:
            push_error("Failed to load scene: " + _scene_path)
            _scene_path = ""
            set_process(false)
```

## 性能优化

### 视锥剔除

```gdscript
# VisibilityNotifier2D 用于2D
# VisibilityNotifier3D 用于3D

func _ready() -> void:
    var notifier = VisibilityNotifier2D.new()
    notifier.screen_entered.connect(_on_screen_entered)
    notifier.screen_exited.connect(_on_screen_exited)
    add_child(notifier)

func _on_screen_entered() -> void:
    process_mode = Node.PROCESS_MODE_INHERIT
    show()

func _on_screen_exited() -> void:
    process_mode = Node.PROCESS_MODE_DISABLED
    hide()
```

### LOD系统

```gdscript
# LODManager.gd
class_name LODManager
extends Node3D

@export var lod_distances: Array[float] = [10.0, 25.0, 50.0]
@export var lod_meshes: Array[Mesh] = []

@onready var mesh_instance: MeshInstance3D = $MeshInstance3D
@onready var camera: Camera3D = get_viewport().get_camera_3d()

func _process(delta: float) -> void:
    if not camera:
        return
    
    var distance = global_position.distance_to(camera.global_position)
    var lod_level = _get_lod_level(distance)
    
    if mesh_instance.mesh != lod_meshes[lod_level]:
        mesh_instance.mesh = lod_meshes[lod_level]

func _get_lod_level(distance: float) -> int:
    for i in range(lod_distances.size()):
        if distance < lod_distances[i]:
            return i
    return lod_meshes.size() - 1
```

## 调用触发条件

**立即调用此 Skill 当：**

- 需要设计Godot场景架构
- 需要规划节点层次
- 需要场景组织建议
- 需要性能优化方案
- 需要场景切换系统
- 需要对象池实现

## 输出保证

- [ ] 场景架构清晰
- [ ] 节点层次合理
- [ ] 命名规范统一
- [ ] 性能优化到位
- [ ] 易于维护扩展

---

**记住：好的场景架构是游戏成功的基石！**
