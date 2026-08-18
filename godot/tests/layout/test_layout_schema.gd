extends SceneTree

const LayoutSchema = preload("res://scripts/layout/layout_schema.gd")

const FIXTURE_DIR := "res://data/layout_fixtures"

const VALID_FIXTURES := [
	"valid_cedar_grove_minimal.json",
	"valid_disconnected_run.json",
	"valid_t_junction.json"
]

const INVALID_FIXTURES := {
	"invalid_duplicate_id.json": LayoutSchema.ERROR_DUPLICATE_ID,
	"invalid_missing_connector.json": LayoutSchema.ERROR_MISSING_CONNECTOR,
	"invalid_non_integer_coordinate.json": LayoutSchema.ERROR_NON_INTEGER_COORDINATE,
	"invalid_overlapping_lots.json": LayoutSchema.ERROR_OVERLAP,
	"invalid_self_intersecting_polygon.json": LayoutSchema.ERROR_SELF_INTERSECTING_POLYGON,
	"invalid_unknown_enum.json": LayoutSchema.ERROR_UNKNOWN_ENUM,
	"legacy_aurora_v2_snapshot.json": LayoutSchema.ERROR_MISSING_FIELD
}

var _failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	_test_valid_fixture()
	_test_invalid_fixtures()
	_test_validation_is_deterministic()

	if _failures.is_empty():
		print("Layout schema tests passed.")
		quit(0)
	else:
		for failure in _failures:
			push_error(failure)
		quit(1)

func _test_valid_fixture() -> void:
	for fixture_name in VALID_FIXTURES:
		var result := LayoutSchema.validate_json_file("%s/%s" % [FIXTURE_DIR, fixture_name])
		_expect(result.ok, "%s should validate, errors: %s" % [fixture_name, str(result.errors)])

func _test_invalid_fixtures() -> void:
	for fixture_name in INVALID_FIXTURES.keys():
		var expected_code: String = INVALID_FIXTURES[fixture_name]
		var result := LayoutSchema.validate_json_file("%s/%s" % [FIXTURE_DIR, fixture_name])
		_expect(not result.ok, "%s should fail validation." % fixture_name)
		_expect(_has_error_code(result.errors, expected_code), "%s should include error code %s, got %s" % [fixture_name, expected_code, str(result.errors)])

func _test_validation_is_deterministic() -> void:
	var first := LayoutSchema.validate_json_file("%s/valid_cedar_grove_minimal.json" % FIXTURE_DIR)
	var second := LayoutSchema.validate_json_file("%s/valid_cedar_grove_minimal.json" % FIXTURE_DIR)
	_expect(str(first) == str(second), "Valid fixture results should be deterministic.")

func _has_error_code(errors: Array, expected_code: String) -> bool:
	for error in errors:
		if typeof(error) == TYPE_DICTIONARY and str(error.get("code", "")) == expected_code:
			return true
	return false

func _expect(condition: bool, message: String) -> void:
	if not condition:
		_failures.append(message)
