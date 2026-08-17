extends Node3D

const Shopper = preload("res://scripts/shopper.gd")
const STORE_COLORS := [Color("#38bdf8"), Color("#f97316"), Color("#d8b4fe"), Color("#34d399"), Color("#fb7185"), Color("#facc15")]
const SHOPPER_COLORS := [Color("#38bdf8"), Color("#fb7185"), Color("#34d399"), Color("#fbbf24"), Color("#a78bfa")]

var stores: Array[Dictionary] = []
var entrances := {}
var blueprint: Dictionary = {}
var selected_store := 0
var cash := 28000
var reputation := 76
var active_shoppers := 0
var spawn_cooldown := 0.0
var camera_yaw := -18.0
var camera_distance := 31.0
var dragging := false
var last_pointer := Vector2.ZERO
var active_touches: Dictionary = {}
var cash_label: Label
var visitor_label: Label
var store_title: Label
var store_detail: Label
var stock_bar: ProgressBar
var campaign_button: Button
var store_buttons: HBoxContainer
var flow_label: Label

func _ready() -> void:
	blueprint = _load_blueprint("res://data/aurora_grand.json")
	cash = int(blueprint.get("starting_cash", 28000))
	_build_architecture()
	_build_stores()
	_build_entrances()
	_update_store_selection_visuals()
	_build_ui()
	for index in 10:
		_spawn_shopper(index % 2 == 0)
	_refresh_ui()

func _process(delta: float) -> void:
	spawn_cooldown -= delta
	if spawn_cooldown <= 0.0 and active_shoppers < 34:
		_spawn_shopper(randf() > 0.5)
		spawn_cooldown = randf_range(0.55, 1.15)
	for store in stores:
		store.promotion = maxf(0.0, store.promotion - delta)
	_update_camera(delta)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
			_select_store_at_screen(event.position)
		if event.button_index == MOUSE_BUTTON_RIGHT or event.button_index == MOUSE_BUTTON_MIDDLE:
			dragging = event.pressed
			last_pointer = event.position
		if event.pressed and event.button_index == MOUSE_BUTTON_WHEEL_UP:
			camera_distance = maxf(18.0, camera_distance - 2.0)
		if event.pressed and event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			camera_distance = minf(42.0, camera_distance + 2.0)
	elif event is InputEventMouseMotion and dragging:
		camera_yaw -= event.relative.x * 0.18
	elif event is InputEventMagnifyGesture:
		camera_distance = clampf(camera_distance / event.factor, 18.0, 42.0)
	elif event is InputEventPanGesture:
		camera_yaw -= event.delta.x * 0.55
	elif event is InputEventScreenTouch:
		if event.pressed:
			active_touches[event.index] = event.position
		else:
			active_touches.erase(event.index)
	elif event is InputEventScreenDrag:
		active_touches[event.index] = event.position
		if active_touches.size() == 1:
			camera_yaw -= event.relative.x * 0.16
		elif active_touches.size() == 2:
			var touch_positions := active_touches.values()
			var current_distance: float = touch_positions[0].distance_to(touch_positions[1])
			var previous_moved: Vector2 = event.position - event.relative
			var other_position: Vector2 = touch_positions[0] if touch_positions[1] == event.position else touch_positions[1]
			var previous_distance: float = previous_moved.distance_to(other_position)
			camera_distance = clampf(camera_distance - (current_distance - previous_distance) * 0.035, 18.0, 42.0)

func _update_camera(delta: float) -> void:
	var input_axis := Input.get_axis("camera_left", "camera_right")
	var zoom_axis := Input.get_axis("camera_up", "camera_down")
	camera_yaw += input_axis * delta * 42.0
	camera_distance = clampf(camera_distance + zoom_axis * delta * 15.0, 18.0, 42.0)
	$CameraRig.rotation_degrees.y = lerpf($CameraRig.rotation_degrees.y, camera_yaw, delta * 8.0)
	$CameraRig/Camera3D.position.z = lerpf($CameraRig/Camera3D.position.z, camera_distance, delta * 8.0)

