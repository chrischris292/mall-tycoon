extends SceneTree

const LayoutCoordinates = preload("res://scripts/layout/layout_coordinates.gd")
const LayoutState = preload("res://scripts/layout/layout_state.gd")
const LayoutTestFactory = preload("res://scripts/layout/layout_test_factory.gd")

var _failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	_test_add_query_remove_every_object_type()
	_test_duplicate_ids_fail_across_collections()
	_test_cell_world_round_trips()
	_test_equivalent_states_hash_the_same()

	if _failures.is_empty():
		print("Layout state tests passed.")
		quit(0)
	else:
		for failure in _failures:
			push_error(failure)
		quit(1)

func _test_add_query_remove_every_object_type() -> void:
	var state: RefCounted = LayoutTestFactory.create_minimal_state()
	_expect(state.object_count() == 5, "Factory state should contain every B2 object type.")
	_expect(state.get_object("main").get("id") == "main", "Can query corridor by id.")
	_expect(state.get_object("court").get("id") == "court", "Can query court by id.")
	_expect(state.get_object("lot_food").get("id") == "lot_food", "Can query lot by id.")
	_expect(state.get_object("west_entry").get("id") == "west_entry", "Can query entrance by id.")
	_expect(state.get_object("east_future").get("id") == "east_future", "Can query expansion port by id.")
	_expect(state.remove_object("east_future").ok, "Can remove expansion port.")
	_expect(not state.has_id("east_future"), "Removed id should leave registry.")

func _test_duplicate_ids_fail_across_collections() -> void:
	var state: RefCounted = LayoutState.new()
	state.configure("duplicate_test", "Duplicate Test", 2)
	var first: Dictionary = state.add_object("corridor", {
		"id": "shared",
		"kind": "orthogonal",
		"points": [[0, 0], [4, 0]],
		"width_cells": 3
	})
	var second: Dictionary = state.add_object("lot", {
		"id": "shared",
		"kind": "inline"
	})
	_expect(first.ok, "First object with id should be accepted.")
	_expect(not second.ok and second.code == "DUPLICATE_ID", "Duplicate id should fail across collections.")

func _test_cell_world_round_trips() -> void:
	var coordinates: RefCounted = LayoutCoordinates.new(2)
	var cells: Array[Vector2i] = [Vector2i(0, 0), Vector2i(4, -7), Vector2i(-12, 9)]
	for cell in cells:
		var world: Vector3 = coordinates.cell_to_world(cell)
		var round_trip: Vector2i = coordinates.world_to_cell(world)
		_expect(round_trip == cell, "Cell/world round trip failed for %s." % str(cell))

func _test_equivalent_states_hash_the_same() -> void:
	var left: RefCounted = LayoutState.new()
	var right: RefCounted = LayoutState.new()
	left.configure("hash_test", "Hash Test", 2)
	right.configure("hash_test", "Hash Test", 2)

	left.add_object("corridor", {"id": "a", "kind": "orthogonal", "points": [[0, 0], [2, 0]], "width_cells": 3})
	left.add_object("entrance", {"id": "b", "kind": "street", "interior_cell": [0, 0], "exterior_cell": [-2, 0], "connects_to": "a"})
	right.add_object("entrance", {"connects_to": "a", "exterior_cell": [-2, 0], "interior_cell": [0, 0], "kind": "street", "id": "b"})
	right.add_object("corridor", {"width_cells": 3, "points": [[0, 0], [2, 0]], "kind": "orthogonal", "id": "a"})

	_expect(left.state_hash() == right.state_hash(), "Equivalent states should hash identically regardless of insertion/key order.")

func _expect(condition: bool, message: String) -> void:
	if not condition:
		_failures.append(message)
