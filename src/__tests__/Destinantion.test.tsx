/// <reference types="cypress" />

import { DisconnectOutlined } from '@ant-design/icons';
import { mount } from '@cypress/react';
import { Suspense } from 'react';
import { Destination } from '../components/controls/Destination';
import '../index.scss';
import '../theme/antd/index.less';
import i18n from '../config/i18n';
import { img } from './utils';
import { getDisplayName, CROSS_CHAIN_NETWORKS } from '../utils';
import { upperFirst } from 'lodash';

i18n.init({
  lng: 'en',
});

const patchedNetworks = CROSS_CHAIN_NETWORKS.map((item) => ({
  ...item,
  facade: { ...item.facade, logo: '/public' + item.facade.logo },
}));

context('Destination component', () => {
  describe('select mode', () => {
    it('should render all network options', () => {
      mount(
        <Suspense fallback="loading">
          <Destination networks={patchedNetworks} title="from" />
        </Suspense>
      );

      cy.get('.ant-select')
        .click()
        .then(() => {
          patchedNetworks.forEach((item) => {
            cy.get(`img[src="${item.facade.logo}"]`).should('be.visible');
            cy.contains(getDisplayName(item));

            if (item.isTest) {
              cy.contains(getDisplayName(item)).next().contains('Test');
            }
          });
        });
    });

    it('display selected network', () => {
      const target = patchedNetworks.find((item) => item.name === 'pangolin');

      mount(
        <Suspense fallback="loading">
          <Destination networks={patchedNetworks} value={target} title="from" />
        </Suspense>
      );
      cy.get(`img[src="${target!.facade.logo}"]`).should('be.visible');
      cy.contains(getDisplayName(target!));
      cy.get('.ant-tag').contains('Test');
    });

    it('can select network', () => {
      const target = patchedNetworks.find((item) => item.name === 'pangoro');

      mount(
        <Suspense fallback="loading">
          <Destination networks={patchedNetworks} title="from" />
        </Suspense>
      );

      cy.get('.ant-select').click();
      cy.get('.ant-select-item').contains(getDisplayName(target!)).click();
      cy.get(`img[src="${target!.facade.logo}"]`).should('be.visible');
      cy.contains(getDisplayName(target!));
      cy.get('.ant-tag').contains('Test');
    });
  });

  describe('card mode', () => {
    it('should display network logo', () => {
      mount(
        <Suspense fallback="loading">
          <Destination networks={CROSS_CHAIN_NETWORKS} mode="card" defaultLogo={img('network.png')} title="from" />
        </Suspense>
      );
      cy.get(`img[src="${img('network.png')}"]`).should('be.visible');
    });

    it('should display default menu content', () => {
      mount(
        <Suspense fallback="loading">
          <Destination networks={CROSS_CHAIN_NETWORKS} mode="card" defaultLogo={img('network.png')} title="from" />
        </Suspense>
      );
      cy.get('.ant-dropdown-trigger').contains('Select Network').should('be.visible');
    });

    it('should display the network menus properly', () => {
      mount(
        <Suspense fallback="loading">
          <Destination networks={CROSS_CHAIN_NETWORKS} mode="card" defaultLogo={img('network.png')} title="from" />
        </Suspense>
      );

      cy.get('.ant-dropdown-trigger')
        .click()
        .then(() => {
          // menu total = network length + 1;
          cy.get('.ant-dropdown-menu-item')
            .should('be.visible')
            .and('have.length', CROSS_CHAIN_NETWORKS.length + 1);

          // all networks should be rendered
          CROSS_CHAIN_NETWORKS.forEach((network) => {
            cy.get('.ant-dropdown-menu-item').contains(upperFirst(network.name));
          });

          // test networks should have tag sibling
          CROSS_CHAIN_NETWORKS.filter((item) => item.isTest).forEach((network) => {
            cy.get('.ant-dropdown-menu-item').contains(upperFirst(network.name)).next().contains('Test');
          });
        });
    });

    it('Display the network correctly', () => {
      const logo = img(CROSS_CHAIN_NETWORKS[2].facade.logo.split('/')[2]);
      const value = { ...CROSS_CHAIN_NETWORKS[2], facade: { logo, logoWithText: '', logoMinor: '' } };

      mount(
        <Suspense fallback="loading">
          <Destination
            value={value}
            networks={CROSS_CHAIN_NETWORKS}
            mode="card"
            defaultLogo={img('network.png')}
            title="from"
            extra={<DisconnectOutlined />}
          />
        </Suspense>
      );
      cy.get('.ant-dropdown-trigger').contains(upperFirst(CROSS_CHAIN_NETWORKS[2].name));
      cy.get(`img[src="${logo}"]`).should('be.visible');
    });

    it('Should render the extra icon', () => {
      mount(
        <Suspense fallback="loading">
          <Destination
            networks={CROSS_CHAIN_NETWORKS}
            defaultLogo={img('network.png')}
            title="from"
            mode="card"
            extra={<DisconnectOutlined />}
          />
        </Suspense>
      );
      cy.get('.ant-dropdown-trigger').find('.anticon-disconnect');
    });
  });
});
