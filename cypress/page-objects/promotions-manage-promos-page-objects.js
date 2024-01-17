/// <reference types="cypress"/>
import { Common } from '../page-objects/common-ant-page-objects'
const common = new Common()
const date = new Date()
const dataTransfer = new DataTransfer()

export class ManagePromotions {
  selectProduct(productName = 'Test Product Cypress 1') {
    cy.get('.ant-select-selector').eq(0).click().type(productName)
    cy.document().its('body').find('.ant-select-item').contains(productName).click()
  }

  selectappGroup(appGroupName = 'Test App Group Cypress 1') {
    cy.get('.ant-select-selector').eq(1).click().type(appGroupName)
    cy.document().its('body').find('.ant-select-item').contains(appGroupName).click()
  }

  enterPromotionDetails(
    name,
    type = 'Information only',
    description = 'description',
    startday = date.getDate(),
    endday = date.getDate(),
    displayCount = 1,
    displayHours = 24
  ) {
    cy.get('#promoType')
      .click({ force: true })
      .clear()
      .type(type)
      .then(() => {
        cy.document().its('body').find('.ant-select-item').contains(type).click()
      })

    cy.get('#name').click().clear().type(name)
    cy.get('#description').click().clear().type(description)
    cy.get('#startAt')
      .click()
      .then(() => {
        cy.get('.ant-picker-dropdown')
          .eq(0)
          .within(() => {
            cy.get('.ant-picker-cell-inner').contains(startday).click()
          })
      })
    cy.get('#endAt')
      .click()
      .then(() => {
        cy.get('.ant-picker-dropdown')
          .eq(1)
          .within(() => {
            cy.get('.ant-picker-cell-inner').should('be.visible').contains(endday).click({ force: true })
          })
      })
    cy.get('#displayCount').click().clear().type(displayCount)
    cy.get('#displayDurationInHrs').click().clear().type(displayHours)
  }

  inputMetaData(text = '{}') {
    cy.get('label')
      .contains('Metadata')
      .parents('.ant-row.ant-form-item')
      .within(() => {
        cy.get('textarea')
          .eq(0)
          .focus()
          .clear({ force: true })
          .type(text, { parseSpecialCharSequences: false }, { force: true })
      })
  }

  checkPlacementCheckBox(Placement, toggle = true) {
    cy.get('td.ant-table-cell .ant-typography')
      .contains(Placement)
      .parents('.ant-table-row.ant-table-row-level-0')
      .within(() => {
        cy.get("input[type='checkbox']").check()
      })
  }

  uploadZipFile(filePath) {
    cy.get("input[type='file']").attachFile(filePath)
  }

    enterCreativePageDetails(defaultVariant='Other',locale='en-US (default locale)'){
        common.selectDropDown('Default variant for this Promotion',defaultVariant);
        common.selectDropDown('Locale',locale);
    }

  matchAssetsToPlacements(index = 0) {
    cy.get('.inner.draggable-item').eq(index).trigger('dragstart', { dataTransfer })
    cy.get('.open-sidebar-button')
      .contains('Placements')
      .click()
      .then(() => {
        cy.get('.placement-header').trigger('drop', { dataTransfer })
      })
    common.waitForModal().within(() => {
      common.clickButtonByName('Continue Anyway')
    })
    cy.get('.anticon.anticon-close').click()
  }

  assertManagePromoInfo(
    name,
    id,
    description = 'description',
    type = 'Information only',
    environment = 'Dev',
    displayCount = '1',
    displayHours = '24'
  ) {
    cy.get('.td-title-selector')
      .invoke('text')
      .then((text) => {
        expect(text.replace(/\s+/g, ' ')).to.include(name)
      })

    cy.get('.id')
      .invoke('text')
      .then((text) => {
        expect(text.replace(/\s+/g, ' ')).to.include(id)
      })
    cy.get('.ant-typography.page-subtitle')
      .invoke('text')
      .then((text) => {
        expect(text.replace(/\s+/g, ' ')).to.include(description)
      })
    cy.get('.col-xs-12 strong')
      .contains('Type')
      .parent()
      .invoke('text')
      .then((text) => {
        expect(text.replace(/\s+/g, ' ')).to.include(type)
      })
    cy.get('.col-md-6.col-xs-12 strong')
      .contains('Environments published')
      .parent()
      .get('i.tdi-check-outline')
      .parent()
      .invoke('text')
      .then((text) => {
        expect(text.replace(/\s+/g, ' ')).to.include(environment)
      })
    cy.get('.col-xs-12 strong')
      .contains('Display count')
      .parent()
      .invoke('text')
      .then((text) => {
        expect(text.replace(/\s+/g, ' ')).to.include(displayCount)
      })
    cy.get('.col-xs-12 strong')
      .contains('Display hours')
      .parent()
      .invoke('text')
      .then((text) => {
        expect(text.replace(/\s+/g, ' ')).to.include(displayHours)
      })
  }

  ValidateCreativeDetails(variant = 'Other (default variant)', locale = 'en-US') {
    cy.get('.ant-space-item')
      .contains('Variant')
      .parent()
      .find('.ant-select-selection-item')
      .invoke('text')
      .then((text) => {
        expect(text.replace(/\s+/g, ' ')).to.include(variant)
      })
    cy.get('.ant-space-item')
      .contains('Locale')
      .parent()
      .find('.ant-select-selection-item')
      .invoke('text')
      .then((text) => {
        expect(text.replace(/\s+/g, ' ')).to.include(locale)
      })
  }

  ValidateMetaDataDetails(metadata = `{}`) {
    cy.get('.ace_text-layer')
      .invoke('text')
      .then((text) => {
        expect(text).to.contains(metadata)
      })
  }
}
