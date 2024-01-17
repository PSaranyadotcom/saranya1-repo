/* eslint-disable no-undef */
import { Common } from '../page-objects/common-page-objects'
import { Codeset } from '../page-objects/codes-code-set-page-objects'

const common = new Common()
const codesetPage = new Codeset()
const codesBaseUrl = Cypress.env('codesBaseUrl')
const ecommerceBasicAuth = Cypress.env('ecommerceBasicAuth')

before('Login', function () {
  // Login
  cy.doAuth()
  Cypress.config('waitForAnimations', false)
  this.SELECTOR_CODESET_LIST = codesetPage.codesetListSelector
  this.baseTitle = 'Codeset'
})

describe('Game Studio - Code Set',{tags:'@wip'}, function () {
  describe('Smoke Tests', { tags: '@smoke' }, function () {
    before('Setup', function () {
      this.campaignName = `Campaign ${this.baseTitle} ${Date.now()}`
      this.codesetName = `${this.baseTitle} ${Date.now()}`
      this.itemName = `Consumable Non-Unique Item ${this.baseTitle} ${Date.now()}`
      this.itemName_2 = `Durable Unique Item ${this.baseTitle} ${Date.now()}`
      this.skuName = `SKU ${this.baseTitle} ${Date.now()}`
      this.licenseName = `License ${this.baseTitle} ${Date.now()}`

      //  Create items
      cy.createItem(this.itemName, 3, 'uses', 5).then((id) => {
        this.itemId = id
      })

      cy.createItem(this.itemName_2, 0).then((id) => {
        this.itemId_2 = id
      })

      cy.createSKUWithoutStore(this.skuName).then((id) => {
        this.skuId = id
      })

      cy.generateAppId(32).then((id) => {
        this.referenceId = id
        cy.createLicense(this.licenseName, id, 10, -1, -1).then((id) => {
          this.licenseId = id
        })
      })

      cy.createCampaign(this.campaignName).then((id) => {
        this.campaignId = id
        // Create codeset
        cy.request({
          method: 'POST',
          url: codesBaseUrl + '/codesets',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Basic ' + ecommerceBasicAuth,
          },
          body: {
            campaignId: id,
            name: this.codesetName,
            description: 'description',
            tags: ['tag1'],
            grantedItemIds: [this.itemId_2],
            grantedItemsWithQuantity: [
              {
                itemId: this.itemId,
                quantity: 1,
              },
            ],
            grantedLicenseIds: [this.licenseId],
            type: 0,
            redeemLimit: 1,
          },
        }).then((res) => {
          cy.parseIdFromHeader(res).then((id) => {
            this.codesetId = id
            cy.generateAndGetCode(id, 0, 8, 1).then((code) => {
              this.code = code
            })
          })
        })
      })
    })

    beforeEach(function () {
      cy.visitBaseUrl()

      // Navigate sidebar and select product
      cy.intercept('**/products').as('waitForProducts')
      common.navigateSidebarMenu('Commerce', 'Codes')
      cy.wait('@waitForProducts')
      common.selectProduct()

      // Wait for code sets to load
      cy.intercept(`**/codes/code-sets?campaignId=${this.campaignId}`).as('waitForCodesets')
      common.getTableRowByString(this.campaignName).click()
      cy.wait('@waitForCodesets')
      common.waitForLoaderToDisappear()
    })

    it('Should look up a code', { tags: ['@smoke'] }, function () {
      codesetPage.searchCode(this.code)

      cy.intercept('**/codes?code=' + this.code).as('waitForSearch')
      common.clickSearch()

      cy.wait('@waitForSearch').then((res) => {
        expect(res.response.statusCode).to.equal(200)
      })

      common.waitForModal().within(() => {
        common.navigateToTab('View Codes')
        common.waitForLoaderToDisappear()
        common
          .getTableRowByIndex()
          .invoke('text')
          .then((text) => {
            expect(this.code).to.equal(text.trim().substr(0, 8))
          })
      })
    })

    it('Should create a code set', { tags: '@smoke' }, function () {
      this.createdCodesetName = `${this.baseTitle} ${Date.now()}`

      common.clickButtonByName('Create Code Set')
      common.waitForModal().within(() => {
        // Tab Description
        codesetPage.inputDescription(
          this.createdCodesetName,
          'SINGLE USE',
          `${this.baseTitle} Description`,
          'tag1 tag2 '
        )
        codesetPage.inputRedemptionTimeframe(15, 20)

        // Tab Items/SKUs
        common.navigateToTab('Items/SKUs')
        common.getActiveTab().within(() => {
          common.inputVerticalTwoWayFilter(this.itemId)
          codesetPage.selectRowFromList()
        })

        // Tab Licenses
        common.navigateToTab('Licenses')
        common.getActiveTab().within(() => {
          common.inputVerticalTwoWayFilter(this.licenseId)
          codesetPage.selectRowFromList()
        })

        // Intercept response to get codesetId
        cy.intercept('POST', 'api/codes/code-sets', (req) => {
          req.on('after:response', (res) => {
            this.createdCodesetId = res.body.data.id
          })
        }).as('waitForSave')
        common.clickButtonByName('Save')
      })

      cy.wait('@waitForSave').then((res) => {
        expect(res.response.statusCode).to.equal(200)
      })

      common.assertRowExist(this.createdCodesetName, this.SELECTOR_CODESET_LIST)

      // Clean up created codeset
      cy.waitUntil(() => this.createdCodesetId).then(() => {
        cy.deleteCodeset(this.createdCodesetId)
      })
    })

    it('Should display a list of code sets', { tags: '@smoke' }, function () {
      common.getRowLength(this.SELECTOR_CODESET_LIST).then((length) => {
        expect(length).to.be.greaterThan(0)
      })
    })

    it('Should view a code set', { tags: '@smoke' }, function () {
      common.getTableRowByString(this.codesetName, this.SELECTOR_CODESET_LIST).within((row) => {
        common.clickView(row)
      })

      common.waitForModal().within(() => {
        common.getModalSubtitle().then(($subtitle) => {
          expect($subtitle.text()).to.include(this.codesetId)
          expect($subtitle.text()).to.include(this.codesetName)
        })
        common.clickButtonByName('Close')
      })
    })

    it('Should edit a code set', { tags: '@smoke' }, function () {
      common.getTableRowByString(this.codesetName, this.SELECTOR_CODESET_LIST).within((row) => {
        common.clickEdit(row)
      })

      this.newCodesetName = `Updated ${this.baseTitle} ${Date.now()}`

      common.waitForModal().within(() => {
        common.getActiveTab().within(() => {
          codesetPage.inputDescription(
            this.newCodesetName,
            'UNLIMITED',
            `Update ${this.baseTitle} Description`,
            'tag2 '
          )
          codesetPage.inputRedemptionTimeframe(20, 25)
        })

        common.navigateToTab('Items/SKUs')
        common.getActiveTab().within(() => {
          codesetPage.deselectRowFromList()
          codesetPage.deselectRowFromList()
          codesetPage.selectSKU(this.skuName)
        })

        common.navigateToTab('Licenses')
        common.getActiveTab().within(() => {
          codesetPage.deselectRowFromList()
        })

        cy.intercept('PUT', '**/code-sets/**').as('waitForSave')
        common.clickButtonByName('Save')
      })

      cy.wait('@waitForSave').then((res) => {
        if (res.response.statusCode == 204) {
          this.codesetName = this.newCodesetName
        }
        expect(res.response.statusCode).to.equal(204)
      })

      common.assertRowExist(this.newCodesetName, this.SELECTOR_CODESET_LIST)
    })

    it('Should clone a code set', { tags: '@smoke' }, function () {
      common.getTableRowByString(this.codesetName, this.SELECTOR_CODESET_LIST).within((row) => {
        common.clickClone(row)
      })

      this.clonedCodesetName = `Cloned ${this.baseTitle} ${Date.now()}`

      common.waitForModal().within(() => {
        common.getActiveTab().within(() => {
          codesetPage.inputDescription(
            this.clonedCodesetName,
            'SINGLE USE',
            `Clone ${this.baseTitle} Description`,
            'tag3 '
          )
        })

        cy.intercept('POST', 'api/codes/code-sets', (req) => {
          req.on('after:response', (res) => {
            this.clonedCodesetId = res.body.data.id
          })
        }).as('waitForSave')
        common.clickButtonByName('Save')
      })

      cy.wait('@waitForSave').then((res) => {
        expect(res.response.statusCode).to.equal(200)
      })

      common.assertRowExist(this.clonedCodesetName, this.SELECTOR_CODESET_LIST)

      // Clean up cloned codeset
      cy.waitUntil(() => this.clonedCodesetId).then(() => {
        cy.deleteCodeset(this.clonedCodesetId)
      })
    })

    it('Should view code set history', { tags: '@smoke' }, function () {
      common.getTableRowByString(this.codesetName, this.SELECTOR_CODESET_LIST).within((row) => {
        cy.intercept('GET', '**/history').as('waitForHistory')
        common.clickHistory(row)
      })

      cy.wait('@waitForHistory').then((res) => {
        expect(res.response.statusCode).to.equal(200)
      })

      common.waitForModal().within(() => {
        common.getRowLength().then((length) => {
          expect(length).to.be.greaterThan(0)
        })

        common.clickButtonByName('Close')
      })
    })

    it('Should manage codes, generate codes & find codes', { tags: ['@smoke'] }, function () {
      common.getTableRowByString(this.codesetName, this.SELECTOR_CODESET_LIST).within((row) => {
        cy.intercept('api/codes/codes?**').as('waitForCodes')
        common.clickBook(row)
      })

      common.waitForModal().within(() => {
        cy.intercept('POST', '**/code-creations').as('waitForGenerate')
        codesetPage.inputCodeCreation(2)

        cy.wait('@waitForGenerate').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })

        common.navigateToTab('View Codes')

        cy.wait('@waitForCodes').then((res) => {
          expect(res.response.statusCode).to.equal(200)
        })
        cy.wait(1000)
        common.waitForLoaderToDisappear()
        common.getRowLength().then((length) => {
          expect(length).to.equal(3)
        })

        common.getTableRowByIndex().then((content) => {
          this.generatedCode = content.text().trim().substr(0, 32)
        })

        common.clickButtonByName('Close')
      })

      cy.waitUntil(() => this.generatedCode).then(() => {
        codesetPage.searchCode(this.generatedCode)
        common.clickSearch()
      })

      common.waitForModal().within(() => {
        cy.intercept('**/codes/**').as('waitForCodes')
        common.navigateToTab('View Codes')

        cy.wait('@waitForCodes').then((res) => {
          expect(res.response.statusCode).to.equal(200)
        })
        common.waitForLoaderToDisappear()
        common.getTableRowByString(this.generatedCode.trim()).should('exist')
      })
    })

    it('Should delete a code set', { tags: '@smoke' }, function () {
      common.getTableRowByString(this.codesetName, this.SELECTOR_CODESET_LIST).within((row) => {
        common.clickTrash(row)
      })

      common.waitForModal().within(() => {
        common.clickButtonByName('Delete')
      })

      cy.intercept('DELETE', '**/code-sets/**').as('waitForDelete')
      common.waitForModal(1).within(() => {
        common.clickButtonByName('Yes')
      })

      cy.wait('@waitForDelete').then((res) => {
        expect(res.response.statusCode).to.equal(204)
      })

      common.assertRowNotExist(this.codesetName, this.SELECTOR_CODESET_LIST)
    })

    after('Clean up', function () {
      //cy.waitUntil(() => this.campaignId).then(() => {
      cy.deleteCampaign(this.campaignId)
      //});
      cy.deleteItem(this.itemId)
      cy.deleteItem(this.itemId_2)
      cy.deleteSKU(this.skuId)
      cy.deleteLicense(this.licenseId)
    })
  })

  describe('Regression Tests', { tags: '@regression' }, function () {
    before('Setup', function () {
      this.campaignName = `Campaign ${this.baseTitle} ${Date.now()}`
      this.itemName = `Consumable Non-Unique Item ${this.baseTitle} ${Date.now()}`
      this.licenseName = `Test License ${this.baseTitle} ${Date.now()}`

      // Create campaign
      cy.createCampaign(this.campaignName).then((id) => {
        this.campaignId = id
      })

      // Create item
      cy.createItem(this.itemName, 3, 'uses', 5).then((id) => {
        this.itemId = id
      })

      // Create license
      cy.generateAppId(32).then((id) => {
        this.referenceId = id
        cy.createLicense(this.licenseName, id, 10, -1, -1).then((id) => {
          this.licenseId = id
        })
      })
    })

    beforeEach(function () {
      cy.visitBaseUrl()

      // Navigate sidebar and select product
      cy.intercept('**/products').as('waitForProducts')
      common.navigateSidebarMenu('Commerce', 'Codes')
      cy.wait('@waitForProducts')
      common.selectProduct()

      // Wait for code sets to load
      cy.intercept('**/code-sets**').as('waitForCodesets')
      common.getTableRowByString(this.campaignName).click()
      cy.wait('@waitForCodesets')
      common.waitForLoaderToDisappear()
    })

    it('Should create code set with default values', { tags: '@regression' }, function () {
      this.createdCodesetName = `${this.baseTitle} ${Date.now()}`

      common.clickButtonByName('Create Code Set')
      common.waitForModal().within(() => {
        codesetPage.inputDescription(this.createdCodesetName, 'SINGLE USE')

        common.navigateToTab('Items')
        common.getActiveTab().within(() => {
          common.inputVerticalTwoWayFilter(this.itemId)
          codesetPage.selectRowFromList()
          codesetPage.getRowFromList(this.itemId).should('exist')
        })

        cy.intercept('POST', 'api/codes/code-sets', (req) => {
          req.on('after:response', (res) => {
            this.createdCodesetId = res.body.data.id
          })
        }).as('waitForSave')
        common.clickButtonByName('Save')
      })

      cy.wait('@waitForSave').then((res) => {
        expect(res.response.statusCode).to.equal(200)
      })

      common.assertRowExist(this.createdCodesetName, this.SELECTOR_CODESET_LIST)
      // Clean up created codeset
      cy.waitUntil(() => this.createdCodesetId).then(() => {
        cy.deleteCodeset(this.createdCodesetId)
      })
    })

    it('Should not create code set with multiple of the same license', { tags: '@regression' }, function () {
      // CTPTD-488
      this.createdCodesetName = `${this.baseTitle} ${Date.now()}`

      common.clickButtonByName('Create Code Set')
      common.waitForModal().within(() => {
        codesetPage.inputDescription(this.createdCodesetName, 'SINGLE USE')

        common.navigateToTab('Licenses')
        common.getActiveTab().within(() => {
          common.inputVerticalTwoWayFilter(this.licenseId)
          codesetPage.selectRowFromList()
          cy.contains('No Licenses available to select.').should('exist')
        })

        cy.intercept('POST', 'api/codes/code-sets', (req) => {
          req.on('after:response', (res) => {
            this.createdCodesetId = res.body.data.id
          })
        }).as('waitForSave')
        common.clickButtonByName('Save')
      })

      cy.wait('@waitForSave').then((res) => {
        expect(res.response.statusCode).to.equal(200)
      })

      common.assertRowExist(this.createdCodesetName, this.SELECTOR_CODESET_LIST)
    })

    //   DNATEC - 2875 Freezing With Large Code Sets Test Case
    it('should not freeze when managing large amounts of codes', { tags: ['@regression'] }, function () {
      common.getTableRowByString(this.createdCodesetName, this.SELECTOR_CODESET_LIST).within((row) => {
        cy.intercept('api/codes/codes?**').as('waitForCodes')
        common.clickBook(row)
      })

      common.waitForModal().within(() => {
        cy.intercept('POST', '**/code-creations').as('waitForGenerate')
        codesetPage.inputCodeCreation(5000)

        cy.wait('@waitForGenerate').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })

        common.navigateToTab('View Codes')

        cy.wait('@waitForCodes').then((res) => {
          expect(res.response.statusCode).to.equal(200)
        })
        cy.waitUntil(() => cy.get('.loader').should('exist'))
        common.waitForLoaderToDisappear(30000)

        common.getRowLength().then((length) => {
          expect(length).greaterThan(3)
        })
        codesetPage.totalCodeCount(5000)

        common.getTableRowByIndex().then((content) => {
          this.generatedCode = content.text().trim().substr(0, 32)
        })
        common.clickButtonByName('Close')
      })

      // Clean up created codeset
      cy.waitUntil(() => this.createdCodesetId).then(() => {
        cy.deleteCodeset(this.createdCodesetId)
      })
    })

    after('Clean up', function () {
      cy.deleteCampaign(this.campaignId)
      cy.deleteItem(this.itemId)
      cy.deleteLicense(this.licenseId)
    })
  })
})
