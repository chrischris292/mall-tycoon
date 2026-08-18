class_name MallShopper
extends Node3D

signal finished_visit(entry_id: String, exit_id: String, store_index: int, purchased: bool, amount: int, rating_delta: int)
signal coin_tossed_in_fountain(world_pos: Vector3)
signal shopper_thought(world_pos: Vector3, text: String, severity: String, store_index: int)

enum Personality {
	LUXURY_VIP,
	BARGAIN_HUNTER,
	TRENDSETTER,
	FOODIE_FAMILY,
	CASUAL_STROLLER
}

enum State {
	SPAWNING,
	NAVIGATING_CONCOURSE,
	ENTERING_STORE,
	BROWSING_FIXTURES,
	EVALUATING_PURCHASE,
	IN_QUEUE,
	ORDERING_AND_PAYING,
	WALKING_TO_SEAT,
	DINING_OR_CINEMA,
	USING_AMENITY,
	LEAVING_STORE,
	EXITING_MALL
}

var personality: Personality = Personality.CASUAL_STROLLER
var current_state: State = State.SPAWNING
var budget := 150
var satisfaction := 95
var will_purchase := false
var sale_amount := 0
var needs := {
	"hunger": 30,
	"comfort": 40,
	"restroom": 25,
	"entertainment": 25,
	"patience": 75
}
var destination_category := "Fashion"
var mall_context: Dictionary = {}
var thought_cooldown := 0.0

var route: Array[Vector3] = []
var route_index := 0
var speed := 2.4
var entry_id := ""
var exit_id := ""
var store_index := -1
var store_ref: Dictionary = {}

var state_timer := 0.0
var service_time := 1.2
var bob_time := 0.0

var internal_fixtures: Array[Vector3] = []
var current_fixture_idx := 0
var register_pos := Vector3.ZERO
var seat_pos := Vector3.ZERO
var target_position := Vector3.ZERO

# Accessories & Visuals
var bubble_node: Node3D
var bubble_label: Label3D
var bubble_timer := 0.0
var bag_mesh: MeshInstance3D
var drink_mesh: MeshInstance3D
var popcorn_mesh: MeshInstance3D
var accessory_badge: MeshInstance3D

func configure(
	p_route: Array[Vector3],
	from_entry: String,
	to_exit: String,
	visited_store_idx: int,
	store_data: Dictionary,
	mall_cleanliness: int,
	mall_security: int,
	p_mall_context: Dictionary = {}
) -> void:
	route = p_route
	entry_id = from_entry
	exit_id = to_exit
	store_index = visited_store_idx
	store_ref = store_data
	mall_context = p_mall_context

	_assign_random_personality()
	_assign_shopper_needs()
	_evaluate_mall_first_impression(mall_cleanliness, mall_security)

	position = route[0] if route.size() > 0 else Vector3.ZERO
	target_position = route[1] if route.size() > 1 else position
	current_state = State.NAVIGATING_CONCOURSE

	_build_avatar()
	_build_bubble()

func _assign_random_personality() -> void:
	var roll := randf()
	if roll < 0.15:
		personality = Personality.LUXURY_VIP
		budget = randi_range(400, 1500)
	elif roll < 0.45:
		personality = Personality.BARGAIN_HUNTER
		budget = randi_range(40, 120)
	elif roll < 0.65:
		personality = Personality.TRENDSETTER
		budget = randi_range(150, 450)
	elif roll < 0.90:
		personality = Personality.FOODIE_FAMILY
		budget = randi_range(100, 300)
	else:
		personality = Personality.CASUAL_STROLLER
		budget = randi_range(25, 75)

