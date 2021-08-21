/// <reference types="cypress" />

describe('Ethereum to Darwinia', () => {
  beforeEach(() => {
    cy.setupMetamask();
    cy.changeMetamaskNetwork('localhost');
    cy.visit(Cypress.config().baseUrl + '/#fm%3Dnative%26tm%3Dnative%26f%3Dropsten%26t%3Dpangolin');
  });

  it('is expected to display a sussess message', () => {
    cy.get('[data-cy=title]').should('contain.text', 'MetaMask Detected');
  });

  it('should display missing wallet modal', () => {
    cy.get('.ant-modal').contains('Missing Wallet Plugin');
  });
});
