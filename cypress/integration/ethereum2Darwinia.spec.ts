/// <reference types="cypress" />

describe('Ethereum to Darwinia', () => {
  const { pangolin: recipient, ropsten: sender } = Cypress.env('accounts');
  const hrefRegExp = /^https:\/\/ropsten.etherscan.io\/tx\/0x\w+$/;

  before(() => {
    // cy.activeMetamask();
  });

  beforeEach(() => {
    cy.visit(Cypress.config().baseUrl + '/#fm%3Dnative%26tm%3Dnative%26f%3Dropsten%26t%3Dpangolin');
    cy.waitForReact();
  });

  it.only('should launch ring tx', () => {
    cy.react('RecipientItem').find('input').type(recipient);
    cy.react('Select', { props: { placeholder: 'Select Assets' } })
      .click()
      .then(() =>
        cy
          .react('TransferInfo')
          .get('span')
          .contains('Cross-chain Fee', { timeout: 1 * 60 * 1000 })
      )
      .then(() => {
        cy.react('Balance').type('3.14');
      });
    cy.react('SubmitButton').click();

    cy.checkTxInfo('Ropsten');
    cy.checkTxInfo('Pangolin');
    cy.checkTxInfo(sender);
    cy.checkTxInfo(recipient);
    cy.checkTxInfo('1.14');
    cy.confirmTxInfo();

    cy.wait(5000);
    cy.confirmMetamaskTransaction();

    cy.checkTxResult('View in Etherscan explorer', hrefRegExp, 3 * 60 * 1000);
  });

  it('should launch kton tx', () => {
    cy.react('RecipientItem').find('input').type(recipient);
    cy.react('Select', { props: { placeholder: 'Select Assets' } })
      .click()
      .then(() => {
        cy.get('.ant-select-item-option-content').contains('KTON').click();
      });
    cy.react('Balance').type('1.234');
    cy.react('SubmitButton').click();

    cy.checkTxInfo('Ropsten');
    cy.checkTxInfo('Pangolin');
    cy.checkTxInfo(sender);
    cy.checkTxInfo(recipient);
    cy.checkTxInfo('1.234');
    cy.confirmTxInfo();

    cy.wait(5000);
    cy.confirmMetamaskTransaction();

    cy.checkTxResult('View in Etherscan explorer', hrefRegExp, 3 * 60 * 1000);
  });
});
