export interface IClientAdapter {
  getGasBalance(): Promise<string>;
  getAddress(): Promise<string>;
  getChainExplorer(): string;
}
