extends RefCounted

const LayoutValidator = preload("res://scripts/layout/layout_validator.gd")

func execute(_state: RefCounted) -> Dictionary:
	return _error_result("NOT_IMPLEMENTED", "execute() not implemented in base LayoutCommand.")

func undo(_state: RefCounted) -> Dictionary:
	return _error_result("NOT_IMPLEMENTED", "undo() not implemented in base LayoutCommand.")

func get_command_type() -> String:
	return "base_command"

func get_summary() -> Dictionary:
	return {
		"type": get_command_type(),
		"cost": 0,
		"affected_ids": []
	}

func _ok_result(command_type: String, affected_ids: Array = [], cost: int = 0, extra: Dictionary = {}) -> Dictionary:
	var res := {
		"ok": true,
		"error_code": "",
		"message": "",
		"type": command_type,
		"cost": cost,
		"affected_ids": affected_ids
	}
	for k in extra.keys():
		res[k] = extra[k]
	return res

func _error_result(error_code: String, message: String, affected_ids: Array = []) -> Dictionary:
	return {
		"ok": false,
		"error_code": error_code,
		"message": message,
		"type": "error",
		"cost": 0,
		"affected_ids": affected_ids
	}
