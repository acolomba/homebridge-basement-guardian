/**
 * @fileoverview The one place the provisional alarm-mute contract lives.
 *
 * The self-test command has real hardware evidence behind its wire shape. Alarm
 * mute has none. Nobody has observed a real Gemini's acknowledgement of a mute
 * request, the timing with which it reports the resulting state, how long a
 * mute actually lasts, or what it does when a mute fails. All four are open,
 * and confirming them is `G-001`, which blocks `1.0.0`.
 *
 * Everything this plugin assumes about mute therefore lives here, and every
 * export says so in its name. Closing that gate is one reviewable edit to this
 * module rather than a search for guesses spread across the accessory tier
 * (D-16, CTRL-04).
 *
 * What is *not* here is as deliberate as what is. There is no duration, no
 * timer, no schedule, and no unmute value, because the vendor exposes none of
 * them: the official client offers no duration selector and no unmute command.
 * Simulating any of them would report a mute ending that the device never ended
 * (D-019).
 */

/**
 * The only value this plugin will ever request for alarm mute.
 *
 * It is both the value a HomeKit write must carry to be accepted and the value
 * the command port is asked for, so one edit here moves both. `true` is the
 * whole of the measured command body `{"alarm_audio_muted": true}`; nothing
 * else has ever been sent to a real device and nothing else will be
 * (D-019, CTRL-04).
 */
export const PROVISIONAL_ALARM_MUTE_REQUESTED_VALUE = true;
