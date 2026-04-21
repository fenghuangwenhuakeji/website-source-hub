extends CharacterBody2D

# Player Controller - GDScript Version
# Handles player movement, combat, and interactions

class_name PlayerController

# Signals
signal health_changed(new_health: int, max_health: int)
signal player_died()
signal player_respawned()

# Movement Constants
const SPEED: float = 150.0
const JUMP_VELOCITY: float = -350.0
const ACCELERATION: float = 800.0
const FRICTION: float = 1000.0
const AIR_ACCELERATION: float = 400.0
const AIR_FRICTION: float = 200.0
const COYOTE_TIME: float = 0.1
const JUMP_BUFFER: float = 0.1

# Combat Constants
const ATTACK_COOLDOWN: float = 0.3
const INVINCIBILITY_TIME: float = 1.0

# Player Stats
@export var max_health: int = 100
var current_health: int = max_health:
	set(value):
		current_health = clamp(value, 0, max_health)
		health_changed.emit(current_health, max_health)
		if current_health <= 0:
			_die()

@export var attack_damage: int = 25
@export var move_speed_multiplier: float = 1.0

# State Variables
var is_grounded: bool = false
var is_attacking: bool = false
var is_invincible: bool = false
var can_jump: bool = false
var facing_right: bool = true

# Timers
var coyote_timer: float = 0.0
var jump_buffer_timer: float = 0.0
var attack_timer: float = 0.0
var invincibility_timer: float = 0.0

# Node References
@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var collision_shape: CollisionShape2D = $CollisionShape2D
@onready var attack_hitbox: Area2D = $AttackHitbox
@onready var ground_check: RayCast2D = $GroundCheck

func _ready():
	print("PlayerController initialized")
	attack_hitbox.monitoring = false
	attack_hitbox.body_entered.connect(_on_attack_hitbox_body_entered)

func _physics_process(delta: float):
	if GameManager.current_state != GameManager.GameState.PLAYING:
		return
	
	_handle_timers(delta)
	_handle_input()
	_apply_movement(delta)
	_handle_animations()
	
	move_and_slide()

func _handle_timers(delta: float):
	# Coyote time (grace period for jumping after leaving ground)
	if is_on_floor():
		coyote_timer = COYOTE_TIME
		can_jump = true
	else:
		coyote_timer -= delta
		if coyote_timer <= 0:
			can_jump = false
	
	# Jump buffer
	if jump_buffer_timer > 0:
		jump_buffer_timer -= delta
	
	# Attack cooldown
	if attack_timer > 0:
		attack_timer -= delta
		if attack_timer <= 0:
			is_attacking = false
			attack_hitbox.monitoring = false
	
	# Invincibility
	if invincibility_timer > 0:
		invincibility_timer -= delta
		if invincibility_timer <= 0:
			is_invincible = false
			sprite.modulate.a = 1.0

func _handle_input():
	# Get input direction
	var direction = Input.get_axis("move_left", "move_right")
	
	# Jump input
	if Input.is_action_just_pressed("jump"):
		jump_buffer_timer = JUMP_BUFFER
	
	# Attack input
	if Input.is_action_just_pressed("attack") and attack_timer <= 0:
		_attack()
	
	# Apply movement
	if direction != 0:
		facing_right = direction > 0
		_update_facing()

func _apply_movement(delta: float):
	var direction = Input.get_axis("move_left", "move_right")
	
	# Handle jump
	if jump_buffer_timer > 0 and can_jump:
		velocity.y = JUMP_VELOCITY
		jump_buffer_timer = 0
		coyote_timer = 0
		can_jump = false
		AudioManager.play_sfx("jump")
	
	# Apply gravity
	if not is_on_floor():
		velocity += get_gravity() * delta
	
	# Apply horizontal movement
	var target_speed = direction * SPEED * move_speed_multiplier
	
	if is_on_floor():
		# Ground movement
		if direction != 0:
			velocity.x = move_toward(velocity.x, target_speed, ACCELERATION * delta)
		else:
			velocity.x = move_toward(velocity.x, 0, FRICTION * delta)
	else:
		# Air movement
		if direction != 0:
			velocity.x = move_toward(velocity.x, target_speed, AIR_ACCELERATION * delta)
		else:
			velocity.x = move_toward(velocity.x, 0, AIR_FRICTION * delta)

func _handle_animations():
	if not sprite:
		return
	
	if is_attacking:
		sprite.play("attack")
	elif not is_on_floor():
		if velocity.y < 0:
			sprite.play("jump")
		else:
			sprite.play("fall")
	elif abs(velocity.x) > 10:
		sprite.play("run")
	else:
		sprite.play("idle")

func _update_facing():
	if sprite:
		sprite.flip_h = not facing_right
	
	# Update attack hitbox position
	if attack_hitbox:
		var hitbox_offset = 20.0 if facing_right else -20.0
		attack_hitbox.position.x = hitbox_offset

func _attack():
	is_attacking = true
	attack_timer = ATTACK_COOLDOWN
	attack_hitbox.monitoring = true
	AudioManager.play_sfx("attack")

func _on_attack_hitbox_body_entered(body: Node2D):
	if body.has_method("take_damage") and body != self:
		body.take_damage(attack_damage)

func take_damage(damage: int):
	if is_invincible or GameManager.current_state != GameManager.GameState.PLAYING:
		return
	
	current_health -= damage
	is_invincible = true
	invincibility_timer = INVINCIBILITY_TIME
	
	# Flash effect
	_flash_invincibility()
	
	AudioManager.play_sfx("hit")
	SceneTransition.shake_screen(5.0, 0.3)

func _flash_invincibility():
	var tween = create_tween()
	tween.set_loops(5)
	tween.tween_property(sprite, "modulate:a", 0.3, 0.1)
	tween.tween_property(sprite, "modulate:a", 1.0, 0.1)

func heal(amount: int):
	current_health += amount
	AudioManager.play_sfx("powerup")

func _die():
	player_died.emit()
	AudioManager.play_sfx("explosion")
	GameManager.lose_life()
	
	if GameManager.lives > 0:
		_respawn()
	else:
		GameManager.change_state(GameManager.GameState.GAME_OVER)

func _respawn():
	# Reset player state
	current_health = max_health
	velocity = Vector2.ZERO
	is_invincible = true
	invincibility_timer = INVINCIBILITY_TIME
	
	# Reset position (you'll need to set this to your checkpoint system)
	global_position = Vector2(100, 100)  # Default spawn point
	
	player_respawned.emit()
	AudioManager.play_sfx("powerup")

# Power-ups and pickups
func collect_coin(value: int = 10):
	GameManager.add_score(value)
	AudioManager.play_sfx("coin")

func collect_powerup(powerup_type: String):
	match powerup_type:
		"health":
			heal(25)
		"speed":
			_apply_speed_boost()
		"damage":
			_apply_damage_boost()
	
	AudioManager.play_sfx("powerup")

func _apply_speed_boost():
	move_speed_multiplier = 1.5
	await get_tree().create_timer(10.0).timeout
	move_speed_multiplier = 1.0

func _apply_damage_boost():
	var original_damage = attack_damage
	attack_damage = int(attack_damage * 1.5)
	await get_tree().create_timer(10.0).timeout
	attack_damage = original_damage
