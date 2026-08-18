extends RefCounted

const SCHEMA_VERSION := 3

const ERROR_UNVERSIONED := "unversioned_layout"
const ERROR_UNSUPPORTED_VERSION := "unsupported_layout_schema_version"
const ERROR_MISSING_FIELD := "missing_required_field"
const ERROR_INVALID_TYPE := "invalid_field_type"
const ERROR_DUPLICATE_ID := "duplicate_id"
const ERROR_NON_INTEGER_COORDINATE := "non_integer_lattice_coordinate"
const ERROR_UNKNOWN_ENUM := "unknown_enum_value"
const ERROR_MISSING_CONNECTOR := "missing_connector"
const ERROR_SELF_INTERSECTING_POLYGON := "self_intersecting_polygon"
const ERROR_OVERLAP := "overlap"

const REQUIRED_TOP_LEVEL_FIELDS := [
	"layout_schema_version",
	"blueprint_id",
	"display_name",
	"cell_size_meters",
	"corridors",
	"courts",
	"lots",
	"entrances",
	"expansion_ports"
]

const CORRIDOR_KINDS := ["orthogonal", "diagonal_45", "curve"]
const LOT_KINDS := ["inline", "anchor", "kiosk", "service"]
const FRONTAGE_SIDES := ["north", "south", "east", "west"]
const ENTRANCE_KINDS := ["street", "parking", "transit", "service"]

static func validate_blueprint(data: Variant) -> Dictionary:
	var errors: Array[Dictionary] = []
	if typeof(data) != TYPE_DICTIONARY:
		return _result(false, [_error(ERROR_INVALID_TYPE, "Blueprint root must be a dictionary.", "root")])

	var blueprint: Dictionary = data
	for field in REQUIRED_TOP_LEVEL_FIELDS:
		if not blueprint.has(field):
			errors.append(_error(ERROR_MISSING_FIELD, "Blueprint is missing required field '%s'." % field, field))

	if errors.size() > 0:
		return _result(false, errors)

	if not _is_integer_number(blueprint.layout_schema_version):
		errors.append(_error(ERROR_INVALID_TYPE, "layout_schema_version must be an integer.", "layout_schema_version"))
	elif int(blueprint.layout_schema_version) != SCHEMA_VERSION:
		errors.append(_error(ERROR_UNSUPPORTED_VERSION, "Only layout schema version %d is supported." % SCHEMA_VERSION, "layout_schema_version"))

	if not _is_non_empty_string(blueprint.blueprint_id):
		errors.append(_error(ERROR_INVALID_TYPE, "blueprint_id must be a non-empty string.", "blueprint_id"))
	if not _is_non_empty_string(blueprint.display_name):
		errors.append(_error(ERROR_INVALID_TYPE, "display_name must be a non-empty string.", "display_name"))
	if not _is_integer_number(blueprint.cell_size_meters) or int(blueprint.cell_size_meters) <= 0:
		errors.append(_error(ERROR_INVALID_TYPE, "cell_size_meters must be a positive integer.", "cell_size_meters"))

	_validate_array_field(blueprint, "corridors", errors)
	_validate_array_field(blueprint, "courts", errors)
	_validate_array_field(blueprint, "lots", errors)
	_validate_array_field(blueprint, "entrances", errors)
	_validate_array_field(blueprint, "expansion_ports", errors)
	if errors.size() > 0:
		return _result(false, errors)

	var ids := {}
	_validate_corridors(blueprint.corridors, ids, errors)
	_validate_courts(blueprint.courts, ids, errors)
	_validate_lots(blueprint.lots, ids, errors)
	_validate_lot_overlaps(blueprint.lots, errors)
	_validate_entrances(blueprint.entrances, ids, errors)
	_validate_expansion_ports(blueprint.expansion_ports, ids, errors)

	return _result(errors.is_empty(), errors)

