import React, { Suspense } from 'react';
import { mount } from '@cypress/react';
import { Balance } from '../components/controls/Balance';
import '../index.scss';
import '../theme/antd/index.less';

describe('Balance Component', () => {
  it('use default precision (9)', () => {
    mount(
      <Suspense fallback="loading">
        <Balance />
      </Suspense>
    );

    cy.waitForReactComponent();
    cy.react('InputNumber').find('input').type('123.111029298382');
    cy.react('InputNumber').find('input').blur();
    cy.react('InputNumber').find('input').should('have.value', '123.111029298');

    cy.react('InputNumber').find('input').clear();
    cy.react('InputNumber').find('input').type('2');
    cy.react('InputNumber').find('input').blur();
    cy.react('InputNumber').find('input').should('have.value', '2.000000000');

    cy.react('InputNumber').find('input').clear();
    cy.react('InputNumber').find('input').type('-1');
    cy.react('InputNumber').find('input').blur();
    cy.react('InputNumber').find('input').should('have.value', '0.000000000');
  });

  it.skip('output value', () => {
    const fn = cy.spy();
    mount(
      <Suspense fallback="loading">
        <Balance onChange={fn} />
      </Suspense>
    );

    cy.waitForReactComponent();
    cy.react('InputNumber').find('input').type('12345');
    cy.react('InputNumber').find('input').blur();
    expect(fn).to.be.called.calledWith('12345.000000000');
  });
});
