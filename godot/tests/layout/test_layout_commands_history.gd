extends SceneTree

const LayoutState = preload("res://scripts/layout/layout_state.gd")
const LayoutCoordinates = preload("res://scripts/layout/layout_coordinates.gd")
const LayoutValidator = preload("res://scripts/layout/layout_validator.gd")
const LayoutHistory = preload("res://scripts/layout/layout_history.gd")
const DrawCorridorCommand = preload("res://scripts/layout/commands/draw_corridor_command.gd")

func _init() -> void:
	test_draw_corridor_success_and_undo_redo()
	test_draw_corridor_validation_failure()
	print("Layout commands and history tests passed.")
	quit(0)

func test_draw_corridor_success_and_undo_redo() -> void:
	var state: RefCounted = LayoutState.new()
	state.configure("test_mall", "Test Mall", 2)

	# Add starter corridor so new corridor has a valid start connection
	state.add_object("corridor", {
		"id": "starter_hall",
		"kind": "orthogonal",
		"points": [[0, 0], [10, 0]],
		"width_cells": 3
	})
	var initial_hash: String = state.state_hash()

	var history: RefCounted = LayoutHistory.new()
	assert(not history.can_undo(), "Initial history should not undo")
	assert(not history.can_redo(), "Initial history should not redo")

	# Draw new corridor connected at [10, 0] -> [10, 8]
	var cmd: RefCounted = DrawCorridorCommand.new({
		"id": "new_wing",
		"kind": "orthogonal",
		"points": [[10, 0], [10, 8]],
		"width_cells": 3
	})

	var exec_res: Dictionary = history.execute_command(cmd, state)
	assert(exec_res.ok, "Execute command should succeed")
	assert(state.has_id("new_wing"), "State should have new corridor id")
	assert(history.can_undo(), "Should be able to undo after execute")
	assert(not history.can_redo(), "Redo should be empty after new execute")

	var modified_hash: String = state.state_hash()
	assert(initial_hash != modified_hash, "State hash should change after adding corridor")

	# Test Undo
	var undo_res: Dictionary = history.undo(state)
	assert(undo_res.ok, "Undo should succeed")
	assert(not state.has_id("new_wing"), "Corridor should be removed after undo")
	assert(state.state_hash() == initial_hash, "State hash should match initial after undo")
	assert(not history.can_undo(), "Undo stack should be empty")
	assert(history.can_redo(), "Redo should be available after undo")

	# Test Redo
	var redo_res: Dictionary = history.redo(state)
	assert(redo_res.ok, "Redo should succeed")
	assert(state.has_id("new_wing"), "Corridor should be restored after redo")
	assert(state.state_hash() == modified_hash, "State hash should match modified after redo")
	assert(history.can_undo(), "Undo should be available after redo")
	assert(not history.can_redo(), "Redo should be empty after redo")

func test_draw_corridor_validation_failure() -> void:
	var state: RefCounted = LayoutState.new()
	state.configure("test_mall", "Test Mall", 2)
	state.add_object("corridor", {
		"id": "starter_hall",
		"kind": "orthogonal",
		"points": [[0, 0], [10, 0]],
		"width_cells": 3
	})
	var initial_hash: String = state.state_hash()

	var history: RefCounted = LayoutHistory.new()

	# Disconnected corridor should fail preflight
	var bad_cmd: RefCounted = DrawCorridorCommand.new({
		"id": "disconnected_wing",
		"kind": "orthogonal",
		"points": [[50, 50], [50, 60]],
		"width_cells": 3
	})

	var exec_res: Dictionary = history.execute_command(bad_cmd, state)
	assert(not exec_res.ok, "Disconnected corridor command should fail")
	assert(exec_res.error_code == "NO_START_CONNECTION", "Error code should be NO_START_CONNECTION")
	assert(not state.has_id("disconnected_wing"), "Failed command must not mutate state")
	assert(state.state_hash() == initial_hash, "State hash must remain unchanged on failure")
	assert(not history.can_undo(), "Failed command must not be added to history")
