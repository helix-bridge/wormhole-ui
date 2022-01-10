# 开发文档

## 项目架构

![wormhole](./screenshot/wormhole.png)

- 网络连接在 App 级别进行，连接的实现位于 /scr/utils/network/目录下
- 跨链交易的展示主要由 Bridge 组件和 Transfer 组件配合，功能和视图独立，功能实现位于 /src/utils/tx/ 目录下。

> Bridge 组件的主要任务是实现视图，对于交易流程，它只是组织者。

## 如何开发

### 前置知识

桥实现过程中的两个关键环节（连接网络和交易逻辑）都采用了 rxjs 的 Observable 形式的接口，开发者需要对观察者模式及 rxjs 有基本的了解。

### 开发步骤

开发步骤实际没有先后顺序，由开发者自由决定，以下是建议采用的开发步骤：

1. 添加网络配置。在 src/config/network.ts 中，主要的配置有 2 个， 是各网络的配置信息，NETWORK_GRAPH 是桥的配置

1. 连接网络。在 src/utils/network/connection.ts 的 config 中配置连接网络的方法。

1. 实现桥视图。工作目录 src/component/bridge

1. 实现交易逻辑。工作目录 src/utils/tx/

> ps：src/components/controls 有已经实现了的表单控件，或许可以减轻你的工作量。另外 utils/ 下的 network 和 tx 放在这里也许不合适，后面可能会考虑给他们换个地方。
