extends Node3D

const SoundMgr = preload("res://scripts/sound_manager.gd")
const TycoonEconomyModel = preload("res://scripts/tycoon_economy.gd")

func _spawn_shopper_node() -> Node3D:
	var node := Node3D.new()
	node.set_script(load("res://scripts/shopper.gd"))
	return node



const STORE_COLORS := [
	Color("#38bdf8"), Color("#f97316"), Color("#d8b4fe"), Color("#34d399"),
	Color("#fb7185"), Color("#facc15"), Color("#a78bfa"), Color("#4ade80")
]

# Mall State Variables
var cash := 28000
var week := 1
var day := 1
var day_progress := 0.0
var reputation := 76
var cleanliness := 95
var security := 90
var total_sales := 0
var active_shoppers := 0
var spawn_cooldown := 0.0

var selected_store_idx := 0
var current_drawer := "inspector" # "inspector", "directory", "architect", "ops", "data", "goals", "feed"
var selected_directory_cat := "All"
var selected_place_amenity := ""

# Data Catalogs & Blueprint
var catalog_data: Dictionary = {}
var tenants_catalog: Array = []
var amenities_catalog: Array = []
var scenarios_catalog: Array = []
var blueprint: Dictionary = {}

var stores: Array[Dictionary] = []
var placed_amenities: Array[Dictionary] = []
var entrances := {}
var event_feed: Array[Dictionary] = []
var weekly_reports: Array[Dictionary] = []
var shopper_thoughts: Array[Dictionary] = []
var tycoon_metrics: Dictionary = {}
var heatmap_mode := "none"
var heatmap_cells: Dictionary = {}
var heatmap_overlay_root: Node3D
var staff_units: Array[Dictionary] = []
var active_incidents: Array[Dictionary] = []
var staff_root: Node3D
var incident_root: Node3D
var incident_cooldown := 9.0
var staff_serial := 0
var incident_serial := 0
var active_scenario: Dictionary = {}
var completed_goals: Dictionary = {}
var scenario_complete := false
var prestige_tier := 1
var tutorial_seen: Dictionary = {}
var mobile_shopper_budget := 46

# Camera & Input state
var camera_yaw := -18.0
var camera_pitch := -48.0
var camera_distance := 58.0
var camera_target_pos := Vector3.ZERO
var dragging := false
var last_pointer := Vector2.ZERO
var active_touches: Dictionary = {}


# Node References
var sound_mgr: SoundMgr
var tycoon_economy: TycoonEconomy
var ui_root: CanvasLayer
var cash_label: Label
var date_label: Label
var guests_label: Label
var rep_label: Label
var clean_label: Label
var sec_label: Label
var speed_label: Label
var sound_btn: Button

# UI Drawer Containers
var drawer_panel: Panel
var drawer_title: Label
var drawer_content: Control
var toast_container: VBoxContainer

func _ready() -> void:
	Engine.time_scale = 1.0
	sound_mgr = SoundMgr.new()
	sound_mgr.name = "SoundManager"
	add_child(sound_mgr)
	tycoon_economy = TycoonEconomyModel.new()

	_load_catalogs()
	_initialize_scenario()
	blueprint = _load_json("res://data/aurora_grand.json")
	cash = int(blueprint.get("starting_cash", 28000))

	_build_architecture()
	heatmap_overlay_root = Node3D.new()
	heatmap_overlay_root.name = "HeatmapOverlay"
	add_child(heatmap_overlay_root)
	staff_root = Node3D.new()
	staff_root.name = "ServiceStaff"
	add_child(staff_root)
	incident_root = Node3D.new()
	incident_root.name = "Incidents"
	add_child(incident_root)
	_build_stores_from_blueprint()
	_build_entrances()
	_load_game()
	_ensure_store_economy_state()
	_initialize_staff_units()
	_refresh_heatmap_overlay()

	_build_ui()
	_update_store_selection_visuals()

	# Spawn opening crowd
	for index in 12:
		_spawn_shopper(index % 2 == 0)

	_add_event("Welcome to Aurora Grand", "Operating 3D flagship mall. Manage stores, zone lots, and expand!", "info")
	_refresh_ui()

func _process(delta: float) -> void:
	# 1. Day / Time Progression
	day_progress += delta
	if day_progress >= 26.0:
		day_progress -= 26.0
		day += 1
		# Cleanliness and security decay with crowd size
		cleanliness = maxi(10, cleanliness - (3 if active_shoppers > 20 else 2))
		security = maxi(10, security - (3 if active_shoppers > 25 else 1))

		if cleanliness < 50 and randf() < 0.35:
			_trigger_health_inspection_penalty()
		if security < 45 and randf() < 0.30:
			_trigger_shoplifting_incident()

		if day > 7:
			day = 1
			week += 1
			_process_weekly_accounting()
		elif randf() < 0.35:
			_trigger_daily_event()

	# 2. Shopper Crowd Spawning (Adjusted for mall draw, synergy, & reputation)
	spawn_cooldown -= delta
	var tenant_draw_sum := _calculate_total_mall_draw()
	var shopper_cap := clampi(16 + int(tenant_draw_sum * 0.12) + placed_amenities.size() * 3 + int(reputation * 0.25), 14, mobile_shopper_budget)

	if spawn_cooldown <= 0.0 and active_shoppers < shopper_cap:
		_spawn_shopper(randf() > 0.5)
		spawn_cooldown = randf_range(0.5, 1.1) * (1.15 - reputation / 220.0)

	# 3. Store Deep Simulation (Promotion timers, Cinema showtimes)
	for s in stores:
		if float(s.get("promotion", 0.0)) > 0.0:
			s.promotion = maxf(0.0, float(s.promotion) - delta)

		# Cinema Showtime Simulation
		if str(s.get("category", "")) == "Entertainment" and s.has("cinema_state"):
			var cs: Dictionary = s.cinema_state
			cs.timer = float(cs.timer) - delta
			if cs.timer <= 0.0:
				match str(cs.phase):
					"box_office":
						cs.phase = "doors_open"
						cs.timer = 12.0
						_add_event("Cinema Doors Opening", "Auditorium doors open for '%s'!" % cs.movie, "info")
					"doors_open":
						cs.phase = "screening"
						cs.timer = 32.0
						_add_event("Feature Film Rolling", "IMAX 4K Laser Projector active: '%s'." % cs.movie, "info")
						_update_cinema_glow(s, true)
					"screening":
						cs.phase = "credits"
						cs.timer = 8.0
						_update_cinema_glow(s, false)
					"credits":
						cs.phase = "box_office"
						cs.timer = 24.0
						var movies: Array = ["Interstellar Echoes 4DX", "Neon Samurai 2099", "Starlight Symphony", "Quantum Horizon"]
						cs.movie = movies[(movies.find(cs.movie) + 1) % movies.size()]
						_add_event("Now Showing at Cinema", "Box office open for next feature: '%s'." % cs.movie, "info")

	_process_staff_and_incidents(delta)
	_update_scenario_goals()
	_update_camera(delta)

# ==============================================================================
# INPUT & TOUCH HANDLING (Desktop + Mobile Gestures)
# ==============================================================================
func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
			if selected_place_amenity != "":
				_place_amenity_at_screen(event.position)
			else:
				_select_store_at_screen(event.position)
		elif event.button_index == MOUSE_BUTTON_RIGHT or event.button_index == MOUSE_BUTTON_MIDDLE:
			dragging = event.pressed
			last_pointer = event.position
		elif event.pressed and event.button_index == MOUSE_BUTTON_WHEEL_UP:
			camera_distance = maxf(22.0, camera_distance - 2.5)
		elif event.pressed and event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			camera_distance = minf(82.0, camera_distance + 2.5)
	elif event is InputEventMouseMotion and dragging:
		camera_yaw -= event.relative.x * 0.18
		camera_pitch = clampf(camera_pitch - event.relative.y * 0.12, -75.0, -20.0)
	elif event is InputEventMagnifyGesture:
		camera_distance = clampf(camera_distance / event.factor, 22.0, 82.0)

	elif event is InputEventPanGesture:
		camera_yaw -= event.delta.x * 0.6
	elif event is InputEventScreenTouch:
		if event.pressed:
			active_touches[event.index] = event.position
		else:
			active_touches.erase(event.index)
	elif event is InputEventScreenDrag:
		active_touches[event.index] = event.position
		if active_touches.size() == 1:
			camera_yaw -= event.relative.x * 0.16
			camera_pitch = clampf(camera_pitch - event.relative.y * 0.10, -75.0, -20.0)
		elif active_touches.size() == 2:
			var touches := active_touches.values()
			var cur_dist: float = touches[0].distance_to(touches[1])
			var prev_pos: Vector2 = event.position - event.relative
			var other_pos: Vector2 = touches[0] if touches[1] == event.position else touches[1]
			var prev_dist: float = prev_pos.distance_to(other_pos)
			camera_distance = clampf(camera_distance - (cur_dist - prev_dist) * 0.04, 16.0, 46.0)

func _update_camera(delta: float) -> void:
	var input_axis := Input.get_axis("camera_left", "camera_right")
	var zoom_axis := Input.get_axis("camera_up", "camera_down")
	camera_yaw += input_axis * delta * 45.0
	camera_distance = clampf(camera_distance + zoom_axis * delta * 20.0, 22.0, 82.0)


	$CameraRig.rotation_degrees.y = lerpf($CameraRig.rotation_degrees.y, camera_yaw, delta * 8.0)
	$CameraRig/Camera3D.rotation_degrees.x = lerpf($CameraRig/Camera3D.rotation_degrees.x, camera_pitch, delta * 8.0)
	$CameraRig/Camera3D.position.z = lerpf($CameraRig/Camera3D.position.z, camera_distance, delta * 8.0)
	$CameraRig.position = $CameraRig.position.lerp(camera_target_pos, delta * 6.0)

# ==============================================================================
# 3D WORLD ARCHITECTURE & DYNAMIC MULTI-SIZE STORES
# ==============================================================================
func _build_architecture() -> void:
	# Main Site Podium — large enough to cover 4 wings + corners
	_box("Site", Vector3(0, -0.45, 0), Vector3(100, 0.7, 100), Color("#0b1220"), 0.12, 0.9)

	# Corner fill slabs between wings (to avoid void gaps at intersections)
	for cx in [-16.0, 16.0]:
		for cz in [-16.0, 16.0]:
			_box("CornerSlab_%d_%d" % [int(cx), int(cz)], Vector3(cx, 0.0, cz),
				Vector3(16.0, 0.18, 16.0), Color("#1e293b"), 0.1, 0.8)

	# Walkable Concourse Galleries from blueprint
	for corridor in blueprint.get("corridors", []):
		var center: Array = corridor.center
		var size_data: Array = corridor.size
		var is_atrium: bool = corridor.get("material", "") == "atrium"
		_box(
			str(corridor.id),
			Vector3(float(center[0]), 0.02 if is_atrium else 0.0, float(center[1])),
			Vector3(float(size_data[0]), 0.22 if is_atrium else 0.18, float(size_data[1])),
			Color("#f8fafc") if is_atrium else Color("#e2e8f0"),
			0.22 if is_atrium else 0.15,
			0.15 if is_atrium else 0.25
		)

	# Brass Circulation Inlays — dual-lane along each wing axis
	# East/West wing (X axis): two lanes at z = ±2.8
	_box("BrassInlayEW_N", Vector3(0, 0.12, -2.8), Vector3(80.0, 0.025, 0.14), Color("#caa85e"), 0.85, 0.2)
	_box("BrassInlayEW_S", Vector3(0, 0.12,  2.8), Vector3(80.0, 0.025, 0.14), Color("#caa85e"), 0.85, 0.2)
	# North/South wing (Z axis): two lanes at x = ±2.8
	_box("BrassInlayNS_W", Vector3(-2.8, 0.12, 0), Vector3(0.14, 0.025, 80.0), Color("#caa85e"), 0.85, 0.2)
	_box("BrassInlayNS_E", Vector3( 2.8, 0.12, 0), Vector3(0.14, 0.025, 80.0), Color("#caa85e"), 0.85, 0.2)

	# Skylight Beams — along East/West wing
	for x in [-30.0, -20.0, -10.0, 10.0, 20.0, 30.0]:
		_box("SkylightBeam_EW_%d" % int(x), Vector3(x, 4.4, 0), Vector3(0.18, 0.2, 9.0), Color("#38bdf8"), 0.7, 0.1)
	# Skylight Beams — along North/South wing
	for z in [-30.0, -20.0, -10.0, 10.0, 20.0, 30.0]:
		_box("SkylightBeam_NS_%d" % int(z), Vector3(0, 4.4, z), Vector3(9.0, 0.2, 0.18), Color("#38bdf8"), 0.7, 0.1)

	# Wing intersection corner benches (4 corners)
	var corner_positions := [Vector3(12, 0, -12), Vector3(-12, 0, -12), Vector3(12, 0, 12), Vector3(-12, 0, 12)]
	for i in corner_positions.size():
		var cp: Vector3 = corner_positions[i]
		_box("CornerBench_%d" % i, cp, Vector3(2.2, 0.48, 0.7), Color("#334155"), 0.3, 0.5)
		_box("CornerBenchBack_%d" % i, cp + Vector3(0, 0.42, 0), Vector3(2.2, 0.35, 0.2), Color("#1e293b"), 0.2, 0.5)

	# Grand Center Court Fountain (expanded)
	_build_center_court_fountain()

func _build_center_court_fountain() -> void:
	var root := Node3D.new()
	root.name = "CenterCourtFountain"
	root.position = Vector3(0, 0, 0)
	add_child(root)

	# Grand outer basin — wider for the larger rotunda
	_cylinder("FountainBasinOuter", Vector3(0, 0.25, 0), 3.4, 0.55, Color("#0f766e"), 0.3, 0.4, root)
	# Water surface
	_cylinder("FountainWater", Vector3(0, 0.46, 0), 3.2, 0.12, Color(0.15, 0.75, 0.92, 0.88), 0.2, 0.05, root, true)
	# Inner basin tier
	_cylinder("FountainBasinMid", Vector3(0, 0.82, 0), 1.9, 0.55, Color("#0d9488"), 0.35, 0.35, root)
	_cylinder("FountainWaterMid", Vector3(0, 1.06, 0), 1.75, 0.08, Color(0.2, 0.85, 0.95, 0.8), 0.2, 0.05, root, true)
	# Top tier basin
	_cylinder("FountainBasinInner", Vector3(0, 1.35, 0), 1.0, 0.5, Color("#115e59"), 0.3, 0.4, root)
	# Central spire
	_cylinder("FountainSpire", Vector3(0, 1.95, 0), 0.28, 1.1, Color("#caa85e"), 0.8, 0.2, root)
	_sphere("FountainSphere", Vector3(0, 2.65, 0), 0.42, Color("#67e8f9"), 0.9, 0.08, root)

	# 4 cardinal benches around the fountain
	for angle_deg in [0.0, 90.0, 180.0, 270.0]:
		var rad := deg_to_rad(angle_deg)
		var bx := sin(rad) * 5.0
		var bz := cos(rad) * 5.0
		var bench := _box("FountainBench_%d" % int(angle_deg),
			Vector3(bx, 0.24, bz), Vector3(2.4, 0.48, 0.72), Color("#1e3a5f"), 0.3, 0.5, root)
		if bench != null:
			bench.rotation_degrees.y = -angle_deg



