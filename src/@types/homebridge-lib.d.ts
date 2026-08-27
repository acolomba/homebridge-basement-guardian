declare module 'homebridge-lib/EveHomeKitTypes' {
  export class EveHomeKitTypes {
    constructor(homebridge: import('homebridge').API);

    Characteristics: Record<string, unknown>;
    Services: Record<string, unknown>;
  }
}

declare module 'homebridge-lib' {}
