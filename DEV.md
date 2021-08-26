## Development Guide

## Project architecture

![wormhole](./doc/screenshot/wormhole.png)

- The network connection is done at App level and is implemented in the /scr/utils/network/ directory
- The presentation of cross-chain transactions is mainly done by the Bridge component and the Transfer component, which are functionally and view independent, the functions are implemented in the /src/utils/tx/ directory.

> The main task of the Bridge component is to implement the view, for the transaction flow it is just the organizer.

## How to develop

### Pre-required knowledge

The two key aspects of the bridge implementation (connecting to the network and the transaction logic) both use rxjs' Observable form of interface, and developers need to have a basic understanding of the Observer pattern and rxjs.

### Development steps

There is no real order to the development steps, they are at the discretion of the developer, the following are the recommended development steps.

1. Add the network configuration. In src/config/network.ts there are 2 main configurations, NETWORK_CONFIG for each network and NETWORK_GRAPH for the bridge configuration

1. Connecting to the network. The method of connecting to the network is configured in the config of src/utils/network/connection.ts.

1. Implement the bridge view. Working directory src/component/bridge

1. Implement the transaction logic. Working directory src/utils/tx/

> ps: src/components/controls has already implemented form controls which may ease your workload. Also the network and tx under utils/ may not fit here, so we may consider moving them later.
