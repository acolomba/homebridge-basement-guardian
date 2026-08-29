import assert from 'node:assert/strict';
import { test } from 'node:test';

import { LogLevel } from 'homebridge';
import { mock, verify, when } from 'strong-mock';

import { createRedactingLogger } from '../src/logging.js';

import type { RedactingLogger } from '../src/logging.js';
import type { Logging } from 'homebridge';

const PREFIX = 'basement guardian';
const ACCOUNT_PASSWORD = 'account-password';

// The placeholder is written out here rather than imported, so a change to the
// production constant fails these cases instead of silently following it.
const REDACTED = '[redacted]';

// The five members that take a message and carry their level in their name.
const LEVELLED_MEMBERS = ['debug', 'error', 'info', 'success', 'warn'] as const;

const AWS_SESSION_CREDENTIAL_FIELDS = ['AccessKeyId', 'SecretAccessKey', 'SessionToken'];

const PRESIGNED_URL_PARAMETERS = ['X-Amz-Credential', 'X-Amz-Security-Token', 'X-Amz-Signature'];

const ID_TOKEN = 'id-token-value';

// Enough rotations that a list keeping every registered value would hold three
// hundred of them, which is roughly four days of the vendor's hourly cadence.
const ROTATION_COUNT = 100;

// The wrapper reads the delegate's prefix once while it is built, so every case
// promises that one property read.
function createDelegate(): Logging {
  const delegate = mock<Logging>({ exactParams: true, name: 'homebridge logging' });
  when(() => delegate.prefix).thenReturn(PREFIX);

  return delegate;
}

// Registers one rotated credential set, the way the credential refresh does.
function rotate(log: RedactingLogger, generation: number): void {
  log.registerSecret(`access-key-${String(generation)}`, 'aws-access-key-id');
  log.registerSecret(`secret-key-${String(generation)}`, 'aws-secret-access-key');
  log.registerSecret(`session-token-${String(generation)}`, 'aws-session-token');
}

test('carries the prefix, the seven log members, and the secret registration hook', () => {
  // arrange
  const delegate = createDelegate();

  // act
  const log = createRedactingLogger({ delegate, secrets: [] });

  // assert
  assert.strictEqual(typeof log, 'function');
  assert.strictEqual(log.prefix, PREFIX);
  assert.deepStrictEqual(Object.keys(log).sort(), ['debug', 'error', 'info', 'log', 'prefix', 'registerSecret', 'success', 'warn']);
  verify(delegate);
});

test('D-18 substitutes a registered secret through the bare callable form', () => {
  // arrange
  const delegate = createDelegate();
  when(() => {
    delegate(`signing in with ${REDACTED}`);
  }).thenReturn(undefined);
  const log = createRedactingLogger({ delegate, secrets: [ACCOUNT_PASSWORD] });

  // act
  log(`signing in with ${ACCOUNT_PASSWORD}`);

  // assert
  verify(delegate);
});

for (const member of LEVELLED_MEMBERS) {
  test(`D-18 substitutes a registered secret through ${member}`, () => {
    // arrange
    const delegate = createDelegate();
    when(() => {
      delegate[member](`signing in with ${REDACTED}`);
    }).thenReturn(undefined);
    const log = createRedactingLogger({ delegate, secrets: [ACCOUNT_PASSWORD] });

    // act
    log[member](`signing in with ${ACCOUNT_PASSWORD}`);

    // assert
    verify(delegate);
  });
}

test('D-18 substitutes a registered secret through the levelled log member', () => {
  // arrange
  const delegate = createDelegate();
  when(() => {
    delegate.log(LogLevel.WARN, `signing in with ${REDACTED}`);
  }).thenReturn(undefined);
  const log = createRedactingLogger({ delegate, secrets: [ACCOUNT_PASSWORD] });

  // act
  log.log(LogLevel.WARN, `signing in with ${ACCOUNT_PASSWORD}`);

  // assert
  verify(delegate);
});

test('substitutes a registered secret inside a trailing string parameter', () => {
  // arrange
  const delegate = createDelegate();
  when(() => {
    delegate.info('the grant was rejected', `attempt with ${REDACTED}`);
  }).thenReturn(undefined);
  const log = createRedactingLogger({ delegate, secrets: [ACCOUNT_PASSWORD] });

  // act
  log.info('the grant was rejected', `attempt with ${ACCOUNT_PASSWORD}`);

  // assert
  verify(delegate);
});

