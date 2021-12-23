/// <reference types="cypress" />

import { mount } from '@cypress/react';
import { Balance } from '../components/controls/Balance';
import '../index.scss';
import '../theme/antd/index.less';

describe('Balance Component', () => {
  it('should use default precision 9 to display', () => {
    mount(<Balance />);

    cy.waitForReactComponent();
    cy.react('InputNumber').find('input').as('balance');
    cy.get('@balance').type('123.111029298382');
    cy.get('@balance').blur();
    cy.get('@balance').should('have.value', '123.111029298');

    cy.get('@balance').clear();
    cy.get('@balance').type('2');
    cy.get('@balance').blur();
    cy.get('@balance').should('have.value', '2.000000000');

    cy.get('@balance').clear();
    cy.get('@balance').type('-1');
    cy.get('@balance').blur();
    cy.get('@balance').should('have.value', '0.000000000');
  });

  it('should output the typed value', () => {
    const fn = cy.stub().as('listener');
    mount(<Balance onChange={fn} />);

    cy.waitForReactComponent();
    cy.react('InputNumber').find('input').as('balance');
    cy.get('@balance').type('123.45');
    cy.get('@listener')
      .should('have.been.called')
      .its('lastCall.args')
      .then(([arg]) => {
        expect(arg).eq('123.45');
      });
  });

  it('should output unformatted value', () => {
    const fn = cy.stub().as('listener');
    mount(<Balance value="123,456.7" onChange={fn} />);

    cy.waitForReactComponent();
    cy.react('InputNumber').find('input').as('balance');
    cy.get('@balance').focus();
    cy.get('@balance').blur();
    cy.get('@listener')
      .should('have.been.called')
      .its('lastCall.args')
      .then(([arg]) => {
        expect(arg).eq('123456.7');
      });
  });
});
