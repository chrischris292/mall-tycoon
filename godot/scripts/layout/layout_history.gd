extends RefCounted

var undo_stack: Array[RefCounted] = []
var redo_stack: Array[RefCounted] = []
var max_history_size := 50
var transactions: Array[Dictionary] = []

signal history_changed()

func execute_command(command: RefCounted, state: RefCounted) -> Dictionary:
	var result: Dictionary = command.execute(state)
	if result.ok:
		undo_stack.append(command)
		if undo_stack.size() > max_history_size:
			undo_stack.pop_front()
		redo_stack.clear()
		transactions.append({
			"action": "execute",
			"type": command.get_command_type(),
			"summary": command.get_summary(),
			"result": result
		})
		history_changed.emit()
	return result

func undo(state: RefCounted) -> Dictionary:
	if not can_undo():
		return {
			"ok": false,
			"error_code": "NO_UNDO",
			"message": "Nothing to undo."
		}
	var command: RefCounted = undo_stack.pop_back()
	var result: Dictionary = command.undo(state)
	if result.ok:
		redo_stack.append(command)
		transactions.append({
			"action": "undo",
			"type": command.get_command_type(),
			"summary": command.get_summary(),
			"result": result
		})
		history_changed.emit()
	else:
		# If undo failed, push it back
		undo_stack.append(command)
	return result

func redo(state: RefCounted) -> Dictionary:
	if not can_redo():
		return {
			"ok": false,
			"error_code": "NO_REDO",
			"message": "Nothing to redo."
		}
	var command: RefCounted = redo_stack.pop_back()
	var result: Dictionary = command.execute(state)
	if result.ok:
		undo_stack.append(command)
		transactions.append({
			"action": "redo",
			"type": command.get_command_type(),
			"summary": command.get_summary(),
			"result": result
		})
		history_changed.emit()
	else:
		redo_stack.append(command)
	return result

func can_undo() -> bool:
	return not undo_stack.is_empty()

func can_redo() -> bool:
	return not redo_stack.is_empty()

func clear() -> void:
	undo_stack.clear()
	redo_stack.clear()
	transactions.clear()
	history_changed.emit()

func get_summary() -> Dictionary:
	return {
		"undo_count": undo_stack.size(),
		"redo_count": redo_stack.size(),
		"can_undo": can_undo(),
		"can_redo": can_redo(),
		"transactions_count": transactions.size()
	}
