interface IOmniDeployerSdk {
  sayHello(): void;
}

export class Sdk implements IOmniDeployerSdk {
  sayHello(): void {
    console.log('Hello from OmniDeployerSdk');
  }
}