static func validate_json_file(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return _result(false, [_error(ERROR_MISSING_FIELD, "Fixture file does not exist: %s" % path, path)])

	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return _result(false, [_error(ERROR_INVALID_TYPE, "Fixture file could not be opened: %s" % path, path)])

	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if parsed == null:
		return _result(false, [_error(ERROR_INVALID_TYPE, "Fixture is not valid JSON: %s" % path, path)])
	return validate_blueprint(parsed)

static func _validate_corridors(items: Array, ids: Dictionary, errors: Array[Dictionary]) -> void:
	for index in items.size():
		var path := "corridors[%d]" % index
		var item: Variant = items[index]
		if not _require_dictionary(item, path, errors):
			continue
		_register_id(item, ids, path, errors)
		_require_enum(item, "kind", CORRIDOR_KINDS, "%s.kind" % path, errors)
		if not _require_integer_points(item, "points", "%s.points" % path, errors, 2):
			continue
		_require_positive_integer(item, "width_cells", "%s.width_cells" % path, errors)

static func _validate_courts(items: Array, ids: Dictionary, errors: Array[Dictionary]) -> void:
	for index in items.size():
		var path := "courts[%d]" % index
		var item: Variant = items[index]
		if not _require_dictionary(item, path, errors):
			continue
		_register_id(item, ids, path, errors)
		if _require_integer_points(item, "polygon", "%s.polygon" % path, errors, 4):
			_validate_polygon_not_self_intersecting(item.polygon, "%s.polygon" % path, errors)

static func _validate_lots(items: Array, ids: Dictionary, errors: Array[Dictionary]) -> void:
	for index in items.size():
		var path := "lots[%d]" % index
		var item: Variant = items[index]
		if not _require_dictionary(item, path, errors):
			continue
		_register_id(item, ids, path, errors)
		_require_enum(item, "kind", LOT_KINDS, "%s.kind" % path, errors)
		if _require_integer_points(item, "footprint", "%s.footprint" % path, errors, 4):
			_validate_polygon_not_self_intersecting(item.footprint, "%s.footprint" % path, errors)
		_require_dictionary_field(item, "frontage", "%s.frontage" % path, errors)
		_require_dictionary_field(item, "door", "%s.door" % path, errors)
		if typeof(item.get("frontage")) == TYPE_DICTIONARY:
			_require_enum(item.frontage, "side", FRONTAGE_SIDES, "%s.frontage.side" % path, errors)
			_require_integer_point(item.frontage, "from", "%s.frontage.from" % path, errors)
			_require_integer_point(item.frontage, "to", "%s.frontage.to" % path, errors)
		if typeof(item.get("door")) == TYPE_DICTIONARY:
			_require_integer_point(item.door, "cell", "%s.door.cell" % path, errors)
			_require_connector(item.door, "connects_to", "%s.door.connects_to" % path, errors)

static func _validate_lot_overlaps(items: Array, errors: Array[Dictionary]) -> void:
	for a in range(items.size()):
		if typeof(items[a]) != TYPE_DICTIONARY or typeof(items[a].get("footprint")) != TYPE_ARRAY:
			continue
		var a_bounds := _polygon_bounds(items[a].footprint)
		for b in range(a + 1, items.size()):
			if typeof(items[b]) != TYPE_DICTIONARY or typeof(items[b].get("footprint")) != TYPE_ARRAY:
				continue
			var b_bounds := _polygon_bounds(items[b].footprint)
			if _bounds_overlap(a_bounds, b_bounds):
				errors.append(_error(ERROR_OVERLAP, "Lot footprints overlap.", "lots[%d].footprint" % b))

static func _validate_entrances(items: Array, ids: Dictionary, errors: Array[Dictionary]) -> void:
	for index in items.size():
		var path := "entrances[%d]" % index
		var item: Variant = items[index]
		if not _require_dictionary(item, path, errors):
			continue
		_register_id(item, ids, path, errors)
		_require_enum(item, "kind", ENTRANCE_KINDS, "%s.kind" % path, errors)
		_require_integer_point(item, "exterior_cell", "%s.exterior_cell" % path, errors)
		_require_integer_point(item, "interior_cell", "%s.interior_cell" % path, errors)
		_require_connector(item, "connects_to", "%s.connects_to" % path, errors)

static func _validate_expansion_ports(items: Array, ids: Dictionary, errors: Array[Dictionary]) -> void:
	for index in items.size():
		var path := "expansion_ports[%d]" % index
		var item: Variant = items[index]
		if not _require_dictionary(item, path, errors):
			continue
		_register_id(item, ids, path, errors)
		_require_integer_point(item, "cell", "%s.cell" % path, errors)
		_require_connector(item, "connects_to", "%s.connects_to" % path, errors)

static func _register_id(item: Dictionary, ids: Dictionary, path: String, errors: Array[Dictionary]) -> void:
	if not _require_non_empty_string(item, "id", "%s.id" % path, errors):
		return
	var id := str(item.id)
	if ids.has(id):
		errors.append(_error(ERROR_DUPLICATE_ID, "Duplicate layout id '%s'." % id, "%s.id" % path))
	else:
		ids[id] = path

static func _validate_array_field(data: Dictionary, field: String, errors: Array[Dictionary]) -> bool:
	if typeof(data.get(field)) != TYPE_ARRAY:
		errors.append(_error(ERROR_INVALID_TYPE, "%s must be an array." % field, field))
		return false
	return true

static func _require_dictionary(value: Variant, path: String, errors: Array[Dictionary]) -> bool:
	if typeof(value) != TYPE_DICTIONARY:
		errors.append(_error(ERROR_INVALID_TYPE, "%s must be a dictionary." % path, path))
		return false
	return true

static func _require_dictionary_field(data: Dictionary, field: String, path: String, errors: Array[Dictionary]) -> bool:
	if typeof(data.get(field)) != TYPE_DICTIONARY:
		errors.append(_error(ERROR_INVALID_TYPE, "%s must be a dictionary." % field, path))
		return false
	return true

static func _require_enum(data: Dictionary, field: String, valid_values: Array, path: String, errors: Array[Dictionary]) -> bool:
	if not _require_non_empty_string(data, field, path, errors):
		return false
	if not valid_values.has(str(data[field])):
		errors.append(_error(ERROR_UNKNOWN_ENUM, "%s has unsupported value '%s'." % [field, str(data[field])], path))
		return false
	return true

static func _require_non_empty_string(data: Dictionary, field: String, path: String, errors: Array[Dictionary]) -> bool:
	if not data.has(field):
		errors.append(_error(ERROR_MISSING_FIELD, "Missing required field '%s'." % field, path))
		return false
	if not _is_non_empty_string(data[field]):
		errors.append(_error(ERROR_INVALID_TYPE, "%s must be a non-empty string." % field, path))
		return false
	return true

static func _require_connector(data: Dictionary, field: String, path: String, errors: Array[Dictionary]) -> bool:
	if not data.has(field) or not _is_non_empty_string(data[field]):
		errors.append(_error(ERROR_MISSING_CONNECTOR, "%s must reference a connector id." % field, path))
		return false
	return true

static func _require_positive_integer(data: Dictionary, field: String, path: String, errors: Array[Dictionary]) -> bool:
	if not data.has(field):
		errors.append(_error(ERROR_MISSING_FIELD, "Missing required field '%s'." % field, path))
		return false
	if not _is_integer_number(data[field]) or int(data[field]) <= 0:
		errors.append(_error(ERROR_INVALID_TYPE, "%s must be a positive integer." % field, path))
		return false
	return true

static func _require_integer_points(data: Dictionary, field: String, path: String, errors: Array[Dictionary], minimum: int) -> bool:
	if not data.has(field):
		errors.append(_error(ERROR_MISSING_FIELD, "Missing required field '%s'." % field, path))
		return false
	if typeof(data[field]) != TYPE_ARRAY:
		errors.append(_error(ERROR_INVALID_TYPE, "%s must be an array of integer points." % field, path))
		return false
	if data[field].size() < minimum:
		errors.append(_error(ERROR_INVALID_TYPE, "%s must contain at least %d points." % [field, minimum], path))
		return false
	var ok := true
	for index in data[field].size():
		ok = _validate_integer_point_value(data[field][index], "%s[%d]" % [path, index], errors) and ok
	return ok

static func _require_integer_point(data: Dictionary, field: String, path: String, errors: Array[Dictionary]) -> bool:
	if not data.has(field):
		errors.append(_error(ERROR_MISSING_FIELD, "Missing required field '%s'." % field, path))
		return false
	return _validate_integer_point_value(data[field], path, errors)

static func _validate_integer_point_value(value: Variant, path: String, errors: Array[Dictionary]) -> bool:
	if typeof(value) != TYPE_ARRAY or value.size() != 2:
		errors.append(_error(ERROR_INVALID_TYPE, "Point must be [x, y].", path))
		return false
	if not _is_integer_number(value[0]) or not _is_integer_number(value[1]):
		errors.append(_error(ERROR_NON_INTEGER_COORDINATE, "Lattice coordinates must be integers.", path))
		return false
	return true

static func _validate_polygon_not_self_intersecting(points: Array, path: String, errors: Array[Dictionary]) -> void:
	if points.size() < 4:
		return
	for a in range(points.size()):
		var a1 := Vector2(points[a][0], points[a][1])
		var a2 := Vector2(points[(a + 1) % points.size()][0], points[(a + 1) % points.size()][1])
		for b in range(a + 1, points.size()):
			if abs(a - b) <= 1 or (a == 0 and b == points.size() - 1):
				continue
			var b1 := Vector2(points[b][0], points[b][1])
			var b2 := Vector2(points[(b + 1) % points.size()][0], points[(b + 1) % points.size()][1])
			if Geometry2D.segment_intersects_segment(a1, a2, b1, b2) != null:
				errors.append(_error(ERROR_SELF_INTERSECTING_POLYGON, "Polygon edges intersect.", path))
				return

static func _polygon_bounds(points: Array) -> Rect2i:
	var min_x := int(points[0][0])
	var min_y := int(points[0][1])
	var max_x := min_x
	var max_y := min_y
	for point in points:
		min_x = mini(min_x, int(point[0]))
		min_y = mini(min_y, int(point[1]))
		max_x = maxi(max_x, int(point[0]))
		max_y = maxi(max_y, int(point[1]))
	return Rect2i(min_x, min_y, max_x - min_x, max_y - min_y)

static func _bounds_overlap(a: Rect2i, b: Rect2i) -> bool:
	return a.position.x < b.end.x and a.end.x > b.position.x and a.position.y < b.end.y and a.end.y > b.position.y

static func _is_non_empty_string(value: Variant) -> bool:
	return typeof(value) == TYPE_STRING and not str(value).strip_edges().is_empty()

static func _is_integer_number(value: Variant) -> bool:
	if typeof(value) == TYPE_INT:
		return true
	if typeof(value) == TYPE_FLOAT:
		return is_equal_approx(float(value), float(int(value)))
	return false

static func _error(code: String, message: String, path: String) -> Dictionary:
	return {
		"code": code,
		"message": message,
		"path": path
	}

static func _result(ok: bool, errors: Array[Dictionary]) -> Dictionary:
	return {
		"ok": ok,
		"errors": errors
	}
