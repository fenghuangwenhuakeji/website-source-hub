extends Node

# Game Manager - Autoload Singleton
# Handles game state, score, level management, and global game logic

signal score_changed(new_score: int)
signal lives_changed(new_lives: int)
signal game_over()
signal level_completed(level: int)

# Game States
enum GameState {
	MENU,
	PLAYING,
	PAUSED,
	GAME_OVER,
	LEVEL_COMPLETE
}

# Current game state
var current_state: GameState = GameState.MENU

# Player stats
var score: int = 0:
	set(value):
		score = value
		score_changed.emit(score)

var lives: int = 3:
	set(value):
		lives = max(0, value)
		lives_changed.emit(lives)
		if lives <= 0:
			game_over.emit()

var current_level: int = 1
var max_levels: int = 5

# Game settings
var game_settings = {
	"difficulty": 1.0,
	"sound_volume": 0.8,
	"music_volume": 0.6,
	"fullscreen": false
}

func _ready():
	print("GameManager initialized")
	_load_settings()

# State Management
func change_state(new_state: GameState):
	current_state = new_state
	match current_state:
		GameState.MENU:
			Engine.time_scale = 1.0
		GameState.PLAYING:
			Engine.time_scale = 1.0
		GameState.PAUSED:
			Engine.time_scale = 0.0
		GameState.GAME_OVER:
			Engine.time_scale = 1.0
		GameState.LEVEL_COMPLETE:
			Engine.time_scale = 1.0

func start_game():
	score = 0
	lives = 3
	current_level = 1
	change_state(GameState.PLAYING)
	get_tree().change_scene_to_file("res://scenes/level_1.tscn")

func pause_game():
	if current_state == GameState.PLAYING:
		change_state(GameState.PAUSED)
	elif current_state == GameState.PAUSED:
		change_state(GameState.PLAYING)

func resume_game():
	change_state(GameState.PLAYING)

func restart_game():
	start_game()

func return_to_menu():
	change_state(GameState.MENU)
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")

# Score Management
func add_score(points: int):
	score += points

func get_score() -> int:
	return score

# Lives Management
func lose_life():
	lives -= 1

func add_life():
	lives += 1

# Level Management
func complete_level():
	level_completed.emit(current_level)
	if current_level < max_levels:
		current_level += 1
		change_state(GameState.LEVEL_COMPLETE)
		await get_tree().create_timer(2.0).timeout
		get_tree().change_scene_to_file("res://scenes/level_%d.tscn" % current_level)
		change_state(GameState.PLAYING)
	else:
		game_over.emit()

# Settings Management
func _load_settings():
	var config = ConfigFile.new()
	var err = config.load("user://settings.cfg")
	if err == OK:
		game_settings.difficulty = config.get_value("game", "difficulty", 1.0)
		game_settings.sound_volume = config.get_value("audio", "sound_volume", 0.8)
		game_settings.music_volume = config.get_value("audio", "music_volume", 0.6)
		game_settings.fullscreen = config.get_value("display", "fullscreen", false)

func save_settings():
	var config = ConfigFile.new()
	config.set_value("game", "difficulty", game_settings.difficulty)
	config.set_value("audio", "sound_volume", game_settings.sound_volume)
	config.set_value("audio", "music_volume", game_settings.music_volume)
	config.set_value("display", "fullscreen", game_settings.fullscreen)
	config.save("user://settings.cfg")

func set_difficulty(value: float):
	game_settings.difficulty = clamp(value, 0.5, 2.0)

func get_difficulty() -> float:
	return game_settings.difficulty
