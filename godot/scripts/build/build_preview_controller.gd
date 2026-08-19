extends RefCounted

const LayoutValidator = preload("res://scripts/layout/layout_validator.gd")
const LayoutCoordinates = preload("res://scripts/layout/layout_coordinates.gd")

enum RouteStyle {
	AUTO = 0,
	STRAIGHT = 1,
	CORNER_HV = 2,
	CORNER_VH = 3
}

var start_cell := Vector2i.ZERO
var end_cell := Vector2i.ZERO
var selected_width_cells := 3
var route_style: RouteStyle = RouteStyle.AUTO
var is_active := false
var corridor_id_prefix := "corridor_user_"
var corridor_counter := 1

signal preview_updated(preview_data: Dictionary)

func start_preview(p_start_cell: Vector2i, p_width_cells: int = 3) -> void:
	start_cell = p_start_cell
	end_cell = p_start_cell
	selected_width_cells = p_width_cells
	is_active = true

func update_preview(p_end_cell: Vector2i) -> void:
	end_cell = p_end_cell

func set_width_cells(width: int) -> void:
	selected_width_cells = clampi(width, 2, 4)

func cycle_route_style() -> RouteStyle:
	match route_style:
		RouteStyle.AUTO:
			route_style = RouteStyle.CORNER_HV
		RouteStyle.CORNER_HV:
			route_style = RouteStyle.CORNER_VH
		RouteStyle.CORNER_VH:
			route_style = RouteStyle.STRAIGHT
		RouteStyle.STRAIGHT:
			route_style = RouteStyle.AUTO
	return route_style

func generate_points() -> Array:
	if start_cell == end_cell:
		return [[start_cell.x, start_cell.y], [end_cell.x, end_cell.y]]

	var is_straight := start_cell.x == end_cell.x or start_cell.y == end_cell.y
	if is_straight:
		return [[start_cell.x, start_cell.y], [end_cell.x, end_cell.y]]

	match route_style:
		RouteStyle.STRAIGHT:
			# Project to dominant axis
			if absi(end_cell.x - start_cell.x) >= absi(end_cell.y - start_cell.y):
				return [[start_cell.x, start_cell.y], [end_cell.x, start_cell.y]]
			else:
				return [[start_cell.x, start_cell.y], [start_cell.x, end_cell.y]]
		RouteStyle.CORNER_VH:
			return [[start_cell.x, start_cell.y], [start_cell.x, end_cell.y], [end_cell.x, end_cell.y]]
		RouteStyle.CORNER_HV, RouteStyle.AUTO, _:
			return [[start_cell.x, start_cell.y], [end_cell.x, start_cell.y], [end_cell.x, end_cell.y]]

func get_corridor_candidate(custom_id: String = "") -> Dictionary:
	var id := custom_id
	if id.is_empty():
		id = "%s%03d" % [corridor_id_prefix, corridor_counter]
	return {
		"id": id,
		"kind": "orthogonal",
		"points": generate_points(),
		"width_cells": selected_width_cells
	}

func evaluate_preview(state: RefCounted) -> Dictionary:
	if not is_active:
		return {
			"is_active": false,
			"valid": false,
			"cost": 0,
			"length_cells": 0,
			"area_cells": 0,
			"issues": [],
			"points": [],
			"corridor": {}
		}

	var corridor: Dictionary = get_corridor_candidate()
	var preflight: Dictionary = LayoutValidator.preflight_command(state, {
		"type": "add_corridor",
		"corridor": corridor
	})

	var points: Array = corridor.points
	var length_cells := 0
	for i in range(points.size() - 1):
		var p0: Array = points[i]
		var p1: Array = points[i + 1]
		length_cells += absi(int(p1[0]) - int(p0[0])) + absi(int(p1[1]) - int(p0[1]))

	var area_cells: int = length_cells * selected_width_cells
	var cost: int = area_cells * 140

	var result := {
		"is_active": true,
		"valid": preflight.ok,
		"issues": preflight.issues,
		"corridor": corridor,
		"points": points,
		"length_cells": length_cells,
		"area_cells": area_cells,
		"width_cells": selected_width_cells,
		"cost": cost,
		"route_style": route_style,
		"handles": [start_cell, end_cell]
	}
	preview_updated.emit(result)
	return result

func next_corridor_id() -> void:
	corridor_counter += 1

func clear() -> void:
	is_active = false
