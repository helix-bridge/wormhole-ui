import { isEqual } from 'lodash';
import { FunctionComponent } from 'react';
import { ApiKeys, BridgeConfig, ContractConfig, Departure } from '../../model';

export type BridgeStatus = 'pending' | 'available';

/**
 * departure -> arrival: issuing;
 * departure <- arrival: redeem;
 */
export class Bridge<C extends ContractConfig = ContractConfig, A extends ApiKeys = ApiKeys> {
  readonly status: BridgeStatus = 'pending';

  readonly stable: boolean = false;

  readonly departure: Departure;

  readonly arrival: Departure;

  readonly issuing: [Departure, Departure];

  readonly redeem: [Departure, Departure];

  private _config: BridgeConfig<C, A>;

  private crossChain: Map<Departure[], FunctionComponent> = new Map();

  private record: Map<Departure[], FunctionComponent> = new Map();

  constructor(
    departure: Departure,
    arrival: Departure,
    config: BridgeConfig<C, A>,
    status: BridgeStatus = 'pending',
    stable = false
  ) {
    this.departure = departure;
    this.arrival = arrival;
    this.issuing = [departure, arrival];
    this.redeem = [arrival, departure];
    this._config = config;
    this.status = status;
    this.stable = !!stable;
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
