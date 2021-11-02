/// <reference types="cypress" />

describe('Substrate DVM to Substrate', () => {
  before(() => {
    cy.activeMetamask();
  });

  beforeEach(() => {
    cy.visit(Cypress.config().baseUrl + '/#fm%3Ddvm%26tm%3Dnative%26f%3Dpangolin%26t%3Dpangoro');
    cy.waitForReact();
  });

  it('approve before launch tx', () => {
    // cy.acceptMetamaskAccess(); // allow metamask connect;
    cy.get('.ant-notification-notice-btn > .ant-btn')
      .click()
      .then(() => {
        /**
         * !metamask has two steps here: 1. approve  2. switch
         */
        cy.acceptMetamaskSwitch({ networkName: 'pangolin', networkId: 43, isTestnet: true });
        cy.acceptMetamaskSwitch({ networkName: 'pangolin', networkId: 43, isTestnet: true });
      });

    cy.react('RecipientItem').find('input').type('5FA7CzAgT5fNDFRdb4UWSZX3b9HJsPuR7F5BF4YotSpKxAA2');
    cy.react('Erc20Control')
      .find('input')
      .click()
      .then(() => {
        cy.get('.ant-select-item-option-content').contains('xORING').click();
      });
    cy.react('Balance').type('3');

    cy.get('button').contains('approve').click();
    cy.get('.ant-modal-confirm-btns button').contains('Confirm').click();

    cy.wait(5000);
    cy.confirmMetamaskPermissionToSpend();

    cy.get('.ant-modal-confirm-content', { timeout: 1 * 60 * 1000 })
      .find('a')
      .should('have.text', 'View in Etherscan explorer');
  });

  it('should launch tx', () => {
    cy.react('RecipientItem').find('input').type('5FA7CzAgT5fNDFRdb4UWSZX3b9HJsPuR7F5BF4YotSpKxAA2');
    cy.react('Erc20Control')
      .find('input')
      .click()
      .then(() => {
        cy.get('.ant-select-item-option-content').contains('xORING').click();
      });

    /**
     * if type balance immediately, allowance may be fetching, test maybe failed.
     */
    cy.wait(3000);

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

    cy.get('.ant-modal-confirm-content', { timeout: 1 * 60 * 1000 })
      .find('a')
      .should('have.text', 'View in Etherscan explorer');
  });
});