test('substitutes a registered secret inside a plain object parameter', () => {
  // arrange
  const delegate = createDelegate();
  when(() => {
    delegate.info('the grant was rejected', `{"credential":"${REDACTED}"}`);
  }).thenReturn(undefined);
  const log = createRedactingLogger({ delegate, secrets: [ACCOUNT_PASSWORD] });

  // act
  log.info('the grant was rejected', { credential: ACCOUNT_PASSWORD });

  // assert
  verify(delegate);
});

test('substitutes a registered secret inside an Error parameter and keeps its class name', () => {
  // arrange
  const delegate = createDelegate();
  when(() => {
    delegate.error('the grant was rejected', `TypeError: rejected ${REDACTED}`);
  }).thenReturn(undefined);
  const log = createRedactingLogger({ delegate, secrets: [ACCOUNT_PASSWORD] });

  // act
  log.error('the grant was rejected', new TypeError(`rejected ${ACCOUNT_PASSWORD}`));

  // assert
  verify(delegate);
});

test('describes a parameter that cannot be serialized', () => {
  // arrange
  const delegate = createDelegate();
  const snapshot: Record<string, unknown> = { deviceId: 'device-1' };
  snapshot.self = snapshot;
  when(() => {
    delegate.warn('the snapshot was refused', '[unserializable object]');
  }).thenReturn(undefined);
  const log = createRedactingLogger({ delegate, secrets: [] });

  // act
  log.warn('the snapshot was refused', snapshot);

  // assert
  verify(delegate);
});

test('WR-10 describes an unserializable parameter that has no prototype rather than raising', () => {
  // arrange
  const delegate = createDelegate();
  // Object.create answers `any`; the assertion restores the type the case works through.
  const snapshot = Object.create(null) as Record<string, unknown>;
  snapshot.self = snapshot;
  when(() => {
    delegate.warn('the snapshot was refused', '[unserializable object]');
  }).thenReturn(undefined);
  const log = createRedactingLogger({ delegate, secrets: [] });

  // act
  log.warn('the snapshot was refused', snapshot);

  // assert
  verify(delegate);
});

test('AUTH-02 substitutes an authorization token and keeps the scheme word', () => {
  // arrange
  const delegate = createDelegate();
  when(() => {
    delegate.debug(`sending authorization: Bearer ${REDACTED}`);
  }).thenReturn(undefined);
  const log = createRedactingLogger({ delegate, secrets: [] });

  // act
  log.debug('sending authorization: Bearer header.payload.signature');

  // assert
  verify(delegate);
});

test('AUTH-02 leaves the sentence full stop after an authorization token it substitutes', () => {
  // arrange
  const delegate = createDelegate();
  when(() => {
    delegate.debug(`the request carried Bearer ${REDACTED}.`);
  }).thenReturn(undefined);
  const log = createRedactingLogger({ delegate, secrets: [] });

  // act
  log.debug('the request carried Bearer header.payload.signature.');

  // assert
  verify(delegate);
});

for (const field of AWS_SESSION_CREDENTIAL_FIELDS) {
  test(`AUTH-02 substitutes the temporary credential field ${field}`, () => {
    // arrange
    const delegate = createDelegate();
    when(() => {
      delegate.debug(`aws credentials {"${field}":"${REDACTED}"}`);
    }).thenReturn(undefined);
    const log = createRedactingLogger({ delegate, secrets: [] });

    // act
    log.debug(`aws credentials {"${field}":"temporary-credential-value"}`);

    // assert
    verify(delegate);
  });
}

for (const parameter of PRESIGNED_URL_PARAMETERS) {
  test(`AUTH-02 substitutes the presigned URL parameter ${parameter}`, () => {
    // arrange
    const delegate = createDelegate();
    when(() => {
      delegate.debug(`connecting to wss://broker.test/mqtt?${parameter}=${REDACTED}&X-Amz-Date=1`);
    }).thenReturn(undefined);
    const log = createRedactingLogger({ delegate, secrets: [] });

    // act
    log.debug(`connecting to wss://broker.test/mqtt?${parameter}=presigned-credential-value&X-Amz-Date=1`);

    // assert
    verify(delegate);
  });
}