func _assign_shopper_needs() -> void:
	match personality:
		Personality.LUXURY_VIP:
			needs = {"hunger": randi_range(15, 45), "comfort": randi_range(70, 95), "restroom": randi_range(15, 40), "entertainment": randi_range(20, 55), "patience": randi_range(55, 80)}
			destination_category = "Luxury"
		Personality.BARGAIN_HUNTER:
			needs = {"hunger": randi_range(20, 60), "comfort": randi_range(25, 55), "restroom": randi_range(20, 45), "entertainment": randi_range(10, 40), "patience": randi_range(70, 95)}
			destination_category = "Fashion"
		Personality.TRENDSETTER:
			needs = {"hunger": randi_range(20, 55), "comfort": randi_range(35, 65), "restroom": randi_range(20, 45), "entertainment": randi_range(60, 95), "patience": randi_range(45, 75)}
			destination_category = "Specialty" if randf() > 0.35 else "Entertainment"
		Personality.FOODIE_FAMILY:
			needs = {"hunger": randi_range(70, 100), "comfort": randi_range(55, 85), "restroom": randi_range(55, 90), "entertainment": randi_range(30, 70), "patience": randi_range(45, 75)}
			destination_category = "Food"
		Personality.CASUAL_STROLLER:
			needs = {"hunger": randi_range(25, 65), "comfort": randi_range(45, 75), "restroom": randi_range(20, 55), "entertainment": randi_range(25, 70), "patience": randi_range(55, 85)}
			destination_category = ["Fashion", "Food", "Entertainment"][randi() % 3]

func _evaluate_mall_first_impression(clean: int, sec: int) -> void:
	match personality:
		Personality.LUXURY_VIP:
			if clean < 75:
				satisfaction -= 30
				_record_thought("This mall needs to feel spotless for luxury shopping.", "warning", "🧼")
			if sec < 70:
				satisfaction -= 20
				_record_thought("Security feels too light for a premium visit.", "warning", "🛡️")
		Personality.BARGAIN_HUNTER:
			if clean < 40:
				satisfaction -= 15
				_record_thought("Good deals are nice, but this place feels rough.", "warning", "🧹")
		Personality.FOODIE_FAMILY:
			if clean < 60:
				satisfaction -= 25
				_record_thought("I need this place cleaner if we are eating here.", "warning", "🍽️")

	var restrooms := int(mall_context.get("restrooms", 0))
	var seating := int(mall_context.get("seating", 0))
	var food_count := int(mall_context.get("food_count", 0))
	var entertainment_count := int(mall_context.get("entertainment_count", 0))
	if int(needs.get("restroom", 0)) > 65 and restrooms <= 0:
		satisfaction -= 18
		_record_thought("I cannot find a restroom near this trip.", "warning", "🚻")
	if int(needs.get("comfort", 0)) > 70 and seating < 2:
		satisfaction -= 12
		_record_thought("There are not enough places to sit.", "info", "🪑")
	if int(needs.get("hunger", 0)) > 70 and food_count <= 0:
		satisfaction -= 22
		_record_thought("I came hungry and cannot find food.", "warning", "🍜")
	if int(needs.get("entertainment", 0)) > 70 and entertainment_count <= 0:
		satisfaction -= 12
		_record_thought("I wish this mall had more fun stuff to do.", "info", "🎬")

