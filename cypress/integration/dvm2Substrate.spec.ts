/// <reference types="cypress" />

describe('DVM to main net', () => {
  const { pangolinDVM: sender, pangolin: recipient } = Cypress.env('accounts');
  const hrefRegExp = /^https:\/\/pangolin.subscan.io\/extrinsic\/0x\w+$/;

  before(() => {
    cy.activeMetamask();
  });

  beforeEach(() => {
    cy.visit(Cypress.config().baseUrl + '/#fm%3Ddvm%26tm%3Dnative%26f%3Dpangolin%26t%3Dpangolin');
    cy.waitForReact();
  });

  it('just to accept metamask access', () => {
    cy.acceptMetamaskAccess(); // allow metamask connect;
    expect(true).to.true;
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

    cy.checkTxInfo('Pangolin-Smart');
    cy.checkTxInfo('Pangolin');
    cy.checkTxInfo(sender);
    cy.checkTxInfo(recipient);
    cy.checkTxInfo('1');
    cy.confirmTxInfo();

    cy.wait(5000);
    cy.confirmMetamaskTransaction();

    cy.checkTxResult('View in Subscan explorer', hrefRegExp);
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

    cy.checkTxInfo('Pangolin-Smart');
    cy.checkTxInfo('Pangolin');
    cy.checkTxInfo(sender);
    cy.checkTxInfo(recipient);
    cy.checkTxInfo('1');
    cy.confirmTxInfo();

    cy.wait(5000);
    cy.confirmMetamaskTransaction();

    cy.checkTxResult('View in Subscan explorer', hrefRegExp);
  });
});
