/// <reference types="cypress"/>

import { Common as CommonAnt } from '../page-objects/common-ant-page-objects'

const commonAnt = new CommonAnt()
export class Account {
  constructor() {}
  navigateToAccounts() {
    cy.waitUntil(() => cy.get('.ant-menu-item').should('have.length.greaterThan', 2))
    cy.get('.ant-menu-item').contains('Accounts', { timeout: 2000 }).eq(0).click({ force: true })
    cy.waitUntil(() => cy.get('.header').should('include.text', 'Search account'))
  }

  clickHistory() {
    cy.get('.fa-history').click()
  }

  getEditAccount() {
    return cy.get('.edit-user-details')
  }

  getDisabledButton(Name) {
    return cy.get('button:disabled').contains(Name)
  }

  getUnlink() {
    return cy.get('.tdi-unlink')
  }

  clickOfferLink(name) {
    cy.get('a').contains(name).click()
  }

  clickActionDropdown(text) {
    cy.get('a')
      .contains('Actions')
      .click()
      .siblings('.dropdown-menu')
      .within(() => {
        cy.contains(text).click()
      })
  }

  getActionDropdown() {
    return cy.get('a').contains('Actions').click().siblings('.dropdown-menu')
  }

  getPortletByTitle(title) {
    return cy.get('.portlet-title').contains(title).parents('.portlet')
  }

  getPortletTitle(title) {
    return cy.get('.portlet-title').contains(title)
  }

  getAccountDetails() {
    return cy.get('.ant-tag.ant-tag-default')
  }

  getUserDetails(label) {
    return cy.get('.additional-objects .ant-typography').contains(label).parents().next().eq(0)
  }

  getDeviceDetails(label) {
    return cy.get('.accounts-linked-devices-accounts').contains(label).siblings()
  }

  getHiddenPII() {
    return cy.get('.user-info-val.hidden-pii')
  }

  getBan() {
    return cy.get('.account-ban-status-toggle')
  }

  getBanToggle() {
    return cy.get('.ant-switch')
  }

  getNewsletterToggle() {
    return cy.get('.ant-switch')
  }

  getItemRowLength() {
    cy.get('.loader')
      .should('not.exist')
      .then(() => {
        cy.get('.item-transformations-tab').then(($content) => {
          cy.wrap($content.find('.row').length).as('length')
        })
      })

    return cy.get('@length')
  }

  getTransactionLabel(text) {
    return cy.get('strong:visible').contains(text).parent()
  }

  getPurchasePrice() {
    return cy
      .get('.purchases-collapsible-row .col-md-2')
      .contains('Purchase Price')
      .siblings('.col-md-10')
      .eq(1)
      .invoke('text')
  }

  inputWalletTransaction(amount = 1, reason = 'test', register = 'Earned') {
    cy.get('#register').contains(register).click()
    cy.get('#amount').clear().type(amount)
    cy.get('#reason').clear().type(reason)
    cy.get('button').contains('Save').click()
  }

  inputNote(text) {
    cy.get('textarea').clear().type(text)
  }

  inputCustomData(text) {
    cy.get('textarea').type(text, { force: true })
  }

  inputRecordKey(name) {
    cy.get("input[placeholder='Please provide a record key.']").clear().type(name)
  }

  inputRecordTag(text) {
    cy.get('.form-tags input').type(text)
  }

  inputRecordOpaque(code) {
    cy.get('textarea').eq(0).focus().clear({ force: true }).type(code, { force: true })
  }

  inputRecordProperties(code) {
    cy.get('textarea')
      .eq(1)
      .focus()
      .clear({ force: true })
      .type(code, { force: true, parseSpecialCharSequences: false })
  }

  attachBlob(file, assert = true) {
    cy.get(".ant-upload input[type='file']").attachFile(file)
    if (assert) {
      cy.get('.ant-upload-list-item-name').should('have.text', file)
    }
  }

  selectLicenseType(type = 'Vortex') {
    cy.get('.ant-select-selection-placeholder').contains('Select license type').click({ force: true })
    cy.document().its('body').find('.ant-select-item.ant-select-item-option').contains(type).click()
  }

