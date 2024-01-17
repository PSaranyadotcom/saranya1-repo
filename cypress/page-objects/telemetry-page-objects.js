/// <reference types="cypress"/>

export class Telemetry {
  constructor() {
    this.activeTabSelector = '.tab-pane.active'
  }

  navigateToTelemetry() {
    cy.get('.ant-menu').contains('Telemetry').click()
  }

  navigateToEventsTab() {
    cy.get('.nav-tabs a').contains('Events').click()
  }

  navigateToAdvancedTab() {
    cy.get('.nav-tabs a').contains('Advanced').click()
  }

  selectQueue(name, index = 0) {
    cy.get('.select2').eq(index).contains('-- Select Queue --').click()
    cy.document().its('body').find('.select2-results').contains(name).click()
  }

  inputName(name) {
    cy.get('input').eq(0).clear().type(name)
  }

  inputAdvancedQueueConfig(
    priority = 1,
    sampling = 100,
    maxSize = -1,
    flushRetries = 5,
    flushDelayRetriesInSeconds = 10
  ) {
    cy.get('input').eq(0).clear().type(priority)
    cy.get('input').eq(1).clear().type(sampling)
    cy.get('input').eq(2).clear().type(maxSize)
    cy.get('input').eq(5).clear().type(flushRetries)
    cy.get('input').eq(6).clear().type(flushDelayRetriesInSeconds)
  }

  inputAdvancedEventConfig(priority = 1, sampling = 100) {
    cy.get('input').eq(0).clear().type(priority)
    cy.get('input').eq(1).clear().type(sampling)
  }

  inputBucketName(bucketName, index = 0) {
    cy.get("input[type='text']").eq(index).click().clear().type(bucketName, { timeout: 500 })
  }

  selectAWSAccount(accountName) {
    cy.get('.select2').contains('-- Select AWS Account --').click()
    cy.document().its('body').find('.select2-results').contains(accountName).click()
  }

  clickCreateQueue() {
    cy.get('button').contains('Create Queue').click()
  }

  clickCreateEvent() {
    cy.get('button').contains('Create Event').click()
  }

  clickGetStarted() {
    cy.get('button').contains('Get started').click()
  }

  clickAddBucket() {
    cy.get('button').contains('Add Bucket').click({ force: true })
  }

  clickRegister() {
    cy.get('button').contains('Register').click()
  }

  clickCloneAppGroup() {
    cy.get('button').contains('Clone Application Group').click()
  }

  clickMoveEvents() {
    cy.get('button').contains('Move Events').click()
  }

  clickMove() {
    cy.get('button').contains('Move').click()
  }

  clickUpdateOffloadBucket() {
    cy.get('button').contains('Update Offload Bucket(s)').click()
  }

  getUpdateOffloadBucketButton() {
    return cy.get('button').contains('Update Offload Bucket(s)')
  }

  getCreateOffloadBucketButton() {
    return cy.get('button').contains('Create Offload Bucket')
  }
  selectProduct(product = 'Test Product Cypress 1') {
    cy.wait(3000)
    cy.get('.vscomp-toggle-button').contains('-- Select Product --').click()
    cy.get("[placeholder='Search...']")
      .eq(0)
      .click()
      .type(product)
      .then(() => {
        cy.document().its('body').find('.vscomp-option-text').eq(0).contains(product).click()
      })
  }
  selectPaginationLimit(paginationLimit) {
    cy.get('.pagination-limit select').eq(0).select(paginationLimit)
  }

  verifyIntegrationStatus(status) {
    cy.get('.basic-info .ant-space-item').contains('Integration Status')
    return cy
      .get('.basic-info .ant-space-item')
      .contains(status)
      .invoke('text')
      .then((text) => {
        expect(text).contains(status)
      })
  }

  verifyHelpfulDocsExistance() {
    cy.get('.helpful-docs-section .ant-space-item').contains('Helpful Docs').should('exist')
    cy.get('.helpful-docs-section .helpful-docs-item')
      .invoke('text')
      .then((docs) => {
        expect(docs).contains('Telemetry-K - Invitation process to Rockset')
        expect(docs).contains('Telemetry-K - Testing Rockset Integration | Rockset Workflow')
      })
  }

  verifyUserListExists(selector = '.rockset-user-list') {
    cy.get(`${selector} .ant-space-item`)
      .invoke('text')
      .then((list) => {
        expect(list).contains('User List')
      })

    cy.get(`tr .ant-table-cell .subtext`).then((row) => {
      const lists = row.length
      expect(lists).to.be.greaterThan(0)
    })
  }

  selectRocksetProduct(product = 'Integration Test') {
    cy.get('.vscomp-clear-button').click()
    cy.get('.items-product-selector').contains('-- Select Product --').click({ force: true })
    cy.get('.vscomp-search-input').type(product)
    cy.get('.vscomp-option .vscomp-option-text').each((el) => {
      var txt = el.text().trim()
      if (txt == product) {
        cy.wrap(el).click({ force: true })
      }
    })
  }
}
