/// <reference types="cypress" />

import { DisconnectOutlined } from '@ant-design/icons';
import { mount } from '@cypress/react';
import React, { Suspense } from 'react';
import { Destination } from '../components/controls/Destination';
import { NETWORKS } from '../config';
import '../index.scss';
import '../theme/antd/index.less';

describe('Destination component', () => {
  it('renders learn react link', () => {
    mount(
      <Suspense fallback="loading">
        <Destination
          networks={NETWORKS}
          defaultLogo="/public/image/logo.png"
          title="from"
          extra={<DisconnectOutlined />}
        />
      </Suspense>
    );

    cy.get('.ant-dropdown-trigger').contains('Select Network').should('be.visible');
    cy.get('img[src="/public/image/logo.png"]').should('be.visible');
    cy.get('.ant-dropdown-trigger')
      .click()
      .then(() => {
        cy.get('.ant-dropdown-menu-item').should('be.visible');
      });
  });

  it('Display the selected network', () => {
    mount(
      <Suspense fallback="loading">
        <Destination networks={NETWORKS} title="to" />
      </Suspense>
    );

    cy.get('.ant-dropdown-trigger')
      .click()
      .then(() => {
        cy.get('.ant-dropdown-menu-item').contains('Crab Mainnet').click();
        cy.get('.ant-dropdown-trigger').contains('Crab Mainnet');
      });
  });

  it('Should render the extra icon', () => {
    mount(
      <Suspense fallback="loading">
        <Destination networks={NETWORKS} title="to" extra={<div>extra area</div>} />
      </Suspense>
    );

    cy.get('.ant-dropdown-trigger').contains('extra area');
  });
});