func _build_architecture() -> void:
	# Landscape podium and a polished, strictly walkable central concourse.
	_box("Site", Vector3(0, -0.45, 0), Vector3(60, 0.7, 32), Color("#172033"), 0.12, 0.9)
	for corridor_data in blueprint.get("corridors", []):
		var center: Array = corridor_data.center
		var corridor_size: Array = corridor_data.size
		var is_atrium: bool = corridor_data.material == "atrium"
		_box(str(corridor_data.id), Vector3(float(center[0]), 0.02 if is_atrium else 0.0, float(center[1])), Vector3(float(corridor_size[0]), 0.21 if is_atrium else 0.18, float(corridor_size[1])), Color("#e8edf0") if is_atrium else Color("#dfe7e9"), 0.2 if is_atrium else 0.18, 0.18 if is_atrium else 0.22)
	# Brass circulation inlay gives the corridor a readable premium spine.
	_box("BrassInlay", Vector3(0, 0.12, 0), Vector3(47.5, 0.025, 0.11), Color("#caa85e"), 0.8, 0.24)
	for x in [-18.0, -9.0, 9.0, 18.0]:
		_box("SkylightBeam", Vector3(x, 3.8, 0), Vector3(0.16, 0.18, 7.4), Color("#67e8f9"), 0.62, 0.12)
	# Center court planter and sculptural light.
	_cylinder("Planter", Vector3(0, 0.42, 0), 1.35, 0.7, Color("#0f766e"), 0.14, 0.48)
	_cylinder("Tree", Vector3(0, 2.2, 0), 0.22, 3.5, Color("#6b4f38"), 0.0, 0.8)
	_sphere("Canopy", Vector3(0, 4.15, 0), 1.65, Color("#34d399"), 0.0, 0.74)

func _build_stores() -> void:
	var definitions: Array = blueprint.get("stores", [])
	for index in definitions.size():
		var definition: Dictionary = definitions[index]
		var store_position: Array = definition.position
		var north := float(store_position[1]) < 0.0
		var store := {
			"name": definition.name, "category": definition.category, "position": Vector3(float(store_position[0]), 0, float(store_position[1])),
			"door": Vector3(float(store_position[0]), 0.15, -3.65 if north else 3.65), "price": "Market", "staff": 3,
			"stock": 100.0, "satisfaction": 92, "promotion": 0.0, "facade": "Gallery", "color": STORE_COLORS[index]
		}
		stores.append(store)
		_build_store_model(index, store, north)

func _build_store_model(index: int, store: Dictionary, north: bool) -> void:
	var root := Node3D.new()
	root.name = "Store_%02d_%s" % [index, store.name]
	root.position = store.position
	root.set_meta("store_index", index)
	add_child(root)
	var color: Color = store.color
	_box("Floor", Vector3(0, 0.12, 0), Vector3(7.4, 0.2, 6.2), color.lightened(0.76), 0.08, 0.3, root)
	var selection := _box("Selection", Vector3(0, 0.245, 0), Vector3(7.58, 0.035, 6.38), Color(0.25, 0.9, 1.0, 0.24), 0.65, 0.12, root, true)
	selection.visible = false
	_box("BackWall", Vector3(0, 1.75, -3.0 if north else 3.0), Vector3(7.4, 3.5, 0.22), Color("#152033"), 0.12, 0.66, root)
	_box("LeftWall", Vector3(-3.6, 1.55, 0), Vector3(0.22, 3.1, 6.0), Color("#263247"), 0.08, 0.55, root)
	_box("RightWall", Vector3(3.6, 1.55, 0), Vector3(0.22, 3.1, 6.0), Color("#263247"), 0.08, 0.55, root)
	var facade_z := 3.0 if north else -3.0
	_box("FacadeBeam", Vector3(0, 2.7, facade_z), Vector3(7.4, 0.65, 0.3), color.darkened(0.48), 0.48, 0.2, root)
	_box("GlassLeft", Vector3(-2.45, 1.35, facade_z), Vector3(2.25, 2.1, 0.12), Color(0.42, 0.82, 0.92, 0.32), 0.25, 0.08, root, true)
	_box("GlassRight", Vector3(2.45, 1.35, facade_z), Vector3(2.25, 2.1, 0.12), Color(0.42, 0.82, 0.92, 0.32), 0.25, 0.08, root, true)
	var sign := Label3D.new()
	sign.name = "Sign"
	sign.text = store.name
	sign.font_size = 34
	sign.outline_size = 8
	sign.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	sign.modulate = color.lightened(0.2)
	sign.position = Vector3(0, 2.78, facade_z + (0.18 if north else -0.18))
	sign.rotation_degrees.y = 0 if north else 180
	root.add_child(sign)
	# Merchandising fixtures create category silhouettes instead of colored rectangles.
	for fixture_index in 3:
		var fx := -2.1 + fixture_index * 2.1
		_box("Display", Vector3(fx, 0.55, 0.25), Vector3(1.35, 0.9, 1.25), color.darkened(0.18), 0.32, 0.34, root)
		_box("DisplayLight", Vector3(fx, 1.08, 0.25), Vector3(1.1, 0.08, 1.0), color.lightened(0.35), 0.55, 0.16, root)
	if store.category == "Cafe" or store.category == "Dining":
		for table_x in [-1.8, 0.0, 1.8]:
			_cylinder("Table", Vector3(table_x, 0.52, -1.25 if north else 1.25), 0.5, 0.1, Color("#9a6c45"), 0.0, 0.62, root)
	elif store.category == "Technology" or store.category == "Entertainment":
		for screen_x in [-2.1, 0.0, 2.1]:
			_box("Screen", Vector3(screen_x, 1.2, -1.7 if north else 1.7), Vector3(1.25, 1.2, 0.12), color.lightened(0.25), 0.45, 0.08, root)
	var body := StaticBody3D.new()
	body.set_meta("store_index", index)
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = Vector3(7.4, 3.5, 6.2)
	collision.shape = shape
	collision.position.y = 1.7
	body.add_child(collision)
	root.add_child(body)

