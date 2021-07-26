import React, { Suspense } from 'react';
import { mount } from '@cypress/react';
import { ShortAccount } from '../components/ShortAccount';
import '../index.scss';
import '../theme/antd/index.less';

const account = '0xE2faa0277EF9264C8AFc10A556D438C54a718B07';

describe('Render short account', () => {
  beforeEach(() => {
    cy.viewport(1024, 768);
  });

  it('should render the account with copy icon', () => {
    mount(
      <Suspense fallback="loading">
        <ShortAccount account={account} className="short" />
      </Suspense>
    );

    cy.get('.short').should('be.visible');
    cy.get('.anticon').should('be.visible');
  });

  it('Should display short account', () => {
    mount(
      <Suspense fallback="loading">
        <ShortAccount account={account} className="short" />
      </Suspense>
    );

    cy.get('.short').contains('0xE2fa...718B07');
  });

  it('the copy icon color should be the set', () => {
    mount(
      <Suspense fallback="loading">
        <ShortAccount account={account} className="short" color="red" />
      </Suspense>
    );

    cy.get('.anticon').should('have.css', 'color', 'rgb(255, 0, 0)');
  });
});