func _build_stores_from_blueprint() -> void:
	stores.clear()
	var defs: Array = blueprint.get("stores", [])
	for index in defs.size():
		var def: Dictionary = defs[index]
		var store_pos: Array = def.position
		var size_data: Array = def.get("size", [7.5, 6.0])
		var width: float = float(size_data[0])
		var depth: float = float(size_data[1])
		var north: bool = float(store_pos[1]) < 0.0
		var cat: String = str(def.get("category", "Fashion"))
		var lot_type: String = str(def.get("lot_type", "standard"))

		var tenant_match := _find_tenant_by_category(cat)
		var s_name := str(def.get("name", tenant_match.get("name", "Store")))
		var s_income := int(tenant_match.get("base_income", 100))
		var s_draw := int(tenant_match.get("draw", 35))

		# Scale stats for mega anchors vs kiosks
		if lot_type == "mega_anchor":
			s_income = roundi(s_income * 1.6)
			s_draw = roundi(s_draw * 1.5)
		elif lot_type == "kiosk":
			s_income = roundi(s_income * 0.75)
			s_draw = roundi(s_draw * 0.8)

		var door_z: float = -3.8 if north else 3.8
		var store := {
			"name": s_name,
			"category": cat,
			"lot_type": lot_type,
			"width": width,
			"depth": depth,
			"position": Vector3(float(store_pos[0]), 0, float(store_pos[1])),
			"door": Vector3(float(store_pos[0]), 0.15, door_z),
			"price": "Market",
			"staff": int(tenant_match.get("base_staff", 2)) if lot_type != "mega_anchor" else 4,
			"stock": 100.0,
			"satisfaction": 95,
			"promotion": 0.0,
			"facade": "Neon" if cat == "Entertainment" else "Warm" if cat == "Food" else "Gallery",
			"color": STORE_COLORS[index % STORE_COLORS.size()],
			"level": 1,
			"revenue": 0,
			"served": 0,
			"base_income": s_income,
			"draw": s_draw,
			"tenant_id": str(tenant_match.get("id", "generic")),
			"fixtures": [] as Array[Vector3],
			"register_pos": Vector3.ZERO,
			"seat_pos": Vector3.ZERO
		}
		store["economy"] = tycoon_economy.create_store_economy(store, tenant_match, week, catalog_data)

		if cat == "Entertainment":
			store["cinema_state"] = {
				"movie": "Interstellar Echoes 4DX",
				"phase": "box_office",
				"timer": 20.0
			}

		stores.append(store)
		_build_store_model(index, store, north)

func _build_store_model(index: int, store: Dictionary, north: bool) -> void:
	var old_node := get_node_or_null("Store_%02d_%s" % [index, store.name])
	if old_node != null:
		old_node.queue_free()
	for child in get_children():
		if child is Node3D and child.has_meta("store_index") and int(child.get_meta("store_index")) == index:
			child.queue_free()

	var root := Node3D.new()
	root.name = "Store_%02d_%s" % [index, store.name]
	root.position = store.position
	root.set_meta("store_index", index)
	add_child(root)

	var color: Color = store.color
	var level: int = int(store.get("level", 1))
	var cat: String = str(store.get("category", "Fashion"))
	var width: float = float(store.get("width", 7.5))
	var depth: float = float(store.get("depth", 6.0))
	var wall_height: float = 3.6 if store.get("lot_type", "") == "mega_anchor" else 3.2

	# Floor Slab with Category Material
	var floor_color: Color = color.lightened(0.78)
	if level >= 2: floor_color = floor_color.lightened(0.1)
	_box("Floor", Vector3(0, 0.12, 0), Vector3(width, 0.2, depth), floor_color, 0.08, 0.25, root)

	# Selection Ring / Highlight
	var selection := _box("Selection", Vector3(0, 0.245, 0), Vector3(width + 0.2, 0.035, depth + 0.2), Color(0.2, 0.9, 1.0, 0.35), 0.7, 0.1, root, true)
	selection.visible = index == selected_store_idx

	# Perimeter Walls
	var back_z: float = (-depth * 0.5) if north else (depth * 0.5)
	var facade_z: float = (depth * 0.5) if north else (-depth * 0.5)
	var wall_color := Color("#152033") if level < 3 else Color("#0f172a")

	_box("BackWall", Vector3(0, wall_height * 0.5, back_z), Vector3(width, wall_height, 0.22), wall_color, 0.15, 0.6, root)
	_box("LeftWall", Vector3(-width * 0.5, wall_height * 0.5, 0), Vector3(0.22, wall_height, depth), Color("#243044"), 0.1, 0.55, root)
	_box("RightWall", Vector3(width * 0.5, wall_height * 0.5, 0), Vector3(0.22, wall_height, depth), Color("#243044"), 0.1, 0.55, root)

	# Facade Beam & Glass Curtain Wall
	_box("FacadeBeam", Vector3(0, wall_height - 0.35, facade_z), Vector3(width, 0.7, 0.32), color.darkened(0.4), 0.5, 0.2, root)
	var glass_w: float = (width - 2.8) * 0.5
	_box("GlassLeft", Vector3(-width * 0.5 + glass_w * 0.5, (wall_height - 0.7) * 0.5, facade_z), Vector3(glass_w, wall_height - 0.7, 0.12), Color(0.45, 0.85, 0.95, 0.3), 0.3, 0.05, root, true)
	_box("GlassRight", Vector3(width * 0.5 - glass_w * 0.5, (wall_height - 0.7) * 0.5, facade_z), Vector3(glass_w, wall_height - 0.7, 0.12), Color(0.45, 0.85, 0.95, 0.3), 0.3, 0.05, root, true)

	# 3D Illuminated Signage
	var sign := Label3D.new()
	sign.name = "Sign"
	sign.text = "%s %s" % [store.name, "★".repeat(level) if level > 1 else ""]
	sign.font_size = 32 if store.get("lot_type", "") == "mega_anchor" else 26
	sign.outline_size = 8
	sign.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	sign.modulate = color.lightened(0.35)
	sign.position = Vector3(0, wall_height - 0.3, facade_z + (0.22 if north else -0.22))
	sign.rotation_degrees.y = 0 if north else 180
	root.add_child(sign)

	# Procedural Interior Fixtures & Target Calculation
	_build_category_interior(root, store, north)

	# Clickable Collision Shape
	var body := StaticBody3D.new()
	body.set_meta("store_index", index)
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = Vector3(width, wall_height, depth)
	collision.shape = shape
	collision.position.y = wall_height * 0.5
	body.add_child(collision)
	root.add_child(body)

	_apply_facade_to_node(root, str(store.get("facade", "Gallery")), color)

func _build_category_interior(root: Node3D, store: Dictionary, north: bool) -> void:
	var cat: String = str(store.get("category", "Fashion"))
	var width: float = float(store.get("width", 7.5))
	var depth: float = float(store.get("depth", 6.0))
	var level: int = int(store.get("level", 1))
	var center_pos: Vector3 = store.position

	var counter_z: float = (-depth * 0.25) if north else (depth * 0.25)
	var reg_local := Vector3(-width * 0.25, 0.5, counter_z)
	_box("Counter", reg_local, Vector3(2.4, 0.9, 0.8), Color("#334155"), 0.3, 0.4, root)
	_box("Register", reg_local + Vector3(0.5, 0.55, 0), Vector3(0.5, 0.25, 0.45), Color("#0f172a"), 0.6, 0.2, root)
	store.register_pos = center_pos + reg_local

	var fixtures: Array[Vector3] = []
	var seat_world := Vector3.ZERO

	match cat:
		"Dining", "Cafe", "Food":
			_box("FoodDisplay", reg_local + Vector3(-0.6, 0.52, 0), Vector3(1.1, 0.35, 0.6), Color(0.9, 0.95, 1.0, 0.5), 0.2, 0.1, root, true)
			fixtures.append(center_pos + reg_local + Vector3(0, 0, 0.8 if north else -0.8))

			# Dining Tables & Chairs
			var table_xs := [-width * 0.2, width * 0.1, width * 0.3]
			for tx in table_xs:
				var tz: float = (depth * 0.15) if north else (-depth * 0.15)
				_cylinder("DiningTable", Vector3(tx, 0.48, tz), 0.45, 0.1, Color("#9a6c45"), 0.1, 0.6, root)
				_cylinder("Stool1", Vector3(tx - 0.4, 0.25, tz), 0.16, 0.45, Color("#475569"), 0.2, 0.5, root)
				_cylinder("Stool2", Vector3(tx + 0.4, 0.25, tz), 0.16, 0.45, Color("#475569"), 0.2, 0.5, root)
				if seat_world == Vector3.ZERO:
					seat_world = center_pos + Vector3(tx, 0.15, tz)
				fixtures.append(center_pos + Vector3(tx, 0.15, tz))

		"Entertainment":
			var screen_z: float = (-depth * 0.45) if north else (depth * 0.45)
			var screen := _box("IMAXScreen", Vector3(0, 1.7, screen_z), Vector3(width * 0.85, 2.4, 0.1), Color("#ffffff"), 0.2, 0.1, root)
			var screen_mat := StandardMaterial3D.new()
			screen_mat.albedo_color = Color("#0f172a")
			screen_mat.emission_enabled = true
			screen_mat.emission = Color("#38bdf8")
			screen_mat.emission_energy_multiplier = 1.4
			screen.material_override = screen_mat

			# Stadium Recliner Rows
			for r in 2:
				var rz: float = (-depth * 0.15 + r * 1.3) if north else (depth * 0.15 - r * 1.3)
				for sx in [-width * 0.25, 0.0, width * 0.25]:
					_box("CinemaSeat", Vector3(sx, 0.45, rz), Vector3(0.75, 0.6, 0.65), Color("#831843"), 0.1, 0.7, root)
					if seat_world == Vector3.ZERO:
						seat_world = center_pos + Vector3(sx, 0.15, rz)
					fixtures.append(center_pos + Vector3(sx, 0.15, rz))

		"Technology", "Specialty":
			for tx in [-width * 0.2, width * 0.2]:
				_box("TechTable", Vector3(tx, 0.52, 0.0), Vector3(1.6, 0.85, 2.0), Color("#e2e8f0"), 0.4, 0.2, root)
				_box("Device1", Vector3(tx - 0.35, 0.98, -0.3), Vector3(0.35, 0.05, 0.45), Color("#38bdf8"), 0.8, 0.1, root)
				_box("Device2", Vector3(tx + 0.35, 0.98, 0.3), Vector3(0.35, 0.05, 0.45), Color("#a855f7"), 0.8, 0.1, root)
				fixtures.append(center_pos + Vector3(tx, 0.15, 0.0))

		"Fashion", "Luxury":
			for rx in [-width * 0.2, width * 0.2]:
				_box("ClothingRack", Vector3(rx, 0.75, 0.0), Vector3(1.8, 1.3, 0.6), Color("#d97706" if cat == "Luxury" else "#475569"), 0.6, 0.3, root)
				fixtures.append(center_pos + Vector3(rx, 0.15, 0.0))
			_cylinder("MannequinPedestal", Vector3(width * 0.35, 0.18, counter_z), 0.35, 0.15, Color("#caa85e"), 0.8, 0.2, root)
			_cylinder("MannequinBody", Vector3(width * 0.35, 0.8, counter_z), 0.2, 1.1, Color("#fce7f3"), 0.1, 0.4, root)

	if level >= 2:
		_cylinder("Chandelier", Vector3(0, 3.2, 0), 0.7, 0.15, Color("#facc15"), 0.9, 0.1, root)
	if level >= 3:
		_box("GoldTrimLeft", Vector3(-width * 0.5 + 0.05, 3.0, 0), Vector3(0.1, 0.15, depth - 0.4), Color("#caa85e"), 0.9, 0.1, root)
		_box("GoldTrimRight", Vector3(width * 0.5 - 0.05, 3.0, 0), Vector3(0.1, 0.15, depth - 0.4), Color("#caa85e"), 0.9, 0.1, root)

	store.fixtures = fixtures
	store.seat_pos = seat_world

func _update_cinema_glow(store: Dictionary, active: bool) -> void:
	var idx := stores.find(store)
	if idx < 0: return
	var root := get_node_or_null("Store_%02d_%s" % [idx, store.name])
	if root != null and root.has_node("IMAXScreen"):
		var screen: MeshInstance3D = root.get_node("IMAXScreen")
		var mat := screen.material_override as StandardMaterial3D
		if mat != null:
			mat.emission_energy_multiplier = 3.2 if active else 0.6
			mat.emission = Color("#f43f5e") if active else Color("#38bdf8")

func _apply_facade_to_node(root: Node3D, style: String, base_color: Color) -> void:
	if not root.has_node("FacadeBeam"): return
	var beam: MeshInstance3D = root.get_node("FacadeBeam")
	var mat := beam.material_override as StandardMaterial3D
	if mat == null: return

	match style:
		"Gallery":
			mat.albedo_color = Color("#0f172a")
			mat.emission_enabled = false
			mat.metallic = 0.5
			mat.roughness = 0.2
		"Warm":
			mat.albedo_color = Color("#78350f")
			mat.emission_enabled = true
			mat.emission = Color("#d97706")
			mat.emission_energy_multiplier = 0.3
			mat.metallic = 0.1
			mat.roughness = 0.6
		"Neon":
			mat.albedo_color = Color("#1e1b4b")
			mat.emission_enabled = true
			mat.emission = base_color
			mat.emission_energy_multiplier = 2.4
			mat.metallic = 0.7
			mat.roughness = 0.1

func _build_entrances() -> void:
	for entry_data in blueprint.get("entrances", []):
		var entry_pos: Array = entry_data.position
		var entry_id := str(entry_data.id)
		entrances[entry_id] = {
			"name": entry_data.name,
			"position": Vector3(float(entry_pos[0]), 0.0, float(entry_pos[1])),
			"entered": 0,
			"exited": 0
		}
		_build_entrance_portal(entry_id, float(entry_pos[0]), float(entry_pos[1]), float(entry_data.facing))

