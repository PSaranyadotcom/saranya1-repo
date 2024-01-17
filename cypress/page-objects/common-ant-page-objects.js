/// <reference types="cypress"/>
import { v4 as uuidv4 } from 'uuid'

export class Common {
  constructor() {}

  expandSidebarMenu() {
    //locators not exist
    cy.get('.tdi-overflow-vertical').trigger('mouseover')
    cy.get('.ant-menu-item-only-child').contains('Expand sidebar').click()
  }

  navigateSidebarMenu(menu, subMenu = null) {
    if (menu === 'Promotions') {
      cy.get('.ant-menu-title-content').contains(menu).click()
    } else {
      cy.get('.ant-menu').contains(menu).click({ force: true })
    }
    if (subMenu != null) {
      cy.get('.ant-menu').contains(subMenu).click({ force: true })
    }
  }

  navigateBreadcrumbByString(text) {
    cy.get('.ant-breadcrumb .ant-breadcrumb-link').contains(text).click({ force: true })
  }

  navigateToTab(text) {
    cy.get('.ant-tabs-tab-btn').contains(text).click()
  }

  getTableRowByString(name, selector = '') {
    return cy.get(`${selector} .ant-table-tbody`).contains(name).parents('.ant-table-row')
  }

  getTableRowByIndex(index = 0, selector = '') {
    cy.get('.ant-table-row').should('have.length.greaterThan', 0)
    return cy.get(`${selector} .ant-table-tbody > .ant-table-row`).eq(index)
  }
  pageNum(num) {
    cy.get('a[rel="nofollow"]').contains(num).click()
  }

  getRowLength(selector = '') {
    cy.get('.ant-spin-dot')
      .should('not.exist')
      .then(() => {
        cy.get('table')
          .should('exist')
          .find('.ant-table-row')
          .should('have.length.greaterThan', 0)
          .then(() => {
            cy.get(`${selector} .ant-table-tbody`).within(($content) => {
              cy.wrap($content.find('.ant-table-row').length).as('length')
            })
          })
      })
    return cy.get('@length')
  }

  getActiveTab() {
    return cy.get('.ant-tabs-tabpane-active')
  }

  getPageTitle() {
    return cy.get('.page-title-wrapper')
  }

  getSource(id) {
    return cy.get(`tr[data-row-key=source-${id}]`).invoke('text')
  }

  getDataTableByIndex(index) {
    return cy.get('.DataTable').eq(index)
  }

  getDataTableHeaderRow() {
    return cy.get('.DataTable th.ant-table-cell ')
  }

  assertDataTableColumnNames(namesList) {
    this.getDataTableHeaderRow()
      .should('have.length', namesList.length)
      .each((item, index) => {
        cy.wrap(item).should('contain.text', namesList[index])
      })
  }

  getExpandedRowContent() {
    return cy.get('.ant-table-expanded-row').eq(0).not("[style='display: none;']").invoke('text')
  }

  getAntAlert() {
    return cy.get('.ant-alert')
  }

  getAntExplain() {
    return cy.get('.ant-form-item-explain')
  }

  searchDataTable(query, filter = '', index = 0, index1 = 0) {
    cy.get('.DataTable').within(() => {
      if (filter != '') {
        cy.get('.ant-input-search')
          .eq(index)
          .siblings('.ant-select')
          .within(() => {
            cy.get('.ant-select-selection-search input').eq(0).click({ force: true })
          })
        cy.document().its('body').find('.ant-select-dropdown').contains(filter).click({ force: true }).wait(1000)
      }
      cy.get('.ant-input-search input').eq(index1).clear().type(query).wait(1000)
    })
  }

  clearSearch() {
    cy.get("[name='id']").clear()
  }

  assertRowExist(name, selector = '') {
    return cy.get(`${selector} .ant-table-tbody`).contains(name).should('exist')
  }

  assertRowNotExist(name, selector = '') {
    return cy.get(`${selector} .ant-table-tbody`).contains(name).should('not.exist')
  }

  assertEmptyTable() {
    return cy.get(`.ant-table-tbody .ant-empty`).should('exist')
  }

  assertTagSuccess() {
    return cy.get('.ant-tag-success').should('exist')
  }

  waitForModal(index = 0) {
    return cy
      .waitUntil(() => cy.get('.ant-modal-content'))
      .eq(index)
      .wait(1000)
  }

  waitForLoaderToDisappear(timeoutAmount = 50000) {
    return cy.get('.ant-spin-dot', { timeout: timeoutAmount }).should('not.exist')
  }

