extends RefCounted

const LayoutSchema = preload("res://scripts/layout/layout_schema.gd")
const LayoutState = preload("res://scripts/layout/layout_state.gd")

static func parse_v3_blueprint(data: Dictionary) -> Dictionary:
	var validation := LayoutSchema.validate_blueprint(data)
	if not validation.ok:
		return {
			"ok": false,
			"errors": validation.errors,
			"state": null
		}

	var state: RefCounted = LayoutState.new()
	state.configure(str(data.blueprint_id), str(data.display_name), int(data.cell_size_meters))
	_add_all(state, "corridor", data.corridors)
	_add_all(state, "court", data.courts)
	_add_all(state, "lot", data.lots)
	_add_all(state, "entrance", data.entrances)
	_add_all(state, "expansion_port", data.expansion_ports)
	return {
		"ok": true,
		"errors": [],
		"state": state
	}

static func serialize_v3_state(state: RefCounted) -> Dictionary:
	return {
		"layout_schema_version": LayoutSchema.SCHEMA_VERSION,
		"blueprint_id": state.blueprint_id,
		"display_name": state.display_name,
		"cell_size_meters": state.cell_size_meters,
		"corridors": _collection_values(state.corridors),
		"courts": _collection_values(state.courts),
		"lots": _collection_values(state.lots),
		"entrances": _collection_values(state.entrances),
		"expansion_ports": _collection_values(state.expansion_ports)
	}

static func load_json_file(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {
			"ok": false,
			"errors": [LayoutSchema._error(LayoutSchema.ERROR_MISSING_FIELD, "File does not exist: %s" % path, path)],
			"state": null
		}
	var file := FileAccess.open(path, FileAccess.READ)
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		return {
			"ok": false,
			"errors": [LayoutSchema._error(LayoutSchema.ERROR_INVALID_TYPE, "Expected JSON object.", path)],
			"state": null
		}
	return parse_v3_blueprint(parsed)

static func migrate_legacy_v2(data: Dictionary) -> Dictionary:
	if data.has("layout_schema_version"):
		return parse_v3_blueprint(data)
	if not data.has("id") or not data.has("name") or not data.has("corridors") or not data.has("stores"):
		return {
			"ok": false,
			"errors": [LayoutSchema._error(LayoutSchema.ERROR_UNVERSIONED, "Unversioned layout is not a recognized legacy v2 blueprint.", "layout_schema_version")],
			"blueprint": {}
		}

	var blueprint := {
		"layout_schema_version": LayoutSchema.SCHEMA_VERSION,
		"blueprint_id": "%s_migrated_v3" % str(data.id),
		"display_name": "%s Migrated" % str(data.name),
		"cell_size_meters": 2,
		"corridors": [],
		"courts": [],
		"lots": [],
		"entrances": [],
		"expansion_ports": []
	}

	for raw_corridor in data.corridors:
		if typeof(raw_corridor) != TYPE_DICTIONARY:
			continue
		var converted := _migrate_legacy_corridor(raw_corridor)
		if converted.is_empty():
			continue
		if converted.get("kind", "") == "court":
			blueprint.courts.append(converted.court)
		else:
			blueprint.corridors.append(converted)

	for index in data.stores.size():
		var raw_store: Variant = data.stores[index]
		if typeof(raw_store) != TYPE_DICTIONARY:
			continue
		blueprint.lots.append(_migrate_legacy_store(raw_store, index))

	return {
		"ok": true,
		"errors": [],
		"blueprint": blueprint
	}

static func _add_all(state: RefCounted, kind: String, items: Array) -> void:
	for item in items:
		state.add_object(kind, item)

static func _collection_values(collection: Dictionary) -> Array:
	var keys: Array = collection.keys()
	keys.sort()
	var values: Array = []
	for key in keys:
		values.append(collection[key].duplicate(true))
	return values

static func _migrate_legacy_corridor(raw_corridor: Dictionary) -> Dictionary:
	var id := str(raw_corridor.get("id", "corridor"))
	var center: Array = raw_corridor.get("center", [0.0, 0.0])
	var size: Array = raw_corridor.get("size", [2.0, 2.0])
	var axis := str(raw_corridor.get("axis", "x"))
	var center_cell := Vector2i(roundi(float(center[0]) / 2.0), roundi(float(center[1]) / 2.0))
	var half_width_cells := maxi(1, roundi(float(size[0]) / 4.0))
	var half_depth_cells := maxi(1, roundi(float(size[1]) / 4.0))
	if axis == "c":
		return {
			"kind": "court",
			"court": {
				"id": id,
				"polygon": [
					[center_cell.x - half_width_cells, center_cell.y - half_depth_cells],
					[center_cell.x + half_width_cells, center_cell.y - half_depth_cells],
					[center_cell.x + half_width_cells, center_cell.y + half_depth_cells],
					[center_cell.x - half_width_cells, center_cell.y + half_depth_cells]
				]
			}
		}
	if axis == "z":
		return {
			"id": id,
			"kind": "orthogonal",
			"points": [[center_cell.x, center_cell.y - half_depth_cells], [center_cell.x, center_cell.y + half_depth_cells]],
			"width_cells": maxi(1, roundi(float(size[0]) / 2.0)),
			"material": str(raw_corridor.get("material", "terrazzo"))
		}
	return {
		"id": id,
		"kind": "orthogonal",
		"points": [[center_cell.x - half_width_cells, center_cell.y], [center_cell.x + half_width_cells, center_cell.y]],
		"width_cells": maxi(1, roundi(float(size[1]) / 2.0)),
		"material": str(raw_corridor.get("material", "terrazzo"))
	}

static func _migrate_legacy_store(raw_store: Dictionary, index: int) -> Dictionary:
	var position: Array = raw_store.get("position", [0.0, 0.0])
	var size: Array = raw_store.get("size", [6.0, 5.0])
	var center := Vector2i(roundi(float(position[0]) / 2.0), roundi(float(position[1]) / 2.0))
	var half_w := maxi(1, roundi(float(size[0]) / 4.0))
	var half_d := maxi(1, roundi(float(size[1]) / 4.0))
	var facing := str(raw_store.get("facing", "north"))
	var door_cell := center
	var frontage_from := Vector2i(center.x - half_w, center.y)
	var frontage_to := Vector2i(center.x + half_w, center.y)
	if facing == "north":
		door_cell = Vector2i(center.x, center.y + half_d)
		frontage_from = Vector2i(center.x - half_w, center.y + half_d)
		frontage_to = Vector2i(center.x + half_w, center.y + half_d)
	elif facing == "south":
		door_cell = Vector2i(center.x, center.y - half_d)
		frontage_from = Vector2i(center.x - half_w, center.y - half_d)
		frontage_to = Vector2i(center.x + half_w, center.y - half_d)
	return {
		"id": "legacy_lot_%02d" % index,
		"kind": "inline",
		"tenant_id": str(raw_store.get("name", "")).to_snake_case(),
		"legacy_repair_required": true,
		"footprint": [
			[center.x - half_w, center.y - half_d],
			[center.x + half_w, center.y - half_d],
			[center.x + half_w, center.y + half_d],
			[center.x - half_w, center.y + half_d]
		],
		"frontage": {
			"side": facing,
			"from": [frontage_from.x, frontage_from.y],
			"to": [frontage_to.x, frontage_to.y]
		},
		"door": {
			"cell": [door_cell.x, door_cell.y],
			"connects_to": "__legacy_repair_required__"
		}
	}