  searchAccount(criteria, findBy = 'E-mail Address', platform, platformId) {
    cy.get('.ant-dropdown-trigger').eq(0).click()
    cy.get('.ant-dropdown-menu-title-content').contains(findBy).click()
    if (findBy != 'E-mail Address' && findBy != 'Public ID') {
      cy.get('.ant-dropdown-trigger').eq(1).click()
      cy.waitUntil(() => cy.get('.ant-dropdown-menu-title-content').should('contain.text', platform))
      cy.get('.ant-dropdown-menu-title-content').contains(platform).click()
    }
    cy.get('.ant-input.ant-input-lg').type(criteria)
    cy.waitUntil(() => cy.get('.ant-input-suffix').should('be.visible'))
    cy.intercept('api/accounts/**').as('waitForSearch')
    cy.intercept('POST', '/api2/accounts/recent-search/users/**').as('user')
    cy.contains('button', 'Search').eq(0).should('be.enabled').click()
    cy.wait(1000)
    cy.get('.ant-spin-dot', { timeout: 30000 }).should('not.exist')
    cy.wait('@user')
    if (findBy == 'First Party Alias') {
      cy.get('.account-search-results a .ant-card-meta-detail', { timeout: 5000 })
        .should('have.length.gt', 0)
        .contains(platformId)
        .parents('a')
        .children('.ant-btn')
        .should('be.enabled')
        .click({ force: true })
    }
    cy.get('.ant-spin-dot', { timeout: 30000 }).should('not.exist')
    cy.wait('@waitForSearch')
  }

  assertRecordInfo(store, recordKey, accountId, productId, tags = ['tag1']) {
    cy.get('.ant-spin-container')
      .eq(0)
      .within(() => {
        cy.get('.ant-select-selection-item')
          .invoke('text')
          .then((key) => {
            expect(key).to.equal(recordKey)
          })

        this.getUserDetails('Record ID')
          .invoke('text')
          .then((id) => {
            if (store == 'userProduct') {
              expect(id).to.equal(`${accountId}:${productId}:${recordKey}`)
            } else if (store == 'userGlobal') {
              expect(id).to.equal(`${accountId}:${recordKey}`)
            }
          })
      })

    this.getUserDetails('Record Key')
      .invoke('text')
      .then((text) => {
        expect(text).to.include(recordKey)
      })

    this.getUserDetails('Date Created')
      .invoke('text')
      .then((text) => {
        expect(text).to.not.be.empty
      })

    this.getUserDetails('Date Modified')
      .invoke('text')
      .then((text) => {
        expect(text).to.not.be.empty
      })
  }

  assertRecordData(opaque = 'test', properties = `{"boolean":false,"integer":1,"string":"test"}`) {
    commonAnt.navigateToTab('Opaque')
    cy.get('.ace_text-layer')
      .eq(0)
      .invoke('text')
      .then((text) => {
        expect(text).to.include(opaque)
      })
    commonAnt.navigateToTab('Properties')
    cy.get('.ace_text-layer')
      .eq(1)
      .invoke('text')
      .then((text) => {
        expect(text.replace(/\s/g, '')).to.include(properties)
      })
  }

  navigateToAccountTile(accountTileName) {
    cy.waitUntil(() => cy.get('.ant-space .ant-space-item .ant-typography').should('contain.text', accountTileName))
    cy.get('.ant-space .ant-space-item .ant-typography').contains(accountTileName).click()
  }

  getActiveTab() {
    return cy.get('.account-menu-section')
  }

  clickResetIconX(index = 0) {
    cy.get('button:not([disabled]) .tdi-close-outline').eq(index).click()
  }

  getResetIconX(index = 0) {
    return cy.get('button:not([disabled]) .tdi-close-outline').eq(index).parent()
  }

  verifySuccessCheckMark(index = 0) {
    cy.get('.tdi-checkmark-filled.success').eq(index).should('exist')
  }

  getAccountHistoryJsonData() {
    return cy
      .get('.col-md-2')
      .contains('Description')
      .parent()
      .siblings('.col-md-10.column-detail')
      .children('div')
      .children()
  }