func _process(delta: float) -> void:
	thought_cooldown = maxf(0.0, thought_cooldown - delta)
	# Thought bubble billboard update
	if bubble_timer > 0.0:
		bubble_timer -= delta
		if bubble_node != null:
			bubble_node.visible = true
			bubble_node.position.y = 1.65 + sin(bob_time * 2.0) * 0.04
		if bubble_timer <= 0.0 and bubble_node != null:
			bubble_node.visible = false
	elif bubble_node != null:
		bubble_node.visible = false

	# State machine execution
	match current_state:
		State.NAVIGATING_CONCOURSE:
			_process_concourse_navigation(delta)
		State.ENTERING_STORE:
			if _move_towards(target_position, delta, 0.2):
				if internal_fixtures.size() > 0:
					current_state = State.BROWSING_FIXTURES
					current_fixture_idx = 0
					target_position = internal_fixtures[0]
					_show_bubble("👀", 1.8)
				else:
					_start_purchase_evaluation()
		State.BROWSING_FIXTURES:
			if _move_towards(target_position, delta, 0.25):
				state_timer = randf_range(1.2, 2.5)
				_show_browsing_bubble()
				current_state = State.EVALUATING_PURCHASE
		State.EVALUATING_PURCHASE:
			state_timer -= delta
			if state_timer <= 0.0:
				# Decide whether to inspect next fixture or make purchase decision
				if current_fixture_idx + 1 < internal_fixtures.size() and randf() < 0.45:
					current_fixture_idx += 1
					target_position = internal_fixtures[current_fixture_idx]
					current_state = State.BROWSING_FIXTURES
				else:
					_resolve_purchase_decision()
		State.IN_QUEUE:
			state_timer -= delta
			if state_timer <= 0.0:
				current_state = State.ORDERING_AND_PAYING
				state_timer = service_time * randf_range(0.8, 1.3)
				_show_bubble("🛍️", 2.0)
		State.ORDERING_AND_PAYING:
			state_timer -= delta
			if state_timer <= 0.0:
				_complete_transaction()
		State.WALKING_TO_SEAT:
			if _move_towards(target_position, delta, 0.2):
				current_state = State.DINING_OR_CINEMA
				state_timer = randf_range(3.5, 6.0)
				_show_bubble("😋" if store_ref.get("category", "") == "Food" else "🍿", 3.0)
		State.DINING_OR_CINEMA:
			state_timer -= delta
			if state_timer <= 0.0:
				current_state = State.LEAVING_STORE
				target_position = route[5] if route.size() > 5 else position
		State.USING_AMENITY:
			state_timer -= delta
			if state_timer <= 0.0:
				current_state = State.EXITING_MALL
				route_index = 6
		State.LEAVING_STORE:
			if _move_towards(target_position, delta, 0.25):
				current_state = State.EXITING_MALL
				route_index = 6
		State.EXITING_MALL:
			_process_concourse_navigation(delta)

func _process_concourse_navigation(delta: float) -> void:
	if route_index >= route.size():
		var rating := 2 if satisfaction >= 85 and will_purchase else 1 if satisfaction >= 65 else -2 if satisfaction < 40 else -1
		if satisfaction < 45:
			_record_thought("Leaving unhappy. The mall did not match this trip.", "warning", "😤")
		elif will_purchase:
			_record_thought("Good visit. I found what I wanted.", "success", "❤️")
		finished_visit.emit(entry_id, exit_id, store_index, will_purchase, sale_amount, rating)
		queue_free()
		return

	var target := route[route_index]
	var flat_target := Vector3(target.x, position.y, target.z)
	var distance := position.distance_to(flat_target)

	if distance < 0.28:
		# Check if arrived at store entrance threshold
		if route_index == 4 and current_state == State.NAVIGATING_CONCOURSE:
			current_state = State.ENTERING_STORE
			target_position = route[4]
			route_index += 1
			return
		# Check fountain coin toss opportunity near center court
		if route_index == 2 and personality == Personality.CASUAL_STROLLER and randf() < 0.35:
			current_state = State.USING_AMENITY
			state_timer = 2.0
			_show_bubble("🪙", 2.0)
			coin_tossed_in_fountain.emit(position)
			route_index += 1
			return
		route_index += 1
		return

	var direction := position.direction_to(flat_target)
	position += direction * minf(speed * delta, distance)
	rotation.y = lerp_angle(rotation.y, atan2(direction.x, direction.z), delta * 11.0)
	bob_time += delta * 10.0
	if has_node("Avatar"):
		$Avatar.position.y = 0.05 + sin(bob_time) * 0.045
		$Avatar.rotation.z = sin(bob_time * 0.5) * 0.04

func _move_towards(dest: Vector3, delta: float, tolerance: float) -> bool:
	var flat_dest := Vector3(dest.x, position.y, dest.z)
	var dist := position.distance_to(flat_dest)
	if dist <= tolerance:
		return true
	var dir := position.direction_to(flat_dest)
	position += dir * minf(speed * delta * 0.88, dist)
	rotation.y = lerp_angle(rotation.y, atan2(dir.x, dir.z), delta * 10.0)
	bob_time += delta * 8.0
	if has_node("Avatar"):
		$Avatar.position.y = 0.05 + sin(bob_time) * 0.035
	return false

