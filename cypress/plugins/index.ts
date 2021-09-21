/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

const path = require('path');
const cracoPlugin = require('@cypress/react/plugins/craco');
const cracoConf = require(path.join(__dirname, '../../craco.config.js'));

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  // require('@carlos0202/cypress-metamask/plugins')(on);
  cracoPlugin(on, config, cracoConf);
  require('cypress-metamask/plugins')(on);
  on('before:browser:launch', (browser = {}, launchOptions) => {
    launchOptions.args.push('--auto-open-devtools-for-tabs');
    launchOptions.extensions.push('./cypress/extensions/MetaMask');
    return launchOptions;
  });

  return config;
};
