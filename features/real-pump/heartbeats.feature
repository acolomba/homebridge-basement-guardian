@real @read-only
Feature: Observing heartbeats and natural updates on the real Gemini

  The configured Gemini's live path is observed across one 960-second interval (README.md).
  A quiet connection is acceptable after the initial shadow state arrives. The run fails if
  discovery or initial shadow observation misses its bound, or if the connection logs a
  failure or the process reports an unhandled rejection. No device status is changed to
  make this suite pass (REL-09, D-04).

  Scenario: The connection stays healthy across one heartbeat interval
    # 960 seconds (16 minutes) is long enough to plausibly span one 898-second heartbeat, and short
    # enough that a maintainer running this suite by hand is not left waiting half an hour. A quiet
    # connection counts as success after discovery and initial shadow state arrive. A reported
    # connection failure or an unhandled rejection fails this scenario (T-06-20).
    When the harness starts
    Then the harness discovers one device within 30 seconds
    Then the discovered device snapshot gains shadow-sourced fields within 45 seconds
    When the harness waits 960 seconds
    Then the connection reports no failure