func _show_browsing_bubble() -> void:
	var cat: String = str(store_ref.get("category", "Fashion"))
	match cat:
		"Luxury":
			_show_bubble("💎" if personality == Personality.LUXURY_VIP else "🏷️", 2.0)
		"Food":
			_show_bubble("🥟" if randf() > 0.5 else "🍜", 2.0)
		"Technology":
			_show_bubble("📱" if randf() > 0.5 else "🎧", 2.0)
		"Entertainment":
			_show_bubble("🎬" if randf() > 0.5 else "🍿", 2.0)
		_:
			_show_bubble("👗" if randf() > 0.5 else "👟", 2.0)

func _start_purchase_evaluation() -> void:
	current_state = State.EVALUATING_PURCHASE
	state_timer = randf_range(0.8, 1.6)
	_show_bubble("🤔", 1.5)

func _resolve_purchase_decision() -> void:
	var price_strat: String = str(store_ref.get("price", "Market"))
	var stock_level: float = float(store_ref.get("stock", 100.0))
	var cat: String = str(store_ref.get("category", "Fashion"))
	var level: int = int(store_ref.get("level", 1))
	var patience := int(needs.get("patience", 75))

	# 1. Out of stock check
	if stock_level < 8.0:
		will_purchase = false
		satisfaction -= 20
		_record_thought("They were out of what I wanted.", "warning", "📦")
		_show_bubble("📦❌", 2.5)
		current_state = State.LEAVING_STORE
		target_position = route[5] if route.size() > 5 else position
		return

	# 2. Personality-driven price elasticity & decision matrix
	var purchase_score := 50.0
	if cat == destination_category:
		purchase_score += 22.0
	elif destination_category == "Food" and cat != "Food" and int(needs.get("hunger", 0)) > 75:
		purchase_score -= 20.0
	if satisfaction < 55:
		purchase_score -= 18.0
	if patience < 55 and int(store_ref.get("staff", 2)) < 2:
		purchase_score -= 15.0
		_record_thought("The service line feels too slow.", "warning", "⏱️")

	match personality:
		Personality.LUXURY_VIP:
			if cat == "Luxury" or level >= 2: purchase_score += 40.0
			if price_strat == "Premium": purchase_score += 25.0
			elif price_strat == "Value":
				purchase_score -= 35.0 # VIPs dislike cheap quality!
				_show_bubble("😒", 2.0)
			if satisfaction < 70: purchase_score -= 30.0
		Personality.BARGAIN_HUNTER:
			if price_strat == "Value": purchase_score += 40.0
			elif price_strat == "Premium":
				purchase_score -= 55.0 # Bargain hunters hate premium prices!
				_record_thought("That price is too high for me.", "warning", "💸")
				_show_bubble("💸❌", 2.5)
			else: purchase_score += 5.0
		Personality.TRENDSETTER:
			if float(store_ref.get("promotion", 0.0)) > 0.0: purchase_score += 35.0
			if store_ref.get("facade", "") == "Neon": purchase_score += 20.0
			if cat == "Technology" or cat == "Entertainment": purchase_score += 25.0
		Personality.FOODIE_FAMILY:
			if cat == "Food": purchase_score += 40.0
			if price_strat == "Value": purchase_score += 15.0
			elif price_strat == "Premium": purchase_score -= 15.0
		Personality.CASUAL_STROLLER:
			purchase_score += 10.0 if float(store_ref.get("promotion", 0.0)) > 0.0 else -15.0

	if purchase_score >= 45.0 and budget >= int(store_ref.get("base_income", 80)):
		will_purchase = true
		satisfaction = mini(100, satisfaction + 8)
		_record_thought("This store fits my trip.", "success", "😍")
		_show_bubble("😍" if personality == Personality.LUXURY_VIP else "💡", 2.0)
		current_state = State.IN_QUEUE
		target_position = register_pos if register_pos != Vector3.ZERO else route[4]
		state_timer = service_time * randf_range(0.6, 1.1)
	else:
		will_purchase = false
		satisfaction -= 10
		if budget < int(store_ref.get("base_income", 80)):
			_record_thought("I do not have the budget for this store.", "warning", "💸")
		else:
			_record_thought("This was not what I came here for.", "info", "🤔")
		_show_bubble("😒" if randf() > 0.5 else "💸❓", 2.0)
		current_state = State.LEAVING_STORE
		target_position = route[5] if route.size() > 5 else position

