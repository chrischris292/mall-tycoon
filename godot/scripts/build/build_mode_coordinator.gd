extends Node3D

const LayoutState = preload("res://scripts/layout/layout_state.gd")
const LayoutCoordinates = preload("res://scripts/layout/layout_coordinates.gd")
const LayoutHistory = preload("res://scripts/layout/layout_history.gd")
const LayoutRenderer = preload("res://scripts/layout/layout_renderer.gd")
const DrawCorridorCommand = preload("res://scripts/layout/commands/draw_corridor_command.gd")
const BuildTouchController = preload("res://scripts/build/build_touch_controller.gd")
const BuildPreviewController = preload("res://scripts/build/build_preview_controller.gd")

var state: RefCounted
var history: RefCounted = LayoutHistory.new()
var coordinates: RefCounted = LayoutCoordinates.new(2)
var touch_controller: RefCounted = BuildTouchController.new()
var preview_controller: RefCounted = BuildPreviewController.new()

var main_renderer: Node3D
var preview_renderer: Node3D
var bottom_sheet: Control
var camera: Camera3D

signal corridor_committed(corridor_data: Dictionary, cost: int)
signal layout_changed()
signal exit_requested()

func setup(p_state: RefCounted, p_camera: Camera3D, p_bottom_sheet: Control) -> void:
	state = p_state
	camera = p_camera
	bottom_sheet = p_bottom_sheet
	coordinates = LayoutCoordinates.new(state.cell_size_meters)

	# Main committed renderer
	main_renderer = LayoutRenderer.new()
	main_renderer.name = "CommittedLayoutRenderer"
	add_child(main_renderer)
	main_renderer.render_state(state, false)

	# Ghost preview renderer
	preview_renderer = LayoutRenderer.new()
	preview_renderer.name = "PreviewLayoutRenderer"
	add_child(preview_renderer)

	_connect_signals()
	_update_ui()

func _connect_signals() -> void:
	touch_controller.intent_started.connect(_on_touch_intent_started)
	touch_controller.intent_updated.connect(_on_touch_intent_updated)
	touch_controller.intent_ended.connect(_on_touch_intent_ended)
	touch_controller.intent_cancelled.connect(_on_touch_intent_cancelled)
	touch_controller.handle_dragged.connect(_on_handle_dragged)

	if bottom_sheet != null:
		bottom_sheet.width_selected.connect(_on_ui_width_selected)
		bottom_sheet.route_style_toggled.connect(_on_ui_route_style_toggled)
		bottom_sheet.build_confirmed.connect(_on_ui_build_confirmed)
		bottom_sheet.build_cancelled.connect(_on_ui_build_cancelled)
		bottom_sheet.undo_requested.connect(_on_ui_undo)
		bottom_sheet.redo_requested.connect(_on_ui_redo)
		bottom_sheet.close_requested.connect(_on_ui_close)

func _unhandled_input(event: InputEvent) -> void:
	if camera == null:
		return

	if event is InputEventMouseButton:
		var cell := _screen_to_cell(event.position)
		if event.button_index == MOUSE_BUTTON_LEFT:
			if event.pressed:
				touch_controller.handle_screen_touch(0, true, event.position, cell)
			else:
				touch_controller.handle_screen_touch(0, false, event.position, cell)
	elif event is InputEventMouseMotion:
		var cell := _screen_to_cell(event.position)
		touch_controller.handle_screen_drag(0, event.position, cell)
	elif event is InputEventScreenTouch:
		var cell := _screen_to_cell(event.position)
		touch_controller.handle_screen_touch(event.index, event.pressed, event.position, cell)
	elif event is InputEventScreenDrag:
		var cell := _screen_to_cell(event.position)
		touch_controller.handle_screen_drag(event.index, event.position, cell)

func _screen_to_cell(screen_pos: Vector2) -> Vector2i:
	if camera == null:
		return Vector2i.ZERO
	var from: Vector3 = camera.project_ray_origin(screen_pos)
	var dir: Vector3 = camera.project_ray_normal(screen_pos)
	if absf(dir.y) < 0.0001:
		return Vector2i.ZERO
	var t: float = -from.y / dir.y
	var hit: Vector3 = from + dir * t
	return coordinates.world_to_cell(hit)