func _build_entrances() -> void:
	for entry_data in blueprint.get("entrances", []):
		var entry_position: Array = entry_data.position
		var entry_id := str(entry_data.id)
		entrances[entry_id] = {"name": entry_data.name, "position": Vector3(float(entry_position[0]), 0.0, float(entry_position[1])), "entered": 0, "exited": 0}
		_build_entrance(entry_id, float(entry_position[0]), float(entry_position[1]), float(entry_data.facing))

func _build_entrance(id: String, x: float, z: float, facing: float) -> void:
	var root := Node3D.new()
	root.name = "%s_entrance" % id
	root.position = Vector3(x, 0, z)
	root.rotation_degrees.y = facing
	add_child(root)
	_box("PortalTop", Vector3(0, 3.2, 0), Vector3(5.4, 0.55, 0.65), Color("#083344"), 0.5, 0.2, root)
	_box("PortalLeft", Vector3(-2.45, 1.55, 0), Vector3(0.5, 3.1, 0.65), Color("#164e63"), 0.5, 0.2, root)
	_box("PortalRight", Vector3(2.45, 1.55, 0), Vector3(0.5, 3.1, 0.65), Color("#164e63"), 0.5, 0.2, root)
	_box("GlassDoors", Vector3(0, 1.45, 0), Vector3(4.4, 2.8, 0.1), Color(0.45, 0.92, 1.0, 0.28), 0.35, 0.05, root, true)
	var label := Label3D.new()
	label.text = entrances[id].name.to_upper()
	label.font_size = 28
	label.outline_size = 7
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label.modulate = Color("#a5f3fc")
	label.position = Vector3(0, 3.22, 0.38)
	root.add_child(label)

func _spawn_shopper(from_west: bool) -> void:
	var entry := "west" if from_west else "east"
	var exit := "east" if from_west else "west"
	var direction := 1.0 if from_west else -1.0
	var chosen_index := _pick_store_index()
	var chosen_store := stores[chosen_index]
	var door: Vector3 = chosen_store.door
	var corridor_door := Vector3(door.x, 0.05, clampf(door.z, -3.15, 3.15))
	var start_x := -28.0 if from_west else 28.0
	var threshold_x := -25.5 if from_west else 25.5
	var route: Array[Vector3] = [
		Vector3(start_x, 0.05, 0), Vector3(threshold_x, 0.05, 0), Vector3(door.x - direction * 1.2, 0.05, 0),
		corridor_door, door, corridor_door, Vector3(-door.x, 0.05, 0), Vector3(-threshold_x, 0.05, 0), Vector3(-start_x, 0.05, 0)
	]
	var shopper := Shopper.new()
	add_child(shopper)
	shopper.configure(route, entry, exit, chosen_index, 3.6 / maxf(1.0, float(chosen_store.staff)), SHOPPER_COLORS[randi() % SHOPPER_COLORS.size()])
	shopper.finished_visit.connect(_on_shopper_finished)
	entrances[entry].entered += 1
	active_shoppers += 1
	_refresh_ui()

