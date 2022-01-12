/// <reference types="cypress" />

import { mount } from '@cypress/react';
import { Suspense } from 'react';
import { ProgressProps, State } from '../components/record/Progress';
import { Record, RecordProps } from '../components/record/Record';
import { pangoroConfig as pangoro, pangolinConfig as pangolin, ropstenConfig as ropsten } from '../config';
import '../index.scss';
import '../theme/antd/index.less';
import { img } from './utils';

const sent: ProgressProps = {
  title: 'Pangolin Sent',
  steps: [{ state: State.completed }],
  network: pangolin,
  icon: img('pangolin.svg'),
};

const originConfirmed: ProgressProps = {
  title: 'Pangolin Confirmed',
  steps: [{ state: State.completed }],
  network: pangolin,
  icon: img('pangolin.svg'),
};

const delivered: ProgressProps = {
  title: 'Pangolin delivered',
  steps: [{ state: State.completed }],
  network: null,
  icon: img('deliver.svg'),
};

const targetConfirmed: ProgressProps = {
  title: 'Ropsten Confirmed',
  steps: [{ state: State.completed }],
  network: ropsten,
  icon: img('pangolin.svg'),
};

describe('Record Component', () => {
  it('should display completed step', () => {
    const props: RecordProps = {
      departure: pangolin,
      arrival: pangoro,
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
