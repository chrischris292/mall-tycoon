extends SceneTree

const LayoutRenderer = preload("res://scripts/layout/layout_renderer.gd")
const LayoutSaveCodec = preload("res://scripts/layout/layout_save_codec.gd")

var _failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	_test_renderer_creates_nodes_without_mutating_state()
	_test_renderer_can_rebuild_preview()

	if _failures.is_empty():
		print("Layout renderer tests passed.")
		quit(0)
	else:
		for failure in _failures:
			push_error(failure)
		quit(1)

func _test_renderer_creates_nodes_without_mutating_state() -> void:
	var loaded: Dictionary = LayoutSaveCodec.load_json_file("res://data/layout_fixtures/valid_cedar_grove_minimal.json")
	var renderer: Node3D = LayoutRenderer.new()
	get_root().add_child(renderer)
	var result: Dictionary = renderer.render_state(loaded.state)
	_expect(result.rendered_cells > 0, "Renderer should create floor cells.")
	_expect(renderer.get_child_count() > result.rendered_cells, "Renderer should include trim/edge detail, not only floor cells.")
	_expect(result.state_hash_before == result.state_hash_after, "Renderer must not mutate layout state.")
	renderer.queue_free()

func _test_renderer_can_rebuild_preview() -> void:
	var loaded: Dictionary = LayoutSaveCodec.load_json_file("res://data/layout_fixtures/valid_t_junction.json")
	var renderer: Node3D = LayoutRenderer.new()
	get_root().add_child(renderer)
	var first: Dictionary = renderer.render_state(loaded.state)
	var second: Dictionary = renderer.render_state(loaded.state, true)
	_expect(first.rendered_cells == second.rendered_cells, "Preview rebuild should preserve topology cell count.")
	_expect(second.state_hash_before == second.state_hash_after, "Preview rebuild must not mutate layout state.")
	renderer.queue_free()

func _expect(condition: bool, message: String) -> void:
	if not condition:
		_failures.append(message)
