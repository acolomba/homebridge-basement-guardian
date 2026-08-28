import type { GeminiDeviceTypeId, GeminiMetadataField, GeminiTelemetryField } from '../../src/device/gemini.js';

void ('wayneWaterGemini' satisfies GeminiDeviceTypeId);
void ('water_level' satisfies GeminiTelemetryField);
void ('backup_pump_running' satisfies GeminiTelemetryField);
void ('serial_communications' satisfies GeminiTelemetryField);
void ('alarm_audio_muted' satisfies GeminiTelemetryField);
void ('mcu_target_version' satisfies GeminiMetadataField);
void ('wifi_signal_dbm' satisfies GeminiMetadataField);

// @ts-expect-error the HALO identity selects a different adapter
void ('wayneWaterHalo' satisfies GeminiDeviceTypeId);
// @ts-expect-error pump_state belongs to the other family; Gemini does not define it
void ('pump_state' satisfies GeminiTelemetryField);
// @ts-expect-error firmware versions are device metadata, kept apart from telemetry
void ('mcu_firmware_version' satisfies GeminiTelemetryField);
// @ts-expect-error the water level is telemetry, not metadata
void ('water_level' satisfies GeminiMetadataField);