  newUUID() {
    return uuidv4().replace(/-/g, '')
  }

  enterTextToParticularPlaceHolderName(PlaceholderName, text) {
    cy.get('.filter-fields input[placeholder="' + PlaceholderName + '"]')
      .clear()
      .type(text, { force: true })
  }

  selectProduct(productName = 'Test Product Cypress 1', index = 0) {
    cy.get('.ant-select-selector').eq(index).click().type(productName)
    cy.document().its('body').find('.ant-select-item').contains(productName).click()
  }

  selectPaginationLimit(paginationLimit) {
    cy.get('.ant-pagination-options').click()
    cy.document().its('body').find('.ant-select-item').contains(paginationLimit).click()
  }

  goToLastPageOfTable() {
    cy.get('.ant-pagination-item').last().click()
  }

  getActivePageOfTableButton() {
    return cy.get('.ant-pagination-item-active')
  }

  clickButtonByName(name) {
    cy.get('button:not([disabled])').contains(name).eq(0).click()
  }

  forceClickButtonByName(name) {
    cy.get('button:not([disabled])').contains(name).eq(0).click({ force: true })
  }

  getButtonByName(name) {
    return cy.get('button').contains(name).parent('button')
  }

  assertButtonNotExistByName(name) {
    cy.get('button', { multiple: true }).should('not.contain', name)
  }

  clickOverflow(index = 0) {
    cy.get('button .tdi-overflow').eq(index).click()
  }

  clickVerticalOverflow(index = 0) {
    cy.get('button .tdi-overflow-vertical').eq(index).click()
  }

  clickView(index = 0) {
    cy.get('.tdi-arrow-right').eq(index).click()
  }

  expandAndViewNote(note, index = 0) {
    cy.get('button.btn-expand').eq(index).click()
    cy.waitUntil(() => cy.get('.expanded-row-content'))
    cy.get('.expanded-row-content').contains(note)
  }

  clickEdit(index = 0) {
    cy.get('.tdi-edit').eq(index).click()
  }

  assertEditNotExist() {
    cy.get('button .tdi-edit').should('not.exist')
  }

  clickClone(index = 0) {
    cy.get('button .tdi-copy').eq(index).click()
  }

  clickTrash(index = 0) {
    cy.get('button .tdi-trash-can').eq(index).click()
  }

  clickHistory(index = 0) {
    cy.get('button .tdi-history').eq(index).click()
  }

  assertTrashNotExist() {
    cy.get('button .tdi-trash-can').should('not.exist')
  }

  clickExpand(index = 0) {
    cy.get('button .tdi-chevron-right').eq(index).click()
  }

  clickCollapse(index = 0) {
    cy.get('button .tdi-chevron-down').eq(index).click()
  }

  clickRadio(index = 0) {
    cy.get('.ant-radio').eq(index).click()
  }

  clickPlus(index = 0) {
    cy.get('.ant-btn-circle .tdi-plus-sign').eq(index).click({ force: true })
  }

  clickNext(index = 0) {
    cy.get('button').contains('Next').eq(index).click()
  }

  clickClose(index = 0) {
    cy.get('button').contains('Close').eq(index).click()
  }

  clickX() {
    cy.get('button:not([disabled]) .ant-modal-close-x').click()
  }

  clickSave(index = 0) {
    cy.get('button').contains('Save').eq(index).click({ force: true })
  }

  clickDropdownItem(item) {
    cy.get('.ant-dropdown-menu-item').contains(item).eq(0).click()
  }

  getSave(index = 0) {
    return cy.get('button').eq(index).contains('Save')
  }

  clickDelete(index = 0) {
    cy.get('button').contains('Delete').eq(index).click()
  }

  clickYes(index = 0) {
    cy.get('button').contains('Yes').eq(index).click()
  }

  clickPublish(index = 0) {
    cy.get('button').contains('Publish').eq(index).click()
  }

  clickCheck(index = 0) {
    cy.get('.ant-checkbox').eq(index).click()
  }

  clickStoreContainer(store) {
    cy.get('.store-card-container').contains(store).click()
  }

  getStoreContainer(store) {
    return cy.get('.store-card-container').contains(store).parents('.store-card-container')
  }

  clickPopOverButton(text) {
    cy.get('.ant-modal-content').contains(text).click()
  }

  inputSearchFilter(text, index = 0) {
    cy.get("[placeholder='Search'].ant-input").eq(index).type(text).wait(1000)
  }

