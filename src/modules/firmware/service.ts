import { FirmwareRepository } from "./repository";

export class FirmwareService {
  private repository: FirmwareRepository;
  constructor(firmwareRepository: FirmwareRepository) {
    this.repository = firmwareRepository;
  }
}
