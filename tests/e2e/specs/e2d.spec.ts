/// <reference types="cypress" />

describe('Ethereum to Darwinia', () => {
  beforeEach(() => {
    // cy.stub(network, 'connect').returns(
    //   of({
    //     accounts: ['0x245B4775082C144C22a4874B0fBa8c70c510c5AE'],
    //     status: 'success',
    //     chainId: '3',
    //     type: 'metamask',
    //   })
    // );
    cy.visit(Cypress.config().baseUrl + '/#fm%3Dnative%26tm%3Dnative%26f%3Dropsten%26t%3Dpangolin');
  });

  it('should connect', () => {
    cy.get('.anticon-disconnect').should('have.css', 'color');
  });

  it('should display missing wallet modal', () => {
    cy.get('.ant-modal').contains('Missing Wallet Plugin');
  });
});
