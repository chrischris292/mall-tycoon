extends SceneTree

const LayoutSaveCodec = preload("res://scripts/layout/layout_save_codec.gd")
const LayoutState = preload("res://scripts/layout/layout_state.gd")
const LayoutValidator = preload("res://scripts/layout/layout_validator.gd")

var _failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	_test_valid_fixture_has_no_blockers()
	_test_command_preflight_returns_cost_without_mutation()
	_test_failed_command_does_not_mutate_state()
	_test_invalid_command_errors()
	_test_demolition_detects_orphaned_store()
	_test_whole_layout_invariant_errors()

	if _failures.is_empty():
		print("Layout validator tests passed.")
		quit(0)
	else:
		for failure in _failures:
			push_error(failure)
		quit(1)

func _test_valid_fixture_has_no_blockers() -> void:
	var loaded: Dictionary = LayoutSaveCodec.load_json_file("res://data/layout_fixtures/valid_cedar_grove_minimal.json")
	var result: Dictionary = LayoutValidator.validate_state(loaded.state)
	_expect(result.ok, "Valid Cedar Grove minimal fixture should have no blockers: %s" % str(result.issues))

func _test_command_preflight_returns_cost_without_mutation() -> void:
	var state: RefCounted = _single_corridor_state()
	var before: String = state.state_hash()
	var result: Dictionary = LayoutValidator.preflight_command(state, {
		"type": "add_corridor",
		"corridor": {
			"id": "north_branch",
			"kind": "orthogonal",
			"points": [[4, 0], [4, -6]],
			"width_cells": 3
		}
	})
	_expect(result.ok, "Connected add corridor command should preflight.")
	_expect(result.summary.cost > 0 and result.summary.area_cells > 0, "Preflight should return cost and area summaries.")
	_expect(before == state.state_hash() and result.state_hash_before == result.state_hash_after, "Preflight must not mutate state.")

func _test_failed_command_does_not_mutate_state() -> void:
	var state: RefCounted = _single_corridor_state()
	var before: String = state.state_hash()
	var result: Dictionary = LayoutValidator.preflight_command(state, {
		"type": "add_corridor",
		"corridor": {
			"id": "floating",
			"kind": "orthogonal",
			"points": [[50, 50], [56, 50]],
			"width_cells": 3
		}
	})
	_expect(not result.ok, "Disconnected add corridor command should fail.")
	_expect(_has_issue(result.issues, LayoutValidator.NO_START_CONNECTION), "Disconnected command should explain NO_START_CONNECTION.")
	_expect(before == state.state_hash(), "Failed preflight must not mutate state.")

func _test_invalid_command_errors() -> void:
	var state: RefCounted = _single_corridor_state()
	var duplicate: Dictionary = LayoutValidator.preflight_command(state, {
		"type": "add_corridor",
		"corridor": {
			"id": "main",
			"kind": "orthogonal",
			"points": [[4, 0], [8, 0]],
			"width_cells": 3
		}
	})
	var outside: Dictionary = LayoutValidator.preflight_command(state, {
		"type": "add_corridor",
		"corridor": {
			"id": "outside",
			"kind": "orthogonal",
			"points": [[126, 0], [140, 0]],
			"width_cells": 3
		}
	})
	var curve: Dictionary = LayoutValidator.preflight_command(state, {
		"type": "add_corridor",
		"corridor": {
			"id": "tight_curve",
			"kind": "curve",
			"points": [[4, 0], [8, 4]],
			"width_cells": 3,
			"radius_cells": 1
		}
	})
	_expect(_has_issue(duplicate.issues, LayoutValidator.DUPLICATE_ID), "Duplicate command id should fail with DUPLICATE_ID.")
	_expect(_has_issue(outside.issues, LayoutValidator.OUTSIDE_PARCEL), "Outside command should fail with OUTSIDE_PARCEL.")
	_expect(_has_issue(curve.issues, LayoutValidator.CURVE_TOO_TIGHT), "Tight curve command should fail with CURVE_TOO_TIGHT.")

func _test_demolition_detects_orphaned_store() -> void:
	var loaded: Dictionary = LayoutSaveCodec.load_json_file("res://data/layout_fixtures/valid_cedar_grove_minimal.json")
	var result: Dictionary = LayoutValidator.preflight_command(loaded.state, {
		"type": "demolish",
		"ids": ["west_prom"]
	})
	_expect(not result.ok, "Demolishing public access should fail.")
	_expect(_has_issue(result.issues, LayoutValidator.ORPHANS_STORE), "Demolition should detect orphaned stores or entrances.")
	_expect(result.state_hash_before == result.state_hash_after, "Demolition preflight must not mutate state.")

func _test_whole_layout_invariant_errors() -> void:
	var overlap_loaded: Dictionary = LayoutSaveCodec.load_json_file("res://data/layout_fixtures/invalid_overlapping_lots.json")
	var overlap_state: RefCounted = LayoutState.new()
	overlap_state.configure("overlap", "Overlap", 2)
	overlap_state.add_object("corridor", {"id": "main", "kind": "orthogonal", "points": [[0, 0], [10, 0]], "width_cells": 3})
	overlap_state.add_object("lot", overlap_loaded.state.get_object("lot_a") if overlap_loaded.ok else _lot("lot_a", [0, 2], [6, 7], [3, 2]))
	overlap_state.add_object("lot", _lot("lot_b", [4, 3], [9, 8], [6, 3]))
	var overlap_result: Dictionary = LayoutValidator.validate_state(overlap_state)
	_expect(_has_issue(overlap_result.issues, LayoutValidator.OVERLAPS_LOT), "Overlapping lots should fail whole-layout validation.")

	var bad_door: RefCounted = _single_corridor_state()
	bad_door.add_object("lot", _lot("bad_door", [0, 2], [6, 7], [9, 9]))
	var bad_door_result: Dictionary = LayoutValidator.validate_state(bad_door)
	_expect(_has_issue(bad_door_result.issues, LayoutValidator.DOOR_NOT_ON_FRONTAGE), "Door outside frontage should fail validation.")

func _single_corridor_state() -> RefCounted:
	var state: RefCounted = LayoutState.new()
	state.configure("validator", "Validator", 2)
	state.add_object("corridor", {"id": "main", "kind": "orthogonal", "points": [[0, 0], [8, 0]], "width_cells": 3})
	return state

func _lot(id: String, top_left: Array, bottom_right: Array, door: Array) -> Dictionary:
	return {
		"id": id,
		"kind": "inline",
		"tenant_id": "",
		"footprint": [[top_left[0], top_left[1]], [bottom_right[0], top_left[1]], [bottom_right[0], bottom_right[1]], [top_left[0], bottom_right[1]]],
		"frontage": {
			"side": "north",
			"from": [top_left[0], top_left[1]],
			"to": [bottom_right[0], top_left[1]]
		},
		"door": {
			"cell": door,
			"connects_to": "main"
		}
	}

func _has_issue(issues: Array, code: String) -> bool:
	for issue in issues:
		if typeof(issue) == TYPE_DICTIONARY and str(issue.get("code", "")) == code:
			return true
	return false

func _expect(condition: bool, message: String) -> void:
	if not condition:
		_failures.append(message)
