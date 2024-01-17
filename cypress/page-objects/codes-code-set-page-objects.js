/// <reference types="cypress"/>

export class Codeset {
  constructor() {
    this.codesetListSelector = '.codeset-table'
  }

  searchCode(code) {
    cy.get('.code-search-wrapper input').clear().type(code, { force: true })
  }

  inputDescription(name, redemptionType, description = null, tags = null) {
    cy.get('input').eq(0).clear().type(name)
    if (description != null) {
      cy.get('textarea').eq(0).clear().type(description)
    }
    if (tags != null) {
      cy.get('input').eq(1).type(tags)
    }
    cy.get('.select2').eq(0).click()
    cy.document().its('body').find('.select2-results').contains(redemptionType).click()
  }

  inputRedemptionTimeframe(startDate, endDate) {
    cy.get('.bootstrap-switch-container').click()
    cy.get('.date-picker__button').eq(0).click()
    cy.document().its('body').find('.date-picker__day').contains(startDate).click()
    cy.document().its('body').find('.date-picker__header__button--next').click()
    cy.document().its('body').find('.date-picker__day').contains(endDate).click()
  }

  inputCodeCreation(amount = 1, length = 32, type = 'ALPHANUMERIC') {
    cy.get('input').eq(0).type(amount)
    cy.get('input').eq(1).type(length)
    cy.get('.selection').contains('-- Select Code Type --').click()
    cy.document().its('body').find('.select2-results').contains(type).click()
    cy.get('button').contains('Generate').click()
  }

  totalCodeCount(num) {
    cy.get('.row.batch-info .pull-left')
      .invoke('text')
      .then((text) => {
        expect(text).to.include(num)
      })
  }

  selectSKU(name) {
    cy.get('.select2').click()
    cy.document().its('body').find('.select2-results').contains(name).click()
  }

  getRowFromList(text, index = 0) {
    return cy.get(`.vertical-two-way-selector-list:eq(${index}) .element`).contains(text).parents('.element')
  }

  selectRowFromList(index = 0) {
    cy.get(`.vertical-two-way-selector-list .fa-plus-circle`).eq(index).click()
  }

  deselectRowFromList(index = 0) {
    cy.get(`.vertical-two-way-selector-list .fa-minus-circle`).eq(index).click()
  }
}
