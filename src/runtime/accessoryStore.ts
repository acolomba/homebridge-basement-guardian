/**
 * Sink for an accessory's own persisted state.
 *
 * Mutating an accessory's context changes an object in memory and nothing on
 * disk: Homebridge writes the cache only when it is told the accessory changed,
 * so a record that counted an activation and never asked to be stored is lost
 * on the next restart. The record module writes through this port rather than
 * reaching for a Homebridge API handle, because the accessory's injected
 * options carry none today and must not gain one for the sake of one write
 * (D-08).
 *
 * Injection here is about provability rather than convenience. A test hands in
 * a recorder and asserts `persist()` was not called for an update that changed
 * nothing, which is evidence about an absence; watching behaviour alone cannot
 * give it, because an unchanged value written again looks exactly like an
 * unchanged value left alone (D-10).
 *
 * There is deliberately no process-wide implementation to go with this, unlike
 * the clock and the timers. The only implementation is the accessory-scoped
 * closure the composition root builds, so a consumer reaching through this
 * module can find no shared store to write to.
 */
export interface AccessoryStore {
  /** Asks Homebridge to write this accessory's current context to its cache. */
  persist(): void;
}