func _build_entrance_portal(id: String, x: float, z: float, facing: float) -> void:
	var root := Node3D.new()
	root.name = "%s_entrance" % id
	root.position = Vector3(x, 0, z)
	root.rotation_degrees.y = facing
	add_child(root)

	_box("PortalTop", Vector3(0, 3.3, 0), Vector3(5.6, 0.6, 0.7), Color("#083344"), 0.5, 0.2, root)
	_box("PortalLeft", Vector3(-2.55, 1.6, 0), Vector3(0.55, 3.2, 0.7), Color("#164e63"), 0.5, 0.2, root)
	_box("PortalRight", Vector3(2.55, 1.6, 0), Vector3(0.55, 3.2, 0.7), Color("#164e63"), 0.5, 0.2, root)
	_box("GlassDoors", Vector3(0, 1.5, 0), Vector3(4.6, 2.9, 0.1), Color(0.45, 0.9, 1.0, 0.3), 0.35, 0.05, root, true)

	var label := Label3D.new()
	label.text = entrances[id].name.to_upper()
	label.font_size = 28
	label.outline_size = 7
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label.modulate = Color("#a5f3fc")
	label.position = Vector3(0, 3.35, 0.42)
	root.add_child(label)

# ==============================================================================
# SHOPPER SPAWNING & FOUNTAIN-AVOIDANCE CONCOURSE PATHFINDING
# ==============================================================================
func _spawn_shopper(from_west: bool) -> void:
	var entry := "west" if from_west else "east"
	var exit := "east" if from_west else "west"

	var chosen_idx := _pick_weighted_store_index()
	if chosen_idx < 0 or chosen_idx >= stores.size(): return
	var chosen_store := stores[chosen_idx]
	var door: Vector3 = chosen_store.door
	var is_north: bool = door.z < 0.0
	var lane_z: float = -2.8 if is_north else 2.8

	var start_x := -27.0 if from_west else 27.0
	var thresh_x := -24.0 if from_west else 24.0

	# Concourse route with dual-lane curve around the center court fountain (z = +/- 2.8)
	var route: Array[Vector3] = [
		Vector3(start_x, 0.05, 0.0),
		Vector3(thresh_x, 0.05, lane_z * 0.5),
		Vector3(door.x * 0.5, 0.05, lane_z), # Midpoint lane curving cleanly around fountain
		Vector3(door.x, 0.05, lane_z),
		door,
		Vector3(door.x, 0.05, lane_z),
		Vector3(-thresh_x * 0.5, 0.05, lane_z),
		Vector3(-thresh_x, 0.05, lane_z * 0.5),
		Vector3(-start_x, 0.05, 0.0)
	]
	_sample_heatmap_route(route)

	var shopper: Node3D = _spawn_shopper_node()

	add_child(shopper)

	shopper.configure(route, entry, exit, chosen_idx, chosen_store, cleanliness, security, _build_shopper_context())
	shopper.set_store_interior_targets(chosen_store.get("fixtures", []), chosen_store.get("register_pos", Vector3.ZERO), chosen_store.get("seat_pos", Vector3.ZERO))
	shopper.finished_visit.connect(_on_shopper_finished)
	shopper.coin_tossed_in_fountain.connect(_on_fountain_coin_tossed)
	shopper.shopper_thought.connect(_on_shopper_thought)

	if entrances.has(entry):
		entrances[entry].entered += 1
	active_shoppers += 1
	_refresh_stats_hud()

func _build_shopper_context() -> Dictionary:
	var food_count := 0
	var entertainment_count := 0
	for s in stores:
		match str(s.get("category", "")):
			"Food":
				food_count += 1
			"Entertainment":
				entertainment_count += 1
	var restrooms := 0
	var seating := 0
	for amen in placed_amenities:
		match str(amen.get("type", "")):
			"luxury_restroom":
				restrooms += 1
			"rest_bench", "bistro_dining_set", "fountain_tier":
				seating += 1
	return {
		"food_count": food_count,
		"entertainment_count": entertainment_count,
		"restrooms": restrooms,
		"seating": seating,
		"reputation": reputation
	}

func _on_fountain_coin_tossed(pos: Vector3) -> void:
	cash += 1
	reputation = mini(100, reputation + 1)
	sound_mgr.play_cash()
	_spawn_floating_revenue(1, pos + Vector3(0, 1.2, 0), Color("#67e8f9"))

func _on_shopper_finished(_entry: String, exit: String, s_index: int, purchased: bool, amount: int, rating_shift: int) -> void:
	if entrances.has(exit):
		entrances[exit].exited += 1

	if s_index >= 0 and s_index < stores.size():
		var store := stores[s_index]
		store.satisfaction = clampi(int(store.get("satisfaction", 95)) + rating_shift, 30, 100)

		if purchased and amount > 0:
			var player_cut := roundi(amount * 0.24)
			cash += player_cut
			total_sales += amount
			store.revenue = int(store.get("revenue", 0)) + amount
			store.served = int(store.get("served", 0)) + 1
			store.stock = maxf(0.0, float(store.get("stock", 100.0)) - randf_range(1.5, 3.5))
			_add_heatmap_sample(store.position, "spend", amount)
			_add_heatmap_sample(store.position, "satisfaction", 8)

			_spawn_floating_revenue(player_cut, store.position + Vector3(0, 1.8, 0), Color("#34d399"))
			sound_mgr.play_cash()
		elif rating_shift < 0:
			_add_heatmap_sample(store.position, "satisfaction", rating_shift * 8)

	active_shoppers = maxi(0, active_shoppers - 1)
	_refresh_stats_hud()
	if current_drawer == "inspector":
		_render_drawer_content()

func _on_shopper_thought(world_pos: Vector3, text: String, severity: String, s_index: int) -> void:
	var thought := {
		"text": text,
		"severity": severity,
		"store_index": s_index,
		"x": world_pos.x,
		"z": world_pos.z,
		"time": "W%d·D%d" % [week, day]
	}
	shopper_thoughts.push_front(thought)
	if shopper_thoughts.size() > 80:
		shopper_thoughts.pop_back()
	if severity == "warning":
		_add_heatmap_sample(world_pos, "satisfaction", -7)
		reputation = maxi(10, reputation - 1)
		if randf() < 0.22:
			_add_event("Shopper Complaint", text, "warning")
	elif severity == "success" and randf() < 0.16:
		_add_heatmap_sample(world_pos, "satisfaction", 5)
		reputation = mini(100, reputation + 1)
	if current_drawer == "data":
		_render_drawer_content()
	_refresh_stats_hud()

func _sample_heatmap_route(route: Array[Vector3]) -> void:
	for point in route:
		_add_heatmap_sample(point, "traffic", 1)

func _add_heatmap_sample(world_pos: Vector3, metric: String, amount: int) -> void:
	var gx := roundi(world_pos.x / 3.0) * 3
	var gz := roundi(world_pos.z / 3.0) * 3
	var key := "%d:%d" % [gx, gz]
	if not heatmap_cells.has(key):
		heatmap_cells[key] = {"x": gx, "z": gz, "traffic": 0, "spend": 0, "satisfaction": 0}
	var cell: Dictionary = heatmap_cells[key]
	cell[metric] = int(cell.get(metric, 0)) + amount
	if heatmap_mode != "none":
		_refresh_heatmap_overlay()

func _set_heatmap_mode(mode: String) -> void:
	heatmap_mode = mode
	sound_mgr.play_click()
	_refresh_heatmap_overlay()
	_render_drawer_content()

func _refresh_heatmap_overlay() -> void:
	if heatmap_overlay_root == null:
		return
	for child in heatmap_overlay_root.get_children():
		child.queue_free()
	if heatmap_mode == "none":
		return

	var max_abs := 1
	for cell in heatmap_cells.values():
		max_abs = maxi(max_abs, abs(int(cell.get(heatmap_mode, 0))))

	for cell in heatmap_cells.values():
		var value := int(cell.get(heatmap_mode, 0))
		if value == 0:
			continue
		var intensity := clampf(float(abs(value)) / float(max_abs), 0.18, 0.85)
		var col := Color(0.2, 0.7, 1.0, 0.18 + intensity * 0.38)
		match heatmap_mode:
			"traffic":
				col = Color(0.15, 0.65, 1.0, 0.18 + intensity * 0.38)
			"spend":
				col = Color(0.1, 0.9, 0.45, 0.18 + intensity * 0.42)
			"satisfaction":
				col = Color(0.2, 0.9, 0.45, 0.18 + intensity * 0.42) if value >= 0 else Color(1.0, 0.25, 0.35, 0.2 + intensity * 0.42)
		_box("Heat_%s" % str(cell), Vector3(float(cell.x), 0.2, float(cell.z)), Vector3(2.8, 0.035, 2.8), col, 0.0, 0.7, heatmap_overlay_root, true)

func _spawn_floating_revenue(amount: int, world_pos: Vector3, col := Color("#34d399")) -> void:
	var label := Label3D.new()
	label.text = "+$%d" % amount
	label.font_size = 38
	label.outline_size = 8
	label.modulate = col
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label.position = world_pos
	add_child(label)

	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(label, "position:y", world_pos.y + 2.2, 1.4)
	tween.tween_property(label, "modulate:a", 0.0, 1.4).set_ease(Tween.EASE_IN)
	tween.chain().tween_callback(label.queue_free)

# ==============================================================================
# TYCOON STRATEGIC DIFFICULTY: SYNERGY, CANNIBALIZATION & DRAW MATRIX
# ==============================================================================
func _calculate_total_mall_draw() -> int:
	var total := 0
	for i in stores.size():
		total += _calculate_single_store_draw(i)
	return total

func _calculate_single_store_draw(idx: int) -> int:
	var s := stores[idx]
	if str(s.get("tenant_id", "")) == "vacant" or str(s.get("category", "")) == "Vacant":
		return 0
	var base_draw: float = float(s.get("draw", 35))
	var mult := 1.5 if float(s.get("promotion", 0.0)) > 0.0 else 1.0
	var stock_pen := 0.3 if float(s.get("stock", 100.0)) < 15.0 else 1.0
	var layout := _calculate_layout_factors(idx)
	return int(base_draw * mult * stock_pen * float(layout.get("draw_multiplier", 1.0)))

func _calculate_layout_factors(idx: int) -> Dictionary:
	if idx < 0 or idx >= stores.size():
		return {"draw_multiplier": 1.0, "score": 50, "reasons": []}
	var s := stores[idx]
	var cat: String = str(s.get("category", ""))
	if cat == "Vacant":
		return {"draw_multiplier": 0.0, "score": 0, "reasons": ["vacant"]}

	var multiplier := 1.0
	var score := 55.0
	var reasons: Array[String] = []
	var same_cat_neighbors := 0
	var combo_hits := 0
	var nearby_count := 0
	var combo_map := {
		"Entertainment": ["Food", "Specialty"],
		"Food": ["Entertainment", "Food"],
		"Luxury": ["Luxury", "Fashion", "Specialty"],
		"Fashion": ["Fashion", "Luxury", "Specialty"],
		"Specialty": ["Entertainment", "Fashion", "Luxury"]
	}

	for j in stores.size():
		if idx == j: continue
		var other := stores[j]
		if str(other.get("category", "")) == "Vacant": continue
		var dist: float = s.position.distance_to(other.position)
		if dist > 16.0: continue
		nearby_count += 1
		var other_cat := str(other.get("category", ""))
		if other_cat == cat:
			same_cat_neighbors += 1
		if combo_map.get(cat, []).has(other_cat):
			combo_hits += 1

	if combo_hits > 0:
		var combo_bonus := minf(0.24, combo_hits * 0.08)
		multiplier += combo_bonus
		score += combo_bonus * 100.0
		reasons.append("adjacency combo")
	if same_cat_neighbors >= 3:
		multiplier -= 0.26
		score -= 24.0
		reasons.append("category saturation")
	elif same_cat_neighbors >= 1:
		multiplier += 0.08
		score += 8.0
		reasons.append("cluster identity")

	var best_anchor_bonus := 0.0
	for other in stores:
		if other.get("lot_type", "") == "mega_anchor" and s.get("lot_type", "") != "mega_anchor":
			var anchor_dist: float = s.position.distance_to(other.position)
			if anchor_dist < 26.0:
				best_anchor_bonus = maxf(best_anchor_bonus, 0.32 * (1.0 - anchor_dist / 26.0))
	if best_anchor_bonus > 0.0:
		multiplier += best_anchor_bonus
		score += best_anchor_bonus * 80.0
		reasons.append("anchor halo")

	var nearest_entrance := 999.0
	for entrance in entrances.values():
		nearest_entrance = minf(nearest_entrance, s.position.distance_to(entrance.position))
	if nearest_entrance > 34.0 and nearby_count < 2:
		multiplier -= 0.22
		score -= 18.0
		reasons.append("dead-zone risk")

	multiplier = clampf(multiplier, 0.45, 1.75)
	score = clampf(score, 0.0, 100.0)
	if reasons.is_empty():
		reasons.append("neutral layout")
	return {"draw_multiplier": multiplier, "score": roundi(score), "reasons": reasons}

func _update_layout_scores() -> void:
	for i in stores.size():
		var factors := _calculate_layout_factors(i)
		stores[i]["layout_score"] = int(factors.get("score", 50))
		stores[i]["layout_reasons"] = factors.get("reasons", [])
		if stores[i].has("economy") and stores[i].economy is Dictionary:
			stores[i].economy["layout_score"] = int(factors.get("score", 50))
			stores[i].economy["layout_reasons"] = factors.get("reasons", [])

func _pick_weighted_store_index() -> int:
	var candidates: Array[int] = []
	for i in stores.size():
		if _calculate_single_store_draw(i) <= 0:
			continue
		var weight := maxi(1, _calculate_single_store_draw(i) / 7)
		for count in weight:
			candidates.append(i)
	return candidates[randi() % candidates.size()] if candidates.size() > 0 else 0

# ==============================================================================
# OPERATIONS, HEALTH FINES, SHOPLIFTING & WEEKLY ACCOUNTING
# ==============================================================================
func _ensure_store_economy_state() -> void:
	if tycoon_economy == null:
		return
	for s in stores:
		var tenant_def := _find_tenant_by_id(str(s.get("tenant_id", "")))
		tycoon_economy.ensure_store_economy(s, tenant_def, week, catalog_data)
	_update_layout_scores()

