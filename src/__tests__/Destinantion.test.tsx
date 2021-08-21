/// <reference types="cypress" />

import { DisconnectOutlined } from '@ant-design/icons';
import { mount } from '@cypress/react';
import React, { Suspense } from 'react';
import { Destination } from '../components/controls/Destination';
import { NETWORKS } from '../config';
import '../index.scss';
import '../theme/antd/index.less';
import i18n from '../config/i18n';
import { img } from './utils';

i18n.init({
  lng: 'en',
});

describe('Destination component', () => {
  it('should display network logo', () => {
    mount(
      <Suspense fallback="loading">
        <Destination networks={NETWORKS} defaultLogo={img('network.png')} title="from" />
      </Suspense>
    );
    cy.get(`img[src="${img('network.png')}"]`).should('be.visible');
  });

  it('should display default menu content', () => {
    mount(
      <Suspense fallback="loading">
        <Destination networks={NETWORKS} defaultLogo={img('network.png')} title="from" />
      </Suspense>
    );
    cy.get('.ant-dropdown-trigger').contains('Select Network').should('be.visible');
  });

  it('should display the network menus properly', () => {
    mount(
      <Suspense fallback="loading">
        <Destination networks={NETWORKS} defaultLogo={img('network.png')} title="from" />
      </Suspense>
    );

    cy.get('.ant-dropdown-trigger')
      .click()
      .then(() => {
        // menu total = network length + 1;
        cy.get('.ant-dropdown-menu-item')
          .should('be.visible')
          .and('have.length', NETWORKS.length + 1);

        // all networks should be rendered
        NETWORKS.forEach((network) => {
          cy.get('.ant-dropdown-menu-item').contains(network.fullName);
        });

        // test networks should have tag sibling
        NETWORKS.filter((item) => item.isTest).forEach((network) => {
          cy.get('.ant-dropdown-menu-item').contains(network.fullName).next().contains('Test');
        });
      });
  });

  it('Display the network correctly', () => {
    const logo = img(NETWORKS[2].facade.logo.split('/')[1]);
    const value = { ...NETWORKS[2], facade: { logo, logoWithText: '' } };

    mount(
      <Suspense fallback="loading">
        <Destination
          value={value}
          networks={NETWORKS}
          defaultLogo={img('network.png')}
          title="from"
          extra={<DisconnectOutlined />}
        />
      </Suspense>
    );
    cy.get('.ant-dropdown-trigger').contains(NETWORKS[2].fullName);
    cy.get(`img[src="${logo}"]`).should('be.visible');
  });

  it('Should render the extra icon', () => {
    mount(
      <Suspense fallback="loading">
        <Destination networks={NETWORKS} defaultLogo={img('network.png')} title="from" extra={<DisconnectOutlined />} />
      </Suspense>
    );
    cy.get('.ant-dropdown-trigger').find('.anticon-disconnect');
  });
});
