## Development Guide

[中文](./doc/DEVELOPMENT_ZH.md)

---

## Project architecture

![wormhole](./doc/screenshot/wormhole.png)
![bridge](./doc/screenshot/bridge.png)

- The network connection is done at App level; Main-connection: connection of the origin chain; assistant-connection: connection of the target network.

- The bridge module contain two main types of components: **Cross-chain** component and **Cross-chain Record** component, with specific dependencies

## How to develop

### Pre-required knowledge

The two key aspects of the bridge implementation (connecting to the network and the transaction logic) both use rxjs' Observable form of interface, and developers need to have a basic understanding of the Observer pattern and rxjs.

### Development steps

There is no real order to the development steps, they are at the discretion of the developer, the following are the recommended development steps.

1. Add the network configuration. Check if the required network is available under the src/config/network folder. If exists, you can skip this step.

1. Different network may need to connect to different wallets or plugins in order to authorize. Implemented connections: metamask, polkadot, tron; If you want to implement other connections, add the corresponding connection methods in src/utils/connection/connection.ts, which need to follow the unified interface and return Observable<Connection>

1. Run `yarn init:bridge` or `npm run init:bridge` in you terminal.
   After the execution is completed, the corresponding directory and basic code will be generated.
