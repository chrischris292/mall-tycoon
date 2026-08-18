extends RefCounted

const CELL_SOURCE_CORRIDOR := "corridor"
const CELL_SOURCE_COURT := "court"

static func rasterize_state(state: RefCounted, include_sources: bool = true) -> Dictionary:
	var cells: Dictionary = {}
	var sources: Dictionary = {}
	var endpoints: Dictionary = {}
	var corridor_ids: Array = _sorted_keys(state.corridors) if include_sources else state.corridors.keys()
	for corridor_id in corridor_ids:
		var corridor: Dictionary = state.corridors[corridor_id]
		var corridor_cells := rasterize_corridor(corridor)
		if include_sources:
			sources[corridor_id] = corridor_cells
		for cell in corridor_cells:
			_mark_cell(cells, cell, CELL_SOURCE_CORRIDOR, corridor_id, include_sources)
		if include_sources:
			endpoints[corridor_id] = _corridor_endpoints(corridor)

	var court_ids: Array = _sorted_keys(state.courts) if include_sources else state.courts.keys()
	for court_id in court_ids:
		var court: Dictionary = state.courts[court_id]
		var court_cells := rasterize_court(court)
		if include_sources:
			sources[court_id] = court_cells
		for cell in court_cells:
			_mark_cell(cells, cell, CELL_SOURCE_COURT, court_id, include_sources)

	return {
		"cells": cells,
		"sources": sources,
		"endpoints": endpoints,
		"cell_count": cells.size()
	}

static func rasterize_corridor(corridor: Dictionary) -> Array[Vector2i]:
	var result: Dictionary = {}
	var width_cells := int(corridor.get("width_cells", 1))
	var radius := maxi(0, floori((width_cells - 1) / 2.0))
	var points: Array = corridor.get("points", [])
	for index in range(points.size() - 1):
		var start := _point_to_cell(points[index])
		var end := _point_to_cell(points[index + 1])
		for center_cell in _orthogonal_line_cells(start, end):
			for widened in _widen_cell(center_cell, start, end, radius):
				result[_cell_key(widened)] = widened
	return _cell_values(result)

static func rasterize_court(court: Dictionary) -> Array[Vector2i]:
	var polygon: Array = court.get("polygon", [])
	if polygon.is_empty():
		return []
	var bounds := _polygon_bounds(polygon)
	var result: Dictionary = {}
	for x in range(bounds.position.x, bounds.end.x + 1):
		for y in range(bounds.position.y, bounds.end.y + 1):
			var cell := Vector2i(x, y)
			if _point_inside_or_on_polygon(Vector2(cell.x, cell.y), polygon):
				result[_cell_key(cell)] = cell
	return _cell_values(result)

static func cell_key(cell: Vector2i) -> String:
	return _cell_key(cell)

static func _orthogonal_line_cells(start: Vector2i, end: Vector2i) -> Array[Vector2i]:
	var cells: Array[Vector2i] = []
	if start.x == end.x:
		var min_y := mini(start.y, end.y)
		var max_y := maxi(start.y, end.y)
		for y in range(min_y, max_y + 1):
			cells.append(Vector2i(start.x, y))
	elif start.y == end.y:
		var min_x := mini(start.x, end.x)
		var max_x := maxi(start.x, end.x)
		for x in range(min_x, max_x + 1):
			cells.append(Vector2i(x, start.y))
	else:
		cells.append(start)
	return cells

static func _widen_cell(center_cell: Vector2i, start: Vector2i, end: Vector2i, radius: int) -> Array[Vector2i]:
	var cells: Array[Vector2i] = []
	if start.x == end.x:
		for x in range(center_cell.x - radius, center_cell.x + radius + 1):
			cells.append(Vector2i(x, center_cell.y))
	else:
		for y in range(center_cell.y - radius, center_cell.y + radius + 1):
			cells.append(Vector2i(center_cell.x, y))
	return cells

static func _corridor_endpoints(corridor: Dictionary) -> Array[Vector2i]:
	var points: Array = corridor.get("points", [])
	if points.is_empty():
		return []
	return [_point_to_cell(points.front()), _point_to_cell(points.back())]

static func _mark_cell(cells: Dictionary, cell: Vector2i, source_type: String, source_id: String, include_sources: bool) -> void:
	var key := _cell_key(cell)
	if not cells.has(key):
		cells[key] = {
			"cell": cell
		}
		if include_sources:
			cells[key].sources = []
	if not include_sources:
		return
	cells[key].sources.append({
		"type": source_type,
		"id": source_id
	})

static func _point_to_cell(point: Variant) -> Vector2i:
	if typeof(point) == TYPE_VECTOR2I:
		return point
	return Vector2i(int(point[0]), int(point[1]))

static func _polygon_bounds(points: Array) -> Rect2i:
	var first := _point_to_cell(points[0])
	var min_x := first.x
	var min_y := first.y
	var max_x := first.x
	var max_y := first.y
	for point in points:
		var cell := _point_to_cell(point)
		min_x = mini(min_x, cell.x)
		min_y = mini(min_y, cell.y)
		max_x = maxi(max_x, cell.x)
		max_y = maxi(max_y, cell.y)
	return Rect2i(min_x, min_y, max_x - min_x, max_y - min_y)

static func _point_inside_or_on_polygon(point: Vector2, polygon: Array) -> bool:
	var packed := PackedVector2Array()
	for raw_point in polygon:
		var cell := _point_to_cell(raw_point)
		packed.append(Vector2(cell.x, cell.y))
	if Geometry2D.is_point_in_polygon(point, packed):
		return true
	for index in range(packed.size()):
		if Geometry2D.get_closest_point_to_segment(point, packed[index], packed[(index + 1) % packed.size()]).distance_to(point) < 0.001:
			return true
	return false

static func _sorted_keys(collection: Dictionary) -> Array:
	var keys := collection.keys()
	keys.sort()
	return keys

static func _sorted_cell_values(cells: Dictionary) -> Array[Vector2i]:
	var keys := cells.keys()
	keys.sort()
	var result: Array[Vector2i] = []
	for key in keys:
		result.append(cells[key])
	return result

static func _cell_values(cells: Dictionary) -> Array[Vector2i]:
	var result: Array[Vector2i] = []
	for key in cells.keys():
		result.append(cells[key])
	return result

static func _cell_key(cell: Vector2i) -> String:
	return "%d,%d" % [cell.x, cell.y]