func _complete_transaction() -> void:
	if bag_mesh != null: bag_mesh.visible = true
	var price_strat: String = str(store_ref.get("price", "Market"))
	var price_mult := 0.84 if price_strat == "Value" else 1.35 if price_strat == "Premium" else 1.0
	var tier_mult := 1.0 + (float(store_ref.get("level", 1)) - 1.0) * 0.5
	var vip_bonus := 1.45 if personality == Personality.LUXURY_VIP else 1.0

	sale_amount = roundi((float(store_ref.get("base_income", 90)) * tier_mult + randf_range(15.0, 40.0)) * price_mult * vip_bonus)
	budget = maxi(0, budget - sale_amount)
	if store_ref.get("category", "") == "Food":
		needs["hunger"] = maxi(0, int(needs.get("hunger", 0)) - 55)
	if store_ref.get("category", "") == "Entertainment":
		needs["entertainment"] = maxi(0, int(needs.get("entertainment", 0)) - 45)

	_show_bubble("❤️" if personality == Personality.LUXURY_VIP else "✨", 2.5)

	# If dining or cinema, walk to seating fixture
	if seat_pos != Vector3.ZERO and (store_ref.get("category", "") == "Food" or store_ref.get("category", "") == "Entertainment"):
		current_state = State.WALKING_TO_SEAT
		target_position = seat_pos
		if drink_mesh != null and store_ref.get("category", "") == "Food": drink_mesh.visible = true
		if popcorn_mesh != null and store_ref.get("category", "") == "Entertainment": popcorn_mesh.visible = true
	else:
		current_state = State.LEAVING_STORE
		target_position = route[5] if route.size() > 5 else position

func set_store_interior_targets(fixtures: Array[Vector3], reg_point: Vector3, seating: Vector3) -> void:
	internal_fixtures = fixtures
	register_pos = reg_point
	seat_pos = seating

func _show_bubble(icon_text: String, duration := 2.5) -> void:
	if bubble_label != null:
		bubble_label.text = icon_text
		bubble_timer = duration

func _record_thought(text: String, severity: String, icon_text := "💭") -> void:
	if thought_cooldown > 0.0:
		return
	thought_cooldown = 1.2
	_show_bubble(icon_text, 2.3)
	shopper_thought.emit(position, text, severity, store_index)

