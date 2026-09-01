import type { CommandFailure, CommandOutcome, CommandPort } from '../../src/runtime/commandPort.js';

// A port is a contract, so the cases here are the shapes it admits and the ones
// it refuses. `node --test` runs this module with zero cases; the compiler is
// what checks it.
void ('vendor-error' satisfies CommandFailure);
void ('timed-out' satisfies CommandFailure);

void ({ accepted: true } satisfies CommandOutcome);
void ({ accepted: false, failure: 'vendor-error' } satisfies CommandOutcome);
void ({ accepted: false, failure: 'timed-out' } satisfies CommandOutcome);

void ({ send: () => Promise.resolve({ accepted: true }) } satisfies CommandPort);

// @ts-expect-error a refusal names the cause the HomeKit tier maps to a status
void ({ accepted: false } satisfies CommandOutcome);
// @ts-expect-error an acceptance carries no cause, so the two forms cannot be mixed
void ({ accepted: true, failure: 'timed-out' } satisfies CommandOutcome);
// @ts-expect-error the vocabulary is closed: a new cause is a deliberate addition
void ('refused' satisfies CommandFailure);
// @ts-expect-error a port answers an outcome rather than resolving silently
void ({ send: () => Promise.resolve(undefined) } satisfies CommandPort);
// @ts-expect-error the port carries one method, so a second command surface is a deliberate addition
void ({ send: () => Promise.resolve({ accepted: true }), cancel: () => undefined } satisfies CommandPort);
