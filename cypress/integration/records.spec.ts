/// <reference types="cypress" />

describe('History records', () => {
  const {
    pangolin: pangolinAccount,
    pangoro: pangoroAccount,
    ropsten: ropstenAccount,
    pangolinDVM: pangolinDVMAccount,
  } = Cypress.env('accounts');

  before(() => {
    cy.activeMetamask();
  });

  beforeEach(() => {
    cy.visit(Cypress.config().baseUrl + '/history');
    cy.waitForReact();
  });

  it('should display e2d records properly', () => {
    //     cy.acceptMetamaskAccess(); // allow metamask connect;
    cy.intercept(
      {
        method: 'GET',
        url: 'https://api.darwinia.network.l2me.com/api/redeem*',
      },
      { fixture: 'e2d.records.json' }
    );

    cy.react('Select')
      .eq(0)
      .click()
      .then(() => {
        cy.get('.ant-select-item-option-content').contains('Ropsten').click();
      });
    cy.react('Search').find('input').type(ropstenAccount);
  });

  it.only('should display d2e records and launch claim', () => {
    cy.intercept(
      {
        method: 'GET',
        url: 'https://api.darwinia.network.l2me.com/api/ethereumBacking/locks*',
      },
      { fixture: 'd2e.records.json' }
    );

    cy.react('Select')
      .eq(0)
      .click()
      .then(() => {
        cy.get('.ant-select-item-option-content')
          .contains(/Pangolin/g)
          .click();
      });

    cy.react('Search').find('input').type(pangolinAccount);

    // claim
    cy.react('Record')
      .eq(1)
      .click()
      .then(() => {
        cy.react('Button').contains('Claim').click();
        cy.wait(30 * 1000);
        // do not claim it
        cy.rejectMetamaskTransaction();
      });
  });

  it('should display substrate to substrate DVM records properly', () => {
    cy.intercept(
      {
        method: 'POST',
        url: 'https://api.subquery.network/sq/darwinia-network/pangoro',
      },
      { fixture: 's2sDVM.records.json' }
    );

    cy.react('Select')
      .eq(0)
      .click()
      .then(() => {
        cy.get('.ant-select-item-option-content').contains('Pangoro').click();
      });
    cy.react('Search').find('input').type(pangoroAccount);
  });

  it('should display substrate DVM to substrate records properly', () => {
    cy.intercept(
      {
        method: 'POST',
        url: 'https://pangolin-thegraph.darwinia.network/subgraphs/name/wormhole/Sub2SubMappingTokenFactory',
      },
      { fixture: 'sDVM2s.records.json' }
    );

    cy.react('Select')
      .eq(0)
      .click()
      .then(() => {
        cy.get('.ant-select-item-option-content').contains('Pangolin-Smart').click();
      });

    cy.react('Select')
      .eq(1)
      .click()
      .then(() => {
        cy.get('.ant-select-item-option-content span[title="To"]').contains('Pangoro').click();
      });
    cy.react('Search').find('input').type(pangolinDVMAccount);
  });
});
