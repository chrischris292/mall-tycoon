extends RefCounted

const LayoutState = preload("res://scripts/layout/layout_state.gd")

static func create_minimal_state() -> RefCounted:
	var state: RefCounted = LayoutState.new()
	state.configure("test_minimal", "Test Minimal Mall", 2)
	state.add_object("corridor", {
		"id": "main",
		"kind": "orthogonal",
		"points": [[0, 0], [8, 0]],
		"width_cells": 3
	})
	state.add_object("court", {
		"id": "court",
		"polygon": [[8, -3], [14, -3], [14, 3], [8, 3]]
	})
	state.add_object("lot", {
		"id": "lot_food",
		"kind": "inline",
		"tenant_id": "ramen",
		"footprint": [[0, 2], [6, 2], [6, 7], [0, 7]],
		"frontage": {
			"side": "north",
			"from": [0, 2],
			"to": [6, 2]
		},
		"door": {
			"cell": [3, 2],
			"connects_to": "main"
		}
	})
	state.add_object("entrance", {
		"id": "west_entry",
		"kind": "street",
		"exterior_cell": [-4, 0],
		"interior_cell": [0, 0],
		"connects_to": "main"
	})
	state.add_object("expansion_port", {
		"id": "east_future",
		"cell": [14, 0],
		"connects_to": "court"
	})
	return state
