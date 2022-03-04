/// <reference types="cypress" />

describe('Active metamask', () => {
  before(() => {
    cy.activeMetamask();
  });

  beforeEach(() => {
    cy.visit(Cypress.config().baseUrl + '/#fm%3Ddvm%26tm%3Dnative%26f%3Dpangolin%26t%3Dpangolin');
    cy.waitForReact();
  });

  it('Just to accept metamask access', () => {
    cy.acceptMetamaskAccess(); // allow metamask connect;
    expect(true).to.true;
  });
});
