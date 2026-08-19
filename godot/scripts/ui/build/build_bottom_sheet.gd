extends PanelContainer

signal tool_selected(tool_name: String)
signal width_selected(width_cells: int)
signal route_style_toggled()
signal build_confirmed()
signal build_cancelled()
signal undo_requested()
signal redo_requested()
signal close_requested()

var status_label: Label
var metric_label: Label
var style_btn: Button
var btn_narrow: Button
var btn_std: Button
var btn_grand: Button
var btn_build: Button
var btn_cancel: Button
var btn_undo: Button
var btn_redo: Button

func _init() -> void:
	_build_ui()

func _build_ui() -> void:
	custom_minimum_size = Vector2(0, 180)
	size_flags_horizontal = Control.SIZE_EXPAND_FILL

	# Dark glassmorphic styling
	var panel_style := StyleBoxFlat.new()
	panel_style.bg_color = Color(0.06, 0.09, 0.16, 0.94)
	panel_style.corner_radius_top_left = 18
	panel_style.corner_radius_top_right = 18
	panel_style.border_width_top = 2
	panel_style.border_color = Color("#38bdf8")
	panel_style.content_margin_left = 16
	panel_style.content_margin_right = 16
	panel_style.content_margin_top = 12
	panel_style.content_margin_bottom = 16
	add_theme_stylebox_override("panel", panel_style)

	var main_vbox := VBoxContainer.new()
	main_vbox.add_theme_constant_override("separation", 10)
	add_child(main_vbox)

	# Row 1: Header / Tool Rail + Close
	var top_row := HBoxContainer.new()
	top_row.add_theme_constant_override("separation", 8)
	main_vbox.add_child(top_row)

	var title_lbl := Label.new()
	title_lbl.text = "MALL ARCHITECT — BUILD CORRIDOR"
	title_lbl.add_theme_color_override("font_color", Color("#38bdf8"))
	title_lbl.add_theme_font_size_override("font_size", 15)
	top_row.add_child(title_lbl)

	var spacer := Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top_row.add_child(spacer)

	var close_btn := Button.new()
	close_btn.text = "✕ Exit Build"
	close_btn.custom_minimum_size = Vector2(100, 36)
	close_btn.pressed.connect(func(): close_requested.emit())
	top_row.add_child(close_btn)

	# Row 2: Status & Metric Context Bar
	var context_bar := PanelContainer.new()
	var ctx_style := StyleBoxFlat.new()
	ctx_style.bg_color = Color(0.1, 0.15, 0.24, 0.8)
	ctx_style.corner_radius_top_left = 8
	ctx_style.corner_radius_top_right = 8
	ctx_style.corner_radius_bottom_left = 8
	ctx_style.corner_radius_bottom_right = 8
	ctx_style.content_margin_left = 12
	ctx_style.content_margin_right = 12
	ctx_style.content_margin_top = 6
	ctx_style.content_margin_bottom = 6
	context_bar.add_theme_stylebox_override("panel", ctx_style)
	main_vbox.add_child(context_bar)

	var ctx_hbox := HBoxContainer.new()
	ctx_hbox.add_theme_constant_override("separation", 12)
	context_bar.add_child(ctx_hbox)

	status_label = Label.new()
	status_label.text = "Touch and drag in the mall to draw a hallway run."
	status_label.add_theme_color_override("font_color", Color("#94a3b8"))
	status_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	ctx_hbox.add_child(status_label)

	metric_label = Label.new()
	metric_label.text = ""
	metric_label.add_theme_color_override("font_color", Color("#facc15"))
	ctx_hbox.add_child(metric_label)

	# Row 3: Width chips + Route style toggle + Action buttons
	var ctrl_row := HBoxContainer.new()
	ctrl_row.add_theme_constant_override("separation", 8)
	main_vbox.add_child(ctrl_row)

	# Undo / Redo
	btn_undo = Button.new()
	btn_undo.text = "↶ Undo"
	btn_undo.custom_minimum_size = Vector2(76, 44)
	btn_undo.disabled = true
	btn_undo.pressed.connect(func(): undo_requested.emit())
	ctrl_row.add_child(btn_undo)

	btn_redo = Button.new()
	btn_redo.text = "↷ Redo"
	btn_redo.custom_minimum_size = Vector2(76, 44)
	btn_redo.disabled = true
	btn_redo.pressed.connect(func(): redo_requested.emit())
	ctrl_row.add_child(btn_redo)

	# Width Chips
	var w_lbl := Label.new()
	w_lbl.text = "Width:"
	w_lbl.add_theme_color_override("font_color", Color("#cbd5e1"))
	ctrl_row.add_child(w_lbl)

	btn_narrow = Button.new()
	btn_narrow.text = "4m"
	btn_narrow.custom_minimum_size = Vector2(48, 44)
	btn_narrow.pressed.connect(func(): _select_width(2))
	ctrl_row.add_child(btn_narrow)

	btn_std = Button.new()
	btn_std.text = "6m (Std)"
	btn_std.custom_minimum_size = Vector2(72, 44)
	btn_std.pressed.connect(func(): _select_width(3))
	ctrl_row.add_child(btn_std)

	btn_grand = Button.new()
	btn_grand.text = "8m"
	btn_grand.custom_minimum_size = Vector2(48, 44)
	btn_grand.pressed.connect(func(): _select_width(4))
	ctrl_row.add_child(btn_grand)

	_select_width(3)

	# Route Candidate Style toggle
	style_btn = Button.new()
	style_btn.text = "Route: Auto"
	style_btn.custom_minimum_size = Vector2(100, 44)
	style_btn.pressed.connect(func(): route_style_toggled.emit())
	ctrl_row.add_child(style_btn)

	var spacer2 := Control.new()
	spacer2.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	ctrl_row.add_child(spacer2)

	# Cancel / Build buttons
	btn_cancel = Button.new()
	btn_cancel.text = "Cancel"
	btn_cancel.custom_minimum_size = Vector2(88, 52)
	btn_cancel.pressed.connect(func(): build_cancelled.emit())
	ctrl_row.add_child(btn_cancel)

	btn_build = Button.new()
	btn_build.text = "✓ Build Hallway"
	btn_build.custom_minimum_size = Vector2(130, 52)
	btn_build.disabled = true
	var build_style := StyleBoxFlat.new()
	build_style.bg_color = Color("#0284c7")
	build_style.corner_radius_top_left = 8
	build_style.corner_radius_top_right = 8
	build_style.corner_radius_bottom_left = 8
	build_style.corner_radius_bottom_right = 8
	btn_build.add_theme_stylebox_override("normal", build_style)
	btn_build.pressed.connect(func(): build_confirmed.emit())
	ctrl_row.add_child(btn_build)

