extends Node3D

const LayoutRenderer = preload("res://scripts/layout/layout_renderer.gd")
const LayoutSaveCodec = preload("res://scripts/layout/layout_save_codec.gd")

func _ready() -> void:
	_setup_world()
	var loaded: Dictionary = LayoutSaveCodec.load_json_file("res://data/layout_fixtures/valid_cedar_grove_minimal.json")
	var renderer: Node3D = LayoutRenderer.new()
	renderer.name = "B2LayoutRendererPreview"
	add_child(renderer)
	renderer.render_state(loaded.state)

func _setup_world() -> void:
	var camera := Camera3D.new()
	camera.name = "Camera3D"
	camera.current = true
	camera.position = Vector3(0, 34, 38)
	camera.rotation_degrees = Vector3(-48, 0, 0)
	camera.fov = 45.0
	add_child(camera)

	var light := DirectionalLight3D.new()
	light.name = "Sun"
	light.rotation_degrees = Vector3(-58, -32, 0)
	light.light_energy = 1.2
	light.shadow_enabled = true
	add_child(light)

	var environment := WorldEnvironment.new()
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("#111827")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("#dbeafe")
	env.ambient_light_energy = 0.8
	environment.environment = env
	add_child(environment)