func _on_shopper_finished(_entry: String, exit: String, store_index: int) -> void:
	entrances[exit].exited += 1
	if store_index >= 0 and store_index < stores.size():
		var store := stores[store_index]
		var price_multiplier := 0.82 if store.price == "Value" else 1.28 if store.price == "Premium" else 1.0
		var stock_multiplier := 0.42 if store.stock < 15.0 else 1.0
		var sale := roundi(randf_range(42.0, 96.0) * price_multiplier * stock_multiplier)
		store.stock = maxf(0.0, store.stock - randf_range(1.4, 3.2))
		store.satisfaction = clampi(store.satisfaction + (1 if store.price == "Value" else -1 if store.price == "Premium" else 0), 45, 100)
		cash += roundi(sale * 0.24)
	active_shoppers = maxi(0, active_shoppers - 1)
	_refresh_ui()

func _pick_store_index() -> int:
	var candidates: Array[int] = []
	for index in stores.size():
		var store := stores[index]
		var weight := 3
		if store.price == "Value": weight += 2
		if store.price == "Premium": weight -= 1
		if store.promotion > 0.0: weight += 5
		if store.stock < 15.0: weight = 1
		for count in maxi(1, weight): candidates.append(index)
	return candidates[randi() % candidates.size()]

func _build_ui() -> void:
	var ui := $UI
	var top := _panel(Vector2(18, 16), Vector2(1244, 68), Color(0.035, 0.055, 0.09, 0.94))
	ui.add_child(top)
	var brand := _label("AURORA  /  MALL TYCOON", 22, Color("#f8fafc"))
	brand.position = Vector2(24, 18)
	top.add_child(brand)
	var mode := _label("NATIVE 3D · OPERATING VIEW", 11, Color("#67e8f9"))
	mode.position = Vector2(330, 24)
	top.add_child(mode)
	cash_label = _label("", 17, Color("#fbbf24"))
	cash_label.position = Vector2(870, 19)
	top.add_child(cash_label)
	visitor_label = _label("", 14, Color("#a7f3d0"))
	visitor_label.position = Vector2(1034, 21)
	top.add_child(visitor_label)

	var manager := _panel(Vector2(930, 100), Vector2(332, 504), Color(0.035, 0.055, 0.09, 0.95))
	ui.add_child(manager)
	var flow := _panel(Vector2(18, 100), Vector2(238, 150), Color(0.035, 0.055, 0.09, 0.92))
	ui.add_child(flow)
	var flow_title := _label("ENTRANCE NETWORK", 11, Color("#67e8f9"))
	flow_title.position = Vector2(18, 16)
	flow.add_child(flow_title)
	flow_label = _label("", 12, Color("#cbd5e1"))
	flow_label.position = Vector2(18, 43)
	flow_label.size = Vector2(202, 92)
	flow_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	flow.add_child(flow_label)
	var eyebrow := _label("STORE OPERATIONS", 11, Color("#67e8f9"))
	eyebrow.position = Vector2(22, 19)
	manager.add_child(eyebrow)
	store_title = _label("", 25, Color("#ffffff"))
	store_title.position = Vector2(22, 42)
	manager.add_child(store_title)
	store_detail = _label("", 12, Color("#94a3b8"))
	store_detail.position = Vector2(22, 80)
	store_detail.size = Vector2(288, 66)
	store_detail.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	manager.add_child(store_detail)
	var price_title := _label("PRICING STRATEGY", 10, Color("#94a3b8"))
	price_title.position = Vector2(22, 151)
	manager.add_child(price_title)
	for index in 3:
		var price: String = ["Value", "Market", "Premium"][index]
		var button := _button(price, Vector2(22 + index * 98, 171), Vector2(91, 38))
		button.pressed.connect(_set_price.bind(price))
		manager.add_child(button)
	var staff_title := _label("SERVICE TEAM", 10, Color("#94a3b8"))
	staff_title.position = Vector2(22, 226)
	manager.add_child(staff_title)
	var remove_staff := _button("− Staff", Vector2(22, 246), Vector2(91, 38))
	remove_staff.pressed.connect(_change_staff.bind(-1))
	manager.add_child(remove_staff)
	var add_staff := _button("+ Staff", Vector2(120, 246), Vector2(91, 38))
	add_staff.pressed.connect(_change_staff.bind(1))
	manager.add_child(add_staff)
	var restock := _button("Restock · $240", Vector2(218, 246), Vector2(92, 38))
	restock.pressed.connect(_restock)
	manager.add_child(restock)
	stock_bar = ProgressBar.new()
	stock_bar.position = Vector2(22, 302)
	stock_bar.size = Vector2(288, 12)
	stock_bar.show_percentage = false
	manager.add_child(stock_bar)
	campaign_button = _button("Launch local campaign · $450", Vector2(22, 333), Vector2(288, 44))
	campaign_button.pressed.connect(_campaign)
	manager.add_child(campaign_button)
	var facade_title := _label("STOREFRONT CONCEPT", 10, Color("#94a3b8"))
	facade_title.position = Vector2(22, 397)
	manager.add_child(facade_title)
	for index in 3:
		var facade: String = ["Gallery", "Warm", "Neon"][index]
		var button := _button(facade, Vector2(22 + index * 98, 418), Vector2(91, 38))
		button.pressed.connect(_set_facade.bind(facade))
		manager.add_child(button)

	var dock := _panel(Vector2(18, 624), Vector2(1244, 78), Color(0.035, 0.055, 0.09, 0.95))
	ui.add_child(dock)
	store_buttons = HBoxContainer.new()
	store_buttons.position = Vector2(16, 13)
	store_buttons.size = Vector2(1212, 52)
	store_buttons.add_theme_constant_override("separation", 8)
	dock.add_child(store_buttons)
	for index in stores.size():
		var button := _button(stores[index].name, Vector2.ZERO, Vector2(188, 50))
		button.pressed.connect(_select_store.bind(index))
		store_buttons.add_child(button)

