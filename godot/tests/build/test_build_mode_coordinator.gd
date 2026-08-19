extends SceneTree

const LayoutState = preload("res://scripts/layout/layout_state.gd")
const LayoutSaveCodec = preload("res://scripts/layout/layout_save_codec.gd")
const BuildModeCoordinator = preload("res://scripts/build/build_mode_coordinator.gd")
const BuildBottomSheet = preload("res://scripts/ui/build/build_bottom_sheet.gd")

var _failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	_test_coordinator_flow_and_commit()

	if _failures.is_empty():
		print("BuildModeCoordinator tests passed.")
		quit(0)
	else:
		for f in _failures:
			push_error(f)
		quit(1)

func _test_coordinator_flow_and_commit() -> void:
	var loaded: Dictionary = LayoutSaveCodec.load_json_file("res://data/layout_fixtures/valid_cedar_grove_minimal.json")
	_expect(loaded.ok, "Minimal fixture should load")
	var state: RefCounted = loaded.state
	var initial_hash: String = state.state_hash()

	var coordinator: Node3D = BuildModeCoordinator.new()
	var bottom_sheet: Control = BuildBottomSheet.new()
	get_root().add_child(coordinator)
	get_root().add_child(bottom_sheet)

	var camera := Camera3D.new()
	camera.position = Vector3(0, 34, 38)
	camera.rotation_degrees = Vector3(-48, 0, 0)
	camera.fov = 45.0
	get_root().add_child(camera)

	coordinator.setup(state, camera, bottom_sheet)

	# Simulate touch draw: start from valid connector [10, 6] -> drag to [10, 14] (clear from lots)
	coordinator.touch_controller.arm(Vector2i(10, 6), Vector2(100, 100))
	coordinator.touch_controller.update_pointer(Vector2i(10, 14), Vector2(100, 200)) # Exceeds threshold -> DRAWING
	coordinator.touch_controller.end_pointer(Vector2i(10, 14), Vector2(100, 200)) # -> EDITING_PREVIEW

	var eval: Dictionary = coordinator.preview_controller.evaluate_preview(state)
	_expect(eval.is_active, "Preview should be active")
	_expect(eval.valid, "Connected hallway run should be valid")
	_expect(eval.cost > 0, "Cost should be calculated")

	# Simulate confirming build via UI button
	coordinator._on_ui_build_confirmed()

	_expect(state.state_hash() != initial_hash, "State hash should change after commit")
	_expect(coordinator.history.can_undo(), "History should allow undo")

	# Test undo via coordinator
	coordinator._on_ui_undo()
	_expect(state.state_hash() == initial_hash, "State should restore initial hash after undo")
	_expect(coordinator.history.can_redo(), "History should allow redo")

	# Test redo via coordinator
	coordinator._on_ui_redo()
	_expect(state.state_hash() != initial_hash, "State should reapply changes after redo")

	coordinator.queue_free()
	bottom_sheet.queue_free()
	camera.queue_free()

func _expect(cond: bool, msg: String) -> void:
	if not cond:
		_failures.append(msg)
