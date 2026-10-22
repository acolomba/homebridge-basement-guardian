@real @read-only
Feature: Real pump heartbeats

  The suite observes the configured real Gemini across one 960-second live interval.
  It checks bounded discovery and initial shadow state, then reported failures and rejections.
  It accepts a quiet connection and changes no device status (REL-09).

  Scenario: The connection reports no failure across one heartbeat interval
    # 960 seconds (16 minutes) is long enough to plausibly span one 898-second heartbeat, and short
    # enough that a maintainer running this suite by hand is not left waiting half an hour. A quiet
    # connection counts as success after discovery and initial shadow state arrive. A reported
    # connection failure or an unhandled rejection fails this scenario.
    When the harness starts
    Then the harness discovers at least one device within 30 seconds
    Then the discovered device snapshot gains shadow-sourced fields within 45 seconds
    When the harness waits 960 seconds
    Then the connection reports no failure or unhandled rejection
