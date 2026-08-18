extends SceneTree

const LayoutGraph = preload("res://scripts/layout/layout_graph.gd")
const LayoutRasterizer = preload("res://scripts/layout/layout_rasterizer.gd")
const LayoutSaveCodec = preload("res://scripts/layout/layout_save_codec.gd")
const LayoutState = preload("res://scripts/layout/layout_state.gd")

var _failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	_test_straight_and_l_corridors_rasterize_with_width()
	_test_t_junction_connects_exactly()
	_test_disconnected_runs_stay_separate()
	_test_overlapping_runs_merge_deterministically()
	_test_court_cells_connect_to_corridor()
	_test_large_graph_performance_smoke()

	if _failures.is_empty():
		print("Layout rasterizer/graph tests passed.")
		quit(0)
	else:
		for failure in _failures:
			push_error(failure)
		quit(1)

func _test_straight_and_l_corridors_rasterize_with_width() -> void:
	var state: RefCounted = LayoutState.new()
	state.configure("l_test", "L Test", 2)
	state.add_object("corridor", {"id": "l", "kind": "orthogonal", "points": [[0, 0], [4, 0], [4, 4]], "width_cells": 3})
	var raster: Dictionary = LayoutRasterizer.rasterize_state(state)
	var graph: Dictionary = LayoutGraph.build_from_raster(raster)
	_expect(raster.cells.has("0,-1"), "Width should occupy cells perpendicular to a horizontal run.")
	_expect(raster.cells.has("3,4"), "Width should occupy cells perpendicular to a vertical run.")
	_expect(LayoutGraph.are_cells_connected(graph, Vector2i(0, 0), Vector2i(4, 4)), "L corridor endpoints should connect.")

func _test_t_junction_connects_exactly() -> void:
	var loaded: Dictionary = LayoutSaveCodec.load_json_file("res://data/layout_fixtures/valid_t_junction.json")
	var graph: Dictionary = LayoutGraph.build_from_state(loaded.state)
	_expect(LayoutGraph.are_cells_connected(graph, Vector2i(-8, 0), Vector2i(0, -8)), "T junction branches should connect through shared endpoint.")
	_expect(graph.component_count == 1, "T junction fixture should be one connected component.")

func _test_disconnected_runs_stay_separate() -> void:
	var loaded: Dictionary = LayoutSaveCodec.load_json_file("res://data/layout_fixtures/valid_disconnected_run.json")
	var graph: Dictionary = LayoutGraph.build_from_state(loaded.state)
	_expect(not LayoutGraph.are_cells_connected(graph, Vector2i(-8, 0), Vector2i(10, 0)), "Disconnected runs should not connect through visual nearness.")
	_expect(graph.component_count == 2, "Disconnected fixture should have two graph components.")

func _test_overlapping_runs_merge_deterministically() -> void:
	var left: RefCounted = LayoutState.new()
	var right: RefCounted = LayoutState.new()
	left.configure("overlap", "Overlap", 2)
	right.configure("overlap", "Overlap", 2)
	left.add_object("corridor", {"id": "a", "kind": "orthogonal", "points": [[0, 0], [8, 0]], "width_cells": 3})
	left.add_object("corridor", {"id": "b", "kind": "orthogonal", "points": [[4, 0], [12, 0]], "width_cells": 3})
	right.add_object("corridor", {"id": "b", "kind": "orthogonal", "points": [[4, 0], [12, 0]], "width_cells": 3})
	right.add_object("corridor", {"id": "a", "kind": "orthogonal", "points": [[0, 0], [8, 0]], "width_cells": 3})
	var left_graph: Dictionary = LayoutGraph.build_from_state(left)
	var right_graph: Dictionary = LayoutGraph.build_from_state(right)
	_expect(left_graph.component_count == 1, "Overlapping corridor runs should merge into one component.")
	_expect(LayoutGraph.graph_hash(left_graph) == LayoutGraph.graph_hash(right_graph), "Overlapping runs should graph deterministically regardless of insertion order.")

func _test_court_cells_connect_to_corridor() -> void:
	var loaded: Dictionary = LayoutSaveCodec.load_json_file("res://data/layout_fixtures/valid_cedar_grove_minimal.json")
	var graph: Dictionary = LayoutGraph.build_from_state(loaded.state)
	_expect(LayoutGraph.are_cells_connected(graph, Vector2i(-16, 0), Vector2i(10, 6)), "Cedar Grove minimal public areas should connect.")

func _test_large_graph_performance_smoke() -> void:
	var state: RefCounted = LayoutState.new()
	state.configure("perf", "Performance Smoke", 2)
	for index in range(250):
		state.add_object("corridor", {"id": "seg_%03d" % index, "kind": "orthogonal", "points": [[index * 4, 0], [index * 4 + 4, 0]], "width_cells": 3})
	var graph: Dictionary = LayoutGraph.build_from_state(state)
	var best_ms := 999999.0
	for run in range(5):
		var started := Time.get_ticks_usec()
		graph = LayoutGraph.build_from_state(state)
		var elapsed_ms := (Time.get_ticks_usec() - started) / 1000.0
		best_ms = minf(best_ms, elapsed_ms)
	_expect(graph.component_count == 1, "Performance smoke graph should remain connected.")
	_expect(best_ms < 20.0, "250-segment raster/graph best warm rebuild should be under 20 ms, got %.3f ms." % best_ms)

func _expect(condition: bool, message: String) -> void:
	if not condition:
		_failures.append(message)
