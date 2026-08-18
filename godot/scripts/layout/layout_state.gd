extends RefCounted

const OBJECT_COLLECTIONS := {
	"corridor": "corridors",
	"court": "courts",
	"lot": "lots",
	"entrance": "entrances",
	"expansion_port": "expansion_ports"
}

var blueprint_id := ""
var display_name := ""
var cell_size_meters := 2
var corridors: Dictionary = {}
var courts: Dictionary = {}
var lots: Dictionary = {}
var entrances: Dictionary = {}
var expansion_ports: Dictionary = {}

func configure(p_blueprint_id: String, p_display_name: String, p_cell_size_meters: int) -> void:
	blueprint_id = p_blueprint_id
	display_name = p_display_name
	cell_size_meters = maxi(1, p_cell_size_meters)

func add_object(kind: String, object_data: Dictionary) -> Dictionary:
	if not OBJECT_COLLECTIONS.has(kind):
		return _result(false, "UNKNOWN_KIND", "Unknown layout object kind '%s'." % kind)
	if not _has_valid_id(object_data):
		return _result(false, "MISSING_ID", "Layout object needs a non-empty string id.")
	var id := str(object_data.id)
	if has_id(id):
		return _result(false, "DUPLICATE_ID", "Layout id '%s' already exists." % id)
	var collection: Dictionary = get(OBJECT_COLLECTIONS[kind])
	collection[id] = object_data.duplicate(true)
	return _result(true, "", "")

func get_object(id: String) -> Dictionary:
	for collection_name in OBJECT_COLLECTIONS.values():
		var collection: Dictionary = get(collection_name)
		if collection.has(id):
			return collection[id].duplicate(true)
	return {}

func remove_object(id: String) -> Dictionary:
	for collection_name in OBJECT_COLLECTIONS.values():
		var collection: Dictionary = get(collection_name)
		if collection.has(id):
			collection.erase(id)
			return _result(true, "", "")
	return _result(false, "UNKNOWN_ID", "Layout id '%s' does not exist." % id)

func has_id(id: String) -> bool:
	for collection_name in OBJECT_COLLECTIONS.values():
		var collection: Dictionary = get(collection_name)
		if collection.has(id):
			return true
	return false

func object_count() -> int:
	return corridors.size() + courts.size() + lots.size() + entrances.size() + expansion_ports.size()

func duplicate_state() -> RefCounted:
	var next: RefCounted = get_script().new()
	next.blueprint_id = blueprint_id
	next.display_name = display_name
	next.cell_size_meters = cell_size_meters
	next.corridors = corridors.duplicate(true)
	next.courts = courts.duplicate(true)
	next.lots = lots.duplicate(true)
	next.entrances = entrances.duplicate(true)
	next.expansion_ports = expansion_ports.duplicate(true)
	return next

func to_canonical_dictionary() -> Dictionary:
	return {
		"blueprint_id": blueprint_id,
		"display_name": display_name,
		"cell_size_meters": cell_size_meters,
		"corridors": _canonical_collection(corridors),
		"courts": _canonical_collection(courts),
		"lots": _canonical_collection(lots),
		"entrances": _canonical_collection(entrances),
		"expansion_ports": _canonical_collection(expansion_ports)
	}

func state_hash() -> String:
	return JSON.stringify(to_canonical_dictionary()).sha256_text()

func _canonical_collection(collection: Dictionary) -> Array:
	var keys: Array = collection.keys()
	keys.sort()
	var result := []
	for id in keys:
		result.append(_canonical_value(collection[id]))
	return result

func _canonical_value(value: Variant) -> Variant:
	match typeof(value):
		TYPE_DICTIONARY:
			var keys: Array = value.keys()
			keys.sort()
			var result := {}
			for key in keys:
				result[key] = _canonical_value(value[key])
			return result
		TYPE_ARRAY:
			var result := []
			for item in value:
				result.append(_canonical_value(item))
			return result
		_:
			return value

func _has_valid_id(object_data: Dictionary) -> bool:
	return object_data.has("id") and typeof(object_data.id) == TYPE_STRING and not str(object_data.id).strip_edges().is_empty()

func _result(ok: bool, code: String, message: String) -> Dictionary:
	return {
		"ok": ok,
		"code": code,
		"message": message
	}
