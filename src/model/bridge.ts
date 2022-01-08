import { isEqual } from 'lodash';
import { FunctionComponent } from 'react';
import { Network, NetworkMode } from './network';

/* ----------------------------------------------- bridge state ------------------------------------------------ */

export type BridgeStatus = 'pending' | 'available';

/* ----------------------------------------------- bridge vertices ------------------------------------------------ */

export interface Vertices {
  network: Network;
  mode: NetworkMode;
}

export type Departure = Vertices;

export type Arrival = Vertices;

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

export interface BridgeConfig<C extends ContractConfig, K extends ApiKeys = ApiKeys> {
  specVersion: number;
  contracts?: C;
  api?: Partial<Api<K>>;
}

/**
 * ethereum <-> darwinia
 */
interface E2DContractConfig extends ContractConfig {
  ring: string; // e2d ring balance address
  kton: string; // e2d kton balance address
  fee: string; // e2d cross chain fee querying address
  redeemDeposit: string; // e2d redeem deposit address
}

export interface EthereumDarwiniaBridgeConfig
  extends BridgeConfig<E2DContractConfig, Extract<ApiKeys, 'dapp' | 'evolution'>> {
  lockEvents: LockEventsStorage[];
}

/**
 * substrate <-> substrate dvm
 */
export type SubstrateSubstrateDVMBridgeConfig = BridgeConfig<ContractConfig, Exclude<ApiKeys, 'subscan' | 'subqlMMr'>>;

/**
 * ethereum <-> crab dvm
 */
export type EthereumCrabDVMConfig = BridgeConfig<ContractConfig>;

/* ----------------------------------------------- bridge  ------------------------------------------------ */

/**
 * departure -> arrival: issuing;
 * departure <- arrival: redeem;
 */
export class Bridge<C extends ContractConfig = ContractConfig, A extends ApiKeys = ApiKeys> {
  readonly status: BridgeStatus;

  readonly stable: boolean;

  readonly departure: Departure;

  readonly arrival: Arrival;

  readonly issuing: [Departure, Arrival];

  readonly redeem: [Departure, Arrival];

  private _config: BridgeConfig<C, A>;

  private crossChain: Map<Departure[], FunctionComponent> = new Map();

  private record: Map<Departure[], FunctionComponent> = new Map();

  constructor(
    departure: Departure,
    arrival: Arrival,
    config: BridgeConfig<C, A>,
    options?: {
      status?: BridgeStatus;
      stable?: boolean;
    }
  ) {
    this.departure = departure;
    this.arrival = arrival;
    this.issuing = [departure, arrival];
    this.redeem = [arrival, departure];
    this._config = config;
    this.status = options?.status ?? 'available';
    this.stable = options?.stable ?? true;
  }

  get config() {
    return this._config;
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
