extends RefCounted

const LayoutGraph = preload("res://scripts/layout/layout_graph.gd")
const LayoutRasterizer = preload("res://scripts/layout/layout_rasterizer.gd")

const LEVEL_BLOCKER := "blocker"
const LEVEL_WARNING := "warning"

const OUTSIDE_PARCEL := "OUTSIDE_PARCEL"
const OVERLAPS_LOT := "OVERLAPS_LOT"
const NO_START_CONNECTION := "NO_START_CONNECTION"
const DOOR_NOT_ON_FRONTAGE := "DOOR_NOT_ON_FRONTAGE"
const ORPHANS_STORE := "ORPHANS_STORE"
const DUPLICATE_ID := "DUPLICATE_ID"
const CURVE_TOO_TIGHT := "CURVE_TOO_TIGHT"
const UNKNOWN_COMMAND := "UNKNOWN_COMMAND"
const UNKNOWN_ID := "UNKNOWN_ID"

const DEFAULT_PARCEL := Rect2i(-128, -128, 256, 256)

static func validate_state(state: RefCounted, parcel: Rect2i = DEFAULT_PARCEL) -> Dictionary:
	var issues: Array[Dictionary] = []
	_check_objects_inside_parcel(state, parcel, issues)
	_check_lot_overlaps(state, issues)
	_check_lot_frontage_and_doors(state, issues)
	_check_entrance_connections(state, issues)
	return _validation_result(issues)

static func preflight_command(state: RefCounted, command: Dictionary, parcel: Rect2i = DEFAULT_PARCEL) -> Dictionary:
	var before_hash: String = state.state_hash()
	var issues: Array[Dictionary] = []
	var affected: Array[String] = []
	var command_type := str(command.get("type", ""))

	match command_type:
		"add_corridor":
			_preflight_add_corridor(state, command, parcel, issues, affected)
		"demolish":
			_preflight_demolish(state, command, issues, affected)
		_:
			issues.append(_issue(UNKNOWN_COMMAND, "Unsupported layout command '%s'." % command_type, "type"))

	var cost := 0
	if issues.is_empty() and command_type == "add_corridor":
		cost = _estimate_corridor_cost(command.get("corridor", {}))

	return {
		"ok": _blockers(issues).is_empty(),
		"issues": issues,
		"affected_ids": affected,
		"summary": {
			"type": command_type,
			"cost": cost,
			"area_cells": _estimate_corridor_area(command.get("corridor", {})) if command_type == "add_corridor" else 0
		},
		"state_hash_before": before_hash,
		"state_hash_after": state.state_hash()
	}

static func _preflight_add_corridor(state: RefCounted, command: Dictionary, parcel: Rect2i, issues: Array[Dictionary], affected: Array[String]) -> void:
	var corridor: Dictionary = command.get("corridor", {})
	var id := str(corridor.get("id", ""))
	if id.is_empty():
		issues.append(_issue(DUPLICATE_ID, "New corridor needs a stable id.", "corridor.id"))
	elif state.has_id(id):
		issues.append(_issue(DUPLICATE_ID, "Layout id '%s' already exists." % id, "corridor.id", [id]))

	if str(corridor.get("kind", "orthogonal")) == "curve" and int(corridor.get("radius_cells", 0)) < 3:
		issues.append(_issue(CURVE_TOO_TIGHT, "Curves need at least a 3-cell radius for mobile pathing.", "corridor.radius_cells", [id]))

	var corridor_cells: Array[Vector2i] = LayoutRasterizer.rasterize_corridor(corridor)
	for cell in corridor_cells:
		if not parcel.has_point(cell):
			issues.append(_issue(OUTSIDE_PARCEL, "Corridor leaves the owned parcel.", "corridor.points", [id]))
			break

	for lot_id in state.lots.keys():
		var lot: Dictionary = state.lots[lot_id]
		if _cells_touch_polygon(corridor_cells, lot.get("footprint", [])):
			issues.append(_issue(OVERLAPS_LOT, "Corridor overlaps lot '%s'." % lot_id, "corridor.points", [id, lot_id]))
			affected.append(lot_id)

	if state.corridors.size() > 0 or state.courts.size() > 0:
		var existing_raster: Dictionary = LayoutRasterizer.rasterize_state(state, false)
		var connects := false
		for cell in corridor_cells:
			if existing_raster.cells.has(LayoutRasterizer.cell_key(cell)):
				connects = true
				break
		if not connects:
			issues.append(_issue(NO_START_CONNECTION, "New hallway must start from existing public mall space.", "corridor.points", [id]))

	affected.append(id)

