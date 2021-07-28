/// <reference types="cypress" />

describe('Theme tests', () => {
  before(() => {
    cy.viewport(1024, 768);
    cy.visit(Cypress.config().baseUrl);
  });

  it('should in dark mode by default', () => {
    cy.get('header .ant-switch').should('be.visible').and('have.class', 'ant-switch-checked');
    cy.get('header .ant-switch').click();
  });
});
