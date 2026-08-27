import type { BasementGuardianDevice, BasementGuardianPlatform, BasementGuardianPlatformAccessory } from './platform.js';
import type { CharacteristicValue, Service } from 'homebridge';

/** Handles the services and characteristics for one platform accessory. */
export class BasementGuardianAccessory {
  private readonly service: Service;
  private readonly exampleStates = {
    brightness: 100,
    on: false,
  };

  constructor(
    private readonly platform: BasementGuardianPlatform,
    private readonly accessory: BasementGuardianPlatformAccessory,
  ) {
    this.configureAccessoryInformation();
    this.service = this.createPrimaryService(accessory.context.device);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.exampleDisplayName);

    this.service.getCharacteristic(this.platform.Characteristic.On).onSet(this.setOn.bind(this)).onGet(this.getOn.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.Brightness).onSet(this.setBrightness.bind(this));

    this.configureExampleMotionSensors();
  }

  /** Handle an On change from HomeKit. */
  public setOn(value: CharacteristicValue): void {
    this.exampleStates.on = value as boolean;
    this.platform.log.debug('Set Characteristic On ->', value);
  }

  /** Return the current On state to HomeKit. */
  public getOn(): CharacteristicValue {
    const isOn = this.exampleStates.on;
    this.platform.log.debug('Get Characteristic On ->', isOn);

    return isOn;
  }

  /** Handle a Brightness change from HomeKit. */
  public setBrightness(value: CharacteristicValue): void {
    this.exampleStates.brightness = value as number;
    this.platform.log.debug('Set Characteristic Brightness -> ', value);
  }

  private configureAccessoryInformation(): void {
    const informationService =
      this.accessory.getService(this.platform.Service.AccessoryInformation) ?? this.accessory.addService(this.platform.Service.AccessoryInformation);

    informationService
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');
  }

  private createPrimaryService(device: BasementGuardianDevice): Service {
    if (device.customService === undefined) {
      return this.accessory.getService(this.platform.Service.Lightbulb) ?? this.accessory.addService(this.platform.Service.Lightbulb);
    }

    const customService = this.platform.CustomServices[device.customService];
    if (customService === undefined) {
      throw new Error(`Unknown custom service: ${device.customService}`);
    }

    return this.accessory.getService(customService) ?? this.accessory.addService(new customService(device.exampleDisplayName));
  }

  private configureExampleMotionSensors(): void {
    const firstMotionSensor = this.getOrAddMotionSensor('Motion Sensor One Name', 'YourUniqueIdentifier-1');
    const secondMotionSensor = this.getOrAddMotionSensor('Motion Sensor Two Name', 'YourUniqueIdentifier-2');

    let motionDetected = false;
    setInterval(() => {
      motionDetected = !motionDetected;
      firstMotionSensor.updateCharacteristic(this.platform.Characteristic.MotionDetected, motionDetected);
      secondMotionSensor.updateCharacteristic(this.platform.Characteristic.MotionDetected, !motionDetected);

      this.platform.log.debug('Triggering first motion sensor:', motionDetected);
      this.platform.log.debug('Triggering second motion sensor:', !motionDetected);
    }, 10_000);
  }

  private getOrAddMotionSensor(name: string, subtype: string): Service {
    return this.accessory.getService(name) ?? this.accessory.addService(this.platform.Service.MotionSensor, name, subtype);
  }
}
