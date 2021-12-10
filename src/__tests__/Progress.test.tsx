import { mount } from '@cypress/react';
import React, { Suspense } from 'react';
import { EMPTY } from 'rxjs';
import { Progress, ProgressProps, State } from '../components/records/Progress';
import { NETWORK_CONFIG } from '../config';
import '../index.scss';
import { ApiProvider, TxProvider } from '../providers';
import '../theme/antd/index.less';
import { img } from './utils';

describe('Language Component', () => {
  it('should display completed step', () => {
    const data = {
      title: 'Pangolin Sent',
      steps: [{ name: '', state: State.completed }],
      network: NETWORK_CONFIG.pangolin,
      icon: img('pangolin.svg'),
    };

    mount(
      <Suspense fallback="loading">
        <ApiProvider>
          <TxProvider>
            <Progress {...data} />
          </TxProvider>
        </ApiProvider>
      </Suspense>
    );

    cy.waitForReactComponent();

    cy.get('svg[data-icon="check-circle"]').should('be.visible');
  });

  it('should display error step', () => {
    const data = {
      title: 'Pangolin Sent',
      steps: [{ name: '', state: State.error }],
      network: NETWORK_CONFIG.pangolin,
      icon: img('pangolin.svg'),
    };

    mount(
      <Suspense fallback="loading">
        <ApiProvider>
          <TxProvider>
            <Progress {...data} />
          </TxProvider>
        </ApiProvider>
      </Suspense>
    );

    cy.waitForReactComponent();

    cy.get('svg[data-icon="exclamation-circle"]').should('be.visible');
  });

  it('should display pending step', () => {
    const data = {
      title: 'Pangolin Sent',
      steps: [{ name: '', state: State.pending }],
      network: NETWORK_CONFIG.pangolin,
      icon: img('pangolin.svg'),
    };

    mount(
      <Suspense fallback="loading">
        <ApiProvider>
          <TxProvider>
            <Progress {...data} />
          </TxProvider>
        </ApiProvider>
      </Suspense>
    );

    cy.waitForReactComponent();

    cy.get('button').should('not.exist');
    cy.get('.ant-row.opacity-30').should('be.visible');
  });

  it('should display step with tx hash button', () => {
    const data: ProgressProps = {
      title: 'Pangolin Confirmed',
      steps: [{ name: '', state: State.completed, txHash: '0xabcdefghijklmnopqrst' }],
      network: NETWORK_CONFIG.pangolin,
      icon: img('pangolin.svg'),
    };

    mount(
      <Suspense fallback="loading">
        <ApiProvider>
          <TxProvider>
            <Progress {...data} />
          </TxProvider>
        </ApiProvider>
      </Suspense>
    );

    cy.waitForReactComponent();

    const text = window.navigator.language === 'zh-CN' ? '查看交易' : 'TxHash';

    cy.react('Button').contains(text).should('be.visible');
  });

  it('should display step with claim button', () => {
    const data: ProgressProps = {
      title: 'ChainRelayer Confirmed',
      steps: [
        {
          name: '',
          state: State.completed,
          txHash: '0xabcdefghijklmnopqrst',
          mutateState: () => {
            return EMPTY.subscribe();
          },
        },
      ],
      network: null,
      icon: img('relayer.svg'),
    };

    mount(
      <Suspense fallback="loading">
        <ApiProvider>
          <TxProvider>
            <Progress {...data} />
          </TxProvider>
        </ApiProvider>
      </Suspense>
    );

    cy.waitForReactComponent();

    const text = window.navigator.language === 'zh-CN' ? '领取' : 'Claim';

    cy.react('Button').contains(text).should('be.visible');
  });

  it('should trigger claim action', () => {
    const fn = cy.spy();
    const data: ProgressProps = {
      title: 'ChainRelayer Confirmed',
      steps: [
        {
          name: '',
          state: State.completed,
          txHash: '0xabcdefghijklmnopqrst',
          mutateState: fn,
        },
      ],
      network: null,
      icon: img('relayer.svg'),
    };

    mount(
      <Suspense fallback="loading">
        <ApiProvider>
          <TxProvider>
            <Progress {...data} />
          </TxProvider>
        </ApiProvider>
      </Suspense>
    );

    cy.waitForReactComponent();

    const text = window.navigator.language === 'zh-CN' ? '领取' : 'Claim';

    cy.react('Button')
      .contains(text)
      .click()
      .then(() => {
        expect(fn).to.have.been.calledOnce;
      });
  });
});
