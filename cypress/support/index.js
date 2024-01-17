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

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Import commands.js using ES2015 syntax:
import './commands';

// load and register the grep feature
// https://github.com/bahmutov/cypress-grep
require('cypress-grep')();

require('dotenv').config();

Cypress.Cookies.defaults({
  preserve: ['x-ctp-auth-token', 'x-ctp-auth-user']
});

Cypress.on('uncaught:exception', () => {
  return false
});