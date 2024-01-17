/// <reference types="cypress"/>

export class Licenses {
  constructor() {
    this.licensesListSelector = '.licenses-table'
  }

  navigateToLicenses() {
    cy.get('.ant-menu').contains('Licenses').click()
  }

  inputDescription(name, description = null, tags = null, type = null) {
    cy.get('#name').clear().type(name, { force: true })
    if (description != null) {
      cy.get('#description').clear().type(description, { force: true })
    }
    if (tags != null) {
      cy.get('.form-tags > input').clear().type(tags, { force: true })
    }
    if (type != null) {
      cy.get('#type').click()
      cy.document().its('body').find('.ant-select-item.ant-select-item-option').contains(type).click({ force: true })
    }
  }

  inputReferenceId(referenceId) {
    cy.get('#referenceId').type(referenceId)
  }

  selectReferenceId(referenceId) {
    cy.get('#referenceId').click()
    cy.wait(2000)
    cy.document().its('body').find('.ant-select-item.ant-select-item-option').contains(referenceId).click()
  }

  inputOfflineTtl(value = '24') {
    cy.get('#offlineTtl').clear().type(value)
  }

  inputMaxDeviceRegistration(value = '1') {
    cy.get('#maxDeviceRegistration').clear().type(value)
  }
  inputPayloadChiperKey(text) {
    cy.get('#payloadCipherKey').clear().type(text)
  }
}
