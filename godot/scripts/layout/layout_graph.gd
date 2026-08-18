extends RefCounted

const LayoutRasterizer = preload("res://scripts/layout/layout_rasterizer.gd")

static func build_from_raster(raster: Dictionary) -> Dictionary:
	var nodes: Dictionary = {}
	var adjacency: Dictionary = {}
	var cells: Dictionary = raster.get("cells", {})
	for key in cells.keys():
		var cell: Vector2i = cells[key].cell
		nodes[key] = cell
		adjacency[key] = []

	for key in nodes.keys():
		var cell: Vector2i = nodes[key]
		var neighbor_keys := [
			"%d,%d" % [cell.x + 1, cell.y],
			"%d,%d" % [cell.x - 1, cell.y],
			"%d,%d" % [cell.x, cell.y + 1],
			"%d,%d" % [cell.x, cell.y - 1]
		]
		for neighbor_key in neighbor_keys:
			if nodes.has(neighbor_key):
				adjacency[key].append(neighbor_key)
		adjacency[key].sort()

	var components := _components(adjacency)
	return {
		"nodes": nodes,
		"adjacency": adjacency,
		"components": components,
		"component_count": components.size()
	}

static func build_from_state(state: RefCounted) -> Dictionary:
	return build_from_raster(LayoutRasterizer.rasterize_state(state, false))

static func are_cells_connected(graph: Dictionary, start: Vector2i, end: Vector2i) -> bool:
	var start_key := LayoutRasterizer.cell_key(start)
	var end_key := LayoutRasterizer.cell_key(end)
	if not graph.nodes.has(start_key) or not graph.nodes.has(end_key):
		return false
	for component in graph.components:
		if component.has(start_key) and component.has(end_key):
			return true
	return false

static func component_for_cell(graph: Dictionary, cell: Vector2i) -> Array:
	var key := LayoutRasterizer.cell_key(cell)
	for component in graph.components:
		if component.has(key):
			return component
	return []

static func graph_hash(graph: Dictionary) -> String:
	return JSON.stringify({
		"nodes": _canonical_nodes(graph.nodes),
		"adjacency": _canonical_adjacency(graph.adjacency)
	}).sha256_text()

static func _components(adjacency: Dictionary) -> Array:
	var visited: Dictionary = {}
	var result: Array = []
	for start_key in _sorted_keys(adjacency):
		if visited.has(start_key):
			continue
		var component: Array = []
		var stack: Array = [start_key]
		visited[start_key] = true
		while not stack.is_empty():
			var current: String = stack.pop_back()
			component.append(current)
			for neighbor in adjacency[current]:
				if not visited.has(neighbor):
					visited[neighbor] = true
					stack.append(neighbor)
		component.sort()
		result.append(component)
	return result

static func _canonical_nodes(nodes: Dictionary) -> Array:
	var result: Array = []
	for key in _sorted_keys(nodes):
		var cell: Vector2i = nodes[key]
		result.append([cell.x, cell.y])
	return result

static func _canonical_adjacency(adjacency: Dictionary) -> Dictionary:
	var result: Dictionary = {}
	for key in _sorted_keys(adjacency):
		result[key] = adjacency[key].duplicate()
	return result

static func _sorted_keys(collection: Dictionary) -> Array:
	var keys := collection.keys()
	keys.sort()
	return keys
