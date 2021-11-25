/// <reference types="cypress" />

const {
  notificationPageElements,
  permissionsPageElements,
  confirmPageElements,
  signaturePageElements,
} = require('../pages/metamask/notification-page');

describe('Ethereum to Darwinia', () => {
  before(() => {
    cy.activeMetamask();
  });

  beforeEach(() => {
    cy.visit(Cypress.config().baseUrl + '/#fm%3Dnative%26tm%3Dnative%26f%3Dropsten%26t%3Dpangolin');
    cy.waitForReact();
  });

  it('display action buttons', () => {
    cy.acceptMetamaskAccess(); // allow metamask connect;
    cy.react('SubmitButton').should('be.visible');
    cy.react('FromItemButton').contains('Disconnect').should('exist');
  });

  it('should launch ring transfer properly', () => {
    cy.react('RecipientItem').find('input').type('2pr19FiRxWEcerFt4tS3ZnJjhBXak69KNoJuGkaEY8ngBXEd');
    cy.react('Balance').type('3.14');

    cy.react('SubmitButton').click();

    cy.get('.ant-modal-confirm-content .ant-typography').contains('Ropsten');
    cy.get('.ant-modal-confirm-content .ant-typography').contains('Pangolin');
    cy.get('.ant-modal-confirm-content .ant-typography').contains('0x245b4775082c144c22a4874b0fba8c70c510c5ae');
    cy.get('.ant-modal-confirm-content .ant-typography').contains('2pr19FiRxWEcerFt4tS3ZnJjhBXak69KNoJuGkaEY8ngBXEd');
    cy.get('.ant-modal-confirm-content .ant-typography').contains('1.14');

    cy.get('.ant-modal-confirm-btns button').contains('Confirm').click();

    cy.wait(5000);
    cy.confirmMetamaskTransaction();

    cy.get('.ant-modal-confirm-content', { timeout: 1 * 60 * 1000 })
      .find('a')
      .should('have.text', 'View in Etherscan explorer');
  });

  it('should launch kton transfer properly', () => {
    cy.react('RecipientItem').find('input').type('2pr19FiRxWEcerFt4tS3ZnJjhBXak69KNoJuGkaEY8ngBXEd');
    cy.react('Select', { props: { placeholder: 'Select Assets' } })
      .click()
      .then(() => {
        cy.get('.ant-select-item-option-content').contains('KTON').click();
      });
    cy.react('Balance').type('1.234');

    cy.react('SubmitButton').click();

    cy.get('.ant-modal-confirm-content .ant-typography').contains('Ropsten');
    cy.get('.ant-modal-confirm-content .ant-typography').contains('Pangolin');
    cy.get('.ant-modal-confirm-content .ant-typography').contains('0x245b4775082c144c22a4874b0fba8c70c510c5ae');
    cy.get('.ant-modal-confirm-content .ant-typography').contains('2pr19FiRxWEcerFt4tS3ZnJjhBXak69KNoJuGkaEY8ngBXEd');
    cy.get('.ant-modal-confirm-content .ant-typography').contains('1.234');

    cy.get('.ant-modal-confirm-btns button').contains('Confirm').click();

    cy.wait(5000);
    cy.confirmMetamaskTransaction();

    cy.get('.ant-modal-confirm-content', { timeout: 1 * 60 * 1000 })
      .find('a')
      .should('have.text', 'View in Etherscan explorer');
  });
});
