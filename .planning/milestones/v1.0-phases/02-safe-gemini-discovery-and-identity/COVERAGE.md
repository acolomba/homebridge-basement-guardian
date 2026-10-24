No external API integration: this phase adds device-family adapters (Gemini validation/decoding,
a `deviceTypeId` registry) and HomeKit accessory identity/lifecycle on top of Phase 1's
already-integrated vendor REST/shadow client (`src/cloud/api.ts`, `src/cloud/shadow.ts`); it
introduces no new external API, SDK, or service surface. The `api.devices()` call the DEV-05
final-check reuses is the same Phase-1 `CloudApi.devices()` method already covered by Phase 1's
own integration, not a new endpoint.