func _select_width(w: int) -> void:
	btn_narrow.modulate = Color(1, 1, 1, 0.6)
	btn_std.modulate = Color(1, 1, 1, 0.6)
	btn_grand.modulate = Color(1, 1, 1, 0.6)
	if w == 2:
		btn_narrow.modulate = Color(0.3, 0.9, 1.0, 1.0)
	elif w == 3:
		btn_std.modulate = Color(0.3, 0.9, 1.0, 1.0)
	elif w == 4:
		btn_grand.modulate = Color(0.3, 0.9, 1.0, 1.0)
	width_selected.emit(w)

func update_context(preview_eval: Dictionary, can_undo_val: bool, can_redo_val: bool) -> void:
	btn_undo.disabled = not can_undo_val
	btn_redo.disabled = not can_redo_val

	if not preview_eval.get("is_active", false):
		status_label.text = "Touch and drag in the mall to draw a hallway run."
		status_label.add_theme_color_override("font_color", Color("#94a3b8"))
		metric_label.text = ""
		btn_build.disabled = true
		return

	var is_valid: bool = preview_eval.get("valid", false)
	var length_m: int = int(preview_eval.get("length_cells", 0)) * 2
	var area_m2: int = int(preview_eval.get("area_cells", 0)) * 4
	var cost: int = int(preview_eval.get("cost", 0))

	metric_label.text = "Length: %dm | Area: %dm² | Cost: $%d" % [length_m, area_m2, cost]

	if is_valid:
		status_label.text = "✓ Valid Hallway — Tap Build or drag handles to edit."
		status_label.add_theme_color_override("font_color", Color("#34d399"))
		btn_build.disabled = false
	else:
		var issues: Array = preview_eval.get("issues", [])
		var msg := "Invalid layout placement."
		if issues.size() > 0:
			msg = str(issues[0].get("message", msg))
		status_label.text = "⚠ %s" % msg
		status_label.add_theme_color_override("font_color", Color("#f87171"))
		btn_build.disabled = true

func update_route_style_label(style_name: String) -> void:
	style_btn.text = "Route: %s" % style_name
