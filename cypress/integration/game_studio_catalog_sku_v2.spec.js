/* eslint-disable no-undef */
import { Common } from '../page-objects/common-ant-page-objects'
import { SKU } from '../page-objects/sku-v2-page-objects'
const common = new Common()
const skuPage = new SKU()
before('Login and get feature flags', function () {
  cy.doAuth()
  cy.getFeatureFlags().then((values) => {
    this.featureFlags = values
  })
  this.baseTitle = 'SKU'
  this.SELECTOR_SKU_LIST = skuPage.skuListSelector
})
describe('Game Studio - SKU', function () {
  describe('Smoke Tests', { tags: '@smoke' }, function () {
    before('Setup', function () {
      this.storeName = `Store ${this.baseTitle} ${Date.now()}`
      this.consumableItemName = `Consumable Non-Unique Item ${this.baseTitle} ${Date.now()}`
      this.durableItemName = `Durable Unique Item ${this.baseTitle} ${Date.now()}`
      this.skuName = `${this.baseTitle} ${Date.now()}`
      this.offerName = `Offer ${this.baseTitle} ${Date.now()}`
      this.campaignName = `Campaign ${this.baseTitle} ${Date.now()}`
      this.codeSetName = `Code Set ${this.baseTitle} ${Date.now()}`
      this.entitlementName = `Entitlement ${this.baseTitle} ${Date.now()}`
      this.deleteSuccess = false

      cy.createFPSEntitlement(this.entitlementName).then((id) => {
        this.entitlementId = id
      })

      cy.createStore(this.storeName).then((id) => {
        this.storeId = id
        cy.createSKU(id, this.skuName).then((id) => {
          this.skuId = id
          cy.createOffer(this.storeId, id, this.offerName).then((id) => {
            this.offerId = id
          })
          cy.createCampaign(this.campaignName).then((id) => {
            this.campaignId = id
            cy.createCodeset(this.campaignId, this.codeSetName, this.skuId).then((id) => {
              this.codeSetId = id
            })
          })
        })
      })

      // Create Consumable Non-Unique item for test
      cy.createItem(this.consumableItemName, 3, 'uses', 5).then((id) => {
        this.consumableItemId = id
      })

      // Create Durable Unique item for test
      cy.createItem(this.durableItemName, 0).then((id) => {
        this.durableItemId = id
      })
    })
    beforeEach(function () {
      cy.visitBaseUrl()
      cy.intercept('api2/products').as('waitForProducts')
      common.navigateSidebarMenu('Commerce', 'SKUs')
      cy.wait('@waitForProducts')
      cy.intercept('*/catalog/skus**').as('waitForSku')
      common.selectProduct()
      cy.wait('@waitForSku')
      common.waitForLoaderToDisappear()
    })
    it('Should create a SKU', { tags: '@smoke' }, function () {
      this.createdSkuName = `${this.baseTitle} ${Date.now()}`
      common.clickButtonByName('New SKU')
      // Details Page
      skuPage.inputName(this.createdSkuName)
      skuPage.inputDescription(`${this.baseTitle} Description`)
      skuPage.inputTag('tag1 tag2 ')

      // Optional part while creating SKU
      cy.then(() => {
        if (this.featureFlags.is1PSSDropddownVisible || this.featureFlags.is1PSSDropddownVisible == null) {
          skuPage.selectFPSEntitlement(this.entitlementName)
        }
      })
      common.clickNext()
      // Content Page
      common.clickButtonByName(/\bAdd currenc(y|ies)\b/)
      common.waitForModal().within(() => {
        common.searchDataTable('TST', 'Code')
        skuPage.inputCurrency('TST', 121)
        common.clickButtonByName(/\bAdd currenc(y|ies)\b/)
      })
      common.clickButtonByName(/\bAdd item(|s)\b/)
      common.waitForModal(1).within(() => {
        common.searchDataTable(this.consumableItemId, 'ID')
        skuPage.inputItem(this.consumableItemId, 3)
        common.searchDataTable(this.durableItemId, 'ID')
        skuPage.inputItem(this.durableItemId)
        common.clickButtonByName(/\bAdd item(|s)\b/)
      })
      // Intercept response to get skuId
      cy.intercept('POST', 'api/catalog/skus', (req) => {
        req.on('after:response', (res) => {
          this.createdSkuId = res.body.data.id
        })
      }).as('waitForSave')
      common.clickButtonByName('Create SKU')
      cy.assertAlert('SKU created')
      cy.wait('@waitForSave').then((res) => {
        expect(res.response.statusCode).to.equal(201)
      })
      common.waitForLoaderToDisappear()
      common.searchDataTable(this.createdSkuName)
      common.assertRowExist(this.createdSkuName, this.SELECTOR_SKU_LIST)
      // Clean up created SKU
      cy.waitUntil(() => this.createdSkuId).then(() => {
        cy.deleteSKU(this.createdSkuId)
      })
    })
    it('Should display a list of SKUs', { tags: '@smoke' }, function () {
      common.waitForLoaderToDisappear()
      common.getRowLength(this.SELECTOR_SKU_LIST).then((length) => {
        expect(length).to.be.greaterThan(0)
      })
    })
    it('Should view a SKU', { tags: '@smoke' }, function () {
      common.searchDataTable(this.skuName)
      common.getTableRowByString(this.skuName, this.SELECTOR_SKU_LIST).within(() => {
        cy.intercept(`api/catalog/skus/${this.skuId}`).as('waitForSku')
        common.clickView()
        cy.wait('@waitForSku')
      })
      cy.wait(1000)
      skuPage.assertSkuInfo(this.skuName, this.skuId)
      common.getDataTableByIndex(0).within(() => {
        expect('TST').to.exist
      })
      common.navigateToTab('Used In')
      common.getActiveTab().within(() => {
        common.getActiveTab().within(() => {
          common.waitForLoaderToDisappear()
          common.assertRowExist(this.offerId)
        })

        cy.intercept('GET', `api/codes/code-sets?campaignId=${this.campaignId}`).as('waitForCodesets')
        common.navigateToTab('Codesets')
        common.waitForLoaderToDisappear(300000)
        common.getActiveTab().within(() => {
          common.assertRowExist(this.codeSetId)
        })
        cy.wait('@waitForCodesets').then((res) => {
          expect(res.response.statusCode).to.equal(200)
        })
      })
    })
    it('Should edit a SKU', { tags: '@smoke' }, function () {
      common.searchDataTable(this.skuName)
      common.getTableRowByString(this.skuName, this.SELECTOR_SKU_LIST).within(() => {
        common.clickView()
      })
      this.newSkuName = `Updated ${this.baseTitle} ${Date.now()}`
      common.clickEdit()
      common.waitForModal().within(() => {
        skuPage.inputName(this.newSkuName)
        skuPage.inputDescription(`Updated ${this.baseTitle} Description`)
        skuPage.inputTag('tag2 ')
        cy.then(() => {
          if (this.featureFlags.is1PSSDropddownVisible || this.featureFlags.is1PSSDropddownVisible == null) {
            skuPage.selectFPSEntitlement(this.entitlementName)
          }
        })
        cy.intercept('PUT', `api/catalog/skus/${this.skuId}`).as('waitForSave')
        common.clickSave()
        cy.wait('@waitForSave').then((res) => {
          if (res.response.statusCode == 204) {
            this.skuName = this.newSkuName
          }
          expect(res.response.statusCode).to.equal(204)
        })
      })
      common.waitForLoaderToDisappear()
      common.clickButtonByName(/\bAdd currenc(y|ies)\b/)
      common.waitForModal(1).within(() => {
        common.searchDataTable('TST', 'Code')
        skuPage.inputCurrency('TST', 50, false)
        common.searchDataTable('AAA')
        skuPage.inputCurrency('AAA', 1)
        cy.intercept('PUT', `api/catalog/skus/${this.skuId}`).as('waitForSave')
        common.clickButtonByName(/\bAdd currenc(y|ies)\b/)
        cy.wait('@waitForSave').then((res) => {
          expect(res.response.statusCode).to.equal(204)
        })
      })
      common.getDataTableByIndex(0).within(() => {
        common.getTableRowByString('TST').within(() => {
          common.clickTrash()
        })
      })
      cy.intercept('PUT', `api/catalog/skus/${this.skuId}`).as('waitForSave')
      common.clickYes()
      cy.wait('@waitForSave').then((res) => {
        expect(res.response.statusCode).to.equal(204)
      })
      // Add, edit, and remove item
      common.clickButtonByName(/\bAdd item(|s)\b/)
      common.waitForModal(3).within(() => {
        common.searchDataTable(this.consumableItemId, 'ID')
        skuPage.inputItem(this.consumableItemId, 3)
        common.searchDataTable(this.durableItemId, '', 1)
        skuPage.inputItem(this.durableItemId)
        cy.intercept('PUT', `api/catalog/skus/${this.skuId}`).as('waitForSave')
        common.clickButtonByName(/\bAdd item(|s)\b/)
        cy.wait(1000)
        cy.wait('@waitForSave').then((res) => {
          expect(res.response.statusCode).to.equal(204)
        })
      })
      cy.wait(1500)
      cy.reload()
      common.getDataTableByIndex(1).within(() => {
        common.getTableRowByString(this.durableItemName).within(() => {
          common.clickTrash()
        })
      })
      common.waitForModal(0).within(() => {
        cy.intercept('PUT', `api/catalog/skus/${this.skuId}`).as('waitForSave')
        common.clickButtonByName('Yes, please proceed')
        cy.wait('@waitForSave').then((res) => {
          expect(res.response.statusCode).to.equal(204)
        })
      })
      common.navigateBreadcrumbByString('SKUs')
      common.waitForLoaderToDisappear()
      common.searchDataTable(this.newSkuName)
      common.assertRowExist(this.newSkuName, this.SELECTOR_SKU_LIST)
    })
    it('Should clone a SKU', { tags: '@smoke' }, function () {
      common.searchDataTable(this.skuName)
      common.getTableRowByString(this.skuName, this.SELECTOR_SKU_LIST).within(() => {
        cy.intercept(`api/catalog/skus/${this.skuId}`).as('waitForSku')
        common.clickClone()
        cy.wait('@waitForSku')
      })
      this.clonedSkuName = `Cloned ${this.baseTitle} ${Date.now()}`
      skuPage.inputName(this.clonedSkuName)
      skuPage.deselectFPSEntitlement()
      common.clickNext()
      // Intercept response to get skuId
      cy.intercept('POST', 'api/catalog/skus', (req) => {
        req.on('after:response', (res) => {
          this.clonedSkuId = res.body.data.id
        })
      }).as('waitForSave')
      common.clickButtonByName('Clone SKU')
      cy.wait('@waitForSave').then((res) => {
        expect(res.response.statusCode).to.equal(201)
      })
      cy.assertAlert('SKU cloned')
      common.waitForLoaderToDisappear()
      common.searchDataTable(this.clonedSkuName)
      common.assertRowExist(this.clonedSkuName, this.SELECTOR_SKU_LIST)
      // Clean up cloned sku
      cy.waitUntil(() => this.clonedSkuId).then(() => {
        cy.deleteSKU(this.clonedSkuId)
      })
    })
    it('Should view SKU history', { tags: '@smoke' }, function () {
      common.searchDataTable(this.skuName)
      common.getTableRowByString(this.skuName, this.SELECTOR_SKU_LIST).within(() => {
        cy.intercept(`api/catalog/skus/${this.skuId}`).as('waitForSku')
        common.clickView()
        cy.wait('@waitForSku')
      })
      common.clickOverflow()
      cy.intercept(`api/catalog/skus/${this.skuId}/history`).as('waitForHistory')
      skuPage.clickViewSKUHistory()
      cy.wait('@waitForHistory').then((res) => {
        expect(res.response.statusCode).to.equal(200)
      })
      common.waitForLoaderToDisappear()
      common.getRowLength().then((length) => {
        expect(length).to.be.greaterThan(0)
      })
      common.navigateBreadcrumbByString(this.skuName)
    })
    it('Should delete a SKU', { tags: '@smoke' }, function () {
      cy.deleteOffer(this.offerId)
      cy.deleteCodeset(this.codeSetId)
      common.searchDataTable(this.skuName)
      common.getTableRowByString(this.skuName, this.SELECTOR_SKU_LIST).within(() => {
        common.clickTrash()
      })
      common.waitForModal().within(() => {
        cy.intercept('DELETE', `*/catalog/skus/${this.skuId}`).as('waitForDelete')
        common.clickDelete()
      })
      cy.assertAlert(`SKU "${this.skuName}" deleted`)
      cy.wait('@waitForDelete').then((res) => {
        if (res.response.statusCode == 204) {
          this.deleteSuccess = true
        }
        expect(res.response.statusCode).to.equal(204)
      })
      common.waitForLoaderToDisappear()
      common.assertRowNotExist(this.skuName, this.SELECTOR_SKU_LIST)
    })
    after('Clean up', function () {
      cy.deleteStore(this.storeId)
      cy.deleteCampaign(this.campaignId)
      if (!this.deleteSuccess) {
        cy.deleteSKU(this.skuId)
      }
      cy.deleteItem(this.consumableItemId)
      cy.deleteItem(this.durableItemId)
      cy.deleteFPSEntitlement(this.entitlementId)
    })
  })
  describe('Regression Tests', { tags: '@regression' }, function () {
    beforeEach(function () {
      cy.visitBaseUrl()
      cy.intercept('api2/products').as('waitForProducts')
      common.navigateSidebarMenu('Commerce', 'SKUs')
      cy.wait('@waitForProducts')
      cy.intercept('*/catalog/skus**').as('waitForSku')
      common.selectProduct()
      cy.wait('@waitForSku')
      common.waitForLoaderToDisappear()
    })
    context('SKU Linked', function () {
      before('Setup', function () {
        this.storeName = `${this.baseTitle} store ${Date.now()}`
        this.skuName = `${this.baseTitle} ${Date.now()}`
        this.codeSetName = `${this.baseTitle} Code Set ${Date.now()}`
        this.campaignName = `${this.baseTitle} Campaign ${Date.now()}`
        cy.createStore(this.storeName).then((id) => {
          this.storeId = id
          cy.createSKU(id, this.skuName).then((id) => {
            this.skuId = id
            cy.createCampaign(this.campaignName).then((id) => {
              this.campaignId = id
              cy.createCodeset(this.campaignId, this.codeSetName, this.skuId).then((id) => {
                this.codeSetId = id
              })
            })
          })
        })
      })

      it('Should not delete SKU with code set linked', { tags: '@regression' }, function () {
        common.searchDataTable(this.skuName)
        common.getTableRowByString(this.skuName, this.SELECTOR_SKU_LIST).within(() => {
          common.clickTrash()
        })
        common.waitForModal().within(() => {
          cy.intercept('DELETE', `api/catalog/skus/${this.skuId}`).as('waitForDelete')
          common.clickDelete()
        })

        cy.wait('@waitForDelete').then((res) => {
          expect(res.response.statusCode).to.equal(422)
        })

        cy.assertAlert('SKU delete failed')
      })

      after('Clean up', function () {
        cy.deleteCampaign(this.campaignId)
        cy.deleteSKU(this.skuId)
      })
    })

    context('SKU Linked', function () {
      before('Setup', function () {
        this.storeName = `${this.baseTitle} Store ${Date.now()}`
        this.offerName = `${this.baseTitle} Offer ${Date.now()}`
        this.skuName = `${this.baseTitle} ${Date.now()}`
        cy.createStore(this.storeName).then((id) => {
          this.storeId = id
          cy.createSKU(id, this.skuName).then((id) => {
            this.skuId = id
            cy.createOffer(this.storeId, id, this.offerName).then((id) => {
              this.offerId = id
            })
          })
        })
      })

      it('Should not delete SKU with offer linked', { tags: '@regression' }, function () {
        common.searchDataTable(this.skuName)
        common.getTableRowByString(this.skuName, this.SELECTOR_SKU_LIST).within(() => {
          common.clickTrash()
        })
        common.waitForModal().within(() => {
          cy.intercept('DELETE', `api/catalog/skus/${this.skuId}`).as('waitForDelete')
          common.clickDelete()
        })

        cy.wait('@waitForDelete').then((res) => {
          expect(res.response.statusCode).to.equal(422)
        })

        cy.assertAlert('SKU delete failed')
      })

      after('Clean up', function () {
        cy.deleteStore(this.storeId)
        cy.deleteSKU(this.skuId)
      })
    })
  })
})