func _on_touch_intent_started(cell: Vector2i, _screen_pos: Vector2) -> void:
	preview_controller.start_preview(cell, preview_controller.selected_width_cells)
	_refresh_preview()

func _on_touch_intent_updated(cell: Vector2i, _screen_pos: Vector2) -> void:
	preview_controller.update_preview(cell)
	_refresh_preview()

func _on_touch_intent_ended(cell: Vector2i, _screen_pos: Vector2) -> void:
	preview_controller.update_preview(cell)
	_refresh_preview()

func _on_touch_intent_cancelled(_reason: String) -> void:
	preview_controller.clear()
	_clear_preview_renderer()
	_update_ui()

func _on_handle_dragged(handle_idx: int, new_cell: Vector2i) -> void:
	if handle_idx == 0:
		preview_controller.start_cell = new_cell
	else:
		preview_controller.end_cell = new_cell
	_refresh_preview()

func _refresh_preview() -> void:
	var eval: Dictionary = preview_controller.evaluate_preview(state)
	_render_ghost_preview(eval)
	_update_ui(eval)

func _render_ghost_preview(eval: Dictionary) -> void:
	if not eval.get("is_active", false):
		_clear_preview_renderer()
		return

	# Build transient state copy with preview corridor to feed to LayoutRenderer
	var ghost_state: RefCounted = state.duplicate_state()
	var corridor: Dictionary = eval.get("corridor", {})
	if not corridor.is_empty():
		ghost_state.add_object("corridor", corridor)
	preview_renderer.render_state(ghost_state, true)

func _clear_preview_renderer() -> void:
	if preview_renderer != null:
		preview_renderer._clear()

func _update_ui(eval: Dictionary = {}) -> void:
	if bottom_sheet == null:
		return
	if eval.is_empty():
		eval = preview_controller.evaluate_preview(state)
	bottom_sheet.update_context(eval, history.can_undo(), history.can_redo())

func _on_ui_width_selected(w: int) -> void:
	preview_controller.set_width_cells(w)
	_refresh_preview()

func _on_ui_route_style_toggled() -> void:
	var new_style: int = preview_controller.cycle_route_style()
	var style_name := "Auto"
	match new_style:
		1: style_name = "Straight"
		2: style_name = "Corner H-V"
		3: style_name = "Corner V-H"
	bottom_sheet.update_route_style_label(style_name)
	_refresh_preview()

func _on_ui_build_confirmed() -> void:
	var eval: Dictionary = preview_controller.evaluate_preview(state)
	if not eval.get("valid", false):
		return

	var corridor: Dictionary = eval.get("corridor", {})
	var cmd: RefCounted = DrawCorridorCommand.new(corridor)
	var res: Dictionary = history.execute_command(cmd, state)
	if res.ok:
		preview_controller.next_corridor_id()
		preview_controller.clear()
		touch_controller.reset()
		_clear_preview_renderer()
		main_renderer.render_state(state, false)
		_update_ui()
		corridor_committed.emit(corridor, int(eval.get("cost", 0)))
		layout_changed.emit()

func _on_ui_build_cancelled() -> void:
	touch_controller.cancel("user_button_cancel")
	preview_controller.clear()
	_clear_preview_renderer()
	_update_ui()

func _on_ui_undo() -> void:
	var res: Dictionary = history.undo(state)
	if res.ok:
		main_renderer.render_state(state, false)
		_clear_preview_renderer()
		preview_controller.clear()
		_update_ui()
		layout_changed.emit()

func _on_ui_redo() -> void:
	var res: Dictionary = history.redo(state)
	if res.ok:
		main_renderer.render_state(state, false)
		_clear_preview_renderer()
		preview_controller.clear()
		_update_ui()
		layout_changed.emit()

func _on_ui_close() -> void:
	exit_requested.emit()
