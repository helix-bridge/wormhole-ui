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

  it('should display ethereum to darwinia records', () => {
    //     cy.acceptMetamaskAccess(); // allow metamask connect;
    cy.intercept(
      {
        method: 'GET',
        url: 'https://api.darwinia.network.l2me.com/api/redeem*',
      },
      { fixture: 'e2d.records.json' }
    );

    cy.selectFrom('Ropsten');
    cy.selectTo('Pangolin');
    cy.setSearchAccount(ropstenAccount);

    cy.react('Record').should('have.length', 10);
  });

  it('should display darwinia to ethereum records and launch claim', () => {
    cy.intercept(
      {
        method: 'GET',
        url: 'https://api.darwinia.network.l2me.com/api/ethereumBacking/locks*',
      },
      { fixture: 'd2e.records.json' }
    );

    cy.selectFrom(/^Pangolin$/);
    cy.selectTo('Ropsten');
    cy.setSearchAccount(pangolinAccount);

    cy.react('Record').should('have.length', 6);

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

  it('should display substrate to substrate DVM records', () => {
    cy.intercept(
      {
        method: 'POST',
        url: 'https://api.subquery.network/sq/darwinia-network/pangoro',
      },
      { fixture: 's2sDVM.records.json' }
    );

    cy.selectFrom('Pangoro');
    cy.selectTo('Pangolin-Smart');
    cy.setSearchAccount(pangoroAccount);

    cy.react('Record').should('have.length', 8);
  });

  it('should display substrate DVM to substrate records', () => {
    cy.intercept(
      {
        method: 'POST',
        url: 'https://pangolin-thegraph.darwinia.network/subgraphs/name/wormhole/Sub2SubMappingTokenFactory',
      },
      { fixture: 'sDVM2s.records.json' }
    );

    cy.selectFrom('Pangolin-Smart');
    cy.selectTo('Pangoro');
    cy.setSearchAccount(pangolinDVMAccount);

    cy.react('Record').should('have.length', 10);
  });

  it('should display DVM to substrate records', () => {
    cy.intercept(
      {
        method: 'POST',
        url: 'https://api.subquery.network/sq/darwinia-network/wormhole-pangolin',
      },
      { fixture: 'dvm2s.records.json' }
    );

    cy.selectFrom('Pangolin-Smart');
    cy.selectTo('Pangolin');
    cy.setSearchAccount(pangolinDVMAccount);

    cy.react('Record').should('have.length', 4);
  });

  it('should display substrate to DVM records', () => {
    cy.intercept(
      {
        method: 'POST',
        url: 'https://api.subquery.network/sq/darwinia-network/wormhole-pangolin',
      },
      { fixture: 's2dvm.records.json' }
    );

    cy.selectFrom(/^Pangolin$/);
    cy.selectTo('Pangolin-Smart');
    cy.setSearchAccount(pangolinAccount);

    cy.react('Record').should('have.length', 9);
  });
});