static func _preflight_demolish(state: RefCounted, command: Dictionary, issues: Array[Dictionary], affected: Array[String]) -> void:
	var remove_ids: Array = command.get("ids", [])
	for id in remove_ids:
		if not state.has_id(str(id)):
			issues.append(_issue(UNKNOWN_ID, "Cannot demolish unknown layout id '%s'." % str(id), "ids", [str(id)]))
		else:
			affected.append(str(id))

	var next: RefCounted = state.duplicate_state()
	for id in remove_ids:
		next.remove_object(str(id))

	var graph: Dictionary = LayoutGraph.build_from_state(next)
	for lot_id in next.lots.keys():
		var lot: Dictionary = next.lots[lot_id]
		var door_cell := _array_to_cell(lot.get("door", {}).get("cell", [999999, 999999]))
		if not _cell_touches_public(graph, door_cell):
			issues.append(_issue(ORPHANS_STORE, "Demolition would orphan store lot '%s'." % lot_id, "ids", [lot_id]))
			affected.append(lot_id)

	for entrance_id in next.entrances.keys():
		var entrance: Dictionary = next.entrances[entrance_id]
		var interior_cell := _array_to_cell(entrance.get("interior_cell", [999999, 999999]))
		if not graph.nodes.has(LayoutRasterizer.cell_key(interior_cell)):
			issues.append(_issue(ORPHANS_STORE, "Demolition would disconnect entrance '%s'." % entrance_id, "ids", [entrance_id]))
			affected.append(entrance_id)

static func _check_objects_inside_parcel(state: RefCounted, parcel: Rect2i, issues: Array[Dictionary]) -> void:
	var raster: Dictionary = LayoutRasterizer.rasterize_state(state, false)
	for key in raster.cells.keys():
		var cell: Vector2i = raster.cells[key].cell
		if not parcel.has_point(cell):
			issues.append(_issue(OUTSIDE_PARCEL, "Public mall space leaves the owned parcel.", "public_cells"))
			break

	for lot_id in state.lots.keys():
		for point in state.lots[lot_id].get("footprint", []):
			var cell: Vector2i = _array_to_cell(point)
			if not parcel.has_point(cell):
				issues.append(_issue(OUTSIDE_PARCEL, "Lot '%s' leaves the owned parcel." % lot_id, "lots.%s.footprint" % lot_id, [lot_id]))
				break

static func _check_lot_overlaps(state: RefCounted, issues: Array[Dictionary]) -> void:
	var lot_ids: Array = state.lots.keys()
	for a in range(lot_ids.size()):
		var a_id := str(lot_ids[a])
		var a_bounds: Rect2i = _polygon_bounds(state.lots[a_id].get("footprint", []))
		for b in range(a + 1, lot_ids.size()):
			var b_id := str(lot_ids[b])
			var b_bounds: Rect2i = _polygon_bounds(state.lots[b_id].get("footprint", []))
			if a_bounds.intersects(b_bounds):
				issues.append(_issue(OVERLAPS_LOT, "Lots '%s' and '%s' overlap." % [a_id, b_id], "lots", [a_id, b_id]))

static func _check_lot_frontage_and_doors(state: RefCounted, issues: Array[Dictionary]) -> void:
	var graph: Dictionary = LayoutGraph.build_from_state(state)
	for lot_id in state.lots.keys():
		var lot: Dictionary = state.lots[lot_id]
		var frontage: Dictionary = lot.get("frontage", {})
		var door: Dictionary = lot.get("door", {})
		var from_cell: Vector2i = _array_to_cell(frontage.get("from", [0, 0]))
		var to_cell: Vector2i = _array_to_cell(frontage.get("to", [0, 0]))
		var door_cell: Vector2i = _array_to_cell(door.get("cell", [999999, 999999]))
		if not _cell_on_axis_segment(door_cell, from_cell, to_cell):
			issues.append(_issue(DOOR_NOT_ON_FRONTAGE, "Door for lot '%s' is not on its frontage." % lot_id, "lots.%s.door.cell" % lot_id, [lot_id]))
		if not _cell_touches_public(graph, door_cell):
			issues.append(_issue(NO_START_CONNECTION, "Door for lot '%s' does not touch public mall space." % lot_id, "lots.%s.door.cell" % lot_id, [lot_id]))

