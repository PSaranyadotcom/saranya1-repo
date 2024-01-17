/// <reference types="cypress"/>

import { Common } from './common-ant-page-objects'
import dayjs from 'dayjs'
import { OCHNewCampaign } from './och-new-campaign-page-objects'

const common = new Common()
const ochNewCampaign = new OCHNewCampaign()
export class OCHCampaignDetails {
  constructor() {}

  //TODO: move this to another file

  getBreadcrumb() {
    return cy.get('.ant-breadcrumb .ant-breadcrumb-link')
  }

  getCampaignName() {
    return cy.get('.page-title')
  }

  getCampaignId() {
    return cy.get('[data-testid="campaign-id"]')
  }

  getCampaignStatus() {
    return cy.get('[data-testid="campaign-status"]')
  }

  getCampaignDescription() {
    return cy.get('[data-testid="campaign-description"]')
  }

  getMoreActionsButton() {
    return cy.get('[data-testid="more-actions-btn"]')
  }

  getCampaignEditButton() {
    return cy.get('[data-testid="campaign-edit-btn"]')
  }

  getCampaignSubmitButton() {
    return cy.get('[data-testid="campaign-submit-btn"]')
  }

  getApprovalSwitch() {
    return cy.get('[data-testid="approval-switch"]')
  }

  getCampaignType() {
    return cy.get('[data-testid="campaign-type"]')
  }

  getCampaignStartDate() {
    return cy.get('[data-testid="start-date"]')
  }

  getCampaignEndDate() {
    return cy.get('[data-testid="end-date"]')
  }

  getCampaignCreatedAndModifiedDates() {
    return cy.get('[data-testid="created-modified-dates"]')
  }

  startEndFormatDateTime(dateTime) {
    return dateTime.format('DD MMM YYYY · hh:mm:ss A')
  }

  createModifiedFormatDateTime(dateTime) {
    return dateTime.format('DD MMM YYYY, hh:mm:ss A')
  }

  assertCreatedAndModifiedDates(createDate, modifiedDate) {
    const cDate = this.createModifiedFormatDateTime(dayjs(createDate).tz('America/Los_Angeles'))
    const mDate = this.createModifiedFormatDateTime(dayjs(modifiedDate).tz('America/Los_Angeles'))
    const createdAndModifiedText = 'Created ' + cDate + ' PT · Updated ' + mDate + ' PT'
    this.getCampaignCreatedAndModifiedDates().should('have.text', createdAndModifiedText)
  }
}
