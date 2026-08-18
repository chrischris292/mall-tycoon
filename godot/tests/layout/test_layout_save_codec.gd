extends SceneTree

const LayoutSaveCodec = preload("res://scripts/layout/layout_save_codec.gd")

const FIXTURE_DIR := "res://data/layout_fixtures"

var _failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	_test_valid_fixture_round_trips()
	_test_invalid_fixture_fails_safely()
	_test_legacy_v2_migration_creates_repairable_v3()

	if _failures.is_empty():
		print("Layout save codec tests passed.")
		quit(0)
	else:
		for failure in _failures:
			push_error(failure)
		quit(1)

func _test_valid_fixture_round_trips() -> void:
	var loaded: Dictionary = LayoutSaveCodec.load_json_file("%s/valid_cedar_grove_minimal.json" % FIXTURE_DIR)
	_expect(loaded.ok, "Valid v3 fixture should parse: %s" % str(loaded.errors))
	var serialized: Dictionary = LayoutSaveCodec.serialize_v3_state(loaded.state)
	var reloaded: Dictionary = LayoutSaveCodec.parse_v3_blueprint(serialized)
	_expect(reloaded.ok, "Serialized v3 state should parse again: %s" % str(reloaded.errors))
	_expect(loaded.state.state_hash() == reloaded.state.state_hash(), "Parse -> serialize -> parse should preserve state hash.")

func _test_invalid_fixture_fails_safely() -> void:
	var loaded: Dictionary = LayoutSaveCodec.load_json_file("%s/invalid_duplicate_id.json" % FIXTURE_DIR)
	_expect(not loaded.ok, "Invalid v3 fixture should fail.")
	_expect(loaded.state == null, "Invalid v3 fixture should not return state.")

func _test_legacy_v2_migration_creates_repairable_v3() -> void:
	var file := FileAccess.open("%s/legacy_aurora_v2_snapshot.json" % FIXTURE_DIR, FileAccess.READ)
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	var migrated: Dictionary = LayoutSaveCodec.migrate_legacy_v2(parsed)
	_expect(migrated.ok, "Recognized legacy v2 snapshot should migrate.")
	_expect(migrated.blueprint.get("layout_schema_version") == 3, "Migrated blueprint should be v3.")
	_expect(migrated.blueprint.get("lots", []).size() == 1, "Migrated snapshot should preserve legacy store as a repairable lot.")
	_expect(migrated.blueprint.lots[0].get("legacy_repair_required", false), "Migrated legacy lots should be flagged for repair.")

func _expect(condition: bool, message: String) -> void:
	if not condition:
		_failures.append(message)
