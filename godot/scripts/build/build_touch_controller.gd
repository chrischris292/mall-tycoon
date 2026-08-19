extends RefCounted

const LayoutCoordinates = preload("res://scripts/layout/layout_coordinates.gd")

enum State {
	IDLE = 0,
	ARMED = 1,
	DRAWING = 2,
	EDITING_PREVIEW = 3,
	COMMITTING = 4,
	CANCELLED = 5
}

const DRAG_THRESHOLD := 12.0

var state: State = State.IDLE
var coordinates: RefCounted = LayoutCoordinates.new(2)
var active_touches: Dictionary = {}
var start_screen_pos := Vector2.ZERO
var current_screen_pos := Vector2.ZERO
var start_cell := Vector2i.ZERO
var current_cell := Vector2i.ZERO
var selected_handle_index := -1
var enabled := true

signal state_changed(old_state: int, new_state: int)
signal intent_started(cell: Vector2i, screen_pos: Vector2)
signal intent_updated(cell: Vector2i, screen_pos: Vector2)
signal intent_ended(cell: Vector2i, screen_pos: Vector2)
signal intent_cancelled(reason: String)
signal handle_dragged(handle_index: int, new_cell: Vector2i)

func _set_state(new_state: State) -> void:
	if state == new_state:
		return
	var old_state := state
	state = new_state
	state_changed.emit(int(old_state), int(new_state))

func arm(cell: Vector2i, screen_pos: Vector2) -> void:
	if not enabled:
		return
	start_screen_pos = screen_pos
	current_screen_pos = screen_pos
	start_cell = cell
	current_cell = cell
	selected_handle_index = -1
	_set_state(State.ARMED)

func start_drawing(cell: Vector2i, screen_pos: Vector2) -> void:
	if not enabled:
		return
	start_cell = cell
	current_cell = cell
	start_screen_pos = screen_pos
	current_screen_pos = screen_pos
	_set_state(State.DRAWING)
	intent_started.emit(start_cell, start_screen_pos)

func update_pointer(cell: Vector2i, screen_pos: Vector2) -> void:
	if not enabled:
		return
	current_screen_pos = screen_pos
	current_cell = cell

	if state == State.ARMED:
		if start_screen_pos.distance_to(screen_pos) >= DRAG_THRESHOLD:
			_set_state(State.DRAWING)
			intent_started.emit(start_cell, start_screen_pos)
			intent_updated.emit(current_cell, current_screen_pos)
	elif state == State.DRAWING:
		intent_updated.emit(current_cell, current_screen_pos)
	elif state == State.EDITING_PREVIEW and selected_handle_index >= 0:
		handle_dragged.emit(selected_handle_index, current_cell)

func end_pointer(cell: Vector2i, screen_pos: Vector2) -> void:
	if not enabled:
		return
	current_screen_pos = screen_pos
	current_cell = cell

	if state == State.DRAWING:
		_set_state(State.EDITING_PREVIEW)
		intent_ended.emit(current_cell, current_screen_pos)
	elif state == State.ARMED:
		# Released without exceeding threshold -> tap, stay ARMED or reset to IDLE
		_set_state(State.IDLE)
	elif state == State.EDITING_PREVIEW:
		selected_handle_index = -1

func cancel(reason: String = "user_cancelled") -> void:
	if state == State.IDLE:
		return
	_set_state(State.CANCELLED)
	active_touches.clear()
	selected_handle_index = -1
	intent_cancelled.emit(reason)
	_set_state(State.IDLE)

func select_handle(handle_index: int) -> void:
	if state == State.EDITING_PREVIEW:
		selected_handle_index = handle_index

func handle_screen_touch(index: int, pressed: bool, pos: Vector2, cell: Vector2i) -> bool:
	if not enabled:
		return false

	if pressed:
		active_touches[index] = pos
		if active_touches.size() >= 2:
			# Multi-touch detected: cancel active drawing gesture and yield to camera
			if state == State.DRAWING or state == State.ARMED:
				cancel("multi_touch_camera_gesture")
			return false # Not consuming touch, allow camera gesture
		elif active_touches.size() == 1:
			arm(cell, pos)
			return true
	else:
		active_touches.erase(index)
		if active_touches.is_empty():
			if state == State.ARMED or state == State.DRAWING:
				end_pointer(cell, pos)
				return true

	return false

func handle_screen_drag(index: int, pos: Vector2, cell: Vector2i) -> bool:
	if not enabled or active_touches.size() >= 2:
		return false
	if active_touches.has(index):
		active_touches[index] = pos
		update_pointer(cell, pos)
		return state == State.DRAWING or state == State.ARMED

	return false

func reset() -> void:
	active_touches.clear()
	selected_handle_index = -1
	_set_state(State.IDLE)
