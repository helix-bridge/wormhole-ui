/// <reference types="cypress" />

import { Suspense } from 'react';
import { mount } from '@cypress/react';
import { CrossChainRecord } from '../components/record/CrossChain';
import { BrowserRouter } from 'react-router-dom';
import { ApiProvider } from '../providers';
import '../index.scss';
import '../theme/antd/index.less';

describe('Language Component', () => {
  const {
    pangolin: pangolinAccount,
    pangoro: pangoroAccount,
    ropsten: ropstenAccount,
    // pangolinDVM: pangolinDVMAccount,
  } = Cypress.env('accounts');

  it('should not limit search account format', () => {
    mount(
      <Suspense fallback="loading">
        <BrowserRouter>
          <ApiProvider>
            <CrossChainRecord />
          </ApiProvider>
        </BrowserRouter>
      </Suspense>
    );

    cy.waitForReactComponent();

    cy.react('Select')
      .eq(0)
      .click()
      .then(() => {
        cy.get('.ant-select-item-option-content').contains('Darwinia').click();

        cy.react('Search').find('input').type(ropstenAccount);
        cy.react('Button').click();
        cy.get('.ant-message').should('be.visible');

        cy.react('Search').find('input').clear();

        cy.react('Search').find('input').type(pangolinAccount);
        cy.react('Button').click();
        cy.get('.ant-message').should('be.visible');
      });

    cy.react('Select')
      .eq(0)
      .click()
      .then(() => {
        cy.get('.ant-select-item-option-content').contains('Ethereum').click();

        cy.react('Search').find('input').clear();

        cy.react('Search').find('input').type(pangolinAccount);
        cy.react('Button').click();
        cy.get('.ant-message').should('be.visible');

        cy.react('Search').find('input').clear();

        cy.react('Search').find('input').type(pangoroAccount);
        cy.react('Button').click();
        cy.get('.ant-message').should('be.visible');
      });
  });
});
