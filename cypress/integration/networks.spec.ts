/// <reference types="cypress" />

describe('Networks Panel', () => {
  before(() => {
    cy.activeMetamask();
  });

  beforeEach(() => {
    cy.visit(Cypress.config().baseUrl + '/#fm%3Dnative%26tm%3Dnative%26f%3Dropsten%26t%3Dpangolin');
  });

  it('should display departure and destination properly', () => {
    cy.get('.anticon-link').should('be.visible');

    cy.get('img[src="/image/eth-logo.svg"]').should('be.visible');
    cy.get('img[src="/image/eth-logo.svg"]').next('span').find('.ant-tag').prev().should('have.text', 'Ropsten');
    cy.get('img[src="/image/eth-logo.svg"]').next('span').find('.ant-tag').should('have.text', 'Test');

    cy.get('img[src="/image/pangolin.png"]').should('be.visible');
    cy.get('img[src="/image/pangolin.png"]').next('span').find('.ant-tag').prev().should('have.text', 'Pangolin');
    cy.get('img[src="/image/pangolin.png"]').next('span').find('.ant-tag').should('have.text', 'Test');
  });
});
