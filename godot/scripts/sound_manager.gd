class_name SoundManager
extends Node

# Native procedural audio synthesizer & sound player for Godot 4.7+
# Synthesizes PCM waveforms mathematically for zero external dependencies and instant iOS playback.

static var instance: SoundManager
var sound_enabled := true
var master_volume := 0.85
var sample_rate := 44100

var streams: Dictionary = {}
var player_pool: Array[AudioStreamPlayer] = []
const POOL_SIZE := 8

func _init() -> void:
	instance = self

func _ready() -> void:
	_generate_all_sound_effects()
	for i in POOL_SIZE:
		var p := AudioStreamPlayer.new()
		p.bus = "Master"
		add_child(p)
		player_pool.append(p)

func _get_available_player() -> AudioStreamPlayer:
	for p in player_pool:
		if not p.playing:
			return p
	return player_pool[0]

func play_sound(sound_name: String, pitch_scale := 1.0) -> void:
	if not sound_enabled:
		return
	if streams.has(sound_name):
		var player := _get_available_player()
		player.stream = streams[sound_name]
		player.pitch_scale = pitch_scale
		player.volume_db = linear_to_db(master_volume)
		player.play()

func play_cash() -> void:
	play_sound("cash", randf_range(0.96, 1.05))

func play_place() -> void:
	play_sound("place", randf_range(0.98, 1.02))

func play_upgrade() -> void:
	play_sound("upgrade")

func play_doorbell() -> void:
	play_sound("doorbell")

func play_error() -> void:
	play_sound("error")

func play_arcade() -> void:
	play_sound("arcade", randf_range(0.95, 1.05))

func play_click() -> void:
	play_sound("click", randf_range(0.98, 1.04))

func play_demolish() -> void:
	play_sound("demolish")

func toggle_sound() -> bool:
	sound_enabled = not sound_enabled
	return sound_enabled

# ==============================================================================
# PROCEDURAL PCM AUDIO SYNTHESIS
# ==============================================================================
func _generate_all_sound_effects() -> void:
	streams["click"] = _synth_tone_sequence([
		{"freq": 1400.0, "dur": 0.035, "wave": "sine", "vol": 0.35}
	])
	streams["cash"] = _synth_tone_sequence([
		{"freq": 1318.5, "dur": 0.07, "wave": "sine", "vol": 0.45},
		{"freq": 1661.2, "dur": 0.16, "wave": "sine", "vol": 0.55}
	])
	streams["place"] = _synth_tone_sequence([
		{"freq": 440.0, "dur": 0.08, "wave": "triangle", "vol": 0.4},
		{"freq": 587.3, "dur": 0.09, "wave": "triangle", "vol": 0.45},
		{"freq": 880.0, "dur": 0.15, "wave": "sine", "vol": 0.5}
	])
	streams["upgrade"] = _synth_tone_sequence([
		{"freq": 523.25, "dur": 0.09, "wave": "triangle", "vol": 0.45},
		{"freq": 659.25, "dur": 0.09, "wave": "triangle", "vol": 0.48},
		{"freq": 783.99, "dur": 0.10, "wave": "triangle", "vol": 0.52},
		{"freq": 1046.5, "dur": 0.28, "wave": "sine", "vol": 0.65}
	])
	streams["doorbell"] = _synth_tone_sequence([
		{"freq": 880.0, "dur": 0.14, "wave": "sine", "vol": 0.45},
		{"freq": 698.46, "dur": 0.22, "wave": "sine", "vol": 0.4}
	])
	streams["error"] = _synth_tone_sequence([
		{"freq": 220.0, "dur": 0.12, "wave": "sawtooth", "vol": 0.45},
		{"freq": 174.6, "dur": 0.16, "wave": "sawtooth", "vol": 0.45}
	])
	streams["arcade"] = _synth_tone_sequence([
		{"freq": 320.0, "dur": 0.045, "wave": "square", "vol": 0.28},
		{"freq": 640.0, "dur": 0.05, "wave": "square", "vol": 0.3},
		{"freq": 960.0, "dur": 0.09, "wave": "square", "vol": 0.35}
	])
	streams["demolish"] = _synth_tone_sequence([
		{"freq": 160.0, "dur": 0.08, "wave": "sawtooth", "vol": 0.45},
		{"freq": 90.0, "dur": 0.15, "wave": "sine", "vol": 0.55}
	])

func _synth_tone_sequence(tones: Array) -> AudioStreamWAV:
	var total_duration := 0.0
	for t in tones:
		total_duration += float(t.get("dur", 0.1))
	var num_samples := int(total_duration * sample_rate)
	var byte_buffer := PackedByteArray()
	byte_buffer.resize(num_samples * 2) # 16-bit mono = 2 bytes per sample

	var sample_offset := 0
	for tone_data in tones:
		var freq: float = tone_data.get("freq", 440.0)
		var dur: float = tone_data.get("dur", 0.1)
		var wave_type: String = tone_data.get("wave", "sine")
		var peak_vol: float = tone_data.get("vol", 0.5)
		var tone_samples := int(dur * sample_rate)

		for i in tone_samples:
			var t := float(i) / float(sample_rate)
			var phase := TAU * freq * t
			var raw_sample := 0.0

			match wave_type:
				"sine":
					raw_sample = sin(phase)
				"square":
					raw_sample = 1.0 if sin(phase) >= 0.0 else -1.0
				"triangle":
					raw_sample = 2.0 * absf(2.0 * (t * freq - floorf(t * freq + 0.5))) - 1.0
				"sawtooth":
					raw_sample = 2.0 * (t * freq - floorf(t * freq + 0.5))
				_:
					raw_sample = sin(phase)

			# Exponential / smooth release envelope
			var progress := float(i) / float(tone_samples)
			var env := exp(-progress * 3.8) * (1.0 - progress)
			var final_val := clampf(raw_sample * peak_vol * env, -1.0, 1.0)
			var sample_16 := int(final_val * 32767.0)

			var byte_idx := (sample_offset + i) * 2
			if byte_idx + 1 < byte_buffer.size():
				byte_buffer.encode_s16(byte_idx, sample_16)

		sample_offset += tone_samples

	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = sample_rate
	wav.stereo = false
	wav.data = byte_buffer
	return wav
