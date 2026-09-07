@real @read-only
Feature: Observing heartbeats and natural updates on the real Gemini

  The one real Gemini on the configured account sends a message on its live path about every 898
  seconds (README.md). A connection that stays quiet for one interval is not a failure: this suite
  only fails a run that logs a real connection failure or an unhandled rejection. A natural value
  change, if the run happens to see one, reaches the store on its own -- no scenario forces a status
  change to make this suite pass (REL-09, D-04).

  Scenario: The connection stays healthy across one heartbeat interval
    # 960 seconds (16 minutes) is long enough to plausibly span one 898-second heartbeat, and short
    # enough that a maintainer running this suite by hand is not left waiting half an hour. A quiet
    # connection and an observed update both count as success; only a real connection failure or an
    # unhandled rejection fails this scenario (T-06-20).
    When the harness starts
    Then the harness discovers one device within 30 seconds
    When the harness waits 960 seconds
    Then the connection reports no failure

  Scenario: A natural value change, if one lands during the run, reaches the store
    When the harness starts
    Then the harness discovers one device within 30 seconds
    When the harness remembers the current snapshot as "before the wait"
    When the harness waits 960 seconds
    Then the current snapshot no longer matches "before the wait" if the store recorded a change