  clickExpandRowContent(index = 0) {
    cy.get('tbody .tdi-chevron-right').eq(index).click().wait(1000)
  }

  clickOnElementByText(selector, textValue) {
    cy.get(selector).each(($ele) => {
      const eleText = textValue
      if ($ele.text() === eleText) {
        cy.get($ele).should('have.text', eleText).click({ force: true })
      }
    })
  }

  formatDateToYYYYMMDD(date) {
    var dd = String(date.getDate()).padStart(2, '0')
    var mm = String(date.getMonth() + 1).padStart(2, '0')
    var yyyy = date.getFullYear()
    date = yyyy + '-' + mm + '-' + dd
    return date
  }

  selectDropDown(name, value) {
    cy.get('.ant-form-item-label')
      .contains(name)
      .type(value)
      .then(() => {
        cy.get('.ant-select-item-option').contains(value).click()
      })
  }

  waitForViewDetails() {
    cy.waitUntil(() => cy.get('main .ant-space-item div span:nth-child(2)').invoke('text').should('not.be.null'))
  }

  selectDate(label, index = 0, year, month, date) {
    const picker = (value) => cy.get('.ant-picker-cell.ant-picker-cell-in-view').contains(value).click()
    cy.get('.ant-form-item-label')
      .contains(label)
      .then(() => {
        cy.get('[aria-label="calendar"]').eq(index).click({ force: true })
        cy.get('.ant-picker-panel-container')
          .eq(index)
          .within(() => {
            cy.get('.ant-picker-header-view')
              .invoke('text')
              .then(($txt) => {
                if ($txt.includes(year)) {
                  if ($txt.includes(month)) {
                    picker(date)
                  } else {
                    cy.get('.ant-picker-month-btn').click()
                    picker(month)
                    picker(date)
                  }
                } else {
                  cy.get('.ant-picker-year-btn').click()
                  cy.get('.ant-picker-header-view')
                    .invoke('text')
                    .then(($t) => {
                      if ($t.includes(Math.floor(year / 10.0) * 10)) {
                        picker(year)
                        picker(month)
                        picker(date)
                      } else {
                        cy.get('.ant-picker-decade-btn').click()
                        cy.get('.ant-picker-header-view')
                          .invoke('text')
                          .then(($tx) => {
                            if ($tx.includes(Math.floor(year / 100.0) * 100)) {
                              picker(Math.floor(year / 10.0) * 10)
                              picker(year)
                              picker(month)
                              picker(date)
                            } else {
                              cy.get('.ant-picker-header-super-prev-btn').click()
                              picker(Math.floor(year / 10.0) * 10)
                              picker(year)
                              picker(month)
                              picker(date)
                            }
                          })
                      }
                    })
                }
              })
          })
      })
  }

  waitForTabsText() {
    cy.waitUntil(() => cy.get('.ace_line :nth-child(1n)'))
  }

  AssertPartialRowNameExist(name, selector = '') {
    return cy.get(`${selector} .ant-table-tbody`).contains(name.slice(0, 13)).should('exist')
  }

  getDataByColumnName(selector = '', columnName, rowNum = 0) {
    // Find the column header with the given name
    cy.get(`${selector} th.ant-table-cell`).each(($columnHeader, index) => {
      cy.wrap($columnHeader)
        .invoke('text')
        .then((headerText) => {
          if (headerText.trim().startsWith(columnName)) {
            const columnIndex = index
            cy.get(`${selector} tr.ant-table-row`)
              .eq(rowNum)
              .find(`td:nth-child(${columnIndex + 1})`)
              .invoke('text')
              .then((data) => {
                cy.wrap(data).as('coldata')
              })
          }
        })
    })
    return cy.get('@coldata')
  }

  getDataTableFirstRowByStatus(expectedStatus) {
    cy.get('.campaign-status').each(($stt) => {
      if ($stt.text() === expectedStatus) {
        cy.wrap($stt).parents('.ant-table-row').as('status')
        return false
      }
    })
    return cy.get('@status')
  }

  assertModalTitleAndText(title, text) {
    cy.get('.ant-modal-title').contains(title).should('be.visible')
    cy.get('.ant-modal-body').contains(text).should('be.visible')
  }

  clickModalButtonByName(name) {
    cy.get('.ant-modal-content').within(() => {
      cy.contains(name).click()
    })
  }

  roleAlert(index = 0) {
    return cy.get('[role="alert"]').eq(index)
  }
}
