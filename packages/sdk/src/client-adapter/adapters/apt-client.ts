import { IClientAdapter } from '../types';

export class AptClientAdapter implements IClientAdapter {
  public async getAddress(): Promise<string> {
    return '';
  }

  public async getGasBalance(): Promise<string> {
    return '';
  }

  public getChainExplorer(): string {
    return '';
  }
}
