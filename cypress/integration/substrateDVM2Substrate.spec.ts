/// <reference types="cypress" />

describe('Substrate DVM to Substrate', () => {
  beforeEach(() => {
    cy.visit(Cypress.config().baseUrl + '/#fm%3Ddvm%26tm%3Dnative%26f%3Dpangolin%26t%3Dpangoro');
    cy.waitForReact();
  });

  /**
   * Test below actually should in unit tests;
   */
  it('should check recipient format', () => {
    cy.acceptMetamaskAccess(); // allow metamask connect;
    cy.get('#transfer_recipient').type('0xak13ks9fkFelwflsk', { animationDistanceThreshold: 1 });
    cy.get('div[role="alert"]').contains('Please enter a valid Pangoro address');
  });

  it('should launch tx', () => {
    cy.react('RecipientItem').find('input').type('5FA7CzAgT5fNDFRdb4UWSZX3b9HJsPuR7F5BF4YotSpKxAA2');
    cy.react('Erc20Control').find('select').select('xORING');
    cy.react('Balance').type('3');

    cy.react('SubmitButton').click();

    cy.get('.ant-modal-confirm-content .ant-typography').contains('Pangolin-Smart');
    cy.get('.ant-modal-confirm-content .ant-typography').contains('Pangoro');
    cy.get('.ant-modal-confirm-content .ant-typography').contains('0x245b4775082c144c22a4874b0fba8c70c510c5ae');
    cy.get('.ant-modal-confirm-content .ant-typography').contains('5FA7CzAgT5fNDFRdb4UWSZX3b9HJsPuR7F5BF4YotSpKxAA2');
    cy.get('.ant-modal-confirm-content .ant-typography').contains('3');

    cy.get('.ant-modal-confirm-btns button').contains('Confirm').click();

    cy.wait(5000);
    cy.confirmMetamaskTransaction();

    cy.get('.ant-modal-confirm-content', { timeout: 2 * 60 * 1000 })
      .find('a')
      .should('have.text', 'View in Etherscan explorer');
  });
});