func _select_store(index: int) -> void:
	selected_store = index
	_update_store_selection_visuals()
	_refresh_ui()

func _select_store_at_screen(screen_position: Vector2) -> void:
	var camera := $CameraRig/Camera3D as Camera3D
	var origin := camera.project_ray_origin(screen_position)
	var destination := origin + camera.project_ray_normal(screen_position) * 200.0
	var query := PhysicsRayQueryParameters3D.create(origin, destination)
	var result := get_world_3d().direct_space_state.intersect_ray(query)
	if result.has("collider") and result.collider.has_meta("store_index"):
		_select_store(int(result.collider.get_meta("store_index")))

func _update_store_selection_visuals() -> void:
	for index in stores.size():
		var store_node := get_node_or_null("Store_%02d_%s" % [index, stores[index].name])
		if store_node:
			store_node.get_node("Selection").visible = index == selected_store

func _set_price(strategy: String) -> void:
	stores[selected_store].price = strategy
	_refresh_ui()

func _change_staff(delta: int) -> void:
	var store := stores[selected_store]
	if delta > 0 and cash >= 300:
		cash -= 300
		store.staff += 1
	elif delta < 0 and store.staff > 1:
		store.staff -= 1
		cash += 100
	_refresh_ui()

func _restock() -> void:
	if cash < 240: return
	cash -= 240
	stores[selected_store].stock = 100.0
	_refresh_ui()

func _campaign() -> void:
	if cash < 450: return
	cash -= 450
	stores[selected_store].promotion = 25.0
	for index in 6: _spawn_shopper(index % 2 == 0)
	_refresh_ui()

func _set_facade(style: String) -> void:
	if stores[selected_store].facade == style or cash < 325: return
	cash -= 325
	stores[selected_store].facade = style
	var store_node := get_node("Store_%02d_%s" % [selected_store, stores[selected_store].name])
	var beam: MeshInstance3D = store_node.get_node("FacadeBeam")
	var material := beam.material_override as StandardMaterial3D
	material.albedo_color = Color("#111827") if style == "Gallery" else Color("#9a5b38") if style == "Warm" else Color("#312e81")
	material.emission_enabled = style == "Neon"
	material.emission = stores[selected_store].color
	material.emission_energy_multiplier = 2.3 if style == "Neon" else 0.0
	_refresh_ui()

