/// <reference types="cypress"/>

import { Common } from './common-ant-page-objects'
import dayjs from 'dayjs'

const common = new Common()

export class OfferControlHub {
  constructor() {}

  //TODO: move this to another file
  listOfTableTitles() {
    return {
      name: 'NAME',
      status: 'STATUS',
      type: 'TYPE',
      startDate: 'START DATE (PT)',
      endDate: 'END DATE (PT)',
      createDate: 'CREATED DATE (PT)',
      modifiedDate: 'MODIFIED DATE (PT)',
    }
  }

  listOfTypes() {
    return {
      fixedPeriod: 'Fixed period',
      evergreen: 'Evergreen',
      periodic: 'Periodic',
      advancedPeriodic: 'Advanced periodic',
    }
  }

  listOfStatus() {
    return {
      defined: 'Defined',
      ready: 'Ready',
      approved: 'Approved',
      published: 'Published',
      live: 'Live',
      suspended: 'Suspended',
      completed: 'Completed',
      cancelled: 'Cancelled',
    }
  }

  getBreadcrumb() {
    return cy.get('.ant-breadcrumb .ant-breadcrumb-link')
  }

  getPageTitle() {
    return cy.get('.page-title')
  }

  getPageSubtitle() {
    return cy.get('.page-subtitle')
  }

  getNewCampaignButton() {
    return cy.get('[data-testid="new_campaign_btn"]')
  }

  getCampaignTable() {
    return cy.get('.DataTable')
  }

  getRowMenuIcon() {
    return cy.get('.tdi-overflow-vertical')
  }

  getDeleteRowIcon(row) {
    return row.find('.tdi-trash-can').parent('button')
  }

  deleteCampaign(row) {
    this.getDeleteRowIcon(row).click()
  }

  getEditRowIcon() {
    return cy.get('.tdi-arrow-right')
  }

  openMoreActionsMenu(row) {
    row.find('.ant-dropdown-trigger').trigger('mouseover')
    //TODO: replace for explicit wait
    cy.wait(250)
  }

  closeMoreActionsMenu(row) {
    row.find('.ant-dropdown-trigger').trigger('mouseout')
  }

  getActionsListFromMenu() {
    return cy
      .get('.ant-dropdown')
      .not('.ant-dropdown-hidden')
      .children('.ant-dropdown-menu')
      .children('.ant-dropdown-menu-item')
  }

  assertActionsList(actionsList) {
    this.getActionsListFromMenu()
      .should('have.length', actionsList.length)
      .each((item, index) => {
        cy.wrap(item).should('contain.text', actionsList[index])
      })
  }

  getSearchInput() {
    return cy.get('[name="searchbar"]')
  }

  getSearchButton() {
    return cy.get('.ant-input-search-button')
  }

  assertSearchTypeList(searchList) {
    this.getSearchInput()
      .parents('.ant-input-search')
      .siblings('.ant-select')
      .within(() => {
        cy.get('.ant-select-selection-search input').eq(0).click({ force: true })
      })
    cy.document()
      .its('body')
      .find('.ant-select-item-option')
      .each((item, index) => {
        cy.wrap(item).should('contain.text', searchList[index])
      })
  }

  getFilterButton() {
    return cy.get('.DataTable button').contains('Filter')
  }

  getFilterBar() {
    return cy.get('.FilterBar')
  }

  convertDateTime(dateTime) {
    return dayjs(dateTime).format('DD MMM YYYYhh:mm a')
  }

  assertCampaignOnTable(campaignName, campaignStatus, startDate, endDate, createDate, modifiedDate) {
    common.getDataByColumnName('', this.listOfTableTitles().name).then((name) => {
      expect(name).to.contains(campaignName)
    })
    common.getDataByColumnName('', this.listOfTableTitles().status).then((status) => {
      expect(status).to.contains(campaignStatus)
    })
    common.getDataByColumnName('', this.listOfTableTitles().startDate).then((start) => {
      expect(start).to.contains(this.convertDateTime(startDate))
    })
    common.getDataByColumnName('', this.listOfTableTitles().endDate).then((end) => {
      expect(end).to.contains(this.convertDateTime(endDate))
    })
    common.getDataByColumnName('', this.listOfTableTitles().createDate).then((create) => {
      expect(create).to.contains(this.convertDateTime(createDate))
    })
    common.getDataByColumnName('', this.listOfTableTitles().modifiedDate).then((modified) => {
      expect(modified).to.contains(this.convertDateTime(modifiedDate))
    })
  }