func _process_weekly_accounting() -> void:
	_ensure_store_economy_state()
	var accounting: Dictionary = tycoon_economy.process_weekly_accounting(
		stores,
		catalog_data,
		week,
		cleanliness,
		security,
		reputation,
		placed_amenities.size()
	)
	weekly_reports = accounting.get("reports", [])
	tycoon_metrics = accounting.get("metrics", {})

	var total_rent := int(accounting.get("total_rent", 0))
	var total_revenue_share := int(accounting.get("total_revenue_share", 0))
	var amenity_income := int(accounting.get("amenity_income", 0))
	var maintenance := int(accounting.get("maintenance", 0))
	var net_profit := int(accounting.get("net_profit", 0))

	cash += net_profit
	cleanliness = maxi(15, cleanliness - 4)
	security = maxi(15, security - 3)

	sound_mgr.play_doorbell()
	_add_event(
		"Week %d Accounting Statement" % week,
		"Rent: +$%s · Share: +$%s · Amenities: +$%s · Ops: -$%s · Net: %s$%s" % [
			_comma(total_rent), _comma(total_revenue_share), _comma(amenity_income), _comma(maintenance),
			"+" if net_profit >= 0 else "-", _comma(abs(net_profit))
		],
		"finance"
	)
	for report in weekly_reports.slice(0, mini(weekly_reports.size(), 3)):
		if str(report.get("state", "")) == "at-risk":
			_add_event("Tenant At Risk", str(report.get("statement", "")), "warning")
	_save_game()
	_refresh_stats_hud()

func _trigger_health_inspection_penalty() -> void:
	var fine := 1200
	cash = maxi(0, cash - fine)
	reputation = maxi(20, reputation - 10)
	sound_mgr.play_error()
	_add_event("🚨 Municipal Health Citation", "Mall cleanliness fell below health standards! Fined $%s." % _comma(fine), "warning")
	_refresh_stats_hud()

func _trigger_shoplifting_incident() -> void:
	var lost := randi_range(300, 600)
	cash = maxi(0, cash - lost)
	reputation = maxi(20, reputation - 6)
	sound_mgr.play_error()
	_add_event("🚨 Security Incident Reported", "Shoplifting wave detected in concourse wings. Losses: -$%d." % lost, "warning")
	_refresh_stats_hud()

func _trigger_daily_event() -> void:
	var ev_type := randi() % 3
	match ev_type:
		0:
			reputation = mini(100, reputation + 4)
			for i in 8: _spawn_shopper(i % 2 == 0)
			_add_event("Dining Critic Rave Review", "Food critic praised the culinary court! Reputation +4.", "info")
		1:
			cleanliness = mini(100, cleanliness + 12)
			cash += 600
			_add_event("Municipal Beautification Grant", "Mall architecture & fountain awarded grant! +$600.", "info")
		2:
			reputation = mini(100, reputation + 5)
			for i in 12: _spawn_shopper(i % 2 == 0)
			_add_event("Weekend Mall Festival", "Wave of weekend shoppers arriving for the atrium expo!", "info")
	_refresh_stats_hud()

func _perform_mall_action(action: String) -> void:
	match action:
		"clean":
			if cash < 250:
				sound_mgr.play_error()
				return
			cash -= 250
			cleanliness = mini(100, cleanliness + 25)
			sound_mgr.play_place()
			_add_event("Concourse Buffing Crew", "Floors polished to a sparkling shine. Cleanliness +25%", "success")
		"security":
			if cash < 350:
				sound_mgr.play_error()
				return
			cash -= 350
			security = mini(100, security + 20)
			sound_mgr.play_place()
			_add_event("Security Patrols Deployed", "Concourse patrols reinforced across all wings. Security +20%", "success")
		"campaign":
			if cash < 600:
				sound_mgr.play_error()
				return
			cash -= 600
			reputation = mini(100, reputation + 8)
			for i in 14: _spawn_shopper(i % 2 == 0)
			sound_mgr.play_upgrade()
			_add_event("Regional Advertising Blitz", "Billboards and social campaigns live. Surge of guests arriving!", "success")

	_save_game()
	_refresh_stats_hud()
	if current_drawer == "ops":
		_render_drawer_content()

# ==============================================================================
# SERVICE STAFF, COVERAGE & INCIDENT RESPONSE
# ==============================================================================
func _initialize_staff_units() -> void:
	if staff_units.size() > 0:
		_rebuild_staff_nodes()
		return
	_add_staff_unit("janitor", Vector3(-18, 0.05, -2.8))
	_add_staff_unit("security", Vector3(18, 0.05, 2.8))
	_add_staff_unit("maintenance", Vector3(0, 0.05, -18))
	_add_staff_unit("concierge", Vector3(0, 0.05, 18))

func _add_staff_unit(role: String, pos: Vector3) -> void:
	var id := "staff_%d" % staff_serial
	staff_serial += 1
	var unit := {
		"id": id,
		"role": role,
		"position": pos,
		"target": pos,
		"fatigue": 0.0,
		"assigned_incident": "",
		"route_phase": randf() * 10.0
	}
	staff_units.append(unit)
	_build_staff_node(unit)

func _rebuild_staff_nodes() -> void:
	for child in staff_root.get_children():
		child.queue_free()
	for unit in staff_units:
		_build_staff_node(unit)

func _build_staff_node(unit: Dictionary) -> void:
	if staff_root == null:
		return
	var root := Node3D.new()
	root.name = str(unit.id)
	root.position = unit.position
	staff_root.add_child(root)
	var color := Color("#22c55e")
	match str(unit.role):
		"janitor":
			color = Color("#38bdf8")
		"security":
			color = Color("#fbbf24")
		"maintenance":
			color = Color("#fb7185")
		"concierge":
			color = Color("#a78bfa")
	_cylinder("Body", Vector3(0, 0.55, 0), 0.18, 0.9, color, 0.2, 0.45, root)
	_sphere("Head", Vector3(0, 1.1, 0), 0.16, Color("#f0c8a0"), 0.0, 0.5, root)
	var label := Label3D.new()
	label.text = str(unit.role).substr(0, 1).to_upper()
	label.font_size = 24
	label.outline_size = 6
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label.position = Vector3(0, 1.45, 0)
	root.add_child(label)

func _process_staff_and_incidents(delta: float) -> void:
	incident_cooldown -= delta
	if incident_cooldown <= 0.0:
		incident_cooldown = randf_range(10.0, 18.0)
		_maybe_spawn_incident()

	for i in range(active_incidents.size() - 1, -1, -1):
		var incident: Dictionary = active_incidents[i]
		incident.timer = float(incident.get("timer", 30.0)) - delta
		if float(incident.timer) <= 0.0:
			_apply_incident_consequence(incident)
			_remove_incident_at(i)

	for unit in staff_units:
		_update_staff_unit(unit, delta)

func _maybe_spawn_incident() -> void:
	var pressure := 0.05
	if cleanliness < 75:
		pressure += 0.18
	if security < 75:
		pressure += 0.14
	if active_shoppers > 22:
		pressure += 0.12
	if randf() > pressure:
		return
	var roll := randi() % 4
	var incident_types: Array[String] = ["spill", "shoplifting", "broken_fixture", "lost_guest"]
	var incident_type: String = incident_types[roll]
	var pos := _random_concourse_point()
	_spawn_incident(incident_type, pos)

func _spawn_incident(incident_type: String, pos: Vector3) -> void:
	var role := "janitor"
	var title := "Concourse Spill"
	match incident_type:
		"shoplifting":
			role = "security"
			title = "Shoplifting Report"
		"broken_fixture":
			role = "maintenance"
			title = "Broken Escalator Fixture"
		"lost_guest":
			role = "concierge"
			title = "Lost Guest"
	var id := "incident_%d" % incident_serial
	incident_serial += 1
	var incident := {"id": id, "type": incident_type, "role": role, "title": title, "position": pos, "timer": 38.0, "assigned": false}
	active_incidents.append(incident)
	_build_incident_node(incident)
	_add_event("Incident Reported", "%s needs %s response." % [title, role], "warning")
	if current_drawer == "ops":
		_render_drawer_content()

func _build_incident_node(incident: Dictionary) -> void:
	if incident_root == null:
		return
	var root := Node3D.new()
	root.name = str(incident.id)
	root.position = incident.position
	incident_root.add_child(root)
	_cylinder("Marker", Vector3(0, 0.18, 0), 0.38, 0.14, Color("#ef4444"), 0.1, 0.3, root)
	var label := Label3D.new()
	label.text = "!"
	label.font_size = 44
	label.outline_size = 8
	label.modulate = Color("#fecaca")
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label.position = Vector3(0, 1.0, 0)
	root.add_child(label)

func _update_staff_unit(unit: Dictionary, delta: float) -> void:
	var incident := _find_incident_for_role(str(unit.role), str(unit.get("assigned_incident", "")), unit.position)
	if not incident.is_empty():
		unit.assigned_incident = str(incident.id)
		unit.target = incident.position
		incident.assigned = true
	else:
		unit.assigned_incident = ""
		unit.route_phase = float(unit.get("route_phase", 0.0)) + delta * 0.35
		var phase := float(unit.route_phase)
		unit.target = Vector3(sin(phase) * 22.0, 0.05, cos(phase * 0.7) * 8.0)

	var pos: Vector3 = unit.position
	var target: Vector3 = unit.target
	var dist := pos.distance_to(target)
	if dist > 0.05:
		unit.position = pos + pos.direction_to(target) * minf(delta * 3.1, dist)
	unit.fatigue = clampf(float(unit.get("fatigue", 0.0)) + delta * (0.05 if incident.is_empty() else 0.18), 0.0, 100.0)
	var node := staff_root.get_node_or_null(str(unit.id))
	if node != null:
		node.position = unit.position
		if dist > 0.1:
			var dir := pos.direction_to(target)
			node.rotation.y = lerp_angle(node.rotation.y, atan2(dir.x, dir.z), delta * 8.0)

	if not incident.is_empty() and unit.position.distance_to(incident.position) < 0.6:
		_resolve_incident(str(incident.id), str(unit.role))

func _find_incident_for_role(role: String, assigned_id: String, from_pos: Vector3) -> Dictionary:
	var best: Dictionary = {}
	var best_dist := 999.0
	for incident in active_incidents:
		if str(incident.get("role", "")) != role:
			continue
		if bool(incident.get("assigned", false)) and str(incident.get("id", "")) != assigned_id:
			continue
		var dist := from_pos.distance_to(incident.position)
		if dist < best_dist:
			best = incident
			best_dist = dist
	return best

func _resolve_incident(incident_id: String, role: String) -> void:
	for i in active_incidents.size():
		if str(active_incidents[i].id) == incident_id:
			var title := str(active_incidents[i].title)
			_remove_incident_at(i)
			reputation = mini(100, reputation + 1)
			if role == "janitor":
				cleanliness = mini(100, cleanliness + 3)
			elif role == "security":
				security = mini(100, security + 3)
			_add_event("Incident Resolved", "%s handled by %s." % [title, role], "success")
			_refresh_stats_hud()
			if current_drawer == "ops":
				_render_drawer_content()
			return

func _apply_incident_consequence(incident: Dictionary) -> void:
	match str(incident.type):
		"spill":
			cleanliness = maxi(10, cleanliness - 8)
			reputation = maxi(10, reputation - 3)
		"shoplifting":
			security = maxi(10, security - 8)
			cash = maxi(0, cash - 420)
			reputation = maxi(10, reputation - 4)
		"broken_fixture":
			cash = maxi(0, cash - 360)
			reputation = maxi(10, reputation - 2)
		"lost_guest":
			reputation = maxi(10, reputation - 2)
	_add_event("Incident Escalated", "%s was not handled in time." % str(incident.title), "warning")
	_refresh_stats_hud()

func _remove_incident_at(index: int) -> void:
	if index < 0 or index >= active_incidents.size():
		return
	var id := str(active_incidents[index].id)
	var node := incident_root.get_node_or_null(id)
	if node != null:
		node.queue_free()
	active_incidents.remove_at(index)

func _random_concourse_point() -> Vector3:
	var corridors: Array = blueprint.get("corridors", [])
	if corridors.size() > 0:
		var corridor: Dictionary = corridors[randi() % corridors.size()]
		var center: Array = corridor.get("center", [0, 0])
		var size_data: Array = corridor.get("size", [8, 8])
		return Vector3(
			float(center[0]) + randf_range(-float(size_data[0]) * 0.45, float(size_data[0]) * 0.45),
			0.05,
			float(center[1]) + randf_range(-float(size_data[1]) * 0.45, float(size_data[1]) * 0.45)
		)
	return Vector3(randf_range(-18, 18), 0.05, randf_range(-8, 8))

# ==============================================================================
# SCENARIOS, GOALS & PRESTIGE
# ==============================================================================
func _initialize_scenario() -> void:
	if not active_scenario.is_empty():
		return
	scenarios_catalog = catalog_data.get("scenarios", [])
	if scenarios_catalog.size() > 0:
		active_scenario = scenarios_catalog[0]
		completed_goals.clear()
		scenario_complete = false

func _update_scenario_goals() -> void:
	if active_scenario.is_empty() or scenario_complete:
		return
	var all_done := true
	for goal in active_scenario.get("goals", []):
		var goal_id := str(goal.get("id", "goal"))
		var complete := _goal_current_value(goal) >= int(goal.get("target", 1))
		if str(goal.get("metric", "")) == "at_risk_inverse":
			complete = _goal_current_value(goal) <= int(goal.get("target", 0))
		if complete and not bool(completed_goals.get(goal_id, false)):
			completed_goals[goal_id] = true
			_add_event("Goal Complete", str(goal.get("label", "Goal achieved")), "success")
		if not complete:
			all_done = false
	if all_done:
		_complete_active_scenario()
	if current_drawer == "goals":
		_render_drawer_content()

func _goal_current_value(goal: Dictionary) -> int:
	match str(goal.get("metric", "")):
		"cash":
			return cash
		"reputation":
			return reputation
		"cleanliness":
			return cleanliness
		"security":
			return security
		"tenant_satisfaction":
			return int(tycoon_metrics.get("average_tenant_satisfaction", _average_tenant_satisfaction()))
		"at_risk_inverse":
			return int(tycoon_metrics.get("at_risk_tenants", 0))
		"weekly_sales":
			return int(tycoon_metrics.get("weekly_sales", 0))
		"active_shoppers":
			return active_shoppers
		_:
			return 0

func _average_tenant_satisfaction() -> int:
	var total := 0
	var count := 0
	for s in stores:
		if s.has("economy") and s.economy is Dictionary and str(s.get("tenant_id", "")) != "vacant":
			total += int(s.economy.get("satisfaction", 76))
			count += 1
	return roundi(float(total) / maxf(1.0, float(count)))

