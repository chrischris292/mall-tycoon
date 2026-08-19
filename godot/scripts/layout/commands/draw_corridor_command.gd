extends "res://scripts/layout/layout_command.gd"

var corridor_data: Dictionary = {}
var executed := false

func _init(p_corridor_data: Dictionary = {}) -> void:
	corridor_data = p_corridor_data.duplicate(true)

func get_command_type() -> String:
	return "add_corridor"

func get_summary() -> Dictionary:
	var id := str(corridor_data.get("id", ""))
	var points: Array = corridor_data.get("points", [])
	var width: int = int(corridor_data.get("width_cells", 3))
	var length_cells := 0
	for i in range(points.size() - 1):
		var p0: Array = points[i]
		var p1: Array = points[i + 1]
		length_cells += absi(int(p1[0]) - int(p0[0])) + absi(int(p1[1]) - int(p0[1]))
	var area_cells := length_cells * width
	var cost := area_cells * 140
	return {
		"type": "add_corridor",
		"id": id,
		"points": points,
		"width_cells": width,
		"cost": cost,
		"area_cells": area_cells,
		"affected_ids": [id] if not id.is_empty() else []
	}

func execute(state: RefCounted) -> Dictionary:
	var preflight: Dictionary = LayoutValidator.preflight_command(state, {
		"type": "add_corridor",
		"corridor": corridor_data
	})
	if not preflight.ok:
		var first_issue: Dictionary = preflight.issues[0] if preflight.issues.size() > 0 else {}
		return _error_result(
			str(first_issue.get("code", "VALIDATION_FAILED")),
			str(first_issue.get("message", "Command failed validation.")),
			preflight.affected_ids
		)

	var add_res: Dictionary = state.add_object("corridor", corridor_data)
	if not add_res.ok:
		return _error_result(add_res.error_code, add_res.message, [str(corridor_data.get("id", ""))])

	executed = true
	var summary := get_summary()
	return _ok_result("add_corridor", [str(corridor_data.get("id", ""))], int(summary.cost), {
		"corridor": corridor_data,
		"summary": summary
	})

func undo(state: RefCounted) -> Dictionary:
	var id := str(corridor_data.get("id", ""))
	if id.is_empty():
		return _error_result("EMPTY_ID", "Cannot undo corridor with empty id.")

	var rem_res: Dictionary = state.remove_object(id)
	if not rem_res.ok:
		return _error_result(rem_res.error_code, rem_res.message, [id])

	executed = false
	return _ok_result("undo_add_corridor", [id], 0, {"id": id})
