/// <reference types="cypress" />

import { DisconnectOutlined } from '@ant-design/icons';
import { mount } from '@cypress/react';
import React from 'react';
import { Destination } from '../components/Destination';
import { NETWORKS } from '../config';

it('renders learn react link', () => {
  mount(<Destination networks={NETWORKS} title="from" extra={<DisconnectOutlined />} />);

  cy.get('.ant-dropdown-trigger').contains('Select Network').should('be.visible');
  cy.get('img[src="image/eth-logo.svg"]').should('be.visible');
  cy.get('.ant-dropdown-trigger')
    .click()
    .then(() => {
      cy.get('.ant-dropdown-menu-item').should('be.visible');
    });
});
