class_name MallShopper
extends Node3D

signal finished_visit(entry_id: String, exit_id: String, store_index: int)

var route: Array[Vector3] = []
var route_index := 0
var speed := 2.2
var entry_id := ""
var exit_id := ""
var store_index := -1
var bob_time := 0.0
var dwell_remaining := 0.0
var service_time := 1.0

func configure(points: Array[Vector3], from_entry: String, to_exit: String, visited_store: int, visit_service_time: float, tint: Color) -> void:
	route = points
	entry_id = from_entry
	exit_id = to_exit
	store_index = visited_store
	service_time = visit_service_time
	position = route[0]
	_build_avatar(tint)

func _process(delta: float) -> void:
	if dwell_remaining > 0.0:
		dwell_remaining -= delta
		return
	if route_index >= route.size():
		finished_visit.emit(entry_id, exit_id, store_index)
		queue_free()
		return
	var target := route[route_index]
	var flat_target := Vector3(target.x, position.y, target.z)
	var distance := position.distance_to(flat_target)
	if distance < 0.12:
		if route_index == 4:
			dwell_remaining = service_time
		route_index += 1
		return
	var direction := position.direction_to(flat_target)
	position += direction * minf(speed * delta, distance)
	rotation.y = lerp_angle(rotation.y, atan2(direction.x, direction.z), delta * 9.0)
	bob_time += delta * 9.0
	$Avatar.position.y = 0.06 + sin(bob_time) * 0.035

func _build_avatar(tint: Color) -> void:
	var avatar := Node3D.new()
	avatar.name = "Avatar"
	add_child(avatar)
	var body := MeshInstance3D.new()
	var capsule := CapsuleMesh.new()
	capsule.radius = 0.22
	capsule.height = 0.78
	body.mesh = capsule
	body.position.y = 0.52
	body.material_override = _material(tint, 0.5)
	avatar.add_child(body)
	var head := MeshInstance3D.new()
	var sphere := SphereMesh.new()
	sphere.radius = 0.18
	sphere.height = 0.36
	head.mesh = sphere
	head.position.y = 1.07
	head.material_override = _material(Color(0.76, 0.52, 0.36), 0.72)
	avatar.add_child(head)
	var bag := MeshInstance3D.new()
	var bag_mesh := BoxMesh.new()
	bag_mesh.size = Vector3(0.22, 0.28, 0.12)
	bag.mesh = bag_mesh
	bag.position = Vector3(0.27, 0.52, 0.02)
	bag.material_override = _material(Color(0.93, 0.72, 0.22), 0.42)
	avatar.add_child(bag)

func _material(color: Color, roughness: float) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = roughness
	return material
