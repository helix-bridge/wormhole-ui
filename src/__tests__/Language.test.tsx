import React, { Suspense } from 'react';
import { mount } from '@cypress/react';
import { Language } from '../components/Language';
import '../index.scss';
import '../theme/antd/index.less';

describe('Language Component', () => {
  it('should render the language switch with network color', () => {
    mount(
      <Suspense fallback="loading">
        <Language color="#000" network="pangolin" />
      </Suspense>
    );

    cy.get('.ant-btn').should('be.visible').and('have.class', 'text-pangolin-main');
  });

  it('has en an zh menus', () => {
    mount(
      <Suspense fallback="loading">
        <Language color="#000" network="pangolin" />
      </Suspense>
    );

    cy.get('.ant-btn').click();
    cy.get('.ant-dropdown-menu').contains('中文');
    cy.get('.ant-dropdown-menu').contains('English');
  });

  it('can switch language', () => {
    mount(
      <Suspense fallback="loading">
        <Language color="#000" network="pangolin" />
      </Suspense>
    );

    cy.get('.ant-btn').click();
    cy.get('.ant-dropdown-menu').contains('中文').click();
    cy.get('.ant-btn').contains('中文');
  });
});
