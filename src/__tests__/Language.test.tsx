import React, { Suspense } from 'react';
import { mount } from '@cypress/react';
import { Language } from '../components/Language';
import '../index.scss';
import '../theme/antd/index.less';

describe('render', () => {
  it('should render the language switch with network color', () => {
    mount(
      <Suspense fallback="loading">
        <Language network="pangolin" />
      </Suspense>
    );

    cy.get('.ant-btn').should('be.visible').and('have.class', 'text-pangolin-main');
  });
});
