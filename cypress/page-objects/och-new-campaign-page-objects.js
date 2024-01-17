/// <reference types="cypress"/>

import { Common } from './common-ant-page-objects'

const common = new Common()

export class OCHNewCampaign {
  constructor() {}

  getBreadcrumb() {
    return cy.get('.ant-breadcrumb .ant-breadcrumb-link')
  }

  getPageTitle() {
    return cy.get('.page-title')
  }

  getPageSubtitle() {
    return cy.get('[data-testid="page-subtitle"]')
  }

  getCampaignNameInput() {
    return cy.get('#campaign-form_name')
  }

  getCampaignNameLabel() {
    return this.getCampaignNameInput().parents('.ant-form-item-control').siblings('.ant-form-item-label')
  }

  getCampaignNameCounter() {
    return this.getCampaignNameLabel().find('.ant-typography')
  }

  getCampaignTypeLabel() {
    return cy.get('[for="campaign-form_type"]')
  }

  getCampaignTypeTooltip() {
    return cy.get('.ant-form-item-tooltip')
  }

  getCampaignTypeInput() {
    return cy.get('#campaign-form_type')
  }

  selectCampaignType(type) {
    this.getCampaignTypeInput().click({ force: true }).type(type, { delay: 0 })
    cy.get('.ant-select-item-option-content').contains(type).click({ force: true })
  }

  getSelectedCampaignType() {
    return this.getCampaignTypeInput().parent('.ant-select-selection-search').siblings('.ant-select-selection-item')
  }

  getCampaignStartDateInput() {
    return cy.get('[data-testid="start-date-picker"]')
  }

  getCampaignStartDateLabel() {
    return this.getCampaignStartDateInput().parents('.ant-form-item-control').siblings('.ant-form-item-label')
  }

  getCampaignEndDateInput() {
    return cy.get('[data-testid="end-date-picker"]')
  }

  getCampaignEndDateLabel() {
    return this.getCampaignEndDateInput().parents('.ant-form-item-control').siblings('.ant-form-item-label')
  }

  formatDateTime(dateTime) {
    return dateTime.format('DD MMM YYYY hh:mm:ss A')
  }

  insertDateTime(picker, dateTime) {
    picker.click().type(dateTime + '{enter}', { delay: 0 })
  }

  getCampaignDescriptionLabel() {
    return cy.get('[for="campaign-form_description"]')
  }

  getCampaignDescriptionCounter() {
    return this.getCampaignDescriptionInput().parents('.top-count')
  }

  getCampaignDescriptionInput() {
    return cy.get('#campaign-form_description')
  }

  getCancelButton() {
    return cy.get('[data-testid="cancel-btn"]')
  }

  getCreateEditButton() {
    return cy.get('[data-testid="create-edit-btn"]')
  }

  getNotificationAlert() {
    return cy.get('.ant-notification')
  }

  createCampaign(campaignName, start, end) {
    const campaignType = 'Fixed Period'
    const startDate = this.formatDateTime(start)
    const endDate = this.formatDateTime(end)
    const campaignDescription = campaignName + ' description'

    this.getCampaignNameInput().type(campaignName, { delay: 0 })
    this.selectCampaignType(campaignType)
    this.insertDateTime(this.getCampaignStartDateInput(), startDate)
    this.insertDateTime(this.getCampaignEndDateInput(), endDate)
    this.getCampaignDescriptionInput().type(campaignDescription, { delay: 0 })
    this.getCreateEditButton().click()
    cy.url().should('match', /r-offer-control-hub$/)
    cy.assertAlert(
      'Campaign Created successfully.' + 'The Campaign ' + campaignName + ' has been successfully created.'
    )
    cy.get('.ant-notification-notice-close-x').click()
  }

  createCampaignNoValidation(campaignName, campaignDescription, start, end) {
    const campaignType = 'Fixed Period'
    const startDate = this.formatDateTime(start)
    const endDate = this.formatDateTime(end)

    this.getCampaignNameInput().type(campaignName, { delay: 0 })
    this.selectCampaignType(campaignType)
    this.insertDateTime(this.getCampaignStartDateInput(), startDate)
    this.insertDateTime(this.getCampaignEndDateInput(), endDate)
    this.getCampaignDescriptionInput().type(campaignDescription, { delay: 0 })
    this.getCreateEditButton().click()
  }

  assertAndCancelConfirmationModal(confirmationTitle, confirmationText, urlRegex) {
    common.assertModalTitleAndText(confirmationTitle, confirmationText)
    common.clickModalButtonByName('Cancel')
    cy.url().should('match', urlRegex)
  }
}
