/* eslint-disable no-undef */
import { Common } from '../page-objects/common-ant-page-objects'
import { CloudData } from '../page-objects/cloud-data-page-objects'

const common = new Common()
const cloudDataPage = new CloudData()
const productId = Cypress.env('productId')

before('Login and get feature flags', function () {
  cy.doAuth()
  cy.getFeatureFlags().then((values) => {
    this.featureFlags = values
  })

  this.baseTitle = 'Cloud Data'
  this.SELECTOR_CLOUD_DATA_LIST = cloudDataPage.cloudDataListSelector
})

describe('Game Studio - Cloud Data', function () {
  describe('Smoke tests', { tags: ['@smoke'] }, function () {
    before('Setup record for tests', function () {
      this.deleteSuccess = false
      this.recordKey = common.newUUID()
      cy.createRecord(this.recordKey).then((id) => {
        this.ownerId = id
      })
    })

    beforeEach(function () {
      cy.visitBaseUrl()

      cy.intercept('api2/products').as('waitForProducts')
      cloudDataPage.navigateToCloudData()

      cy.wait('@waitForProducts').then(() => {
        cy.intercept(`**/cloud-data/admin/games/${productId}/records**`).as('waitForRecords')
        common.selectProduct()
      })

      cy.wait('@waitForRecords')
      common.waitForLoaderToDisappear()
    })

    it('Should create a record', { tags: ['@smoke'] }, function () {
      this.createdRecordKey = common.newUUID()

      common.clickButtonByName('New Record')

      // Description Page
      cloudDataPage.inputKey(this.createdRecordKey)
      cloudDataPage.inputTag('tag1 tag2 ')
      common.clickButtonByName('Next')

      // Data Page
      cloudDataPage.inputOpaque('test')
      cloudDataPage.inputProperties(`{"boolean": false, "integer": 1, "string": "test"}`)

      // Intercept response to get ownerId
      cy.intercept('POST', `**/cloud-data/admin/games/${productId}/records?`, (req) => {
        req.on('after:response', (res) => {
          this.createdOwnerId = res.body.ownerId
        })
      }).as('waitForSave')
      common.clickButtonByName('Create Record')

      cy.wait('@waitForSave').then((res) => {
        expect(res.response.statusCode).to.equal(201)
      })
      cy.assertAlert('Record created')

      common.searchDataTable(this.createdRecordKey)
      common.assertRowExist(this.createdRecordKey, this.SELECTOR_CLOUD_DATA_LIST)

      // Clean up created Cloud Data
      cy.waitUntil(() => this.createdRecordKey).then(() => {
        cy.deleteRecord(this.createdRecordKey)
      })
    })

    it('Should display a list of records', { tags: ['@smoke'] }, function () {
      common.getRowLength(this.SELECTOR_CLOUD_DATA_LIST).then((length) => {
        expect(length).to.be.greaterThan(0)
      })
    })

    it('Should view a record', { tags: ['@smoke'] }, function () {
      common.searchDataTable(this.recordKey)
      common.getTableRowByString(this.recordKey, this.SELECTOR_CLOUD_DATA_LIST).within(() => {
        common.clickView()
      })
      common.waitForLoaderToDisappear()

      cloudDataPage.assertRecordInfo(this.recordKey, this.ownerId, 'tag1')
    })

    it('Should edit a record', { tags: ['@smoke'] }, function () {
      common.searchDataTable(this.recordKey)
      common.getTableRowByString(this.recordKey, this.SELECTOR_CLOUD_DATA_LIST).within(() => {
        common.clickView()
      })
      common.waitForLoaderToDisappear()

      common.navigateToTab('Opaque')
      cloudDataPage.clickOnRoundEditButton()
      cloudDataPage.inputOpaque('testsd')

      cy.intercept('PATCH', `**/cloud-data/admin/games/${productId}/records/${this.recordKey}?`).as('waitForSave')
      common.clickButtonByName('Save')
      cy.wait('@waitForSave').then((res) => {
        expect(res.response.statusCode).to.equal(200)
      })
      cy.assertAlert('Record updated')

      common.navigateToTab('Properties')
      cloudDataPage.clickOnRoundEditButton(1)
      cloudDataPage.clearProperties()
      cloudDataPage.inputProperties(`{"string": "test"}`)

      cy.intercept('PATCH', `**/cloud-data/admin/games/${productId}/records/${this.recordKey}?`).as('waitForSave')
      common.clickButtonByName('Save')
      cy.wait('@waitForSave').then((res) => {
        expect(res.response.statusCode).to.equal(200)
      })
      cy.assertAlert('Record updated')

      common.clickEdit()
      common.waitForModal().within(() => {
        cloudDataPage.inputTag('tag2 ')
        cy.intercept('PATCH', `**/cloud-data/admin/games/${productId}/records/${this.recordKey}?`).as('waitForSave')
        common.clickButtonByName('Save')
      })

      cy.wait('@waitForSave').then((res) => {
        expect(res.response.statusCode).to.equal(200)
      })
      cy.assertAlert('Record updated')

      common.navigateBreadcrumbByString('Records')
      common.waitForLoaderToDisappear()
      common.searchDataTable(this.recordKey)
      common.assertRowExist(this.recordKey, this.SELECTOR_CLOUD_DATA_LIST)
    })

    it('Should delete a record', { tags: ['@smoke'] }, function () {
      common.searchDataTable(this.recordKey)
      common.getTableRowByString(this.recordKey, this.SELECTOR_CLOUD_DATA_LIST).within(() => {
        common.clickTrash()
      })

      cy.intercept('DELETE', `**/admin/games/${productId}/records/${this.recordKey}?`).as('waitForDelete')
      common.waitForModal().within(() => {
        common.clickButtonByName('Delete')
      })

      cy.wait('@waitForDelete').then((res) => {
        if (res.response.statusCode == 200) {
          this.deleteSuccess = true
        }
        expect(res.response.statusCode).to.equal(200)
      })
      cy.assertAlert(`Record "${this.recordKey}" deleted`)

      common.waitForLoaderToDisappear()
      common.assertRowNotExist(this.recordKey, this.SELECTOR_CLOUD_DATA_LIST)
    })

    after('Clean up record', function () {
      if (!this.deleteSuccess) {
        cy.deleteRecord(this.recordKey)
      }
    })
  })

  describe('Regression Tests', { tags: ['@regression'] }, function () {
    before('Setup record for tests', function () {
      this.deleteSuccess = false
      this.recordKey = common.newUUID()
      cy.createRecord(this.recordKey).then((id) => {
        this.ownerId = id
      })
    })

    beforeEach(function () {
      cy.visitBaseUrl()

      cy.intercept('api2/products').as('waitForProducts')
      cloudDataPage.navigateToCloudData()

      cy.wait('@waitForProducts').then(() => {
        cy.intercept(`**/cloud-data/admin/games/${productId}/records**`).as('waitForRecords')
        common.selectProduct()
      })

      cy.wait('@waitForRecords')
      common.waitForLoaderToDisappear()
    })

    it('Should create a record with a blob', { tags: ['@regression'] }, function () {
      this.createdRecordKey = common.newUUID()

      common.clickButtonByName('New Record')

      // Description Page
      cloudDataPage.inputKey(this.createdRecordKey)
      cloudDataPage.inputTag('tag1 tag2 ')
      common.clickNext()

      // Data Page
      cloudDataPage.inputProperties(`{"boolean": false, "integer": 1, "string": "test"}`)
      cloudDataPage.attachBlob('blob.txt')

      // Intercept response to get ownerId
      cy.intercept('POST', `**/cloud-data/admin/games/${productId}/records?`, (req) => {
        req.on('after:response', (res) => {
          this.createdOwnerId = res.body.ownerId
        })
      }).as('waitForSave')
      common.clickButtonByName('Create Record')

      cy.wait('@waitForSave').then((res) => {
        expect(res.response.statusCode).to.equal(201)
      })
      cy.assertAlert('Record created')

      common.searchDataTable(this.createdRecordKey)
      common.assertRowExist(this.createdRecordKey, this.SELECTOR_CLOUD_DATA_LIST)

      // Clean up created Cloud Data
      cy.waitUntil(() => this.createdRecordKey).then(() => {
        cy.deleteRecord(this.createdRecordKey)
      })
    })

    it('Should not create a record with both opaque and blob', { tags: ['@regression', '@wip'] }, function () {
      this.createdRecordKey = common.newUUID()

      common.clickButtonByName('New Record')

      // Description Page
      cloudDataPage.inputKey(this.createdRecordKey)
      cloudDataPage.inputTag('tag1 tag2 ')
      common.clickNext()

      // Data Page
      cloudDataPage.inputOpaque('test')
      cloudDataPage.attachBlob('blob.txt')
      common.clickButtonByName('Create Record')

      common.getAntAlert().invoke('text').should('include', 'Blob and Opaque are exclusive properties of a record')
    })

    it('Should not create a record with blob file size greater than 32kB', { tags: ['@regression'] }, function () {
      this.createdRecordKey = common.newUUID()

      common.clickButtonByName('New Record')

      // Description Page
      cloudDataPage.inputKey(this.createdRecordKey)
      cloudDataPage.inputTag('tag1 tag2 ')
      common.clickNext()

      // Data Page
      cloudDataPage.attachBlob('blob_over_32kB.txt', false)

      common.getAntAlert().invoke('text').should('include', 'Blob string size limit of 32KB exceeded')
    })

    it('Should not edit a record to have both a blob and opaque', { tags: ['@regression'] }, function () {
      common.searchDataTable(this.recordKey)
      common.getTableRowByString(this.recordKey, this.SELECTOR_CLOUD_DATA_LIST).within(() => {
        common.clickView()
      })
      common.waitForLoaderToDisappear()

      common.navigateToTab('Opaque')
      cloudDataPage.clickOnRoundEditButton()
      cloudDataPage.clearOpaque()

      cloudDataPage.assertUploadButtonCount(1)
    })

    it(
      'Should be able to edit a record to have a blob file size greater than 32kB',
      { tags: ['@regression'] },
      function () {
        common.searchDataTable(this.recordKey)
        common.getTableRowByString(this.recordKey, this.SELECTOR_CLOUD_DATA_LIST).within(() => {
          common.clickView()
        })
        common.waitForLoaderToDisappear()

        common.navigateToTab('Opaque')
        cloudDataPage.clickOnRoundEditButton()
        cloudDataPage.clearOpaque()
        cloudDataPage.selectBinaryDataSize()

        cloudDataPage.attachBlob('blob_over_32kB.txt', false)
        cloudDataPage.assertChunkUploadIsSuccess()
      }
    )

    after('Clean up record', function () {
      if (!this.deleteSuccess) {
        cy.deleteRecord(this.recordKey)
      }
    })
  })
})