func _complete_active_scenario() -> void:
	scenario_complete = true
	var reward := int(active_scenario.get("reward_cash", 0))
	cash += reward
	prestige_tier += int(active_scenario.get("prestige_reward", 1))
	reputation = mini(100, reputation + 5)
	sound_mgr.play_upgrade()
	_add_event("Scenario Complete", "%s complete! Reward: $%s, Prestige Tier %d." % [str(active_scenario.get("name", "Scenario")), _comma(reward), prestige_tier], "success")
	_save_game()
	_refresh_stats_hud()

# ==============================================================================
# STORE OPERATIONS & UPGRADES
# ==============================================================================
func _upgrade_selected_store() -> void:
	if selected_store_idx < 0 or selected_store_idx >= stores.size(): return
	var store := stores[selected_store_idx]
	var cur_lvl := int(store.get("level", 1))
	if cur_lvl >= 3: return

	var tenant_def := _find_tenant_by_id(str(store.get("tenant_id", "")))
	var upgrades: Array = tenant_def.get("upgrades", [])
	var upgrade_data: Dictionary = {}
	for u in upgrades:
		if int(u.get("tier", 0)) == cur_lvl + 1:
			upgrade_data = u
			break

	var cost := int(upgrade_data.get("cost", 2400))
	if cash < cost:
		sound_mgr.play_error()
		return

	cash -= cost
	store.level = cur_lvl + 1
	store.staff = int(store.get("staff", 2)) + 1
	store.satisfaction = mini(100, int(store.get("satisfaction", 95)) + 8)
	reputation = mini(100, reputation + 6)

	var north: bool = float(store.position.z) < 0.0
	_build_store_model(selected_store_idx, store, north)
	sound_mgr.play_upgrade()
	_add_event("Store Upgraded", "%s upgraded to Tier %d: %s!" % [store.name, store.level, upgrade_data.get("name", "Flagship")], "success")

	_save_game()
	_refresh_stats_hud()
	_render_drawer_content()

func _set_store_price(strat: String) -> void:
	stores[selected_store_idx].price = strat
	sound_mgr.play_click()
	_save_game()
	_render_drawer_content()

func _change_store_staff(delta: int) -> void:
	var s := stores[selected_store_idx]
	var cur := int(s.get("staff", 2))
	if delta > 0 and cash >= 300:
		cash -= 300
		s.staff = cur + 1
		sound_mgr.play_place()
	elif delta < 0 and cur > 1:
		s.staff = cur - 1
		cash += 100
		sound_mgr.play_click()
	else:
		sound_mgr.play_error()
		return
	_save_game()
	_refresh_stats_hud()
	_render_drawer_content()

func _restock_store() -> void:
	if cash < 240:
		sound_mgr.play_error()
		return
	cash -= 240
	stores[selected_store_idx].stock = 100.0
	sound_mgr.play_place()
	_add_event("Inventory Restocked", "%s received full replenishment." % stores[selected_store_idx].name, "success")
	_save_game()
	_refresh_stats_hud()
	_render_drawer_content()

func _launch_store_promotion() -> void:
	if cash < 450:
		sound_mgr.play_error()
		return
	cash -= 450
	stores[selected_store_idx].promotion = 28.0
	for i in 8: _spawn_shopper(i % 2 == 0)
	sound_mgr.play_upgrade()
	_add_event("Local Campaign Live", "%s foot traffic boosted!" % stores[selected_store_idx].name, "success")
	_save_game()
	_refresh_stats_hud()
	_render_drawer_content()

func _set_store_facade(style: String) -> void:
	var s := stores[selected_store_idx]
	if str(s.get("facade", "")) == style or cash < 325:
		if str(s.get("facade", "")) != style: sound_mgr.play_error()
		return
	cash -= 325
	s.facade = style
	var root := get_node_or_null("Store_%02d_%s" % [selected_store_idx, s.name])
	if root != null:
		_apply_facade_to_node(root, style, s.color)
	sound_mgr.play_place()
	_add_event("Facade Renovated", "%s debuted %s storefront concept." % [s.name, style], "success")
	_save_game()
	_refresh_stats_hud()
	_render_drawer_content()

func _lease_tenant_into_store(tenant: Dictionary) -> void:
	var cost := int(tenant.get("cost", 1500))
	if cash < cost:
		sound_mgr.play_error()
		return
	cash -= cost

	var s := stores[selected_store_idx]
	s.name = str(tenant.get("name", "Store"))
	s.category = str(tenant.get("category", "Fashion"))
	s.base_income = int(tenant.get("base_income", 100))
	s.draw = int(tenant.get("draw", 35))
	s.tenant_id = str(tenant.get("id", "generic"))
	s.color = Color(str(tenant.get("color", "#38bdf8")))
	s.level = 1
	s.staff = int(tenant.get("base_staff", 2))
	s.stock = 100.0
	s.revenue = 0
	s.served = 0
	s.facade = "Neon" if s.category == "Entertainment" else "Warm" if s.category == "Food" else "Gallery"
	s.economy = tycoon_economy.create_store_economy(s, tenant, week, catalog_data)
	_update_layout_scores()

	if s.category == "Entertainment":
		s["cinema_state"] = {"movie": "Interstellar Echoes 4DX", "phase": "box_office", "timer": 20.0}
	else:
		s.erase("cinema_state")

	var north: bool = float(s.position.z) < 0.0
	_build_store_model(selected_store_idx, s, north)
	reputation = mini(100, reputation + 5)
	sound_mgr.play_upgrade()
	_add_event("New Tenant Leased", "%s opened in %s!" % [s.name, s.category], "success")

	_save_game()
	_refresh_stats_hud()
	_open_drawer("inspector")

func _renew_selected_lease() -> void:
	if selected_store_idx < 0 or selected_store_idx >= stores.size(): return
	var s := stores[selected_store_idx]
	if str(s.get("tenant_id", "")) == "vacant":
		sound_mgr.play_error()
		return
	_ensure_store_economy_state()
	var economy: Dictionary = s.get("economy", {})
	var concession := maxi(250, roundi(int(economy.get("base_rent", 360)) * (0.65 if int(economy.get("satisfaction", 76)) < 55 else 0.35)))
	if cash < concession:
		sound_mgr.play_error()
		return
	cash -= concession
	economy.renewal_week = week + int(economy.get("term_weeks", 8))
	economy.satisfaction = mini(100, int(economy.get("satisfaction", 76)) + 7)
	economy.state = "stable"
	economy.last_statement = "%s renewed through Week %d after a $%s landlord concession." % [s.name, int(economy.renewal_week), _comma(concession)]
	sound_mgr.play_place()
	_add_event("Lease Renewed", str(economy.last_statement), "success")
	_save_game()
	_refresh_stats_hud()
	_render_drawer_content()

func _lower_selected_rent() -> void:
	if selected_store_idx < 0 or selected_store_idx >= stores.size(): return
	var s := stores[selected_store_idx]
	if str(s.get("tenant_id", "")) == "vacant":
		sound_mgr.play_error()
		return
	_ensure_store_economy_state()
	var economy: Dictionary = s.get("economy", {})
	var old_rent := int(economy.get("base_rent", 360))
	var new_rent := maxi(90, roundi(float(old_rent) * 0.88))
	if new_rent == old_rent:
		sound_mgr.play_error()
		return
	economy.base_rent = new_rent
	economy.satisfaction = mini(100, int(economy.get("satisfaction", 76)) + 10)
	economy.last_statement = "%s received rent relief: $%s/wk -> $%s/wk." % [s.name, _comma(old_rent), _comma(new_rent)]
	sound_mgr.play_click()
	_add_event("Rent Relief Granted", str(economy.last_statement), "success")
	_save_game()
	_render_drawer_content()

func _renovate_selected_tenant() -> void:
	if selected_store_idx < 0 or selected_store_idx >= stores.size(): return
	var s := stores[selected_store_idx]
	if str(s.get("tenant_id", "")) == "vacant":
		sound_mgr.play_error()
		return
	var cost := 850 + int(s.get("level", 1)) * 450
	if cash < cost:
		sound_mgr.play_error()
		return
	cash -= cost
	_ensure_store_economy_state()
	var economy: Dictionary = s.get("economy", {})
	economy.satisfaction = mini(100, int(economy.get("satisfaction", 76)) + 16)
	economy.state = "stable" if str(economy.get("state", "open")) == "at-risk" else str(economy.get("state", "open"))
	economy.last_statement = "%s completed a landlord-funded refresh. Tenant satisfaction rose to %d%%." % [s.name, int(economy.satisfaction)]
	s.satisfaction = mini(100, int(s.get("satisfaction", 95)) + 8)
	s.stock = mini(100.0, float(s.get("stock", 100.0)) + 35.0)
	reputation = mini(100, reputation + 2)
	sound_mgr.play_upgrade()
	_add_event("Tenant Renovation Funded", str(economy.last_statement), "success")
	_save_game()
	_refresh_stats_hud()
	_render_drawer_content()

func _vacate_selected_store() -> void:
	if selected_store_idx < 0 or selected_store_idx >= stores.size(): return
	var s := stores[selected_store_idx]
	if str(s.get("tenant_id", "")) == "vacant":
		sound_mgr.play_error()
		return
	_ensure_store_economy_state()
	var economy: Dictionary = s.get("economy", {})
	var buyout := 0 if str(economy.get("state", "")) == "at-risk" else int(economy.get("base_rent", 360))
	if cash < buyout:
		sound_mgr.play_error()
		return
	cash -= buyout
	var old_name := str(s.get("name", "Tenant"))
	s.name = "Vacant Unit"
	s.category = "Vacant"
	s.base_income = 0
	s.draw = 0
	s.tenant_id = "vacant"
	s.level = 1
	s.staff = 0
	s.stock = 0.0
	s.revenue = 0
	s.served = 0
	s.facade = "Gallery"
	s.color = Color("#64748b")
	s.erase("cinema_state")
	s.economy = tycoon_economy.create_store_economy(s, {}, week, catalog_data)
	_update_layout_scores()
	var north: bool = float(s.position.z) < 0.0
	_build_store_model(selected_store_idx, s, north)
	if buyout > 0:
		sound_mgr.play_error()
	else:
		sound_mgr.play_click()
	_add_event("Tenant Vacated", "%s moved out. Buyout: $%s. Unit is ready for a new lease." % [old_name, _comma(buyout)], "warning")
	_save_game()
	_refresh_stats_hud()
	_render_drawer_content()

# ==============================================================================
# AMENITIES & CONCOURSE PLACEMENT
# ==============================================================================
func _place_amenity_at_screen(screen_pos: Vector2) -> void:
	var camera := $CameraRig/Camera3D as Camera3D
	var origin := camera.project_ray_origin(screen_pos)
	var dir := camera.project_ray_normal(screen_pos)
	var plane := Plane(Vector3.UP, 0.0)
	var hit = plane.intersects_ray(origin, dir)
	if hit != null:
		var hit_pos: Vector3 = hit
		var amen_def := _find_amenity_by_type(selected_place_amenity)
		if amen_def.is_empty(): return

		var cost := int(amen_def.get("cost", 300))
		if cash < cost:
			sound_mgr.play_error()
			return

		cash -= cost
		reputation = mini(100, reputation + int(amen_def.get("reputation_bonus", 4)))
		cleanliness = mini(100, cleanliness + int(amen_def.get("cleanliness_bonus", 0)))

		var amenity_inst := {
			"type": selected_place_amenity,
			"name": amen_def.get("name", "Amenity"),
			"position": hit_pos
		}
		placed_amenities.append(amenity_inst)
		_build_amenity_model(placed_amenities.size() - 1, amenity_inst)
		sound_mgr.play_place()
		_add_event("Amenity Placed", "Installed %s on concourse." % amenity_inst.name, "success")

		selected_place_amenity = ""
		_save_game()
		_refresh_stats_hud()
		_render_drawer_content()

func _build_amenity_model(idx: int, amen: Dictionary) -> void:
	var root := Node3D.new()
	root.name = "Amenity_%02d_%s" % [idx, amen.type]
	root.position = amen.position
	add_child(root)

	match str(amen.type):
		"palm_planter":
			_cylinder("PlanterPot", Vector3(0, 0.35, 0), 0.55, 0.7, Color("#0d9488"), 0.2, 0.4, root)
			_cylinder("PalmTrunk", Vector3(0, 1.4, 0), 0.12, 1.8, Color("#78350f"), 0.0, 0.8, root)
			_sphere("PalmFoliage", Vector3(0, 2.4, 0), 0.9, Color("#22c55e"), 0.0, 0.7, root)
		"rest_bench":
			_box("BenchSeat", Vector3(0, 0.4, 0), Vector3(1.8, 0.1, 0.6), Color("#b45309"), 0.1, 0.6, root)
			_box("BenchLeg1", Vector3(-0.7, 0.2, 0), Vector3(0.12, 0.4, 0.55), Color("#1e293b"), 0.6, 0.2, root)
			_box("BenchLeg2", Vector3(0.7, 0.2, 0), Vector3(0.12, 0.4, 0.55), Color("#1e293b"), 0.6, 0.2, root)
		"atm_kiosk":
			_box("ATMBody", Vector3(0, 0.9, 0), Vector3(0.8, 1.8, 0.7), Color("#1e293b"), 0.5, 0.2, root)
			_box("ATMScreen", Vector3(0, 1.2, 0.36), Vector3(0.5, 0.35, 0.05), Color("#38bdf8"), 0.8, 0.1, root)
		"coffee_cart", "boba_pop_up":
			_box("CartBase", Vector3(0, 0.5, 0), Vector3(1.6, 1.0, 1.1), Color("#b45309"), 0.2, 0.5, root)
			_box("Canopy", Vector3(0, 1.9, 0), Vector3(1.9, 0.15, 1.3), Color("#f59e0b"), 0.1, 0.6, root)
		_:
			_cylinder("AmenityPedestal", Vector3(0, 0.4, 0), 0.6, 0.8, Color("#0284c7"), 0.4, 0.2, root)

# ==============================================================================
# RAYCAST SELECTION
# ==============================================================================
func _select_store_at_screen(screen_pos: Vector2) -> void:
	var camera := $CameraRig/Camera3D as Camera3D
	var origin := camera.project_ray_origin(screen_pos)
	var dest := origin + camera.project_ray_normal(screen_pos) * 250.0
	var query := PhysicsRayQueryParameters3D.create(origin, dest)
	var result := get_world_3d().direct_space_state.intersect_ray(query)

	if result.has("collider") and result.collider.has_meta("store_index"):
		var idx: int = int(result.collider.get_meta("store_index"))
		_select_store(idx)
		sound_mgr.play_click()

func _select_store(idx: int) -> void:
	selected_store_idx = clampi(idx, 0, stores.size() - 1)
	_update_store_selection_visuals()
	_open_drawer("inspector")

	var store := stores[selected_store_idx]
	camera_target_pos = Vector3(store.position.x * 0.4, 0, store.position.z * 0.4)

