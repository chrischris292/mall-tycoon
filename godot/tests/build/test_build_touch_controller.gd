extends SceneTree

const BuildTouchController = preload("res://scripts/build/build_touch_controller.gd")
const BuildPreviewController = preload("res://scripts/build/build_preview_controller.gd")
const LayoutState = preload("res://scripts/layout/layout_state.gd")

func _init() -> void:
	test_touch_controller_state_transitions()
	test_multi_touch_cancellation()
	test_preview_controller_candidates_and_evaluation()
	print("Build touch controller and preview tests passed.")
	quit(0)

func test_touch_controller_state_transitions() -> void:
	var controller: RefCounted = BuildTouchController.new()
	assert(controller.state == BuildTouchController.State.IDLE, "Initial state should be IDLE")

	# Single touch down -> ARMED
	var consumed: bool = controller.handle_screen_touch(0, true, Vector2(100, 100), Vector2i(0, 0))
	assert(consumed, "Initial touch should be consumed")
	assert(controller.state == BuildTouchController.State.ARMED, "State should be ARMED after single touch")

	# Drag below 12px threshold -> stays ARMED
	controller.handle_screen_drag(0, Vector2(105, 105), Vector2i(1, 0))
	assert(controller.state == BuildTouchController.State.ARMED, "State should remain ARMED below threshold")

	# Drag above 12px threshold -> DRAWING
	controller.handle_screen_drag(0, Vector2(120, 120), Vector2i(4, 4))
	assert(controller.state == BuildTouchController.State.DRAWING, "State should become DRAWING above threshold")

	# Release touch -> EDITING_PREVIEW
	controller.handle_screen_touch(0, false, Vector2(120, 120), Vector2i(4, 4))
	assert(controller.state == BuildTouchController.State.EDITING_PREVIEW, "State should be EDITING_PREVIEW after release")

	# Explicit cancel
	controller.cancel()
	assert(controller.state == BuildTouchController.State.IDLE, "State should return to IDLE after cancel")

func test_multi_touch_cancellation() -> void:
	var controller: RefCounted = BuildTouchController.new()

	# Start drawing with 1st finger
	controller.handle_screen_touch(0, true, Vector2(100, 100), Vector2i(0, 0))
	controller.handle_screen_drag(0, Vector2(150, 150), Vector2i(5, 5))
	assert(controller.state == BuildTouchController.State.DRAWING, "Should be DRAWING")

	# Second finger touches screen (pinch / camera gesture)
	var consumed: bool = controller.handle_screen_touch(1, true, Vector2(200, 200), Vector2i(10, 10))
	assert(not consumed, "Second touch should NOT be consumed so camera can handle it")
	assert(controller.state == BuildTouchController.State.IDLE, "State should cancel back to IDLE on multi-touch")

func test_preview_controller_candidates_and_evaluation() -> void:
	var state: RefCounted = LayoutState.new()
	state.configure("test_mall", "Test Mall", 2)
	state.add_object("corridor", {
		"id": "starter_corridor",
		"kind": "orthogonal",
		"points": [[0, 0], [10, 0]],
		"width_cells": 3
	})

	var preview: RefCounted = BuildPreviewController.new()
	preview.start_preview(Vector2i(10, 0), 3) # Starts connected at [10, 0]
	preview.update_preview(Vector2i(10, 8))

	# Straight candidate evaluation
	var eval_res: Dictionary = preview.evaluate_preview(state)
	assert(eval_res.is_active, "Preview should be active")
	assert(eval_res.valid, "Preview connected to starter corridor should be valid")
	assert(eval_res.length_cells == 8, "Length should be 8 cells")
	assert(eval_res.area_cells == 24, "Area should be 24 cells (8 * 3 width)")
	assert(eval_res.cost == 3360, "Cost should be 24 * 140 = 3360")

	# Corner HV candidate
	preview.update_preview(Vector2i(16, 6))
	var corner_res: Dictionary = preview.evaluate_preview(state)
	assert(corner_res.valid, "Corner candidate should be valid")
	assert(corner_res.points.size() == 3, "Corner should have 3 points: start, bend, end")
	assert(corner_res.length_cells == 12, "Length should be 6 (dx) + 6 (dy) = 12 cells")