static func _check_entrance_connections(state: RefCounted, issues: Array[Dictionary]) -> void:
	var graph: Dictionary = LayoutGraph.build_from_state(state)
	for entrance_id in state.entrances.keys():
		var entrance: Dictionary = state.entrances[entrance_id]
		var interior_cell: Vector2i = _array_to_cell(entrance.get("interior_cell", [999999, 999999]))
		if not graph.nodes.has(LayoutRasterizer.cell_key(interior_cell)):
			issues.append(_issue(NO_START_CONNECTION, "Entrance '%s' does not connect to public mall space." % entrance_id, "entrances.%s.interior_cell" % entrance_id, [entrance_id]))

static func _cells_touch_polygon(cells: Array[Vector2i], polygon: Array) -> bool:
	if polygon.is_empty():
		return false
	var bounds: Rect2i = _polygon_bounds(polygon)
	for cell in cells:
		if bounds.has_point(cell):
			return true
	return false

static func _estimate_corridor_area(corridor: Dictionary) -> int:
	return LayoutRasterizer.rasterize_corridor(corridor).size()

static func _estimate_corridor_cost(corridor: Dictionary) -> int:
	return _estimate_corridor_area(corridor) * 125

static func _cell_on_axis_segment(cell: Vector2i, from_cell: Vector2i, to_cell: Vector2i) -> bool:
	if from_cell.x == to_cell.x:
		return cell.x == from_cell.x and cell.y >= mini(from_cell.y, to_cell.y) and cell.y <= maxi(from_cell.y, to_cell.y)
	if from_cell.y == to_cell.y:
		return cell.y == from_cell.y and cell.x >= mini(from_cell.x, to_cell.x) and cell.x <= maxi(from_cell.x, to_cell.x)
	return false

static func _cell_touches_public(graph: Dictionary, cell: Vector2i) -> bool:
	var candidates: Array[Vector2i] = [
		cell,
		Vector2i(cell.x + 1, cell.y),
		Vector2i(cell.x - 1, cell.y),
		Vector2i(cell.x, cell.y + 1),
		Vector2i(cell.x, cell.y - 1)
	]
	for candidate in candidates:
		if graph.nodes.has(LayoutRasterizer.cell_key(candidate)):
			return true
	return false

static func _polygon_bounds(points: Array) -> Rect2i:
	if points.is_empty():
		return Rect2i()
	var first: Vector2i = _array_to_cell(points[0])
	var min_x := first.x
	var min_y := first.y
	var max_x := first.x
	var max_y := first.y
	for point in points:
		var cell: Vector2i = _array_to_cell(point)
		min_x = mini(min_x, cell.x)
		min_y = mini(min_y, cell.y)
		max_x = maxi(max_x, cell.x)
		max_y = maxi(max_y, cell.y)
	return Rect2i(min_x, min_y, max_x - min_x, max_y - min_y)

static func _array_to_cell(value: Variant) -> Vector2i:
	if typeof(value) == TYPE_VECTOR2I:
		return value
	if typeof(value) != TYPE_ARRAY or value.size() != 2:
		return Vector2i(999999, 999999)
	return Vector2i(int(value[0]), int(value[1]))

static func _validation_result(issues: Array[Dictionary]) -> Dictionary:
	return {
		"ok": _blockers(issues).is_empty(),
		"issues": issues,
		"blockers": _blockers(issues),
		"warnings": _warnings(issues)
	}

static func _blockers(issues: Array[Dictionary]) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for issue in issues:
		if issue.level == LEVEL_BLOCKER:
			result.append(issue)
	return result

static func _warnings(issues: Array[Dictionary]) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for issue in issues:
		if issue.level == LEVEL_WARNING:
			result.append(issue)
	return result

static func _issue(code: String, message: String, path: String, affected_ids: Array = []) -> Dictionary:
	return {
		"code": code,
		"level": LEVEL_BLOCKER,
		"message": message,
		"path": path,
		"affected_ids": affected_ids.duplicate()
	}