func _update_store_selection_visuals() -> void:
	for i in stores.size():
		var node := get_node_or_null("Store_%02d_%s" % [i, stores[i].name])
		if node != null and node.has_node("Selection"):
			node.get_node("Selection").visible = i == selected_store_idx

# ==============================================================================
# UI CREATION & MOBILE HUD DRAWERS
# ==============================================================================
func _build_ui() -> void:
	ui_root = $UI
	for child in ui_root.get_children():
		child.queue_free()

	# 1. Top Bar
	var top := _panel(Vector2(14, 12), Vector2(1252, 64), Color(0.04, 0.06, 0.1, 0.94))
	ui_root.add_child(top)

	var brand_logo := _label("AURORA", 20, Color("#ffffff"), true)
	brand_logo.position = Vector2(20, 10)
	top.add_child(brand_logo)

	var brand_sub := _label("MALL TYCOON 3D", 10, Color("#38bdf8"))
	brand_sub.position = Vector2(20, 36)
	top.add_child(brand_sub)

	date_label = _label("W1 · D1", 14, Color("#cbd5e1"), true)
	date_label.position = Vector2(175, 20)
	top.add_child(date_label)

	cash_label = _label("$28,000", 17, Color("#fbbf24"), true)
	cash_label.position = Vector2(275, 18)
	top.add_child(cash_label)

	guests_label = _label("0 GUESTS", 12, Color("#34d399"))
	guests_label.position = Vector2(415, 22)
	top.add_child(guests_label)

	rep_label = _label("76% REP", 12, Color("#a78bfa"))
	rep_label.position = Vector2(515, 22)
	top.add_child(rep_label)

	clean_label = _label("95% CLN", 12, Color("#38bdf8"))
	clean_label.position = Vector2(605, 22)
	top.add_child(clean_label)

	# Sim Speed Controls
	var pause_btn := _button("Ⅱ", Vector2(705, 12), Vector2(38, 38))
	pause_btn.pressed.connect(_set_sim_speed.bind(0.0))
	top.add_child(pause_btn)

	var speed1_btn := _button("1×", Vector2(748, 12), Vector2(42, 38))
	speed1_btn.pressed.connect(_set_sim_speed.bind(1.0))
	top.add_child(speed1_btn)

	var speed2_btn := _button("2×", Vector2(795, 12), Vector2(42, 38))
	speed2_btn.pressed.connect(_set_sim_speed.bind(2.0))
	top.add_child(speed2_btn)

	speed_label = _label("1×", 12, Color("#38bdf8"))
	speed_label.position = Vector2(845, 22)
	top.add_child(speed_label)

	# Sound Toggle & Save
	sound_btn = _button("🔊 SOUND", Vector2(880, 12), Vector2(85, 38))
	sound_btn.pressed.connect(_toggle_sound)
	top.add_child(sound_btn)

	var save_btn := _button("💾 SAVE", Vector2(972, 12), Vector2(78, 38))
	save_btn.pressed.connect(_save_game)
	top.add_child(save_btn)

	# 2. Bottom Drawer Navigation Bar
	var nav_bar := _panel(Vector2(14, 642), Vector2(1252, 66), Color(0.04, 0.06, 0.1, 0.96))
	ui_root.add_child(nav_bar)

	var nav_hbox := HBoxContainer.new()
	nav_hbox.position = Vector2(14, 10)
	nav_hbox.size = Vector2(1224, 46)
	nav_hbox.add_theme_constant_override("separation", 10)
	nav_bar.add_child(nav_hbox)

	var tabs := [
		{"id": "inspector", "label": "🏪 STORE INSPECTOR"},
		{"id": "directory", "label": "📋 LEASING DIRECTORY"},
		{"id": "architect", "label": "📐 ARCHITECT & AMENITIES"},
		{"id": "ops", "label": "⚙️ OPERATIONS & HEALTH"},
		{"id": "data", "label": "📊 TYCOON DATA"},
		{"id": "goals", "label": "🏆 GOALS"},
		{"id": "feed", "label": "📜 EVENTS FEED"}
	]

	for tab in tabs:
		var btn := _button(tab.label, Vector2.ZERO, Vector2(164, 44))
		btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		btn.pressed.connect(_open_drawer.bind(tab.id))
		nav_hbox.add_child(btn)

	# 3. Interactive Main Side Drawer Panel
	drawer_panel = _panel(Vector2(880, 88), Vector2(386, 542), Color(0.03, 0.05, 0.09, 0.96))
	ui_root.add_child(drawer_panel)

	drawer_title = _label("STORE OPERATIONS", 16, Color("#38bdf8"), true)
	drawer_title.position = Vector2(20, 16)
	drawer_panel.add_child(drawer_title)

	drawer_content = Control.new()
	drawer_content.position = Vector2(20, 48)
	drawer_content.size = Vector2(346, 474)
	drawer_panel.add_child(drawer_content)

	# 4. Toast Alerts Container
	toast_container = VBoxContainer.new()
	toast_container.position = Vector2(24, 88)
	toast_container.size = Vector2(340, 300)
	toast_container.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui_root.add_child(toast_container)

	_render_drawer_content()

func _open_drawer(drawer_id: String) -> void:
	current_drawer = drawer_id
	sound_mgr.play_click()
	match drawer_id:
		"architect":
			_show_tutorial_once("architect", "Build Mode", "Place amenities on concourse tiles. Future mall expansion tools should live in this mode.")
		"directory":
			_show_tutorial_once("leasing", "Lease Mode", "Tenant cards now show adjacency guidance. Pick stores that fit the wing around them.")
		"data":
			_show_tutorial_once("data", "Data Mode", "Use heatmap toggles to inspect traffic, spend, and shopper mood without reading raw tables.")
		"goals":
			_show_tutorial_once("goals", "Goals Mode", "Scenario goals give the mall a long-term objective and award prestige when completed.")
	_render_drawer_content()

func _render_drawer_content() -> void:
	if drawer_content == null: return
	for child in drawer_content.get_children():
		child.queue_free()

	match current_drawer:
		"inspector":
			drawer_title.text = "STORE OPERATIONS & LEASING"
			_render_inspector_drawer()
		"directory":
			drawer_title.text = "TENANT LEASING CATALOG"
			_render_directory_drawer()
		"architect":
			drawer_title.text = "CONCOURSE AMENITIES & DESIGN"
			_render_architect_drawer()
		"ops":
			drawer_title.text = "MALL OPERATIONS & ACCOUNTING"
			_render_ops_drawer()
		"data":
			drawer_title.text = "TYCOON ECONOMY DIAGNOSTICS"
			_render_data_drawer()
		"goals":
			drawer_title.text = "SCENARIO GOALS & PRESTIGE"
			_render_goals_drawer()
		"feed":
			drawer_title.text = "MALL NOTIFICATIONS & LOGS"
			_render_feed_drawer()

func _render_inspector_drawer() -> void:
	if selected_store_idx < 0 or selected_store_idx >= stores.size(): return
	var s := stores[selected_store_idx]

	var lot_name := "MEGA ANCHOR" if s.get("lot_type", "") == "mega_anchor" else "FLAGSHIP" if s.get("lot_type", "") == "flagship" else "BOUTIQUE" if s.get("lot_type", "") == "boutique" else "STANDARD"
	var title := _label("%s" % s.name, 19, Color("#ffffff"), true)
	title.position = Vector2(0, 0)
	drawer_content.add_child(title)

	var sub := _label("%s · %s · Tier %d · %d Staff" % [s.category, lot_name, s.level, s.staff], 11, s.color)
	sub.position = Vector2(0, 26)
	drawer_content.add_child(sub)

	var draw_val := _calculate_single_store_draw(selected_store_idx)
	var rev_lbl := _label("Revenue: $%s · Served: %d · Draw: %d" % [_comma(int(s.get("revenue", 0))), int(s.get("served", 0)), draw_val], 10, Color("#94a3b8"))
	rev_lbl.position = Vector2(0, 48)
	drawer_content.add_child(rev_lbl)

	var economy: Dictionary = s.get("economy", {})
	var lease_lbl := _label("Lease: %s · Rent $%s/wk · Tenant %d%%" % [
		str(economy.get("state", "open")).to_upper(),
		_comma(int(economy.get("base_rent", 0))),
		int(economy.get("satisfaction", 76))
	], 10, _state_color(str(economy.get("state", "open"))))
	lease_lbl.position = Vector2(0, 62)
	drawer_content.add_child(lease_lbl)

	var layout_reasons: Array = s.get("layout_reasons", [])
	var layout_lbl := _label("Layout: %d%% · %s" % [
		int(s.get("layout_score", 50)),
		", ".join(layout_reasons) if layout_reasons.size() > 0 else "neutral"
	], 9, Color("#cbd5e1"))
	layout_lbl.position = Vector2(0, 74)
	layout_lbl.size = Vector2(346, 18)
	drawer_content.add_child(layout_lbl)

	# Tier Upgrade Card
	if int(s.level) < 3:
		var up_btn := _button("★ Upgrade to Tier %d · $2,400" % (int(s.level) + 1), Vector2(0, 96), Vector2(346, 30))
		up_btn.pressed.connect(_upgrade_selected_store)
		drawer_content.add_child(up_btn)
	else:
		var max_lbl := _label("★ MAXIMUM FLAGSHIP PALACE (TIER 3)", 11, Color("#fbbf24"), true)
		max_lbl.position = Vector2(0, 98)
		drawer_content.add_child(max_lbl)

	# Pricing Strategy
	var price_title := _label("PRICING STRATEGY (AFFECTS SHOPPER PERSONALITIES)", 10, Color("#94a3b8"))
	price_title.position = Vector2(0, 132)
	drawer_content.add_child(price_title)

	var cur_p: String = str(s.get("price", "Market"))
	for i in 3:
		var p_name: String = ["Value", "Market", "Premium"][i]
		var btn := _button(p_name, Vector2(i * 118, 150), Vector2(110, 30))
		if p_name == cur_p:
			btn.modulate = Color("#38bdf8")
		btn.pressed.connect(_set_store_price.bind(p_name))
		drawer_content.add_child(btn)

	# Service Team Staffing
	var staff_title := _label("SERVICE STAFFING ($85/WK EACH)", 10, Color("#94a3b8"))
	staff_title.position = Vector2(0, 198)
	drawer_content.add_child(staff_title)

	var rm_staff := _button("− Staff", Vector2(0, 218), Vector2(108, 34))
	rm_staff.pressed.connect(_change_store_staff.bind(-1))
	drawer_content.add_child(rm_staff)

	var add_staff := _button("+ Staff ($300)", Vector2(118, 218), Vector2(110, 34))
	add_staff.pressed.connect(_change_store_staff.bind(1))
	drawer_content.add_child(add_staff)

	var restock_btn := _button("Restock ($240)", Vector2(236, 218), Vector2(110, 34))
	restock_btn.pressed.connect(_restock_store)
	drawer_content.add_child(restock_btn)

	# Stock Progress Bar
	var stock_bar := ProgressBar.new()
	stock_bar.position = Vector2(0, 258)
	stock_bar.size = Vector2(346, 10)
	stock_bar.show_percentage = false
	stock_bar.value = float(s.get("stock", 100.0))
	drawer_content.add_child(stock_bar)

	# Local Marketing Campaign
	var promo_sec: float = float(s.get("promotion", 0.0))
	var camp_text := "Campaign active (%ds)" % roundi(promo_sec) if promo_sec > 0.0 else "Launch local ad campaign · $450"
	var camp_btn := _button(camp_text, Vector2(0, 278), Vector2(346, 34))
	camp_btn.pressed.connect(_launch_store_promotion)
	drawer_content.add_child(camp_btn)

	# Storefront Facade Concept
	var facade_title := _label("STOREFRONT FACADE CONCEPT", 10, Color("#94a3b8"))
	facade_title.position = Vector2(0, 322)
	drawer_content.add_child(facade_title)

	var cur_f: String = str(s.get("facade", "Gallery"))
	for i in 3:
		var f_name: String = ["Gallery", "Warm", "Neon"][i]
		var btn := _button(f_name, Vector2(i * 118, 342), Vector2(110, 34))
		if f_name == cur_f:
			btn.modulate = Color("#38bdf8")
		btn.pressed.connect(_set_store_facade.bind(f_name))
		drawer_content.add_child(btn)

	# Replace / Lease Button
	var statement := _label(str(economy.get("last_statement", "Awaiting first weekly accounting.")), 9, Color("#cbd5e1"))
	statement.position = Vector2(0, 380)
	statement.size = Vector2(346, 28)
	statement.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	drawer_content.add_child(statement)

	var renew_btn := _button("Renew", Vector2(0, 414), Vector2(76, 28))
	renew_btn.pressed.connect(_renew_selected_lease)
	drawer_content.add_child(renew_btn)

	var rent_btn := _button("Lower Rent", Vector2(84, 414), Vector2(88, 28))
	rent_btn.pressed.connect(_lower_selected_rent)
	drawer_content.add_child(rent_btn)

	var reno_btn := _button("Renovate", Vector2(180, 414), Vector2(80, 28))
	reno_btn.pressed.connect(_renovate_selected_tenant)
	drawer_content.add_child(reno_btn)

	var vacate_btn := _button("Vacate", Vector2(268, 414), Vector2(78, 28))
	vacate_btn.pressed.connect(_vacate_selected_store)
	drawer_content.add_child(vacate_btn)

	var re_lease_btn := _button("📋 Browse Catalog To Re-Lease", Vector2(0, 450), Vector2(346, 28))
	re_lease_btn.pressed.connect(_open_drawer.bind("directory"))
	drawer_content.add_child(re_lease_btn)

