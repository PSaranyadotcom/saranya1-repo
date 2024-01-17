/* eslint-disable no-undef */
import { Common } from '../page-objects/common-ant-page-objects'
import { Store } from '../page-objects/store-v2-page-objects'
import { Offer } from '../page-objects/store-v2-offer-page-objects'
const path = require('path')

const common = new Common()
const storePage = new Store()
const offerPage = new Offer()
const downloadsFolder = Cypress.config('downloadsFolder')

before('Login and get feature flags', function () {
  cy.cleanUpStoreAndOfferRecords()
  cy.cleanUpSkuRecords()
  cy.doAuth()
  cy.getFeatureFlags().then((values) => {
    this.featureFlags = values
  })

  this.SELECTOR_STORE_LIST = storePage.storeListSelector
  this.SELECTOR_OFFER_LIST = offerPage.offerListSelector
  this.SELECTOR_LINKED_SALES_TABLE = offerPage.linkedSalesEventTableSelector
  this.SELECTOR_LINKED_OFFER_TABLE = offerPage.linkedOfferTableSelector
})

describe('Game Studio - Stores', function () {
  describe('Store Activities', function () {
    describe('Smoke Tests', { tags: '@smoke' }, function () {
      before(function () {
        this.baseTitle = 'Store'
        this.storeName = `${this.baseTitle} ${Date.now()}`
        this.skuName = `${this.baseTitle} SKU ${Date.now()}`
        this.offerName = `${this.baseTitle} Offer ${Date.now()}`
        this.publishedStoreName = `${this.baseTitle} Publish ${Date.now()}`
        this.exportedStore = ''
        this.deleteSuccess = false

        cy.createStore(this.storeName).then((id) => {
          this.storeId = id
          cy.createSKU(id, this.skuName).then((id) => {
            this.skuId = id
            cy.createOffer(this.storeId, id, this.offerName)
          })
        })
        cy.createStore(this.publishedStoreName).then((id) => {
          this.publishedStoreId = id
        })
      })

      beforeEach(function () {
        cy.visitBaseUrl()

        cy.intercept('**/products').as('waitForProducts')
        common.navigateSidebarMenu('Commerce', 'Stores')

        cy.wait('@waitForProducts')
        cy.intercept('**/catalog/stores**').as('waitForStores')
        common.selectProduct()
        cy.wait('@waitForStores')
        common.waitForLoaderToDisappear()
      })

      it('Should create a store', { tags: ['@smoke'] }, function () {
        this.createdStoreName = `${this.baseTitle} ${Date.now()}`

        storePage.clickNewStore()

        storePage.inputName(this.createdStoreName)
        storePage.selectType('Test')
        storePage.inputDescription(`${this.baseTitle} Description`)
        storePage.selectRounding('Up')
        // Intercept response to get storeId
        cy.intercept('POST', '**/api/catalog/stores', (req) => {
          req.on('after:response', (res) => {
            this.createdStoreId = res.body.data.id
          })
        }).as('waitForSave')
        storePage.clickCreateStore()

        cy.assertAlert('Store created')
        cy.wait('@waitForSave').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })
        common.waitForLoaderToDisappear()
        common.searchDataTable(this.createdStoreName)
        common.assertRowExist(this.createdStoreName, this.SELECTOR_STORE_LIST)
        // Clean up created store
        cy.waitUntil(() => this.createdStoreId).then(() => {
          cy.deleteStore(this.createdStoreId)
        })
      })

      it('Should display a list of stores', { tags: ['@smoke'] }, function () {
        common.getRowLength(this.SELECTOR_STORE_LIST).then((length) => {
          expect(length).to.be.greaterThan(0)
        })
      })

      it('Should view a store', { tags: ['@smoke'] }, function () {
        common.waitForLoaderToDisappear()
        common.searchDataTable(this.storeName)
        common.getTableRowByString(this.storeName, this.SELECTOR_STORE_LIST).within(() => {
          common.clickView()
        })
        cy.wait(1000)
        common.waitForLoaderToDisappear()
        storePage.assertStoreInfo(this.storeName, this.storeId)
      })

      it('Should edit a store', { tags: ['@smoke'] }, function () {
        common.waitForLoaderToDisappear()
        common.searchDataTable(this.storeName)
        common.getTableRowByString(this.storeName, this.SELECTOR_STORE_LIST).within(() => {
          common.clickView()
        })
        common.waitForLoaderToDisappear()

        this.newStoreName = `Updated ${this.baseTitle} ${Date.now()}`

        common.clickEdit()

        storePage.selectType('Test')
        storePage.inputName(this.newStoreName)
        storePage.inputDescription(`Updated ${this.baseTitle} Description`)
        storePage.selectRounding('Down')
        cy.intercept('PUT', `**/catalog/stores/${this.storeId}`).as('waitForSave')
        storePage.clickUpdateStore()

        cy.assertAlert('Store updated')
        cy.wait('@waitForSave').then((res) => {
          if (res.response.statusCode == 204) {
            this.storeName = this.newStoreName
          }
          expect(res.response.statusCode).to.equal(204)
        })
        common.waitForLoaderToDisappear()
        common.searchDataTable(this.newStoreName)
        common.assertRowExist(this.newStoreName, this.SELECTOR_STORE_LIST)
      })

      it('Should view store history', { tags: ['@smoke'] }, function () {
        common.waitForLoaderToDisappear()
        common.searchDataTable(this.storeName)
        common.getTableRowByString(this.storeName, this.SELECTOR_STORE_LIST).within(() => {
          common.clickView()
        })
        common.waitForLoaderToDisappear()

        common.clickOverflow()
        cy.intercept(`**/catalog/stores/${this.storeId}/history`).as('waitForHistory')
        storePage.clickViewStoreHistory()

        cy.wait('@waitForHistory').then((res) => {
          expect(res.response.statusCode).to.equal(200)
        })
        common.waitForLoaderToDisappear()

        common.getRowLength().then((length) => {
          expect(length).to.be.greaterThan(0)
        })

        common.getTableRowByIndex(0).within(() => {
          common.clickExpand()
        })

        common.getExpandedRowContent().then((text) => {
          expect(text).to.not.be.empty
        })

        common.navigateBreadcrumbByString(this.storeName)
      })

      it('Should export a store', { tags: ['@smoke', '@wip'] }, function () {
        common.waitForLoaderToDisappear()
        common.searchDataTable(this.storeName)
        common.getTableRowByString(this.storeName, this.SELECTOR_STORE_LIST).within(() => {
          common.clickVerticalOverflow()
        })

        cy.intercept(`**/api/catalog/stores/${this.storeId}/export`, (req) => {
          req.on('after:response', (res) => {
            this.temp = res.headers['content-disposition'].split('filename=')
            this.exportedStore = this.temp[this.temp.length - 1].replace(/["]+/g, '')
          })
        }).as('waitForExport')
        storePage.clickExportStore()
        cy.wait('@waitForExport').then((res) => {
          expect(res.response.statusCode).to.equal(200)
        })
      })

      it('Should import a store', { tags: ['@smoke', '@wip'] }, function () {
        // Create exported store JSON and edit store name to be unique
        this.exportedStore = `store_${Date.now()}.json`
        this.importedStoreName = `${this.baseTitle} ${Date.now()} Imported`

        cy.exportStore(this.storeId).then((body) => {
          this.json = body
          this.json.name = this.importedStoreName
          const filename = path.join(downloadsFolder, this.exportedStore)
          cy.writeFile(filename, this.json)
        })

        storePage.clickImportStore()
        common.waitForModal().within(() => {
          storePage.importStore(`../downloads/${this.exportedStore}`)
          cy.intercept(`**/catalog/stores/import`, (req) => {
            req.on('after:response', (res) => {
              this.importedStoreId = res.body.data.id
            })
          }).as('waitForImport')
          storePage.clickImport()
        })

        cy.wait('@waitForImport').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })

        cy.assertAlert('Store Imported')
        common.waitForLoaderToDisappear()
        common.searchDataTable(this.importedStoreName)
        common.getTableRowByString(this.importedStoreName, this.SELECTOR_STORE_LIST).within(() => {
          common.clickView()
        })
        common.waitForLoaderToDisappear()

        cy.waitUntil(() => this.importedStoreId).then(() => {
          storePage.assertStoreInfo(
            this.importedStoreName,
            this.importedStoreId,
            'Test',
            `Updated ${this.baseTitle} Description`
          )
        })
        cy.wait(2000)
        common.assertRowExist(this.offerName, this.SELECTOR_OFFER_LIST)
        // Clean up imported store
        cy.waitUntil(() => this.importedStoreId).then(() => {
          cy.deleteStore(this.importedStoreId)
        })
      })

      it('Should publish a store', { tags: ['@smoke'] }, function () {
        common.waitForLoaderToDisappear()
        common.searchDataTable(this.storeName)
        common.getTableRowByString(this.storeName, this.SELECTOR_STORE_LIST).within(() => {
          common.clickVerticalOverflow()
        })

        cy.intercept(`**/catalog/stores?**`).as('waitForStores')
        storePage.clickPublishStore()
        cy.wait('@waitForStores')

        common.getSource(this.storeId).then((source) => {
          expect(source).to.include(this.storeId)
          expect(source).to.include(this.storeName)
        })
        // common.waitForLoaderToDisappear();
        common.searchDataTable(this.publishedStoreName, '', 1, 0)
        common.getTableRowByString(this.publishedStoreName).within(() => {
          common.clickRadio()
        })

        cy.intercept('POST', '*/catalog/stores/publish').as('waitForSave')
        common.clickPublish()

        common.waitForModal().within(() => {
          common.clickPublish()
        })

        cy.wait('@waitForSave').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })

        // Check if offer is published
        common.searchDataTable(this.publishedStoreName)
        common.getTableRowByString(this.publishedStoreName, this.SELECTOR_STORE_LIST).within(() => {
          cy.intercept(`*/catalog/stores/${this.publishedStoreId}`).as('waitForStore')
          common.clickView()
          cy.wait('@waitForStore')
        })

        cy.waitUntil(() => cy.get(this.SELECTOR_OFFER_LIST)).within(() => {
          expect(this.offerName).to.exist
        })
      })

      it('Should delete a store', { tags: ['@smoke'] }, function () {
        common.waitForLoaderToDisappear()
        common.searchDataTable(this.storeName)
        common.getTableRowByString(this.storeName, this.SELECTOR_STORE_LIST).within(() => {
          common.clickTrash()
        })

        common.waitForModal().within(() => {
          cy.intercept('DELETE', `*/catalog/stores/${this.storeId}`).as('waitForDelete')
          common.clickDelete()
        })

        cy.assertAlert(`Store "${this.storeName}" deleted`)
        cy.wait('@waitForDelete').then((res) => {
          if (res.response.statusCode == 204) {
            this.deleteSuccess = true
          }
          expect(res.response.statusCode).to.equal(204)
        })

        common.waitForLoaderToDisappear()
        common.assertRowNotExist(this.storeName, this.SELECTOR_STORE_LIST)
      })

      after('Clean up', function () {
        if (!this.deleteSuccess) {
          cy.deleteStore(this.storeId)
        }
        cy.deleteStore(this.publishedStoreId)
        cy.deleteSKU(this.skuId)
      })
    })
  })

  describe('Offer Activities', function () {
    describe('Smoke Tests', { tags: '@smoke' }, function () {
      before('Setup', function () {
        this.baseTitle = 'Offer'
        this.storeName = `${this.baseTitle} Store ${Date.now()}`
        this.skuName = `${this.baseTitle} SKU ${Date.now()}`
        this.offerName = `${this.baseTitle} ${Date.now()}`
        this.salesName = `${this.baseTitle} SalesEvent ${Date.now()}`
        this.deleteSuccess = false

        cy.createStore(this.storeName).then((id) => {
          this.storeId = id
          cy.createSKU(id, this.skuName).then((id) => {
            this.skuId = id
            cy.createOfferWithMultipleCurrency(this.storeId, id, this.offerName).then((id) => {
              this.offerId = id
              cy.createSalesEvent(this.salesName, this.storeId, id).then((id) => {
                this.eventId = id
              })
            })
          })
        })
      })

      beforeEach(function () {
        cy.visitBaseUrl()

        cy.intercept('**/products').as('waitForProducts')
        common.navigateSidebarMenu('Commerce', 'Stores')

        cy.wait('@waitForProducts')
        cy.intercept('**/catalog/stores**').as('waitForStores')
        common.selectProduct('Test Product Cypress 1')

        cy.wait('@waitForStores')
        common.waitForLoaderToDisappear()
        common.searchDataTable(this.storeName)
        common.getTableRowByString(this.storeName, this.SELECTOR_STORE_LIST).within(() => {
          cy.intercept(`**/catalog/stores/${this.storeId}`).as('waitForStore')
          common.clickView()
          cy.wait('@waitForStore')
        })
      })

      it('Should create an offer', { tags: ['@smoke'] }, function () {
        this.createdOfferName = `${this.baseTitle} ${Date.now()}`
        common.clickButtonByName('New Offer')
        common.waitForLoaderToDisappear()
        // SKU Selection Page
        common.searchDataTable(this.skuName)
        common.getTableRowByString(this.skuName).within(() => {
          common.clickRadio()
        })
        common.clickNext()
        // Details Page
        offerPage.selectType('In Game')
        offerPage.inputName(this.createdOfferName)
        offerPage.inputDescription('description')
        offerPage.inputTag('tag1 tag2 ')
        offerPage.repurchasePolicy()
        offerPage.inputOfferData('test')
        offerPage.clickAddPricing()
        common.waitForModal().within(() => {
          offerPage.inputPricing('AAA', 10)
          common.clickButtonByName('Add in-game price')
        })
        common.clickNext()
        // Availablility Page

        //Pass different month value as argument to add for current date to avoid availablity window overlap for offer.
        offerPage.inputDateInAvailabilityWindow(2, 3)

        // Intercept response to get offerId
        cy.intercept('POST', '**/catalog/offers', (req) => {
          req.on('after:response', (res) => {
            if (res.statusCode === 201) this.createdOfferId = res.body
          })
        }).as('waitForSave')
        common.clickButtonByName('Create Offer')

        cy.wait('@waitForSave').then((res) => {
          expect(res.request.body.action).to.contains('create')
          expect(res.response.statusCode).to.equal(201)
        })
        cy.assertAlert('Offer created')
        common.waitForLoaderToDisappear()
        common.searchDataTable(this.createdOfferName)
        cy.waitUntil(() => this.createdOfferId).then(() => {
          common.assertRowExist(this.createdOfferId, this.SELECTOR_OFFER_LIST)
        })

        // Clean up created offer
        cy.waitUntil(() => this.createdOfferId).then(() => {
          cy.deleteOffer(this.createdOfferId)
        })
      })

      it('Should display a list of offers', { tags: ['@smoke'] }, function () {
        common.getRowLength(this.SELECTOR_OFFER_LIST).then((length) => {
          expect(length).to.be.greaterThan(0)
        })
      })

      it('Should view an Offer and SalesEvent records', { tags: ['@smoke'] }, function () {
        common.waitForLoaderToDisappear()
        common.searchDataTable(this.offerName)
        cy.waitUntil(() => this.offerId).then(() => {
          common.getDataByColumnName('', 'IN-GAME PRICES').then((currency) => {
            offerPage.verifyIngamePrices(currency)
          })
          common.getDataByColumnName('', 'OFFER STATUS').then((data) => {
            expect(data).to.contains('Active')
          })
          cy.waitUntil(() => this.offerId)
          offerPage.expandButton()
          cy.waitUntil(() => this.eventId).then(() => {
            offerPage.verifyLinkedSalesEvent(this.eventId)
          })
          common.getDataByColumnName(this.SELECTOR_LINKED_SALES_TABLE, 'DISCOUNT PRICE').then((currency) => {
            offerPage.verifyIngamePrices(currency)
          })

          common.navigateToTab('Sales Event')
          common.searchDataTable(this.salesName, '', 0, 1)
          offerPage.expandButton(1)

          common.getDataByColumnName(this.SELECTOR_LINKED_OFFER_TABLE, 'LINKED OFFER(S)').then((offer) => {
            expect(offer).to.contains(this.offerName)
          })

          common.getDataByColumnName(this.SELECTOR_LINKED_OFFER_TABLE, 'SKU GRANTED').then((offer) => {
            expect(offer).to.contains(this.skuName)
          })

          common.getDataByColumnName(this.SELECTOR_LINKED_OFFER_TABLE, 'IN GAME PRICE(S)').then((currency) => {
            offerPage.verifyIngamePrices(currency)
          })
          common.navigateToTab('Offers')
          common.getTableRowByString(this.offerId, this.SELECTOR_OFFER_LIST).within(() => {
            common.clickView()
          })
        })
        common.waitForLoaderToDisappear()
        offerPage.assertOfferInfo(this.offerName, this.offerId)
      })

      it('Should edit an offer', { tags: ['@smoke'] }, function () {
        common.waitForLoaderToDisappear()
        common.searchDataTable(this.offerName)
        cy.wait(1000)
        cy.waitUntil(() => this.offerId).then(() => {
          common.getTableRowByString(this.offerId, this.SELECTOR_OFFER_LIST).within(() => {
            common.clickView()
          })
        })
        common.waitForLoaderToDisappear()

        this.newOfferName = `Updated ${this.baseTitle} ${Date.now()}`

        common.clickEdit()
        common.waitForModal().within(() => {
          // Details modal
          offerPage.selectType('In Game')
          offerPage.inputName(this.newOfferName)
          offerPage.inputDescription(`Updated ${this.baseTitle} Description`)
          offerPage.inputTag('tag2 ')
          offerPage.inputOfferData('test')
          cy.intercept('POST', `**/catalog/offers`).as('waitForSave')
          common.clickSave()
          cy.wait('@waitForSave').then((res) => {
            if (res.response.statusCode == 204) this.offerName = this.newOfferName
            expect(res.request.body.action).to.contains('update')
            expect(res.response.statusCode).to.equal(204)
          })
        })

        // Pricing tab
        common.navigateToTab('In-game Prices')
        common.getActiveTab().within(() => {
          offerPage.clickOnEditPricing()
        })
        common.waitForModal(1).within(() => {
          offerPage.editInputPricing('AAA', 1, 1)
          cy.intercept('PUT', `**/catalog/offers`).as('waitForSave')
          common.clickButtonByName('Edit in-game price')
          cy.wait('@waitForSave').then((res) => {
            if (res.response.statusCode === 204) expect(res.response.statusCode).to.equal(204)
          })
        })
        common.navigateBreadcrumbByString(this.storeName)
        common.clearSearch()
        common.searchDataTable(this.newOfferName)
        cy.waitUntil(() => this.offerId).then(() => {
          common.assertRowExist(this.offerId, this.SELECTOR_OFFER_LIST)
        })
      })

      it('Should clone an offer', { tags: ['@smoke'] }, function () {
        common.waitForLoaderToDisappear()
        common.searchDataTable(this.offerName)
        cy.waitUntil(() => this.offerId).then(() => {
          common.getTableRowByString(this.offerId, this.SELECTOR_OFFER_LIST).within(() => {
            common.clickClone()
          })
        })
        common.waitForLoaderToDisappear()
        this.clonedOfferName = `Cloned ${this.baseTitle} ${Date.now()}`

        // Details Page
        common.clickNext()
        cy.wait(2000)
        offerPage.selectType('In Game')
        offerPage.inputName(this.clonedOfferName)
        offerPage.inputDescription(`Cloned ${this.baseTitle} Description`)
        offerPage.inputTag('tag3 ')
        offerPage.repurchasePolicy()
        offerPage.inputOfferData('clone')
        offerPage.clickOnEditPricing()
        common.waitForModal().within(() => {
          offerPage.inputPricingFirstOption('1.99')
          common.clickButtonByName('Edit in-game price')
        })
        common.clickNext()
        // Availability Page
        offerPage.inputDateInAvailabilityWindow(6, 7)
        cy.intercept('POST', '**/catalog/offers', (req) => {
          req.on('after:response', (res) => {
            if (res.statusCode === 201) this.clonedOfferId = res.body
          })
        })
          .as('waitForSave')
          .then(() => {
            common.clickButtonByName('Clone Offer')
          })
        cy.wait('@waitForSave').then((res) => {
          expect(res.request.body.action).to.contains('create')
          expect(res.response.statusCode).to.equal(201)
        })
        common.clearSearch()
        common.searchDataTable(this.clonedOfferName)
        cy.waitUntil(() => this.clonedOfferId).then(() => {
          common.assertRowExist(this.clonedOfferId, this.SELECTOR_OFFER_LIST)
        })

        // Clean up cloned offer
        cy.waitUntil(() => this.clonedOfferId).then(() => {
          cy.deleteOffer(this.clonedOfferId)
        })
      })

      it('Should view offer history', { tags: ['@smoke'] }, function () {
        common.waitForLoaderToDisappear()
        common.searchDataTable(this.offerName)
        cy.waitUntil(() => this.offerId).then(() => {
          common.getTableRowByString(this.offerId, this.SELECTOR_OFFER_LIST).within(() => {
            common.clickView()
          })
        })
        common.waitForLoaderToDisappear()

        common.clickOverflow()
        cy.intercept(`**/catalog/offers/${this.offerId}/history`).as('waitForHistory')
        offerPage.clickViewOfferHistory()

        cy.wait('@waitForHistory').then((res) => {
          expect(res.response.statusCode).to.equal(200)
        })
        common.waitForLoaderToDisappear()

        common.getRowLength().then((length) => {
          expect(length).to.be.greaterThan(0)
        })

        common.getTableRowByIndex(0).within(() => {
          common.clickExpand()
        })

        common.getExpandedRowContent().then((text) => {
          expect(text).to.not.be.empty
        })

        common.navigateBreadcrumbByString(this.offerName)
      })

      it('Should delete an offer', { tags: ['@smoke'] }, function () {
        cy.waitUntil(() => this.offerId).then(() => {
          common.getTableRowByString(this.offerId, this.SELECTOR_OFFER_LIST).within(() => {
            common.clickTrash()
          })
        })
        common.waitForModal().within(() => {
          cy.intercept('POST', `**/catalog/offers`).as('waitForDelete')
          common.clickDelete()
        })
        cy.wait('@waitForDelete').then((res) => {
          expect(res.request.body.action).to.contains('delete')
          expect(res.response.statusCode).to.equal(204)
        })
        cy.waitUntil(() => this.offerId).then(() => {
          common.assertRowNotExist(this.offerName, this.SELECTOR_OFFER_LIST)
        })
      })

      after('Clean up', function () {
        cy.waitUntil(() => this.eventId).then(() => {
          cy.deleteSalesEvent(this.storeId, this.eventId)
        })
        cy.deleteStore(this.storeId)
        cy.deleteSKU(this.skuId)
      })
    })

    describe('Regression Tests', { tags: '@regression' }, function () {
      before('Setup', function () {
        this.baseTitle = 'Offer'
        this.storeName = `${this.baseTitle} Store ${Date.now()}`
        this.skuName = `${this.baseTitle} SKU ${Date.now()}`
        this.deleteSuccess = false

        cy.createStore(this.storeName).then((id) => {
          this.storeId = id
          cy.createSKU(id, this.skuName).then((id) => {
            this.skuId = id
          })
        })
      })

      beforeEach(function () {
        cy.visitBaseUrl()

        cy.intercept('**/products').as('waitForProducts')
        common.navigateSidebarMenu('Commerce', 'Stores')

        cy.wait('@waitForProducts')
        cy.intercept('**/catalog/stores**').as('waitForStores')
        common.selectProduct()

        cy.wait('@waitForStores')
        common.waitForLoaderToDisappear()
        common.searchDataTable(this.storeName)
        common.getTableRowByString(this.storeName, this.SELECTOR_STORE_LIST).within(() => {
          cy.intercept(`**/catalog/stores/${this.storeId}`).as('waitForStore')
          common.clickView()
          cy.wait('@waitForStore')
        })
      })

      it('Should create offer with 999,999,999 Virtual Currency Amount', { tags: ['@regression'] }, function () {
        this.createdOfferName = `${this.baseTitle} ${Date.now()}`

        common.clickButtonByName('New Offer')
        common.waitForLoaderToDisappear()
        common.searchDataTable(this.skuName)
        common.getTableRowByString(this.skuName).within(() => {
          common.clickRadio()
        })
        common.clickNext()

        offerPage.selectType('In Game')
        offerPage.inputName(this.createdOfferName)

        offerPage.clickAddPricing()
        common.waitForModal().within(() => {
          offerPage.inputPricing('AAA', 999999999)
          common.clickButtonByName('Add in-game price')
        })
        common.clickNext()

        // Intercept response to get offerId
        cy.intercept('POST', '**/catalog/offers', (req) => {
          req.on('after:response', (res) => {
            if (res.statusCode === 201) this.createdOfferId = res.body
          })
        }).as('waitForSave')

        common.clickButtonByName('Create Offer')

        cy.wait('@waitForSave').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })
        cy.assertAlert('Offer created')
        cy.waitUntil(() => this.createdOfferId).then(() => {
          common.assertRowExist(this.createdOfferId, this.SELECTOR_OFFER_LIST)
        })

        cy.waitUntil(() => this.createdOfferId).then(() => {
          cy.deleteOffer(this.createdOfferId)
        })
      })

      it('Should create offer priced with zero Virtual Currency', { tags: ['@regression'] }, function () {
        this.createdOfferName = `${this.baseTitle} ${Date.now()}`

        common.clickButtonByName('New Offer')
        common.waitForLoaderToDisappear()
        common.searchDataTable(this.skuName)
        common.getTableRowByString(this.skuName).within(() => {
          common.clickRadio()
        })
        common.clickNext()

        offerPage.selectType('In Game')
        offerPage.inputName(this.createdOfferName)

        offerPage.clickAddPricing()
        common.waitForModal().within(() => {
          offerPage.inputPricing('AAA', 0)
          common.clickButtonByName('Add in-game price')
        })
        common.clickNext()

        // Intercept response to get offerId
        cy.intercept('POST', '**/catalog/offers', (req) => {
          req.on('after:response', (res) => {
            if (res.statusCode === 201) this.createdOfferId = res.body
          })
        }).as('waitForSave')

        common.clickButtonByName('Create Offer')

        cy.wait('@waitForSave').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })
        cy.assertAlert('Offer created')
        cy.waitUntil(() => this.createdOfferId).then(() => {
          common.assertRowExist(this.createdOfferId, this.SELECTOR_OFFER_LIST)
        })

        cy.waitUntil(() => this.createdOfferId).then(() => {
          cy.deleteOffer(this.createdOfferId)
        })
      })

      it(
        'Should not create 1st Party offer without selecting a 1st Party Offer',
        { tags: ['@regression'] },
        function () {
          this.createdOfferName = `${this.baseTitle} ${Date.now()}`

          common.clickButtonByName('New Offer')
          common.waitForLoaderToDisappear()
          common.searchDataTable(this.skuName)
          common.getTableRowByString(this.skuName).within(() => {
            common.clickRadio()
          })
          common.clickNext()

          offerPage.selectType('1st Party')
          offerPage.inputName(this.createdOfferName)
          offerPage.inputOfferData('test')
          common.clickNext()

          common.roleAlert().invoke('text').should('include', 'Please provide 1st Party Store Service Offer ID.')
        }
      )

      // DNATEC-3472 -- In-Game pricing has been removed for 1st party offer type.
      it.skip(
        'Should not create 1st party offer priced with zero Virtual Currency',
        { tags: ['@regression'] },
        function () {
          this.createdOfferName = `${this.baseTitle} ${Date.now()}`

          common.clickButtonByName('New Offer')
          common.waitForLoaderToDisappear()
          common.searchDataTable(this.skuName)
          common.getTableRowByString(this.skuName).within(() => {
            common.clickRadio()
          })
          common.clickNext()

          offerPage.selectType('1st Party')
          offerPage.inputName(this.createdOfferName)
          offerPage.selectFirstPartyOffer(this.offerName)
          offerPage.inputOfferData('test')

          offerPage.clickAddPricing()
          common.waitForModal().within(() => {
            offerPage.inputPricing('AAA', 0)
            common.clickButtonByName('Add in-game price')
            common.getAntExplain().invoke('text').should('equal', 'Missing amount')
          })
        }
      )

      it('Should create 1st party offer without offer data', { tags: ['@regression'] }, function () {
        this.createdOfferName = `${this.baseTitle} ${Date.now()}`

        common.clickButtonByName('New Offer')
        common.waitForLoaderToDisappear()
        common.searchDataTable(this.skuName)
        common.getTableRowByString(this.skuName).within(() => {
          common.clickRadio()
        })
        common.clickNext()

        offerPage.selectType('1st Party')
        offerPage.inputName(this.createdOfferName)
        offerPage.selectFirstPartyOffer(this.offerName)
        common.clickNext()

        // Intercept response to get offerId
        cy.intercept('POST', '**/catalog/offers', (req) => {
          req.on('after:response', (res) => {
            if (res.statusCode === 201) this.createdOfferId = res.body
          })
        }).as('waitForSave')

        common.clickButtonByName('Create Offer')

        cy.wait('@waitForSave').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })
        cy.assertAlert('Offer created')
        cy.waitUntil(() => this.createdOfferId).then(() => {
          common.assertRowExist(this.createdOfferId, this.SELECTOR_OFFER_LIST)
        })

        cy.waitUntil(() => this.createdOfferId).then(() => {
          cy.deleteOffer(this.createdOfferId)
        })
      })

      it('Should create 1st party offer without pricing', { tags: ['@regression'] }, function () {
        this.createdOfferName = `${this.baseTitle} ${Date.now()}`

        common.clickButtonByName('New Offer')
        common.waitForLoaderToDisappear()
        common.searchDataTable(this.skuName)
        common.getTableRowByString(this.skuName).within(() => {
          common.clickRadio()
        })
        common.clickNext()

        offerPage.selectType('1st Party')
        offerPage.inputName(this.createdOfferName)
        offerPage.selectFirstPartyOffer(this.offerName)
        offerPage.inputOfferData('test')
        common.clickNext()

        // Intercept response to get offerId
        cy.intercept('POST', '**/catalog/offers', (req) => {
          req.on('after:response', (res) => {
            if (res.statusCode === 201) this.createdOfferId = res.body
          })
        }).as('waitForSave')

        common.clickButtonByName('Create Offer')

        cy.wait('@waitForSave').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })
        cy.assertAlert('Offer created')
        cy.waitUntil(() => this.createdOfferId).then(() => {
          common.assertRowExist(this.createdOfferId, this.SELECTOR_OFFER_LIST)
        })

        cy.waitUntil(() => this.createdOfferId).then(() => {
          cy.deleteOffer(this.createdOfferId)
        })
      })

      after('Clean up', function () {
        cy.deleteStore(this.storeId)
        cy.deleteSKU(this.skuId)
      })
    })
  })
})
