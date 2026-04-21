extends CanvasLayer

# Scene Transition Manager - Autoload Singleton
# Handles smooth scene transitions with fade effects

@onready var fade_rect: ColorRect = ColorRect.new()
@onready var animation_player: AnimationPlayer = AnimationPlayer.new()

const FADE_DURATION: float = 0.5

func _ready():
	layer = 100  # Ensure it's on top of everything
	_setup_ui()
	_setup_animations()
	print("SceneTransition initialized")

func _setup_ui():
	# Create fade rectangle
	fade_rect.color = Color.BLACK
	fade_rect.visible = false
	add_child(fade_rect)
	
	# Make it fill the screen
	fade_rect.set_anchors_preset(Control.PRESET_FULL_RECT)

func _setup_animations():
	add_child(animation_player)
	
	# Create fade animation library
	var anim_library = AnimationLibrary.new()
	
	# Fade out animation (to black)
	var fade_out = Animation.new()
	fade_out.length = FADE_DURATION
	fade_out.add_track(Animation.TYPE_VALUE)
	fade_out.track_set_path(0, "fade_rect:modulate:a")
	fade_out.track_insert_key(0, 0.0, 0.0)
	fade_out.track_insert_key(0, FADE_DURATION, 1.0)
	anim_library.add_animation("fade_out", fade_out)
	
	# Fade in animation (from black)
	var fade_in = Animation.new()
	fade_in.length = FADE_DURATION
	fade_in.add_track(Animation.TYPE_VALUE)
	fade_in.track_set_path(0, "fade_rect:modulate:a")
	fade_in.track_insert_key(0, 0.0, 1.0)
	fade_in.track_insert_key(0, FADE_DURATION, 0.0)
	anim_library.add_animation("fade_in", fade_in)
	
	animation_player.add_animation_library("", anim_library)

# Scene Transition Methods
func change_scene(scene_path: String, transition_type: String = "fade"):
	match transition_type:
		"fade":
			await _fade_transition(scene_path)
		"instant":
			get_tree().change_scene_to_file(scene_path)
		_:
			await _fade_transition(scene_path)

func _fade_transition(scene_path: String):
	# Fade to black
	fade_rect.visible = true
	fade_rect.modulate.a = 0.0
	
	var tween = create_tween()
	tween.tween_property(fade_rect, "modulate:a", 1.0, FADE_DURATION)
	await tween.finished
	
	# Change scene
	var result = get_tree().change_scene_to_file(scene_path)
	if result != OK:
		push_error("Failed to load scene: " + scene_path)
		return
	
	# Wait a frame for the new scene to load
	await get_tree().process_frame
	
	# Fade from black
	tween = create_tween()
	tween.tween_property(fade_rect, "modulate:a", 0.0, FADE_DURATION)
	await tween.finished
	
	fade_rect.visible = false

func reload_current_scene(transition_type: String = "fade"):
	await change_scene(get_tree().current_scene.scene_file_path, transition_type)

# Screen Effects
func flash_screen(color: Color = Color.WHITE, duration: float = 0.1):
	var flash = ColorRect.new()
	flash.color = color
	flash.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(flash)
	
	var tween = create_tween()
	tween.tween_property(flash, "modulate:a", 0.0, duration).from(1.0)
	await tween.finished
	
	flash.queue_free()

func shake_screen(intensity: float = 10.0, duration: float = 0.5):
	var camera = get_viewport().get_camera_2d()
	if camera:
		var original_position = camera.position
		var elapsed = 0.0
		
		while elapsed < duration:
			var offset = Vector2(
				randf_range(-intensity, intensity),
				randf_range(-intensity, intensity)
			)
			camera.position = original_position + offset
			
			await get_tree().process_frame
			elapsed += get_process_delta_time()
			intensity = lerp(intensity, 0.0, get_process_delta_time() / duration)
		
		camera.position = original_position