func _render_directory_drawer() -> void:
	var cat_scroll := HBoxContainer.new()
	cat_scroll.position = Vector2(0, 0)
	cat_scroll.size = Vector2(346, 32)
	drawer_content.add_child(cat_scroll)

	var cats := ["All", "Luxury", "Food", "Fashion", "Entertainment", "Specialty"]
	for c in cats:
		var btn := _button(c, Vector2.ZERO, Vector2(54, 30))
		if c == selected_directory_cat: btn.modulate = Color("#38bdf8")
		btn.pressed.connect(_set_directory_category.bind(c))
		cat_scroll.add_child(btn)

	var list_scroll := ScrollContainer.new()
	list_scroll.position = Vector2(0, 42)
	list_scroll.size = Vector2(346, 426)
	drawer_content.add_child(list_scroll)

	var vbox := VBoxContainer.new()
	vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.add_theme_constant_override("separation", 8)
	list_scroll.add_child(vbox)

	for t in tenants_catalog:
		var t_cat: String = str(t.get("category", ""))
		if selected_directory_cat != "All" and t_cat != selected_directory_cat:
			continue

		var card := _panel(Vector2.ZERO, Vector2(330, 84), Color(0.06, 0.09, 0.15, 0.9))
		card.custom_minimum_size = Vector2(330, 84)
		vbox.add_child(card)

		var t_title := _label("%s %s" % [t.icon, t.name], 12, Color("#ffffff"), true)
		t_title.position = Vector2(10, 8)
		card.add_child(t_title)

		var t_desc := _label("$%s · Draw +%d · %s" % [_comma(int(t.cost)), int(t.draw), t.category], 10, Color("#38bdf8"))
		t_desc.position = Vector2(10, 28)
		card.add_child(t_desc)

		var profile := _economy_profile_for_tenant(t)
		var pref: Array = profile.get("preferred_adjacencies", [])
		var t_sig := _label("Best near: %s" % (", ".join(pref.slice(0, mini(3, pref.size()))) if pref.size() > 0 else "balanced wings"), 9, Color("#94a3b8"))
		t_sig.position = Vector2(10, 48)
		t_sig.size = Vector2(210, 28)
		t_sig.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		card.add_child(t_sig)

		var lease_btn := _button("LEASE", Vector2(236, 22), Vector2(84, 40))
		lease_btn.pressed.connect(_lease_tenant_into_store.bind(t))
		card.add_child(lease_btn)

func _set_directory_category(c: String) -> void:
	selected_directory_cat = c
	_render_drawer_content()

func _render_architect_drawer() -> void:
	var info_lbl := _label("Select an amenity to place on the concourse:", 11, Color("#cbd5e1"))
	info_lbl.position = Vector2(0, 0)
	drawer_content.add_child(info_lbl)

	var scroll := ScrollContainer.new()
	scroll.position = Vector2(0, 26)
	scroll.size = Vector2(346, 442)
	drawer_content.add_child(scroll)

	var vbox := VBoxContainer.new()
	vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.add_theme_constant_override("separation", 8)
	scroll.add_child(vbox)

	for a in amenities_catalog:
		var card := _panel(Vector2.ZERO, Vector2(330, 72), Color(0.06, 0.09, 0.15, 0.9))
		card.custom_minimum_size = Vector2(330, 72)
		vbox.add_child(card)

		var a_title := _label("%s %s" % [a.icon, a.name], 12, Color("#ffffff"), true)
		a_title.position = Vector2(10, 8)
		card.add_child(a_title)

		var a_cost := _label("$%d · %s" % [int(a.cost), a.effect], 10, Color("#34d399"))
		a_cost.position = Vector2(10, 28)
		a_cost.size = Vector2(210, 36)
		a_cost.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		card.add_child(a_cost)

		var place_btn := _button("PLACE", Vector2(236, 16), Vector2(84, 38))
		place_btn.pressed.connect(_select_amenity_for_placement.bind(str(a.type), str(a.name)))
		card.add_child(place_btn)

func _select_amenity_for_placement(amen_type: String, amen_name: String) -> void:
	selected_place_amenity = amen_type
	_add_event("Amenity Placement Active", "Click on any concourse tile to construct %s." % amen_name, "info")
	sound_mgr.play_click()

func _render_ops_drawer() -> void:
	var clean_card := _panel(Vector2(0, 0), Vector2(346, 84), Color(0.06, 0.09, 0.15, 0.9))
	drawer_content.add_child(clean_card)
	var c_lbl := _label("SANITATION & FLOOR BUFFING", 12, Color("#38bdf8"), true)
	c_lbl.position = Vector2(12, 10)
	clean_card.add_child(c_lbl)
	var c_sub := _label("Buff concourses to sparkling shine (+25% Cln)", 10, Color("#94a3b8"))
	c_sub.position = Vector2(12, 32)
	clean_card.add_child(c_sub)
	var c_btn := _button("Dispatch ($250)", Vector2(12, 48), Vector2(322, 28))
	c_btn.pressed.connect(_perform_mall_action.bind("clean"))
	clean_card.add_child(c_btn)

	var sec_card := _panel(Vector2(0, 96), Vector2(346, 84), Color(0.06, 0.09, 0.15, 0.9))
	drawer_content.add_child(sec_card)
	var s_lbl := _label("CONCOURSE SECURITY PATROLS", 12, Color("#38bdf8"), true)
	s_lbl.position = Vector2(12, 10)
	sec_card.add_child(s_lbl)
	var s_sub := _label("Reinforce guard presence (+20% Security)", 10, Color("#94a3b8"))
	s_sub.position = Vector2(12, 32)
	sec_card.add_child(s_sub)
	var s_btn := _button("Deploy ($350)", Vector2(12, 48), Vector2(322, 28))
	s_btn.pressed.connect(_perform_mall_action.bind("security"))
	sec_card.add_child(s_btn)

	var ad_card := _panel(Vector2(0, 192), Vector2(346, 84), Color(0.06, 0.09, 0.15, 0.9))
	drawer_content.add_child(ad_card)
	var a_lbl := _label("REGIONAL ADVERTISING BLITZ", 12, Color("#38bdf8"), true)
	a_lbl.position = Vector2(12, 10)
	ad_card.add_child(a_lbl)
	var a_sub := _label("Mall billboard blitz (+8 Rep & Guest Surge)", 10, Color("#94a3b8"))
	a_sub.position = Vector2(12, 32)
	ad_card.add_child(a_sub)
	var a_btn := _button("Launch ($600)", Vector2(12, 48), Vector2(322, 28))
	a_btn.pressed.connect(_perform_mall_action.bind("campaign"))
	ad_card.add_child(a_btn)

	# Demographics breakdown
	var demo_lbl := _label("SHOPPER DEMOGRAPHICS & ELASTICITY", 11, Color("#cbd5e1"), true)
	demo_lbl.position = Vector2(0, 290)
	drawer_content.add_child(demo_lbl)

	var demo_desc := _label("💎 VIPs (15%): Demand >80% Cln & Premium\n🏷️ Bargain (30%): Demand Value pricing\n📱 Trendsetters (20%): Love Neon & Tech\n🍽️ Foodies (25%): Need Dining & Restrooms\n☕ Strollers (10%): Window-shop & Fountain", 10, Color("#94a3b8"))
	demo_desc.position = Vector2(0, 312)
	demo_desc.size = Vector2(346, 120)
	drawer_content.add_child(demo_desc)

	var incident_lbl := _label("ACTIVE SERVICE INCIDENTS", 10, Color("#38bdf8"), true)
	incident_lbl.position = Vector2(0, 426)
	drawer_content.add_child(incident_lbl)
	var incident_text := "No incidents. Staff are patrolling."
	if active_incidents.size() > 0:
		var lines: Array[String] = []
		for incident in active_incidents.slice(0, mini(active_incidents.size(), 3)):
			lines.append("%s · %ds · %s" % [str(incident.get("title", "Incident")), roundi(float(incident.get("timer", 0))), str(incident.get("role", "staff"))])
		incident_text = "\n".join(lines)
	var incident_desc := _label(incident_text, 9, Color("#cbd5e1"))
	incident_desc.position = Vector2(0, 444)
	incident_desc.size = Vector2(346, 44)
	incident_desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	drawer_content.add_child(incident_desc)

func _render_data_drawer() -> void:
	_ensure_store_economy_state()
	var avg_sat := int(tycoon_metrics.get("average_tenant_satisfaction", 0))
	var at_risk := int(tycoon_metrics.get("at_risk_tenants", 0))
	var weekly_sales := int(tycoon_metrics.get("weekly_sales", 0))
	var store_profit := int(tycoon_metrics.get("weekly_store_profit", 0))

	var summary := _panel(Vector2(0, 0), Vector2(346, 92), Color(0.06, 0.09, 0.15, 0.9))
	drawer_content.add_child(summary)
	var title := _label("WEEKLY ECONOMY SNAPSHOT", 12, Color("#38bdf8"), true)
	title.position = Vector2(12, 10)
	summary.add_child(title)
	var desc := _label("Tenant mood %d%% · At-risk %d · Sales $%s · Tenant P/L %s$%s" % [
		avg_sat,
		at_risk,
		_comma(weekly_sales),
		"+" if store_profit >= 0 else "-",
		_comma(abs(store_profit))
	], 10, Color("#cbd5e1"))
	desc.position = Vector2(12, 34)
	desc.size = Vector2(320, 44)
	desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	summary.add_child(desc)

	var hint := _label("Statements update at the end of each week. They explain traffic, rent pressure, stock, and operations problems.", 9, Color("#94a3b8"))
	hint.position = Vector2(0, 104)
	hint.size = Vector2(346, 34)
	hint.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	drawer_content.add_child(hint)

	var modes := [
		{"id": "none", "label": "None"},
		{"id": "traffic", "label": "Traffic"},
		{"id": "spend", "label": "Spend"},
		{"id": "satisfaction", "label": "Mood"}
	]
	for i in modes.size():
		var mode: Dictionary = modes[i]
		var btn := _button(str(mode.label), Vector2(i * 86, 128), Vector2(80, 28))
		if heatmap_mode == str(mode.id):
			btn.modulate = Color("#38bdf8")
		btn.pressed.connect(_set_heatmap_mode.bind(str(mode.id)))
		drawer_content.add_child(btn)

	var thought_title := _label("LIVE SHOPPER THOUGHTS", 10, Color("#38bdf8"), true)
	thought_title.position = Vector2(0, 164)
	drawer_content.add_child(thought_title)

	var thought_text := "No shopper thoughts yet. Let the sim run for a few visits."
	if shopper_thoughts.size() > 0:
		var snippets: Array[String] = []
		for thought in shopper_thoughts.slice(0, mini(3, shopper_thoughts.size())):
			snippets.append("%s: %s" % [str(thought.get("severity", "info")).to_upper(), str(thought.get("text", ""))])
		thought_text = "\n".join(snippets)
	var thoughts_lbl := _label(thought_text, 9, Color("#cbd5e1"))
	thoughts_lbl.position = Vector2(0, 182)
	thoughts_lbl.size = Vector2(346, 58)
	thoughts_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	drawer_content.add_child(thoughts_lbl)

	var scroll := ScrollContainer.new()
	scroll.position = Vector2(0, 248)
	scroll.size = Vector2(346, 220)
	drawer_content.add_child(scroll)

	var vbox := VBoxContainer.new()
	vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.add_theme_constant_override("separation", 8)
	scroll.add_child(vbox)

	var reports := weekly_reports
	if reports.is_empty():
		reports = []
		for i in stores.size():
			var s := stores[i]
			var economy: Dictionary = s.get("economy", {})
			reports.append({
				"name": str(s.get("name", "Store")),
				"state": str(economy.get("state", "open")),
				"satisfaction": int(economy.get("satisfaction", 76)),
				"weekly_sales": int(economy.get("weekly_sales", 0)),
				"base_rent": int(economy.get("base_rent", 0)),
				"statement": str(economy.get("last_statement", "Awaiting first weekly accounting."))
			})

	for report in reports:
		var card := _panel(Vector2.ZERO, Vector2(330, 84), Color(0.05, 0.08, 0.14, 0.92))
		card.custom_minimum_size = Vector2(330, 84)
		vbox.add_child(card)

		var state := str(report.get("state", "open"))
		var name_lbl := _label("%s · %d%%" % [str(report.get("name", "Store")), int(report.get("satisfaction", 0))], 11, _state_color(state), true)
		name_lbl.position = Vector2(10, 8)
		card.add_child(name_lbl)

		var meta := _label("State: %s · Sales $%s · Rent $%s" % [
			state.to_upper(),
			_comma(int(report.get("weekly_sales", 0))),
			_comma(int(report.get("base_rent", 0)))
		], 9, Color("#94a3b8"))
		meta.position = Vector2(10, 28)
		card.add_child(meta)

		var statement := _label(str(report.get("statement", "")), 9, Color("#cbd5e1"))
		statement.position = Vector2(10, 46)
		statement.size = Vector2(310, 30)
		statement.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		card.add_child(statement)

func _render_goals_drawer() -> void:
	if active_scenario.is_empty():
		var empty := _label("No active scenario loaded.", 12, Color("#cbd5e1"))
		drawer_content.add_child(empty)
		return
	var title := _label(str(active_scenario.get("name", "Scenario")), 18, Color("#ffffff"), true)
	title.position = Vector2(0, 0)
	drawer_content.add_child(title)
	var desc := _label("Prestige Tier %d · %s" % [prestige_tier, str(active_scenario.get("description", ""))], 10, Color("#94a3b8"))
	desc.position = Vector2(0, 28)
	desc.size = Vector2(346, 38)
	desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	drawer_content.add_child(desc)

	var y := 78
	for goal in active_scenario.get("goals", []):
		var target := int(goal.get("target", 1))
		var current := _goal_current_value(goal)
		var inverse := str(goal.get("metric", "")) == "at_risk_inverse"
		var done := current <= target if inverse else current >= target
		var card := _panel(Vector2(0, y), Vector2(346, 78), Color(0.06, 0.09, 0.15, 0.9))
		drawer_content.add_child(card)
		var label := _label(("%s " % ("✓" if done else "□")) + str(goal.get("label", "Goal")), 11, Color("#34d399") if done else Color("#cbd5e1"), true)
		label.position = Vector2(12, 10)
		card.add_child(label)
		var progress := ProgressBar.new()
		progress.position = Vector2(12, 38)
		progress.size = Vector2(322, 10)
		progress.show_percentage = false
		progress.max_value = maxf(1.0, float(target))
		progress.value = float(target - current if inverse else current)
		if inverse:
			progress.max_value = maxf(1.0, float(target + 5))
			progress.value = float(target + 5 - current)
		card.add_child(progress)
		var meta := _label("Current %d / Target %d" % [current, target], 9, Color("#94a3b8"))
		meta.position = Vector2(12, 54)
		card.add_child(meta)
		y += 88

	if scenario_complete:
		var complete := _label("Scenario complete. New scenarios and unlock gates can build on this system.", 11, Color("#fbbf24"), true)
		complete.position = Vector2(0, y + 8)
		complete.size = Vector2(346, 44)
		complete.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		drawer_content.add_child(complete)
	else:
		var perf := _label("iOS budget: %d max shoppers · heatmaps sample events, not every frame · bottom tabs act as mobile modes." % mobile_shopper_budget, 9, Color("#94a3b8"))
		perf.position = Vector2(0, y + 8)
		perf.size = Vector2(346, 44)
		perf.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		drawer_content.add_child(perf)