func _build_avatar() -> void:
	var avatar := Node3D.new()
	avatar.name = "Avatar"
	add_child(avatar)

	# Personality-based styling
	var shirt_tint: Color
	var skin_tint := Color("#dfaa7c") if randf() > 0.5 else Color("#f0c8a0")
	var hair_tint := Color("#2c1810") if randf() > 0.5 else Color("#1c1c1c")

	match personality:
		Personality.LUXURY_VIP:
			shirt_tint = Color("#a855f7") # Regal Purple / Velvet
		Personality.BARGAIN_HUNTER:
			shirt_tint = Color("#eab308") # Vibrant Gold / Yellow
		Personality.TRENDSETTER:
			shirt_tint = Color("#06b6d4") # Cyber Cyan / Neon
		Personality.FOODIE_FAMILY:
			shirt_tint = Color("#f97316") # Warm Orange / Terracotta
		Personality.CASUAL_STROLLER:
			shirt_tint = Color("#64748b") # Slate Gray

	# Torso
	var body := MeshInstance3D.new()
	var capsule := CapsuleMesh.new()
	capsule.radius = 0.23
	capsule.height = 0.78
	body.mesh = capsule
	body.position.y = 0.52
	body.material_override = _mat(shirt_tint, 0.4, 0.15)
	avatar.add_child(body)

	# Head
	var head := MeshInstance3D.new()
	var sphere := SphereMesh.new()
	sphere.radius = 0.19
	sphere.height = 0.38
	head.mesh = sphere
	head.position.y = 1.08
	head.material_override = _mat(skin_tint, 0.7, 0.5)
	avatar.add_child(head)

	# Hair
	var hair := MeshInstance3D.new()
	var hair_mesh := SphereMesh.new()
	hair_mesh.radius = 0.205
	hair_mesh.height = 0.26
	hair.mesh = hair_mesh
	hair.position.y = 1.20
	hair.material_override = _mat(hair_tint, 0.85, 0.8)
	avatar.add_child(hair)

	# VIP Badge / Gold Trim Collar
	if personality == Personality.LUXURY_VIP:
		accessory_badge = MeshInstance3D.new()
		var tor := TorusMesh.new()
		tor.inner_radius = 0.15
		tor.outer_radius = 0.25
		accessory_badge.mesh = tor
		accessory_badge.position.y = 0.88
		accessory_badge.material_override = _mat(Color("#caa85e"), 0.9, 0.1)
		avatar.add_child(accessory_badge)

	# Shopping Bag
	bag_mesh = MeshInstance3D.new()
	var bag_box := BoxMesh.new()
	bag_box.size = Vector3(0.24, 0.32, 0.14)
	bag_mesh.mesh = bag_box
	bag_mesh.position = Vector3(0.28, 0.48, 0.04)
	bag_mesh.material_override = _mat(Color("#f59e0b") if personality != Personality.LUXURY_VIP else Color("#1e1b4b"), 0.3, 0.2)
	bag_mesh.visible = false
	avatar.add_child(bag_mesh)

	# Drink Cup
	drink_mesh = MeshInstance3D.new()
	var cup := CylinderMesh.new()
	cup.top_radius = 0.08
	cup.bottom_radius = 0.06
	cup.height = 0.18
	drink_mesh.mesh = cup
	drink_mesh.position = Vector3(-0.25, 0.62, 0.12)
	drink_mesh.material_override = _mat(Color("#38bdf8"), 0.2, 0.2)
	drink_mesh.visible = false
	avatar.add_child(drink_mesh)

	# Popcorn Tub
	popcorn_mesh = MeshInstance3D.new()
	var tub := CylinderMesh.new()
	tub.top_radius = 0.12
	tub.bottom_radius = 0.09
	tub.height = 0.22
	popcorn_mesh.mesh = tub
	popcorn_mesh.position = Vector3(-0.25, 0.62, 0.12)
	popcorn_mesh.material_override = _mat(Color("#ef4444"), 0.3, 0.1)
	popcorn_mesh.visible = false
	avatar.add_child(popcorn_mesh)

func _build_bubble() -> void:
	bubble_node = Node3D.new()
	bubble_node.name = "Bubble"
	bubble_node.position.y = 1.65
	bubble_node.visible = false
	add_child(bubble_node)

	var bg := MeshInstance3D.new()
	var bg_mesh := SphereMesh.new()
	bg_mesh.radius = 0.26
	bg_mesh.height = 0.42
	bg.mesh = bg_mesh
	var bg_mat := StandardMaterial3D.new()
	bg_mat.albedo_color = Color(0.06, 0.10, 0.18, 0.94)
	bg_mat.emission_enabled = true
	bg_mat.emission = Color(0.2, 0.6, 0.9)
	bg_mat.emission_energy_multiplier = 0.3
	bg.material_override = bg_mat
	bubble_node.add_child(bg)

	bubble_label = Label3D.new()
	bubble_label.text = "❤️"
	bubble_label.font_size = 36
	bubble_label.outline_size = 8
	bubble_label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	bubble_label.position.z = 0.08
	bubble_node.add_child(bubble_label)

func _mat(col: Color, met: float, rough: float) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = col
	m.metallic = met
	m.roughness = rough
	return m
