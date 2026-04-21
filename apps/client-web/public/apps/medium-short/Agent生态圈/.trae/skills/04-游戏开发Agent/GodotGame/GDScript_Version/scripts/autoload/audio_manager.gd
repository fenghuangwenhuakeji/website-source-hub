extends Node

# Audio Manager - Autoload Singleton
# Handles all audio playback, sound effects, and music

# Audio buses
const MASTER_BUS = "Master"
const MUSIC_BUS = "Music"
const SFX_BUS = "SFX"

# Audio players
@onready var music_player: AudioStreamPlayer = AudioStreamPlayer.new()
@onready var sfx_player: AudioStreamPlayer = AudioStreamPlayer.new()

# Audio resources (preload these in a real game)
var music_tracks = {}
var sound_effects = {}

# Volume settings
var master_volume: float = 1.0
var music_volume: float = 0.6
var sfx_volume: float = 0.8

func _ready():
	add_child(music_player)
	add_child(sfx_player)
	_setup_audio_buses()
	_load_volumes()
	print("AudioManager initialized")

func _setup_audio_buses():
	# Ensure audio buses exist
	if not AudioServer.is_bus_name_unique(MUSIC_BUS):
		AudioServer.add_bus()
		AudioServer.set_bus_name(AudioServer.bus_count - 1, MUSIC_BUS)
	
	if not AudioServer.is_bus_name_unique(SFX_BUS):
		AudioServer.add_bus()
		AudioServer.set_bus_name(AudioServer.bus_count - 1, SFX_BUS)

func _load_volumes():
	var config = ConfigFile.new()
	var err = config.load("user://settings.cfg")
	if err == OK:
		master_volume = config.get_value("audio", "master_volume", 1.0)
		music_volume = config.get_value("audio", "music_volume", 0.6)
		sfx_volume = config.get_value("audio", "sfx_volume", 0.8)
		_apply_volumes()

func _apply_volumes():
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index(MASTER_BUS), linear_to_db(master_volume))
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index(MUSIC_BUS), linear_to_db(music_volume))
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index(SFX_BUS), linear_to_db(sfx_volume))

# Music Management
func play_music(track_name: String, fade_duration: float = 1.0):
	if music_tracks.has(track_name):
		var new_track = music_tracks[track_name]
		if music_player.stream != new_track:
			_fade_music(new_track, fade_duration)

func _fade_music(new_stream: AudioStream, duration: float):
	var tween = create_tween()
	tween.tween_property(music_player, "volume_db", -80.0, duration / 2.0)
	tween.tween_callback(func():
		music_player.stream = new_stream
		music_player.play()
	)
	tween.tween_property(music_player, "volume_db", linear_to_db(music_volume), duration / 2.0)

func stop_music(fade_duration: float = 1.0):
	var tween = create_tween()
	tween.tween_property(music_player, "volume_db", -80.0, fade_duration)
	tween.tween_callback(func():
		music_player.stop()
	)

func pause_music():
	music_player.stream_paused = true

func resume_music():
	music_player.stream_paused = false

# Sound Effects
func play_sfx(sound_name: String, pitch_variation: float = 0.0):
	if sound_effects.has(sound_name):
		var player = AudioStreamPlayer.new()
		player.stream = sound_effects[sound_name]
		player.bus = SFX_BUS
		
		if pitch_variation > 0:
			player.pitch_scale = 1.0 + randf_range(-pitch_variation, pitch_variation)
		
		add_child(player)
		player.play()
		
		# Auto-remove when finished
		await player.finished
		player.queue_free()

func play_sfx_at_position(sound_name: String, position: Vector2):
	if sound_effects.has(sound_name):
		var player = AudioStreamPlayer2D.new()
		player.stream = sound_effects[sound_name]
		player.position = position
		player.bus = SFX_BUS
		add_child(player)
		player.play()
		
		await player.finished
		player.queue_free()

# Volume Controls
func set_master_volume(value: float):
	master_volume = clamp(value, 0.0, 1.0)
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index(MASTER_BUS), linear_to_db(master_volume))

func set_music_volume(value: float):
	music_volume = clamp(value, 0.0, 1.0)
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index(MUSIC_BUS), linear_to_db(music_volume))

func set_sfx_volume(value: float):
	sfx_volume = clamp(value, 0.0, 1.0)
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index(SFX_BUS), linear_to_db(sfx_volume))

func get_master_volume() -> float:
	return master_volume

func get_music_volume() -> float:
	return music_volume

func get_sfx_volume() -> float:
	return sfx_volume

# Resource Loading (call this during game initialization)
func load_audio_resources():
	# Example: Load music tracks
	music_tracks["main_theme"] = load("res://assets/audio/music/main_theme.ogg")
	music_tracks["level_1"] = load("res://assets/audio/music/level_1.ogg")
	music_tracks["boss_battle"] = load("res://assets/audio/music/boss_battle.ogg")
	
	# Example: Load sound effects
	sound_effects["jump"] = load("res://assets/audio/sfx/jump.wav")
	sound_effects["attack"] = load("res://assets/audio/sfx/attack.wav")
	sound_effects["hit"] = load("res://assets/audio/sfx/hit.wav")
	sound_effects["coin"] = load("res://assets/audio/sfx/coin.wav")
	sound_effects["powerup"] = load("res://assets/audio/sfx/powerup.wav")
	sound_effects["explosion"] = load("res://assets/audio/sfx/explosion.wav")