func _render_feed_drawer() -> void:
	var scroll := ScrollContainer.new()
	scroll.position = Vector2(0, 0)
	scroll.size = Vector2(346, 470)
	drawer_content.add_child(scroll)

	var vbox := VBoxContainer.new()
	vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.add_theme_constant_override("separation", 6)
	scroll.add_child(vbox)

	for ev in event_feed:
		var panel := _panel(Vector2.ZERO, Vector2(330, 52), Color(0.06, 0.09, 0.15, 0.9))
		panel.custom_minimum_size = Vector2(330, 52)
		vbox.add_child(panel)

		var ev_t := _label(str(ev.title), 11, Color("#38bdf8"), true)
		ev_t.position = Vector2(10, 6)
		panel.add_child(ev_t)

		var ev_d := _label(str(ev.desc), 9, Color("#cbd5e1"))
		ev_d.position = Vector2(10, 24)
		ev_d.size = Vector2(310, 24)
		ev_d.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		panel.add_child(ev_d)

func _add_event(title: String, desc: String, ev_type := "info") -> void:
	var ev := {"title": title, "desc": desc, "type": ev_type, "time": "W%d·D%d" % [week, day]}
	event_feed.push_front(ev)
	if event_feed.size() > 40: event_feed.pop_back()

	if toast_container != null:
		var toast := _panel(Vector2.ZERO, Vector2(340, 48), Color(0.05, 0.08, 0.14, 0.94))
		toast.custom_minimum_size = Vector2(340, 48)
		toast_container.add_child(toast)

		var t_title := _label(title, 11, Color("#38bdf8"), true)
		t_title.position = Vector2(10, 6)
		toast.add_child(t_title)

		var t_desc := _label(desc, 9, Color("#e2e8f0"))
		t_desc.position = Vector2(10, 24)
		t_desc.size = Vector2(320, 20)
		toast.add_child(t_desc)

		var tween := create_tween()
		tween.tween_interval(3.5)
		tween.tween_property(toast, "modulate:a", 0.0, 0.8)
		tween.tween_callback(toast.queue_free)

func _show_tutorial_once(key: String, title: String, desc: String) -> void:
	if bool(tutorial_seen.get(key, false)):
		return
	tutorial_seen[key] = true
	_add_event(title, desc, "info")

func _refresh_stats_hud() -> void:
	if cash_label == null: return
	cash_label.text = "$%s" % _comma(cash)
	date_label.text = "W%d · D%d" % [week, day]
	guests_label.text = "%d GUESTS" % active_shoppers
	rep_label.text = "%d%% REP" % reputation
	clean_label.text = "%d%% CLN" % cleanliness

func _refresh_ui() -> void:
	_refresh_stats_hud()
	_render_drawer_content()

func _set_sim_speed(speed: float) -> void:
	Engine.time_scale = speed
	speed_label.text = "PAUSED" if speed == 0.0 else "%d×" % roundi(speed)
	speed_label.modulate = Color("#fbbf24") if speed == 0.0 else Color("#38bdf8")
	sound_mgr.play_click()

func _toggle_sound() -> void:
	var enabled: bool = sound_mgr.toggle_sound()
	sound_btn.text = "🔊 SOUND" if enabled else "🔇 MUTED"
	sound_btn.modulate = Color.WHITE if enabled else Color("#94a3b8")

# ==============================================================================
# SAVE / LOAD SYSTEM
# ==============================================================================
func _serialize_staff_units() -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for unit in staff_units:
		var saved := unit.duplicate(true)
		saved["position"] = _vector_to_save(unit.get("position", Vector3.ZERO))
		saved["target"] = _vector_to_save(unit.get("target", Vector3.ZERO))
		result.append(saved)
	return result

func _serialize_incidents() -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for incident in active_incidents:
		var saved := incident.duplicate(true)
		saved["position"] = _vector_to_save(incident.get("position", Vector3.ZERO))
		saved["assigned"] = false
		result.append(saved)
	return result

func _vector_to_save(value) -> Dictionary:
	if value is Vector3:
		return {"x": value.x, "y": value.y, "z": value.z}
	return {"x": 0.0, "y": 0.0, "z": 0.0}

func _vector_from_save(value) -> Vector3:
	if value is Vector3:
		return value
	if value is Dictionary:
		return Vector3(float(value.get("x", 0.0)), float(value.get("y", 0.0)), float(value.get("z", 0.0)))
	return Vector3.ZERO

func _save_game() -> void:
	var store_state: Array[Dictionary] = []
	for s in stores:
		store_state.append({
			"name": s.name, "category": s.category, "price": s.price,
			"staff": s.staff, "stock": s.stock, "satisfaction": s.satisfaction,
			"level": s.level, "revenue": s.revenue, "served": s.served,
			"facade": s.facade, "tenant_id": s.tenant_id,
			"economy": s.get("economy", {})
		})

	var payload := {
		"version": TycoonEconomy.SAVE_VERSION,
		"cash": cash,
		"week": week,
		"day": day,
		"reputation": reputation,
		"cleanliness": cleanliness,
		"security": security,
		"selected_store_idx": selected_store_idx,
		"stores": store_state,
		"amenities": placed_amenities,
		"weekly_reports": weekly_reports,
		"shopper_thoughts": shopper_thoughts,
		"heatmap_mode": heatmap_mode,
		"heatmap_cells": heatmap_cells,
		"staff_units": _serialize_staff_units(),
		"active_incidents": _serialize_incidents(),
		"active_scenario": active_scenario,
		"completed_goals": completed_goals,
		"scenario_complete": scenario_complete,
		"prestige_tier": prestige_tier,
		"tutorial_seen": tutorial_seen,
		"mobile_shopper_budget": mobile_shopper_budget,
		"tycoon_metrics": tycoon_metrics
	}

	var file := FileAccess.open("user://aurora_save.json", FileAccess.WRITE)
	if file != null:
		file.store_string(JSON.stringify(payload))
		_add_event("Game Saved", "Mall state saved successfully on device.", "success")
		sound_mgr.play_place()

func _load_game() -> void:
	if not FileAccess.file_exists("user://aurora_save.json"): return
	var file := FileAccess.open("user://aurora_save.json", FileAccess.READ)
	if file == null: return
	var payload = JSON.parse_string(file.get_as_text())
	if not payload is Dictionary: return
	var save_version := int(payload.get("version", 0))
	if save_version < 1 or save_version > TycoonEconomy.SAVE_VERSION: return

	cash = int(payload.get("cash", cash))
	week = int(payload.get("week", week))
	day = int(payload.get("day", day))
	reputation = int(payload.get("reputation", reputation))
	cleanliness = int(payload.get("cleanliness", cleanliness))
	security = int(payload.get("security", security))
	selected_store_idx = clampi(int(payload.get("selected_store_idx", 0)), 0, stores.size() - 1)

	var saved_stores: Array = payload.get("stores", [])
	for i in mini(stores.size(), saved_stores.size()):
		var saved: Dictionary = saved_stores[i]
		stores[i].name = str(saved.get("name", stores[i].name))
		stores[i].category = str(saved.get("category", stores[i].category))
		stores[i].price = str(saved.get("price", "Market"))
		stores[i].staff = int(saved.get("staff", 2))
		stores[i].stock = float(saved.get("stock", 100.0))
		stores[i].satisfaction = int(saved.get("satisfaction", 95))
		stores[i].level = int(saved.get("level", 1))
		stores[i].revenue = int(saved.get("revenue", 0))
		stores[i].served = int(saved.get("served", 0))
		stores[i].facade = str(saved.get("facade", "Gallery"))
		stores[i].tenant_id = str(saved.get("tenant_id", "generic"))
		if saved.has("economy") and saved.economy is Dictionary:
			stores[i].economy = saved.economy

	weekly_reports.clear()
	var saved_reports: Array = payload.get("weekly_reports", [])
	for report in saved_reports:
		if report is Dictionary:
			weekly_reports.append(report)
	shopper_thoughts.clear()
	var saved_thoughts: Array = payload.get("shopper_thoughts", [])
	for thought in saved_thoughts:
		if thought is Dictionary:
			shopper_thoughts.append(thought)
	heatmap_mode = str(payload.get("heatmap_mode", "none"))
	if payload.get("heatmap_cells", {}) is Dictionary:
		heatmap_cells = payload.get("heatmap_cells", {})
	staff_units.clear()
	var saved_staff: Array = payload.get("staff_units", [])
	for unit in saved_staff:
		if unit is Dictionary:
			var restored_unit: Dictionary = unit.duplicate(true)
			restored_unit["position"] = _vector_from_save(unit.get("position", Vector3.ZERO))
			restored_unit["target"] = _vector_from_save(unit.get("target", restored_unit.position))
			staff_units.append(restored_unit)
	active_incidents.clear()
	var saved_incidents: Array = payload.get("active_incidents", [])
	for incident in saved_incidents:
		if incident is Dictionary:
			var restored_incident: Dictionary = incident.duplicate(true)
			restored_incident["position"] = _vector_from_save(incident.get("position", Vector3.ZERO))
			restored_incident["assigned"] = false
			active_incidents.append(restored_incident)
	if incident_root != null:
		for child in incident_root.get_children():
			child.queue_free()
		for incident in active_incidents:
			_build_incident_node(incident)
	if payload.get("active_scenario", {}) is Dictionary:
		active_scenario = payload.get("active_scenario", active_scenario)
	if payload.get("completed_goals", {}) is Dictionary:
		completed_goals = payload.get("completed_goals", {})
	scenario_complete = bool(payload.get("scenario_complete", scenario_complete))
	prestige_tier = int(payload.get("prestige_tier", prestige_tier))
	if payload.get("tutorial_seen", {}) is Dictionary:
		tutorial_seen = payload.get("tutorial_seen", {})
	mobile_shopper_budget = int(payload.get("mobile_shopper_budget", mobile_shopper_budget))
	if payload.get("tycoon_metrics", {}) is Dictionary:
		tycoon_metrics = payload.get("tycoon_metrics", {})

# ==============================================================================
# HELPERS & CATALOG LOADERS
# ==============================================================================
func _load_catalogs() -> void:
	catalog_data = _load_json("res://data/catalogs.json")
	tenants_catalog = catalog_data.get("tenants", [])
	amenities_catalog = catalog_data.get("amenities", [])

func _find_tenant_by_category(cat: String) -> Dictionary:
	for t in tenants_catalog:
		if str(t.get("category", "")) == cat:
			return t
	return tenants_catalog[0] if tenants_catalog.size() > 0 else {}

func _find_tenant_by_id(t_id: String) -> Dictionary:
	for t in tenants_catalog:
		if str(t.get("id", "")) == t_id:
			return t
	return {}

func _find_amenity_by_type(a_type: String) -> Dictionary:
	for a in amenities_catalog:
		if str(a.get("type", "")) == a_type:
			return a
	return {}

func _economy_profile_for_tenant(tenant: Dictionary) -> Dictionary:
	var profiles: Dictionary = catalog_data.get("economy_profiles", {})
	var profile: Dictionary = profiles.get(str(tenant.get("category", "")), profiles.get("default", {})).duplicate(true)
	var override: Dictionary = tenant.get("economy", {})
	for key in override.keys():
		profile[key] = override[key]
	return profile

func _load_json(path: String) -> Dictionary:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null: return {}
	var parsed = JSON.parse_string(file.get_as_text())
	return parsed if parsed is Dictionary else {}

func _comma(value: int) -> String:
	var raw := str(value)
	var result := ""
	while raw.length() > 3:
		result = "," + raw.right(3) + result
		raw = raw.left(raw.length() - 3)
	return raw + result

func _state_color(state: String) -> Color:
	match state:
		"trending":
			return Color("#34d399")
		"stable", "open":
			return Color("#38bdf8")
		"struggling":
			return Color("#fbbf24")
		"at-risk":
			return Color("#fb7185")
		_:
			return Color("#cbd5e1")

func _panel(at: Vector2, panel_size: Vector2, color: Color) -> Panel:
	var panel := Panel.new()
	panel.position = at
	panel.size = panel_size
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.border_color = Color(0.2, 0.35, 0.5, 0.6)
	style.set_border_width_all(1)
	style.set_corner_radius_all(14)
	style.shadow_color = Color(0, 0, 0, 0.4)
	style.shadow_size = 10
	panel.add_theme_stylebox_override("panel", style)
	return panel

func _label(text_val: String, font_size: int, color: Color, bold := false) -> Label:
	var label := Label.new()
	label.text = text_val
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", color)
	return label

func _button(text_val: String, at: Vector2, btn_size: Vector2) -> Button:
	var btn := Button.new()
	btn.text = text_val
	btn.clip_text = true
	btn.position = at
	var stable_size := Vector2(btn_size.x, maxf(btn_size.y, 30.0))
	btn.custom_minimum_size = stable_size
	btn.size = stable_size
	btn.add_theme_font_size_override("font_size", 11)
	var style := StyleBoxFlat.new()
	style.bg_color = Color("#111c2e")
	style.border_color = Color("#1e3a5f")
	style.set_border_width_all(1)
	style.set_corner_radius_all(10)
	btn.add_theme_stylebox_override("normal", style)
	var hover := style.duplicate()
	hover.bg_color = Color("#1d4ed8")
	btn.add_theme_stylebox_override("hover", hover)
	return btn

func _box(name_val: String, at: Vector3, size_val: Vector3, color: Color, metallic: float, roughness: float, parent: Node = self, transparent := false) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = name_val
	var mesh := BoxMesh.new()
	mesh.size = size_val
	node.mesh = mesh
	node.position = at
	node.material_override = _material(color, metallic, roughness, transparent)
	parent.add_child(node)
	return node

func _cylinder(name_val: String, at: Vector3, radius: float, height: float, color: Color, metallic: float, roughness: float, parent: Node = self, transparent := false) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = name_val
	var mesh := CylinderMesh.new()
	mesh.top_radius = radius
	mesh.bottom_radius = radius
	mesh.height = height
	node.mesh = mesh
	node.position = at
	node.material_override = _material(color, metallic, roughness, transparent)
	parent.add_child(node)
	return node

func _sphere(name_val: String, at: Vector3, radius: float, color: Color, metallic: float, roughness: float, parent: Node = self) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = name_val
	var mesh := SphereMesh.new()
	mesh.radius = radius
	mesh.height = radius * 2.0
	node.mesh = mesh
	node.position = at
	node.material_override = _material(color, metallic, roughness)
	parent.add_child(node)
	return node

func _material(color: Color, metallic: float, roughness: float, transparent := false) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = color
	mat.metallic = metallic
	mat.roughness = roughness
	if transparent:
		mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		mat.shading_mode = BaseMaterial3D.SHADING_MODE_PER_PIXEL
	return mat