func _refresh_ui() -> void:
	if cash_label == null: return
	var store := stores[selected_store]
	cash_label.text = "$%s" % _comma(cash)
	visitor_label.text = "%d VISITORS" % active_shoppers
	flow_label.text = "WEST GALLERY\n%d entered  ·  %d exited\n\nEAST GALLERY\n%d entered  ·  %d exited" % [entrances.west.entered, entrances.west.exited, entrances.east.entered, entrances.east.exited]
	store_title.text = "%s  ·  %s" % [store.name, store.category]
	store_detail.text = "%s pricing  ·  %d staff\n%d%% satisfaction  ·  %s facade" % [store.price, store.staff, store.satisfaction, store.facade]
	stock_bar.value = store.stock
	campaign_button.text = "Campaign live · high demand" if store.promotion > 0.0 else "Launch local campaign · $450"
	for index in store_buttons.get_child_count():
		var button := store_buttons.get_child(index) as Button
		button.modulate = Color.WHITE if index == selected_store else Color(0.68, 0.72, 0.8)

func _panel(at: Vector2, panel_size: Vector2, color: Color) -> Panel:
	var panel := Panel.new()
	panel.position = at
	panel.size = panel_size
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.border_color = Color(0.19, 0.3, 0.42, 0.72)
	style.set_border_width_all(1)
	style.set_corner_radius_all(16)
	style.shadow_color = Color(0, 0, 0, 0.35)
	style.shadow_size = 12
	panel.add_theme_stylebox_override("panel", style)
	return panel

func _label(text_value: String, size: int, color: Color) -> Label:
	var label := Label.new()
	label.text = text_value
	label.add_theme_font_size_override("font_size", size)
	label.add_theme_color_override("font_color", color)
	return label

func _button(text_value: String, at: Vector2, button_size: Vector2) -> Button:
	var button := Button.new()
	button.text = text_value
	button.position = at
	button.custom_minimum_size = button_size
	button.size = button_size
	button.add_theme_font_size_override("font_size", 11)
	var style := StyleBoxFlat.new()
	style.bg_color = Color("#13243a")
	style.border_color = Color("#24435f")
	style.set_border_width_all(1)
	style.set_corner_radius_all(10)
	button.add_theme_stylebox_override("normal", style)
	var hover := style.duplicate()
	hover.bg_color = Color("#155e75")
	button.add_theme_stylebox_override("hover", hover)
	return button

func _box(name_value: String, at: Vector3, size: Vector3, color: Color, metallic: float, roughness: float, parent: Node = self, transparent := false) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = name_value
	var mesh := BoxMesh.new()
	mesh.size = size
	node.mesh = mesh
	node.position = at
	node.material_override = _material(color, metallic, roughness, transparent)
	parent.add_child(node)
	return node

func _cylinder(name_value: String, at: Vector3, radius: float, height: float, color: Color, metallic: float, roughness: float, parent: Node = self) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = name_value
	var mesh := CylinderMesh.new()
	mesh.top_radius = radius
	mesh.bottom_radius = radius
	mesh.height = height
	node.mesh = mesh
	node.position = at
	node.material_override = _material(color, metallic, roughness)
	parent.add_child(node)
	return node

func _sphere(name_value: String, at: Vector3, radius: float, color: Color, metallic: float, roughness: float) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	node.name = name_value
	var mesh := SphereMesh.new()
	mesh.radius = radius
	mesh.height = radius * 2.0
	node.mesh = mesh
	node.position = at
	node.material_override = _material(color, metallic, roughness)
	add_child(node)
	return node

func _material(color: Color, metallic: float, roughness: float, transparent := false) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.metallic = metallic
	material.roughness = roughness
	if transparent:
		material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		material.shading_mode = BaseMaterial3D.SHADING_MODE_PER_PIXEL
	return material

func _comma(value: int) -> String:
	var raw := str(value)
	var result := ""
	while raw.length() > 3:
		result = "," + raw.right(3) + result
		raw = raw.left(raw.length() - 3)
	return raw + result

func _load_blueprint(path: String) -> Dictionary:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		push_error("Mall blueprint missing: %s" % path)
		return {}
	var parsed = JSON.parse_string(file.get_as_text())
	if not parsed is Dictionary:
		push_error("Mall blueprint is invalid JSON: %s" % path)
		return {}
	return parsed
