extends Node3D

const LayoutSaveCodec = preload("res://scripts/layout/layout_save_codec.gd")
const BuildModeCoordinator = preload("res://scripts/build/build_mode_coordinator.gd")
const BuildBottomSheet = preload("res://scripts/ui/build/build_bottom_sheet.gd")

var coordinator: Node3D
var bottom_sheet: Control
var camera: Camera3D
var camera_pivot: Node3D

func _ready() -> void:
	_setup_environment()
	_setup_camera()
	_setup_ui()
	_setup_coordinator()

func _setup_environment() -> void:
	var light := DirectionalLight3D.new()
	light.name = "Sun"
	light.rotation_degrees = Vector3(-55, -35, 0)
	light.light_energy = 1.2
	light.shadow_enabled = true
	add_child(light)

	var env_node := WorldEnvironment.new()
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("#0b1120")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("#cbd5e1")
	env.ambient_light_energy = 0.7
	env_node.environment = env
	add_child(env_node)

	# Ground site grid
	var site := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = Vector3(120, 0.4, 120)
	site.mesh = box
	site.position = Vector3(0, -0.22, 0)
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color("#0f172a")
	mat.roughness = 0.9
	site.material_override = mat
	add_child(site)

func _setup_camera() -> void:
	camera_pivot = Node3D.new()
	camera_pivot.name = "CameraPivot"
	camera_pivot.position = Vector3(0, 0, 0)
	add_child(camera_pivot)

	camera = Camera3D.new()
	camera.name = "Camera3D"
	camera.current = true
	camera.position = Vector3(0, 32, 34)
	camera.rotation_degrees = Vector3(-46, 0, 0)
	camera.fov = 45.0
	camera_pivot.add_child(camera)

func _setup_ui() -> void:
	var canvas := CanvasLayer.new()
	canvas.name = "BuildUICanvas"
	add_child(canvas)

	# Safe area margin container
	var margin_container := MarginContainer.new()
	margin_container.set_anchors_preset(Control.PRESET_FULL_RECT)
	margin_container.add_theme_constant_override("margin_left", 20)
	margin_container.add_theme_constant_override("margin_right", 20)
	margin_container.add_theme_constant_override("margin_bottom", 16)
	margin_container.add_theme_constant_override("margin_top", 16)
	canvas.add_child(margin_container)

	var ui_root := VBoxContainer.new()
	ui_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	margin_container.add_child(ui_root)

	# Top info bar
	var top_bar := PanelContainer.new()
	var top_style := StyleBoxFlat.new()
	top_style.bg_color = Color(0.06, 0.09, 0.16, 0.85)
	top_style.corner_radius_bottom_left = 12
	top_style.corner_radius_bottom_right = 12
	top_style.content_margin_left = 16
	top_style.content_margin_right = 16
	top_style.content_margin_top = 8
	top_style.content_margin_bottom = 8
	top_bar.add_theme_stylebox_override("panel", top_style)
	ui_root.add_child(top_bar)

	var top_hbox := HBoxContainer.new()
	top_bar.add_child(top_hbox)

	var info_lbl := Label.new()
	info_lbl.text = "MOBILE MALL LAYOUT BUILDER 2.0 (B2-07 PREVIEW) — Drag to draw hallway • 2 fingers to pan camera"
	info_lbl.add_theme_color_override("font_color", Color("#38bdf8"))
	top_hbox.add_child(info_lbl)

	var spacer := Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top_hbox.add_child(spacer)

	var spacer_mid := Control.new()
	spacer_mid.size_flags_vertical = Control.SIZE_EXPAND_FILL
	ui_root.add_child(spacer_mid)

	# Bottom Sheet
	bottom_sheet = BuildBottomSheet.new()
	bottom_sheet.name = "BuildBottomSheet"
	ui_root.add_child(bottom_sheet)

func _setup_coordinator() -> void:
	var loaded: Dictionary = LayoutSaveCodec.load_json_file("res://data/layout_fixtures/valid_cedar_grove_minimal.json")
	var state: RefCounted = loaded.state

	coordinator = BuildModeCoordinator.new()
	coordinator.name = "BuildModeCoordinator"
	add_child(coordinator)
	coordinator.setup(state, camera, bottom_sheet)
	coordinator.exit_requested.connect(func(): get_tree().quit(0))
