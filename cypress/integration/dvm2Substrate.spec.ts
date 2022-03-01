/// <reference types="cypress" />

describe('DVM to main net', () => {
  const { pangolinDVM: sender, pangolin: recipient } = Cypress.env('accounts');

  before(() => {
    //     cy.activeMetamask();
  });

  beforeEach(() => {
    cy.visit(Cypress.config().baseUrl + '/#fm%3Ddvm%26tm%3Dnative%26f%3Dpangolin%26t%3Dpangolin');
    cy.waitForReact();
  });

  it('should launch ring tx', () => {
    // cy.acceptMetamaskAccess(); // allow metamask connect;
    cy.get('.ant-notification-notice-btn > .ant-btn')
      .click()
      .then(() => {
        // metamask may have two steps here: 1. approve  2. switch
        cy.acceptMetamaskSwitch({ networkName: 'pangolin', networkId: 43, isTestnet: true });
        cy.acceptMetamaskSwitch({ networkName: 'pangolin', networkId: 43, isTestnet: true });
      });

    cy.react('RecipientItem').find('input').type(recipient);

    /**
     * if type balance immediately, allowance may be fetching, test maybe failed.
     */
    cy.wait(3000);

    cy.react('Select', { props: { placeholder: 'Please select token to be transfer' } })
      .click()
      .then(() => {
        cy.get('.ant-select-item-option-content').contains('PRING').click();
      });

    cy.react('Balance').type('1');
    cy.react('SubmitButton').click();

    cy.get('.ant-modal-confirm-content .ant-typography').contains('Pangolin-Smart');
    cy.get('.ant-modal-confirm-content .ant-typography').contains('Pangolin');
    cy.get('.ant-modal-confirm-content .ant-typography').contains(sender);
    cy.get('.ant-modal-confirm-content .ant-typography').contains(recipient);
    cy.get('.ant-modal-confirm-content .ant-typography').contains('1');

    cy.get('.ant-modal-confirm-btns button').contains('Confirm').click();

    cy.wait(5000);
    cy.confirmMetamaskTransaction();

    cy.get('.ant-modal-confirm-content', { timeout: 1 * 60 * 1000 })
      .find('a')
      .should('have.text', 'View in Subscan explorer');
  });

  it('should launch kton tx', () => {
    cy.react('RecipientItem').find('input').type(recipient);

    /**
     * if type balance immediately, allowance may be fetching, test maybe failed.
     */
    cy.wait(3000);

    cy.react('Select', { props: { placeholder: 'Please select token to be transfer' } })
      .click()
      .then(() => {
        cy.get('.ant-select-item-option-content').contains('PKTON').click();
      });

    cy.react('Balance').type('1');
    cy.react('SubmitButton').click();

    cy.get('.ant-modal-confirm-content .ant-typography').contains('Pangolin-Smart');
    cy.get('.ant-modal-confirm-content .ant-typography').contains('Pangolin');
    cy.get('.ant-modal-confirm-content .ant-typography').contains(sender);
    cy.get('.ant-modal-confirm-content .ant-typography').contains(recipient);
    cy.get('.ant-modal-confirm-content .ant-typography').contains('1');

    cy.get('.ant-modal-confirm-btns button').contains('Confirm').click();

    cy.wait(5000);
    cy.confirmMetamaskTransaction();

    cy.get('.ant-modal-confirm-content', { timeout: 1 * 60 * 1000 })
      .find('a')
      .should('have.text', 'View in Subscan explorer');
  });
});