  getUserBasicInfoDetails() {
    return cy.get('.basic-info .ant-space-item span')
  }

  clickOnArrowButton(index = 0) {
    cy.get('.tdi-arrow-right').eq(index).click()
  }

  CreditInWallet(registerName = 'Earned', amount = '1', reason = 'testing') {
    // cy.get("button:not([disabled])").contains('Credit').click();
    cy.get('#register').contains(registerName).click()
    cy.get('#amount').clear().type(amount)
    cy.get('#reason').clear().type(reason)
    cy.get('button').contains('Save').click()
  }

  DebitInWallet(registerName = 'Earned', amount = '1', reason = 'testing') {
    cy.get('button:not([disabled])').contains('Debit').click()
    cy.get('#register').contains(registerName).click()
    cy.get('#amount').clear().type(amount)
    cy.get('#reason').clear().type(reason)
    cy.get('button').contains('Save').click()
  }

  selectProduct(index = 0, productName = 'Test Product Cypress 1') {
    cy.wait(2000)
    cy.get('.ant-select-selection-search').eq(index).click().type(productName)
    cy.document().its('body').find('.ant-select-item').contains(productName).click({ force: true })
  }

  verifyAccountLabel(label) {
    cy.waitUntil(() => cy.get('.ant-space .ant-space-item .ant-typography').should('contain.text', label))
  }

  clickOnGlobalNewRecordBtn(name, index = 0) {
    cy.get('.ant-tabs-tabpane')
      .should('be.visible')
      .find('.ant-btn.ant-btn-round.btn-primary span')
      .eq(index)
      .contains(name)
      .click()
  }

  getCodeEditorTextArea(index = 0) {
    return cy.get('.code-editor').eq(index)
  }

  clickButtonByName(name, index = 0) {
    cy.get('button:not([disabled])').contains(name).eq(index).click()
  }

  closeX() {
    cy.get('.tdi-close-outline').click()
  }

  clickUnlink(index = 0) {
    cy.get('.tdi-unlink').eq(index).click()
  }

  getPurchaseUserDetails(index = 0) {
    return cy.get('.ant-tabs-content-holder').eq(index)
  }

  getTileDetails(tileName) {
    return cy.get('.ant-typography').contains(tileName).parents('.ant-space.ant-space-vertical.account-card')
  }

  removeProductBan(Product = 'Global') {
    cy.get('.ant-table-tbody .ant-table-cell').contains(Product).siblings().contains('Remove').click()
  }

  productBansPage(productName = 'Test Product Cypress 1', dateRange = '2 Weeks', accountNotes = 'Product Bans') {
    cy.get('div.ant-space-item')
      .contains('Product')
      .parents('.ant-space-item')
      .within(() => {
        cy.get(".ant-select input[type='search']").click().type(productName)
        cy.document().its('body').find('.ant-select-item').contains(productName).click({ force: true })
      })
    cy.contains('Select date range').parent().siblings().contains(dateRange).click()
    cy.get('textarea').clear().type(accountNotes)
  }

  editPageDetails(
    email,
    dob,
    firstName = 'First',
    lastName = 'Last',
    displayName = 'display',
    language = 'English',
    country = 'United Kingdom'
  ) {
    cy.get('#firstName').clear().type(firstName)
    cy.get('#lastName').clear().type(lastName)
    cy.get('#email').clear().type(email)
    cy.get('#dob').clear({ force: true }).type(`${dob}{enter}`, { force: true })
    cy.get('#displayName').clear().type(displayName)
    cy.get('#language').clear({ force: true }).type(language, { force: true })

    cy.get('#language_list')
      .siblings()
      .then(() => {
        cy.get('.ant-select-item').contains(language).click({ force: true })
      })

    cy.get('#country').clear({ force: true }).type(country, { force: true })

    cy.get('#country_list')
      .siblings()
      .then(() => {
        cy.get('.ant-select-item').contains(country).click({ force: true })
      })
  }
  getNewsLetterMasterConsent() {
    return cy.get('.master-consent-wrapper button')
  }
}
