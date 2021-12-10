import React, { Suspense } from 'react';
import { mount } from '@cypress/react';
import { Progress, State, ProgressProps } from '../components/records/Progress';
import { BrowserRouter } from 'react-router-dom';
import { ApiProvider, TxProvider } from '../providers';
import '../index.scss';
import '../theme/antd/index.less';
import { NETWORK_CONFIG } from '../config';
import { img } from './utils';

const progresses: ProgressProps[] = [
  {
    title: 'xxx Sent',
    steps: [{ name: '', state: State.completed }],
    network: NETWORK_CONFIG.pangolin,
  },
  {
    title: 'xxx Confirmed',
    steps: [{ name: 'confirm', state: State.completed, txHash: 'aaa' }],
    network: NETWORK_CONFIG.pangolin,
  },
  {
    title: 'ChainRelay Confirmed',
    steps: [{ name: 'confirm', state: State.completed }],
    icon: 'relayer.svg',
    network: null,
  },
  {
    title: 'yyy Confirmed',
    steps: [{ name: 'confirm', state: State.completed, txHash: 'bbb' }],
    network: NETWORK_CONFIG.ropsten,
  },
];

describe('Language Component', () => {
  const {
    pangolin: pangolinAccount,
    pangoro: pangoroAccount,
    ropsten: ropstenAccount,
    pangolinDVM: pangolinDVMAccount,
  } = Cypress.env('accounts');

  it('should display progress properly', () => {
    mount(
      <Suspense fallback="loading">
        <ApiProvider>
          <TxProvider>
            <Progress
              title="xxx"
              icon={img('pangolin.svg')}
              network={progresses[0].network}
              steps={progresses[0].steps}
            />
          </TxProvider>
        </ApiProvider>
      </Suspense>
    );

    cy.waitForReactComponent();
  });
});
