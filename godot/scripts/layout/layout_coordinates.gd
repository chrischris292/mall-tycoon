extends RefCounted

const DEFAULT_CELL_SIZE_METERS := 2

var cell_size_meters: int

func _init(p_cell_size_meters: int = DEFAULT_CELL_SIZE_METERS) -> void:
	cell_size_meters = maxi(1, p_cell_size_meters)

func cell_to_world(cell: Vector2i) -> Vector3:
	return Vector3(cell.x * cell_size_meters, 0.0, cell.y * cell_size_meters)

func world_to_cell(world: Vector3) -> Vector2i:
	return Vector2i(roundi(world.x / float(cell_size_meters)), roundi(world.z / float(cell_size_meters)))

func cell_array_to_vector(value: Array) -> Vector2i:
	return Vector2i(int(value[0]), int(value[1]))

func vector_to_cell_array(cell: Vector2i) -> Array[int]:
	return [cell.x, cell.y]
