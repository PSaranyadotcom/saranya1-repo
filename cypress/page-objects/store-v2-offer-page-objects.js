/// <reference types="cypress"/>
import { Common } from '../page-objects/common-ant-page-objects'
const common = new Common()

export class Offer {
  constructor() {
    this.offerListSelector = '.store-section'
    this.linkedSalesEventTableSelector = '.linked-commerce-table'
    this.linkedOfferTableSelector = '.rSalesEventsTable .linked-commerce-table .DataTable'
  }

  selectType(type) {
    cy.get('.ant-radio-button-wrapper').contains(type).click()
  }

  selectFirstPartyOffer(text) {
    cy.get('#firstPartyOfferId')
      .click({ force: true })
      .then(() => {
        if (text) {
          cy.document().its('body').find('.ant-select-item').contains(text).click()
        } else {
          cy.document().its('body').find('.ant-select-item').first().click()
        }
      })
  }

  inputName(name) {
    cy.get("input[placeholder='Enter a name for the Offer']").clear().type(name)
  }

  inputDescription(text) {
    cy.get("textarea[placeholder='Enter a description for the Offer']").clear().type(text)
  }

  inputTag(text) {
    cy.get('.form-tags input').type(text)
  }

  inputOfferData(text) {
    cy.get('.code-editor textarea').eq(0).clear({ force: true }).type(text, { force: true })
  }

  inputPricing(currencyCode, amount) {
    cy.get('.ant-select-selection-search-input').click()
    cy.get('.ant-select').contains('Select a currency').click({ force: true })
    cy.document().its('body').find('.ant-select-item').contains(`(${currencyCode})`).click({ force: true })
    cy.get('.ant-form-item-label')
      .contains('Amount')
      .parents('.ant-row')
      .within(() => {
        cy.get('input').eq(0).type(amount)
      })
  }

  inputPricingFirstOption(amount, index = 0) {
    cy.get('.ant-select-selection-search input').eq(index).click({ force: true })
    cy.document().its('body').find('.ant-select-item').eq(0).click({ force: true })
    cy.get('.ant-form-item-label')
      .contains('Amount')
      .parents('.ant-row')
      .within(() => {
        cy.get('input').eq(0).type(amount)
      })
  }

  editInputPricing(currencyCode, amount, index = 0) {
    cy.get('.ant-select-selector').wait(2000).eq(index).click({ force: true })
    cy.document().its('body').find('.ant-select-item').contains(`(${currencyCode})`).click({ force: true })
    cy.get('.ant-form-item-label')
      .contains('Amount')
      .parents('.ant-row')
      .within(() => {
        cy.get('input').eq(0).type(amount)
      })
  }
  // Example: startDay=15, endDay=20, time="23:59"
  inputAvailabilityWindow(startDay, endDay, startTime = '00:00', endTime = '23:59') {
    cy.get("input[placeholder='Define when the offer will end']").click({ force: true })
    cy.document().its('body').find('.ant-picker-panel .ant-picker-cell-inner').contains(endDay).click({ force: true })
    cy.get("input[placeholder='HH:MM']").eq(1).type(endTime, { force: true })

    cy.wait(2000)

    cy.get("input[placeholder='Define when the offer will start']").click({ force: true })
    cy.document().its('body').find('.ant-picker-panel .ant-picker-cell-inner').contains(startDay).click({ force: true })
    cy.get("input[placeholder='HH:MM']").eq(0).type(startTime, { force: true })
  }

  inputDateInAvailabilityWindow(addMonthValueToSD, addMonthValueToED) {
    var startDate = new Date()
    var endDate = new Date()
    startDate.setMonth(startDate.getMonth() + addMonthValueToSD)
    endDate.setMonth(endDate.getMonth() + addMonthValueToED)
    startDate = common.formatDateToYYYYMMDD(startDate)
    endDate = common.formatDateToYYYYMMDD(endDate)
    cy.get("input[placeholder='Define when the offer will end']")
      .click({ force: true })
      .clear({ force: true })
      .type(endDate + '{enter}')
    cy.get("input[placeholder='Define when the offer will start']")
      .click({ force: true })
      .clear({ force: true })
      .type(startDate + '{enter}')
  }

  clickAddPricing() {
    cy.get('button .tdi-plus-sign').click()
  }

  clickOnEditPricing(index = 0) {
    cy.get('.ant-list-item.pricing-row .tdi-edit').eq(index).click()
  }

  clickViewOfferHistory() {
    cy.get('.ant-dropdown-menu-item').contains('View Offer history').click()
  }

  checkTargetedOffer() {
    cy.get('.ant-checkbox').click()
  }

  assertOfferInfo(name, id, type = 'In Game', description = 'description') {
    cy.get('.ant-spin-container')
      .eq(0)
      .within(() => {
        cy.get('.header-section')
          .invoke('text')
          .then((header) => {
            expect(header).to.include(name)
            expect(header).to.include(id)
            expect(header).to.include(type)
          })

        cy.get('.page-subtitle')
          .invoke('text')
          .then((text) => {
            expect(text).to.include(description)
          })

        cy.get('.basic-info')
          .invoke('text')
          .then((date) => {
            expect(date).to.not.be.empty
          })
      })
  }

  repurchasePolicy(option = 'Not Allowed') {
    cy.get('#partialPurchasePolicy label').contains(option).click()
  }

  verifyIngamePrices(text, currency1 = 'TST', currency2 = 'CXP', currency3 = 'CYI') {
    ;[currency1, currency2, currency3].forEach(function (currency) {
      expect(text).to.contains(currency)
    })
  }

  expandButton(index = 0) {
    cy.get('td .btn-expand').eq(index).click()
  }

  verifyLinkedSalesEvent(eventId) {
    cy.get('.linked-commerce-table a .subtext').contains(eventId).invoke('text').should('exist')
  }
}