test('AUTH-02 substitutes an authentication request body whose password was never registered', () => {
  // arrange
  const delegate = createDelegate();
  when(() => {
    delegate.debug(`posting {"username":"${REDACTED}","password":"${REDACTED}"}`);
  }).thenReturn(undefined);
  const log = createRedactingLogger({ delegate, secrets: [] });

  // act
  log.debug('posting {"username":"account@example.test","password":"account-password"}');

  // assert
  verify(delegate);
});

test('substitutes a secret registered after the wrapper was built', () => {
  // arrange
  const delegate = createDelegate();
  when(() => {
    delegate.info(`the token ${REDACTED} expires soon`);
  }).thenReturn(undefined);
  const log = createRedactingLogger({ delegate, secrets: [] });

  // act
  log.registerSecret(ID_TOKEN);
  log.info(`the token ${ID_TOKEN} expires soon`);

  // assert
  verify(delegate);
});

test('registers nothing for an empty or whitespace-only secret', () => {
  // arrange
  const delegate = createDelegate();
  when(() => {
    delegate.info('discovered two devices');
  }).thenReturn(undefined);
  const log = createRedactingLogger({ delegate, secrets: ['', '   '] });

  // act
  log.registerSecret('');
  log.registerSecret('   ');
  log.info('discovered two devices');

  // assert
  verify(delegate);
});

test('AUTH-02 substitutes a value registered under a rotated role', () => {
  // arrange
  const delegate = createDelegate();
  when(() => {
    delegate.info(`the connection signed with ${REDACTED}`);
  }).thenReturn(undefined);
  const log = createRedactingLogger({ delegate, secrets: [] });

  // act
  log.registerSecret('access-key-0', 'aws-access-key-id');
  log.info('the connection signed with access-key-0');

  // assert
  verify(delegate);
});

test('AUTH-02 drops a rotated value once a fresh one is registered under the same role', () => {
  // arrange
  const delegate = createDelegate();
  when(() => {
    delegate.info(`access-key-0 gave way to ${REDACTED}`);
  }).thenReturn(undefined);
  const log = createRedactingLogger({ delegate, secrets: [] });

  // act
  log.registerSecret('access-key-0', 'aws-access-key-id');
  log.registerSecret('access-key-1', 'aws-access-key-id');
  log.info('access-key-0 gave way to access-key-1');

  // assert
  verify(delegate);
});

test('AUTH-02 holds one value per rotated role however many rotations follow', () => {
  // arrange
  const current = String(ROTATION_COUNT - 1);
  const expired = 'access-key-0 secret-key-0 session-token-0';
  const delegate = createDelegate();
  when(() => {
    delegate.info(`the expired set was ${expired} and the current one is ${REDACTED} ${REDACTED} ${REDACTED}`);
  }).thenReturn(undefined);
  const log = createRedactingLogger({ delegate, secrets: [] });

  // act
  for (let generation = 0; generation < ROTATION_COUNT; generation += 1) {
    rotate(log, generation);
  }

  log.info(`the expired set was ${expired} and the current one is access-key-${current} secret-key-${current} session-token-${current}`);

  // assert
  verify(delegate);
});

test('AUTH-02 keeps the password and the bearer token redacted however many rotations follow', () => {
  // arrange
  const delegate = createDelegate();
  when(() => {
    delegate.info(`the grant used ${REDACTED} and cached ${REDACTED}`);
  }).thenReturn(undefined);
  const log = createRedactingLogger({ delegate, secrets: [ACCOUNT_PASSWORD] });
  log.registerSecret(ID_TOKEN);

  // act
  for (let generation = 0; generation < ROTATION_COUNT; generation += 1) {
    rotate(log, generation);
  }

  log.info(`the grant used ${ACCOUNT_PASSWORD} and cached ${ID_TOKEN}`);

  // assert
  verify(delegate);
});

test('passes a message and parameters holding no secret to the delegate unchanged', () => {
  // arrange
  const delegate = createDelegate();
  when(() => {
    delegate.info('discovered 3 devices', 3, null);
  }).thenReturn(undefined);
  const log = createRedactingLogger({ delegate, secrets: [ACCOUNT_PASSWORD] });

  // act
  log.info('discovered 3 devices', 3, null);

  // assert
  verify(delegate);
});
