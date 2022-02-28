import { has, isEqual } from 'lodash';
import { FunctionComponent } from 'react';
import { ChainConfig } from '..';
import { Network, NetworkMode } from '../network/network';

/* ----------------------------------------------- bridge state ------------------------------------------------ */

export type BridgeStatus = 'pending' | 'available';

/* ----------------------------------------------- bridge vertices ------------------------------------------------ */

export interface Vertices {
  network: Network;
  mode: NetworkMode;
}

export type Departure = Vertices;

export type Arrival = Vertices;

export type BridgeDirection = [Departure, Arrival];

/* ----------------------------------------------- bridge config ------------------------------------------------ */

/**
 * TODO: remove centralized API:
 * dapp: e2d records; erc20 register proof querying
 * evolution: deposit records
 * subscan: airdrop records in crab
 */
export type ApiKeys = 'subql' | 'subqlMMr' | 'evolution' | 'dapp' | 'subscan' | 'subGraph';

export type Api<T extends ApiKeys> = { [key in T]: string };

export interface LockEventsStorage {
  min: number;
  max: number | null;
  key: string;
}

export interface ContractConfig {
  issuing: string;
  redeem: string;
}

export interface BridgeConfig<C = ContractConfig, K = Record<string, string>> {
  specVersion: number;
  contracts?: C;
  api?: K;
}

/**
 * ethereum <-> darwinia
 */
export interface EthereumDarwiniaContractConfig extends ContractConfig {
  ring: string; // e2d ring balance address
  kton: string; // e2d kton balance address
  fee: string; // e2d cross chain fee querying address
  redeemDeposit: string; // e2d redeem deposit address
}

export type EthereumDarwiniaBridgeConfig = Required<
  BridgeConfig<EthereumDarwiniaContractConfig, Pick<Api<ApiKeys>, 'dapp' | 'evolution'>>
> & {
  lockEvents: LockEventsStorage[];
};

/**
 * substrate <-> substrate dvm
 */
export type SubstrateSubstrateDVMBridgeConfig = Required<
  Omit<BridgeConfig<ContractConfig, Omit<Api<ApiKeys>, 'subscan' | 'subqlMMr'>>, 'contracts'>
>;

/**
 * ethereum <-> crab dvm
 */
export interface EthereumDVMcontractConfig extends ContractConfig {
  proof: string;
}

export type EthereumDVMBridgeConfig = Required<
  BridgeConfig<EthereumDVMcontractConfig, Pick<Api<ApiKeys>, 'dapp' | 'evolution'>>
>;

/**
 * smart app
 */
export type SubstrateDVMBridgeConfig = Required<
  Omit<BridgeConfig<ContractConfig, Pick<Api<ApiKeys>, 'subql'>>, 'contracts'>
>;

/* ----------------------------------------------- bridge  ------------------------------------------------ */

/**
 * departure -> arrival: issuing;
 * departure <- arrival: redeem;
 */
export class Bridge<C = BridgeConfig> {
  readonly status: BridgeStatus;

  readonly stable: boolean;

  readonly departure: ChainConfig;

  readonly arrival: ChainConfig;

  readonly issuing: [Departure, Arrival];

  readonly redeem: [Arrival, Departure];

  private _config: C;

  private crossChain: Map<Departure[], FunctionComponent> = new Map();

  private record: Map<Departure[], FunctionComponent> = new Map();

  constructor(
    departure: ChainConfig,
    arrival: ChainConfig,
    config: C,
    options?: {
      status?: BridgeStatus;
      stable?: boolean;
    }
  ) {
    const dep = this.toVertices(departure);
    const arr = this.toVertices(arrival);

    this.departure = departure;
    this.arrival = arrival;
    this.issuing = [dep, arr];
    this.redeem = [arr, dep];
    this._config = config;
    this.status = options?.status ?? 'available';
    this.stable = options?.stable ?? true;
  }

  get config() {
    return this._config;
  }

  private toVertices(config: ChainConfig): Vertices {
    return { network: config.name, mode: has(config, 'dvm') ? 'dvm' : 'native' };
  }

  setIssuingComponents(crossComp: FunctionComponent, recordComp: FunctionComponent): void {
    this.crossChain.set(this.issuing, crossComp);
    this.record.set(this.issuing, recordComp);
  }

  setRedeemComponents(crossComp: FunctionComponent, recordComp: FunctionComponent) {
    this.crossChain.set(this.redeem, crossComp);
    this.record.set(this.redeem, recordComp);
  }

  isIssuing(departure: Departure, arrival: Departure): boolean {
    return isEqual(this.issuing, [departure, arrival]);
  }

  isRedeem(departure: Departure, arrival: Departure): boolean {
    return isEqual(this.redeem, [departure, arrival]);
  }

  get IssuingCrossChainComponent() {
    return this.crossChain.get(this.issuing);
  }

  get RedeemCrossChainComponent() {
    return this.crossChain.get(this.redeem);
  }

  get IssuingRecordComponent() {
    return this.record.get(this.issuing);
  }

  get RedeemRecordComponent() {
    return this.record.get(this.redeem);
  }
}
