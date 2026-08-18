extends Node3D

const LayoutCoordinates = preload("res://scripts/layout/layout_coordinates.gd")
const LayoutRasterizer = preload("res://scripts/layout/layout_rasterizer.gd")

const THEME_FLOOR := Color("#e8edf4")
const THEME_COURT := Color("#f8fafc")
const THEME_TRIM := Color("#caa85e")
const THEME_EDGE := Color("#64748b")
const THEME_PREVIEW := Color(0.34, 0.9, 1.0, 0.42)

var preview_mode := false
var _coordinates: RefCounted = LayoutCoordinates.new(2)

func render_state(state: RefCounted, p_preview_mode: bool = false) -> Dictionary:
	var before_hash: String = state.state_hash()
	preview_mode = p_preview_mode
	_coordinates = LayoutCoordinates.new(state.cell_size_meters)
	_clear()

	var raster: Dictionary = LayoutRasterizer.rasterize_state(state, true)
	for key in raster.cells.keys():
		var cell: Vector2i = raster.cells[key].cell
		var source_type: String = _dominant_source_type(raster.cells[key].get("sources", []))
		_render_floor_cell(cell, source_type)

	for key in raster.cells.keys():
		var cell: Vector2i = raster.cells[key].cell
		_render_exposed_edges(cell, raster.cells)

	_render_junction_caps(raster.cells)
	return {
		"rendered_cells": raster.cell_count,
		"child_count": get_child_count(),
		"state_hash_before": before_hash,
		"state_hash_after": state.state_hash()
	}

func _render_floor_cell(cell: Vector2i, source_type: String) -> void:
	var world: Vector3 = _coordinates.cell_to_world(cell)
	var color: Color = THEME_PREVIEW if preview_mode else THEME_FLOOR
	if source_type == LayoutRasterizer.CELL_SOURCE_COURT:
		color = THEME_PREVIEW if preview_mode else THEME_COURT
	_box("Floor_%s" % LayoutRasterizer.cell_key(cell), world + Vector3(0.0, 0.0, 0.0), Vector3(_coordinates.cell_size_meters, 0.16, _coordinates.cell_size_meters), color, true)
	_box("Inlay_%s" % LayoutRasterizer.cell_key(cell), world + Vector3(0.0, 0.095, 0.0), Vector3(_coordinates.cell_size_meters * 0.72, 0.025, 0.06), THEME_TRIM, false)

func _render_exposed_edges(cell: Vector2i, cells: Dictionary) -> void:
	var world: Vector3 = _coordinates.cell_to_world(cell)
	var half: float = _coordinates.cell_size_meters * 0.5
	var edge_height: float = 0.28
	var edge_thickness: float = 0.08
	var neighbors: Dictionary = {
		"east": Vector2i(cell.x + 1, cell.y),
		"west": Vector2i(cell.x - 1, cell.y),
		"south": Vector2i(cell.x, cell.y + 1),
		"north": Vector2i(cell.x, cell.y - 1)
	}
	if not cells.has(LayoutRasterizer.cell_key(neighbors.east)):
		_box("Edge_E_%s" % LayoutRasterizer.cell_key(cell), world + Vector3(half, 0.22, 0.0), Vector3(edge_thickness, edge_height, _coordinates.cell_size_meters), THEME_EDGE, false)
	if not cells.has(LayoutRasterizer.cell_key(neighbors.west)):
		_box("Edge_W_%s" % LayoutRasterizer.cell_key(cell), world + Vector3(-half, 0.22, 0.0), Vector3(edge_thickness, edge_height, _coordinates.cell_size_meters), THEME_EDGE, false)
	if not cells.has(LayoutRasterizer.cell_key(neighbors.south)):
		_box("Edge_S_%s" % LayoutRasterizer.cell_key(cell), world + Vector3(0.0, 0.22, half), Vector3(_coordinates.cell_size_meters, edge_height, edge_thickness), THEME_EDGE, false)
	if not cells.has(LayoutRasterizer.cell_key(neighbors.north)):
		_box("Edge_N_%s" % LayoutRasterizer.cell_key(cell), world + Vector3(0.0, 0.22, -half), Vector3(_coordinates.cell_size_meters, edge_height, edge_thickness), THEME_EDGE, false)

func _render_junction_caps(cells: Dictionary) -> void:
	for key in cells.keys():
		var cell: Vector2i = cells[key].cell
		var count: int = 0
		for neighbor in [Vector2i(cell.x + 1, cell.y), Vector2i(cell.x - 1, cell.y), Vector2i(cell.x, cell.y + 1), Vector2i(cell.x, cell.y - 1)]:
			if cells.has(LayoutRasterizer.cell_key(neighbor)):
				count += 1
		if count >= 3:
			var world: Vector3 = _coordinates.cell_to_world(cell)
			_box("JunctionCap_%s" % key, world + Vector3(0.0, 0.14, 0.0), Vector3(_coordinates.cell_size_meters * 0.82, 0.035, _coordinates.cell_size_meters * 0.82), THEME_TRIM, false)

func _dominant_source_type(sources: Array) -> String:
	for source in sources:
		if typeof(source) == TYPE_DICTIONARY and str(source.get("type", "")) == LayoutRasterizer.CELL_SOURCE_COURT:
			return LayoutRasterizer.CELL_SOURCE_COURT
	return LayoutRasterizer.CELL_SOURCE_CORRIDOR

func _clear() -> void:
	for child in get_children():
		child.queue_free()

func _box(name_value: String, at: Vector3, size_value: Vector3, color: Color, transparent: bool) -> MeshInstance3D:
	var node: MeshInstance3D = MeshInstance3D.new()
	node.name = name_value
	var mesh: BoxMesh = BoxMesh.new()
	mesh.size = size_value
	node.mesh = mesh
	node.position = at
	node.material_override = _material(color, transparent)
	add_child(node)
	return node

func _material(color: Color, transparent: bool) -> StandardMaterial3D:
	var mat: StandardMaterial3D = StandardMaterial3D.new()
	mat.albedo_color = color
	mat.metallic = 0.12
	mat.roughness = 0.28
	if transparent:
		mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	return mat
