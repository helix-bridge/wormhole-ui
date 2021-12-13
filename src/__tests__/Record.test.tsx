import { mount } from '@cypress/react';
import React, { Suspense } from 'react';
import { ProgressProps, State } from '../components/records/Progress';
import { Record, RecordProps } from '../components/records/Record';
import { NETWORK_CONFIG } from '../config';
import '../index.scss';
import '../theme/antd/index.less';
import { img } from './utils';

const sent: ProgressProps = {
  title: 'Pangolin Sent',
  steps: [{ name: '', state: State.completed }],
  network: NETWORK_CONFIG.pangolin,
  icon: img('pangolin.svg'),
};

const originConfirmed: ProgressProps = {
  title: 'Pangolin Confirmed',
  steps: [{ name: '', state: State.completed }],
  network: NETWORK_CONFIG.pangolin,
  icon: img('pangolin.svg'),
};

const delivered: ProgressProps = {
  title: 'Pangolin delivered',
  steps: [{ name: '', state: State.completed }],
  network: null,
  icon: img('deliver.svg'),
};

const targetConfirmed: ProgressProps = {
  title: 'Ropsten Confirmed',
  steps: [{ name: '', state: State.completed }],
  network: NETWORK_CONFIG.ropsten,
  icon: img('pangolin.svg'),
};

describe('Record Component', () => {
  it('should display completed step', () => {
    const props: RecordProps = {
      departure: NETWORK_CONFIG.pangolin,
      arrival: NETWORK_CONFIG.pangoro,
      blockTimestamp: Date.now(),
      assets: [
        { amount: '9000000000', unit: 'gwei', currency: 'ring' },
        { amount: '100000000', unit: 'gwei', currency: 'kton' },
      ],
      recipient: Cypress.env('accounts').ropsten,
      items: [sent, originConfirmed, delivered, targetConfirmed],
    };
    mount(
      <Suspense fallback="loading">
        <Record {...props} />
      </Suspense>
    );

    cy.waitForReactComponent();

    cy.contains('9').should('be.visible');
    cy.contains('0.1').should('be.visible');
    cy.react('Progress', { props: { percent: 100, strokeColor: '#10b981' } }).should('have.length', 1);
  });
});
