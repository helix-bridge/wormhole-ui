/// <reference types="cypress" />
// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';
import 'cypress-react-selector';
import { configure } from '@testing-library/cypress';

// Alternatively you can use CommonJS syntax:
// require('./commands')

Cypress.on('window:before:load', (window) => {
  Object.defineProperty(window.navigator, 'language', { value: 'en-US' });
  Object.defineProperty(window.navigator, 'languages', { value: ['en'] });
  Object.defineProperty(window.navigator, 'accept_languages', { value: ['en'] });
});

configure({ testIdAttribute: 'data-testid' });

// dont fail tests on uncaught exceptions of websites
Cypress.on('uncaught:exception', () => {
  if (!process.env.FAIL_ON_ERROR) {
    return false;
  }
});

Cypress.on('window:before:load', (win) => {
  cy.stub(win.console, 'error').callsFake((message) => {
    // @ts-ignore
    cy.now('task', 'error', message);
    // fail test on browser console error
    if (process.env.FAIL_ON_ERROR) {
      throw new Error(message);
    }
  });

  cy.stub(win.console, 'warn').callsFake((message) => {
    // @ts-ignore
    cy.now('task', 'warn', message);
  });
});

before(() => {
  cy.setupMetamask(
    'add, door, once, guide, nest, upper, minute, donkey, liar, wool, reflect, satisfy',
    'ropsten',
    'qwertyuiop'
  );
});
