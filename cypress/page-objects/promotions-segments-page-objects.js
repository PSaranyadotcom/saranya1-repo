/// <reference types="cypress"/>

import { Common } from '../page-objects/common-ant-page-objects'

const common = new Common()

export class Segments {
  constructor() {
    this.segmentsList = '.eyewash-segments-list'
  }

  inputName(name) {
    cy.get('label')
      .contains('Name')
      .parents('.ant-row.ant-form-item')
      .within(() => {
        cy.get('input').eq(0).clear().type(name)
      })
  }

  clickOnCategoryEditBtn() {
    cy.get('button .anticon-edit').eq(0).click()
  }

  addCriteriaDetails({
    Category = 'Country',
    Condition = 'IS',
    Value = 'Asia',
    Value1 = 'Bahrain',
    index = 0,
    listInCreate = true,
  }) {
    cy.get('.ant-card-body')
      .eq(index)
      .within(() => {
        cy.get('div .ant-typography.sub-section')
          .contains('Category')
          .parent('div')
          .within(() => {
            cy.get('.ant-select-selector').click()
          })
      })
    if (listInCreate) {
      cy.get('div.rc-virtual-list').eq(index).find('.ant-select-item-option-content').contains(Category).click()
    } else {
      cy.get('div.rc-virtual-list')
        .eq(index + 1)
        .find('.ant-select-item-option-content')
        .contains(Category)
        .click()
    }

    if (['Console', 'Platform', 'Account Level', 'Age Group'].includes(Category)) {
      cy.get('.ant-card-body')
        .eq(index)
        .within(() => {
          cy.get('div .ant-typography.sub-section')
            .contains('Value')
            .parent('div')
            .within(() => {
              cy.get('.ant-select-selector').click({ force: true })
            })
        })
      cy.get('.ant-select-tree-list').eq(index).find('.ant-select-tree-title').contains(Value).click()
      cy.get('.ant-card-body')
        .eq(index)
        .within(() => {
          cy.get('div .ant-typography.sub-section')
            .contains('Condition')
            .parent('div')
            .within(() => {
              cy.get('label').contains(Condition).click()
            })
        })
    } else if (Category == 'Country') {
      cy.get('.ant-card-body')
        .eq(index)
        .within(() => {
          cy.get('div .ant-typography.sub-section')
            .contains('Value')
            .parent('div')
            .within(() => {
              cy.get('.ant-select-selector').click().type(Value)
            })
        })
      cy.get('.ant-select-tree-list').eq(index).find('.ant-select-tree-title').contains(Value1).click()
      cy.get('.ant-card-body')
        .eq(index)
        .within(() => {
          cy.get('div .ant-typography.sub-section')
            .contains('Condition')
            .parent('div')
            .within(() => {
              cy.get('label').contains(Condition).click()
            })
        })
    } else if (Category == 'Age') {
      cy.get('.ant-card-body')
        .eq(index)
        .within(() => {
          cy.get('div .ant-typography.sub-section')
            .contains('Value')
            .parent('div')
            .within(() => {
              cy.get('input').click().type(Value)
            })

          cy.get('div .ant-typography.sub-section')
            .contains('Condition')
            .parent('div')
            .within(() => {
              cy.get('.ant-select-selector').click()
            })
        })
      cy.get('div.rc-virtual-list').eq(index).find('.ant-select-item-option-content').contains(Condition).click()
    }
  }

  conditionPicker(condition = 'AND', index = 0) {
    cy.get('.condition-picker').eq(index).contains(condition).click()
  }

  selectProduct(productName = 'Test Product Cypress 1') {
    cy.get('.ant-select-selector').eq(0).click().type(productName)
    cy.document().its('body').find('.ant-select-item').contains(productName).click()
  }

  assertSegmentInfo(id, name) {
    cy.get('.ant-spin-container .id')
      .eq(0)
      .invoke('text')
      .then((text) => {
        expect(text.replace(/\s+/g, ' ')).to.include(id)
      })

    cy.get('.ant-spin-container')
      .invoke('text')
      .then((text) => {
        expect(text.replace(/\s+/g, ' ')).to.include(name)
      })
  }

  clickEdit() {
    cy.get('.tdi-edit').click()
  }
}
