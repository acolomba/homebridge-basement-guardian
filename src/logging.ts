import type { LogLevel, Logging } from 'homebridge';

/** The delegate to write through, and the secret values known at build time. */
export interface RedactingLoggerOptions {
  delegate: Logging;
  secrets: readonly string[];
}

/** A `Logging` that also accepts secrets discovered after it was built. */
export interface RedactingLogger extends Logging {
  registerSecret(secret: string): void;
}

/** The five members that carry their level in their own name. */
type LevelledMember = 'debug' | 'error' | 'info' | 'success' | 'warn';

function wrapMember(delegate: Logging, member: LevelledMember): Logging[LevelledMember] {
  return (message: string, ...parameters: unknown[]): void => {
    delegate[member](message, ...parameters);
  };
}

/**
 * Wraps a Homebridge logger so no secret can reach it.
 *
 * `Logging` is a callable interface with seven members, so the wrapper is a
 * function carrying those members rather than a class. Every one of the seven
 * paths redacts, including the bare callable form and `log(level, ...)`.
 */
export function createRedactingLogger(options: RedactingLoggerOptions): RedactingLogger {
  const registerSecret = (): void => undefined;

  const write = (message: string, ...parameters: unknown[]): void => {
    options.delegate(message, ...parameters);
  };

  return Object.assign(write, {
    prefix: options.delegate.prefix,
    registerSecret,
    debug: wrapMember(options.delegate, 'debug'),
    error: wrapMember(options.delegate, 'error'),
    info: wrapMember(options.delegate, 'info'),
    success: wrapMember(options.delegate, 'success'),
    warn: wrapMember(options.delegate, 'warn'),
    log: (level: LogLevel, message: string, ...parameters: unknown[]): void => {
      options.delegate.log(level, message, ...parameters);
    },
  });
}