  showFilters() {
    //TODO: workaround for visible element on first access to page
    this.getFilterButton().click()
    this.getFilterBar().then(($filterBar) => {
      if (!$filterBar.is(':visible')) {
        this.getFilterButton().click()
      }
    })
  }

  hideFilters() {
    this.getFilterBar().then(($filterBar) => {
      if ($filterBar.is(':visible')) {
        this.getFilterButton().click()
      }
    })
  }

  getFilterInactiveCheckbox() {
    return cy.get('[data-testid="filter-inactive_checkbox"]')
  }

  getFilterInactiveCheckboxText() {
    return this.getFilterInactiveCheckbox().parent().next()
  }

  getCustomFilterArea() {
    return cy.get('.CustomFilter')
  }

  getFilterByName() {
    return cy.get('[name="name"]')
  }

  getFilterByNameLabel() {
    return this.getFilterByName().parent().parent().prev()
  }

  getFilterByStatus() {
    return cy.get('[name="statuses"]')
  }

  getFilterByStatusLabel() {
    return this.getFilterByStatus().parent().parent().prev()
  }

  assertFilterStatusList(statusList) {
    this.getFilterByStatus().click()
    cy.document()
      .its('body')
      .find('.ant-select-item-option')
      .each((item, index) => {
        cy.wrap(item).should('contain.text', statusList[index])
      })
  }

  addFilterByStatus(value) {
    this.getFilterByStatus().click()
    this.selectDropDown(value)
    this.getFilterByStatusLabel().click()
  }

  getFilterByType() {
    return cy.get('[name="types"]')
  }

  getFilterByTypeLabel() {
    return this.getFilterByType().parent().parent().prev()
  }

  addFilterByType(value) {
    this.getFilterByType().click()
    this.selectDropDown(value)
    this.getFilterByTypeLabel().click()
  }

  getFilterByTimeRange() {
    return cy.get('[name="startAndEndDate"]')
  }

  getFilterByTimeRangeLabel() {
    return this.getFilterByTimeRange().parent().parent().prev()
  }

  formatDateTime(dateTime) {
    return dateTime.format('DD MMM YYYY hh:mm:ss A')
  }

  insertDateTime(picker, dateTime) {
    picker.click().type(dateTime + '{enter}', { delay: 0 })
  }

  insertTimeRangeDates(startDate, endDate) {
    this.getFilterByTimeRange()
      .children('.ant-picker-input')
      .children('input')
      .eq(0)
      .clear({ force: true })
      .type(startDate, { force: true })
    this.getFilterByTimeRange()
      .children('.ant-picker-input')
      .children('input')
      .eq(1)
      .clear({ force: true })
      .type(endDate + '{enter}', { force: true })
  }

  getFilterCreated() {
    return cy.get('[name="createdAt"]')
  }

  getFilterCreatedLabel() {
    return this.getFilterCreated().parent().parent().prev()
  }

  getFilterByModified() {
    return cy.get('[name="updatedAt"]')
  }

  getFilterByModifiedLabel() {
    return this.getFilterByModified().parent().parent().prev()
  }

  getSaveCustomFilter() {
    return cy.get('button').contains('Save as custom filter')
  }

  getResetFilters() {
    return cy.get('button').contains('Clear filters')
  }

  selectDropDown(value) {
    cy.get('.ant-select-item-option').contains(value).click()
  }

  removeFilterWithKeyword(keyword) {
    cy.get('.ant-select-selection-overflow-item')
      .contains(keyword)
      .siblings('.ant-select-selection-item-remove')
      .click()
  }

  navigateToDetailsPageByCampaignId(campaignId) {
    cy.get('.ant-table-tbody .subtext').contains(campaignId).click()
  }
}
