/// <reference types="cypress" />

const {
  notificationPageElements,
  permissionsPageElements,
  confirmPageElements,
  signaturePageElements,
} = require('../pages/metamask/notification-page');

describe('Ethereum to Darwinia', () => {
  beforeEach(() => {
    cy.visit(Cypress.config().baseUrl + '/#fm%3Dnative%26tm%3Dnative%26f%3Dropsten%26t%3Dpangolin');
  });

  /**
   * Test below actually should in unit tests;
   */
  it('should check recipient format', () => {
    cy.acceptMetamaskAccess();
    cy.get('#transfer_recipient').type('0xak13ks9fkFelwflsk', { animationDistanceThreshold: 1 });
    cy.get('div[role="alert"]').contains('Please enter a valid Pangolin address');
  });

  it('should launch tx', () => {
    cy.get('#transfer_recipient').type('2pr19FiRxWEcerFt4tS3ZnJjhBXak69KNoJuGkaEY8ngBXEd');
    cy.get('#transfer_amount').type('5');

    cy.get('button[type="submit"]').click();

    cy.get('.ant-modal-confirm-content .ant-typography .capitalize').first().contains('ropsten');
    cy.get('.ant-modal-confirm-content .ant-typography .capitalize').last().contains('pangolin');
    cy.get('.ant-modal-confirm-content .ant-typography').contains('0x245b4775082c144c22a4874b0fba8c70c510c5ae');
    cy.get('.ant-modal-confirm-content .ant-typography').contains('2pr19FiRxWEcerFt4tS3ZnJjhBXak69KNoJuGkaEY8ngBXEd');
    cy.get('.ant-modal-confirm-content .ant-typography').contains('3');

    cy.get('.ant-modal-confirm-btns button').contains('Confirm').click();

    cy.confirmMetamaskTransaction();

    cy.get('.ant-modal-confirm-content', { timeout: 2 * 60 * 1000 })
      .find('a')
      .should('have.text', 'View in Etherscan browser');
  });
});
