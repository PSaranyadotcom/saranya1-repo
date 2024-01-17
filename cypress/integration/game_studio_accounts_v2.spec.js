/* eslint-disable no-undef */
import { Common } from '../page-objects/common-page-objects'
import { Common as CommonAnt } from '../page-objects/common-ant-page-objects'
import { Account } from '../page-objects/accounts-v2-page-objects'

const common = new Common()
const commonAnt = new CommonAnt()
const accountPage = new Account()
const productId = Cypress.env('productId')
const entitlementsBaseUrl = Cypress.env('entitlementsBaseUrl')
const ecommerceBasicAuth = Cypress.env('ecommerceBasicAuth')

before('Login and get feature flags', function () {
  // Login
  cy.doAuth()
  cy.getFeatureFlags().then((values) => {
    this.featureFlags = values
  })
})

describe('Game Studio - Accounts', function () {
  describe('Smoke Tests', { tags: '@smoke' }, function () {
    before('Setup', function () {
      this.emailAddress = `ctpshared+${Date.now()}@gmail.com`
      this.firstPartyPlayerId = Date.now()
      this.firstPartyAlias = `ctpshared`
      this.socialPlatformId = Date.now()
      this.socialPlatformAlias = 'ctpshared'
      this.deviceId = Date.now()
      this.deviceName = 'ctpshared'

      cy.createSteamAccount(this.firstPartyPlayerId, this.firstPartyAlias).then((res) => {
        this.platformAccessToken = res.body.accessToken
        this.platformPublicId = res.body.accountId
      })

      cy.createGoogleAccount(this.socialPlatformId, this.socialPlatformAlias).then((res) => {
        this.socialAccessToken = res.body.accessToken
        this.socialPublicId = res.body.accountId
      })

      cy.createDeviceAccount(this.deviceId, this.deviceName).then((res) => {
        this.deviceAccessToken = res.body.accessToken
        this.devicePublicId = res.body.accountId
      })

      cy.createFullAccount(this.emailAddress).then((id) => {
        this.fullPublicId = id
        cy.linkByEmailPasswordLegacy(this.platformAccessToken, this.emailAddress)
        cy.linkByEmailPasswordLegacy(this.socialAccessToken, this.emailAddress)
        cy.linkByEmailPassword(this.deviceAccessToken, this.emailAddress)
      })
    })

    beforeEach(function () {
      cy.visitBaseUrl()
      accountPage.navigateToAccounts()
    })

    describe('Account Search Smoke Tests', { tags: '@smoke' }, function () {
      it('Should search by email address', { tags: '@smoke' }, function () {
        accountPage.searchAccount(this.emailAddress)
        accountPage.getAccountDetails().invoke('text').should('include', 'Full Account')
        accountPage.getUserDetails('Email address').invoke('text').should('include', this.emailAddress)
      })

      it('Should search by first party alias', { tags: '@smoke' }, function () {
        accountPage.searchAccount(this.firstPartyAlias, 'First Party Alias', 'Steam', this.platformPublicId)
        accountPage.getAccountDetails().invoke('text').should('include', 'Platform Account')
        accountPage.getUserDetails('Alias/Gamertag').invoke('text').should('include', this.firstPartyAlias)
      })

      it('Should search by first party player id', { tags: '@smoke' }, function () {
        accountPage.searchAccount(this.firstPartyPlayerId, 'First Party Player ID', 'Steam')
        accountPage.getAccountDetails().invoke('text').should('include', 'Platform Account')
        accountPage.getUserDetails('Platform ID').invoke('text').should('include', this.firstPartyPlayerId)
      })

      it('Should search by social platform id', { tags: '@smoke' }, function () {
        accountPage.searchAccount(this.socialPlatformId, 'Social Platform ID', 'Google')
        accountPage.getAccountDetails().invoke('text').should('include', 'Platform Account')
        accountPage.getUserDetails('Platform ID').invoke('text').should('include', this.socialPlatformId)
      })

      it('Should search by public id', { tags: '@smoke' }, function () {
        accountPage.searchAccount(this.fullPublicId, 'Public ID')
        accountPage.getAccountDetails().invoke('text').should('include', 'Full Account')
        accountPage.getUserDetails('Public ID').invoke('text').should('include', this.fullPublicId)
      })
    })

    describe('Account Info Smoke Tests', { tags: '@smoke' }, function () {
      beforeEach('Visit site and search account', function () {
        accountPage.searchAccount(this.emailAddress)
        commonAnt.waitForLoaderToDisappear()
      })

      it('Should not be able to view PII', { tags: '@smoke' }, function () {
        accountPage.getUserDetails('Date of birth').then((pii) => {
          expect(pii).to.contain('hidden')
        })

        accountPage.getUserDetails('First name').then((pii) => {
          expect(pii).to.have.text('-')
        })

        accountPage.getUserDetails('Last name').then((pii) => {
          expect(pii).to.have.text('-')
        })
      })

      it('Should view account history', { tags: '@smoke' }, function () {
        cy.intercept('GET', `api/accounts/${this.fullPublicId}/history`).as('waitForHistory')
        commonAnt.clickOverflow()
        commonAnt.clickDropdownItem('history')

        cy.wait('@waitForHistory').then((res) => {
          expect(res.response.statusCode).to.equal(200)
        })

        commonAnt.getRowLength().then((length) => {
          expect(length).to.be.greaterThan(0)
        })
      })

      it('Should not be able to view PII in history', { tags: '@smoke' }, function () {
        cy.intercept('GET', `api/accounts/${this.fullPublicId}/history`).as('waitForHistory')
        commonAnt.clickOverflow()
        commonAnt.clickDropdownItem('View account history')

        cy.wait('@waitForHistory').then((res) => {
          expect(res.response.statusCode).to.equal(200)
        })

        commonAnt.getRowLength().then((length) => {
          expect(length).to.be.greaterThan(0)
        })

        commonAnt.inputSearchFilter('Create')
        cy.wait(3000)
        commonAnt.clickExpandRowContent()
        cy.wait(2000)
        accountPage
          .getAccountHistoryJsonData()
          .invoke('text')
          .then((value) => {
            var res = JSON.parse(value)
            expect(res.lastName).to.equal('((hidden))')
            expect(res.firstName).to.equal('((hidden))')
            expect(res.dob).to.equal('((hidden))')
          })
      })

      it('Should view linked platform account', { tags: '@smoke' }, function () {
        accountPage.navigateToAccountTile('Linked Accounts')
        commonAnt.navigateToTab('Platform Accounts')
        accountPage.clickOnArrowButton()
        common.waitForLoaderToDisappear()

        accountPage.getUserDetails('Public ID').invoke('text').should('include', this.platformPublicId)
        accountPage.getUserDetails('Alias/Gamertag').invoke('text').should('include', this.firstPartyAlias)
        accountPage.getUserDetails('Platform Type').invoke('text').should('include', 'Steam')
        accountPage.getUserDetails('Platform ID').invoke('text').should('include', this.firstPartyPlayerId)
        accountPage.getUserDetails('Locale').invoke('text').should('not.be.empty')

        accountPage.getUserBasicInfoDetails().invoke('text').should('contain', 'Account created')
        accountPage.getUserBasicInfoDetails().invoke('text').should('contain', 'Application Player Sign Up')
      })

      it('Should show device account', { tags: '@smoke' }, function () {
        accountPage.navigateToAccountTile('Linked Accounts')
        commonAnt.navigateToTab('Device Accounts')
        commonAnt
          .getTableRowByIndex(0, '.rAccountDevicesTable')
          .invoke('text')
          .then((value) => {
            expect(value).to.contain(this.deviceName)
            expect(value).to.contain(this.devicePublicId)
          })
      })

      it('Should view linked device account', { tags: '@smoke' }, function () {
        accountPage.navigateToAccountTile('Linked Accounts')
        commonAnt.navigateToTab('Device Accounts')
        commonAnt.getDataTableByIndex(1).within(() => {
          commonAnt.clickView()
        })
        common.waitForLoaderToDisappear()
        accountPage.getUserDetails('Public ID').invoke('text').should('include', this.devicePublicId)
        accountPage.getUserDetails('Alias/Gamertag').invoke('text').should('include', this.deviceName)
        accountPage.getUserDetails('Device ID').invoke('text').should('include', this.deviceId)
        accountPage.getUserDetails('Locale').invoke('text').should('not.be.empty')
        accountPage.getUserBasicInfoDetails().invoke('text').should('contain', 'Account created')
        accountPage.getUserBasicInfoDetails().invoke('text').should('contain', 'Application Player Sign Up')
      })

      it('Should be able to unlink platform/social account with matching pattern', { tags: '@smoke' }, function () {
        accountPage.navigateToAccountTile('Linked Accounts')
        commonAnt.navigateToTab('Platform Accounts')
        commonAnt.getDataTableByIndex(0).within(() => {
          accountPage.getUnlink().should('exist')
        })

        commonAnt.navigateToTab('Social Accounts')
        commonAnt.getDataTableByIndex(0).within(() => {
          accountPage.getUnlink().should('exist')
        })
      })
    })

    describe('Legal Responses Smoke Tests', { tags: '@smoke' }, function () {
      it('Should confirm that TOS and PP have been accepted', { tags: '@smoke' }, function () {
        accountPage.searchAccount(this.emailAddress)
        accountPage.navigateToAccountTile('Legal Responses')
        commonAnt.waitForLoaderToDisappear()
        commonAnt.getRowLength().then((length) => {
          expect(length).to.be.equal(2)
        })
        accountPage.getActiveTab().within(() => {
          accountPage.verifySuccessCheckMark()
          accountPage.verifySuccessCheckMark(1)
        })
      })

      it('Should be able to reset legal responses with matching pattern', { tags: '@smoke' }, function () {
        accountPage.searchAccount(this.platformPublicId, 'Public ID')
        accountPage.navigateToAccountTile('Legal Responses')

        commonAnt.getTableRowByIndex().within(() => {
          accountPage.getResetIconX().then((button) => {
            expect(button).to.be.enabled
          })
        })
        commonAnt.getTableRowByIndex(1).within(() => {
          accountPage.getResetIconX().then((button) => {
            expect(button).to.be.enabled
          })
        })
      })
    })

    describe('Purchases Smoke Tests', { tags: '@smoke' }, function () {
      const CONTAINER_SELECTOR = '#tab_purchases_2_0'

      before('Setup', function () {
        this.skuName = `Test SKU ${Date.now()}`
        this.storeName = `Test Store ${Date.now()}`
        this.offerName = `Test Offer ${Date.now()}`
        cy.createStore(this.storeName).then((id) => {
          this.storeId = id
        })

        cy.waitUntil(() => this.storeId).then(() => {
          cy.createSKU(this.storeId, this.skuName).then((id) => {
            this.skuId = id
          })
        })

        cy.waitUntil(() => this.skuId).then(() => {
          cy.createOffer(this.storeId, this.skuId, this.offerName).then((id) => {
            this.offerId = id
          })
        })

        // Credit currency
        cy.transaction(this.platformPublicId, 1, 'TST', 0, 10).then(() => {
          //    Create Purchase
          cy.wait(2000)
          cy.waitUntil(() => this.offerId).then(() => {
            cy.createPurchase(this.platformAccessToken, this.storeId, this.offerId, 'TST', 10).then((id) => {
              this.purchaseId = id
            })
          })
        })
      })

      beforeEach('Visit site', function () {
        cy.intercept('api2/products').as('waitForProducts')
        accountPage.searchAccount(this.firstPartyPlayerId, 'First Party Player ID', 'Steam')
        accountPage.navigateToAccountTile('Purchases')
        cy.wait('@waitForProducts')
        cy.wait(1000)
        accountPage.selectProduct(1)
        commonAnt.waitForLoaderToDisappear(50000)
      })

      it('Should view Purchases', { tags: '@smoke' }, function () {
        commonAnt.getTableRowByString(this.skuName).should('exist')
      })

      it('Should view Offer', { tags: '@smoke' }, function () {
        commonAnt.getTableRowByString(this.skuName).then(() => {
          commonAnt.clickView()
        })
        cy.wait(2000)
        commonAnt.navigateToTab('Offer')
        accountPage.getPurchaseUserDetails().invoke('text').should('contain', this.offerName)
        accountPage.getPurchaseUserDetails().invoke('text').should('contain', this.offerId)
      })

      after('Clean Up', function () {
        cy.deleteStore(this.storeId)
        cy.deleteSKU(this.skuId)
      })
    })

    describe('Wallet Smoke Tests', { tags: ['@smoke'] }, function () {
      before('setup', function () {
        this.currencyName = `ctpshared ${Date.now()}`
        cy.generateCurrencyCode().then((code) => {
          this.currencyCode = code
        })
        cy.waitUntil(() => this.currencyCode).then(() => {
          cy.createCurrency(this.currencyName, this.currencyCode, 3).then((id) => {
            this.currencyId = id
          })
        })
      })
      beforeEach('Visit site and search account', function () {
        cy.intercept('**/api2/products/').as('waitForProducts')
        accountPage.searchAccount(this.emailAddress)
        accountPage.navigateToAccountTile('Wallet')
        cy.wait('@waitForProducts')
        cy.wait(1000)
        cy.intercept('**/wallet/currencies*').as('waitForCurrency')
        accountPage.selectProduct(1)
        cy.wait('@waitForCurrency')
        commonAnt.waitForLoaderToDisappear()
        commonAnt.searchDataTable(this.currencyName)
        commonAnt.getTableRowByIndex().then(() => {
          commonAnt.clickView()
        })
      })

      it('Should credit virtual currency', { tags: '@smoke' }, function () {
        commonAnt.clickButtonByName('Credit')
        cy.intercept('POST', '**/wallet/transactions**').as('waitForCredit')
        commonAnt.waitForModal().within(() => {
          accountPage.inputWalletTransaction(100, 'UAT Cypress')
          // accountPage.CreditInWallet();
        })

        cy.wait('@waitForCredit').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })
      })

      it('Should debit virtual currency', { tags: '@smoke' }, function () {
        commonAnt.clickButtonByName('Debit')
        cy.intercept('POST', '**/wallet/transactions**').as('waitForDebit')
        commonAnt.waitForModal().within(() => {
          accountPage.inputWalletTransaction(100, 'UAT Cypress')
        })

        cy.wait('@waitForDebit').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })
      })

      it('Should view transaction history', { tags: '@smoke' }, function () {
        commonAnt.navigateToTab('Transaction history')
        commonAnt.getRowLength().then((length) => {
          expect(length).to.be.greaterThan(0)
        })
      })
    })

    describe('Entitlements Smoke Tests', { tags: '@smoke' }, function () {
      const CONTAINER_SELECTOR = '#tab_entitlements_4_0'

      before('Setup', function () {
        this.itemName = `Consumable Non-Unique Item ${Date.now()}`
        this.transformationItemName = `Transformation Item ${Date.now()}`

        // Create item for transformation test
        cy.createItem(this.transformationItemName, 0, 'inventory', 3).then((id) => {
          this.transformationItemId = id
        })

        // Create item
        cy.waitUntil(() => this.transformationItemId).then(() => {
          cy.request({
            method: 'POST',
            url: entitlementsBaseUrl + '/items',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Basic ' + ecommerceBasicAuth,
            },
            body: {
              productId: productId,
              name: this.itemName,
              description: 'description',
              tags: ['tag1'],
              type: 3,
              uses: 5,
              customData: '{}',
              inventory: 3,
              transformations: [
                {
                  type: 0,
                  itemId: this.transformationItemId,
                  quantity: 1,
                },
              ],
            },
          }).then((res) => {
            cy.parseIdFromHeader(res).then((id) => {
              this.itemId = id
            })
          })
        })
      })

      beforeEach('Visit site and search account', function () {
        cy.intercept('**/api2/products/').as('waitForProducts')
        accountPage.searchAccount(this.emailAddress)

        accountPage.navigateToAccountTile('Entitlements')
        cy.wait(1000)
        cy.wait('@waitForProducts')

        cy.intercept('**/entitlements*').as('waitForEntitlements')
        accountPage.selectProduct(1)
        cy.wait('@waitForEntitlements')
        common.waitForLoaderToDisappear()
      })

      it('Should grant an entitlement', { tags: '@smoke' }, function () {
        common.clickButtonByName('Grant Item')
        commonAnt.waitForLoaderToDisappear(30000)
        commonAnt.inputSearchFilter(this.transformationItemName)
        commonAnt.getTableRowByString(this.transformationItemName).within(() => {
          commonAnt.clickCheck()
        })
        commonAnt.clickButtonByName('Next')
        cy.wait(2000)
        commonAnt.clickButtonByName('Next')
        cy.intercept('POST', '**/entitlements*').as('waitForGrant')
        commonAnt.clickButtonByName('Grant Items')

        cy.wait('@waitForGrant').then((res) => {
          expect(res.response.statusCode).to.equal(200)
        })
        cy.assertAlert('Items Granted')
        commonAnt.waitForLoaderToDisappear(30000)
        commonAnt.inputSearchFilter(this.transformationItemName)
        commonAnt.assertRowExist(this.transformationItemId)
      })

      it('Should view an entitlement', { tags: '@smoke' }, function () {
        commonAnt.getTableRowByString(this.transformationItemName).within(() => {
          commonAnt.clickView()
        })
        // "No Consumption History" not present but we see only "Consumption History" message
        expect(cy.contains('Consumption History')).to.exist
      })

      //needs to be reviewed Cannot see Show Transformation Details button
      it.skip('Should show transformation details on an entitlement', { tags: ['@smoke'] }, function () {
        if (!this.featureFlags.isTransformationsVisible && this.featureFlags.isTransformationsVisible != null) {
          this.skip()
        }
        common.clickButtonByName('Grant Item')
        commonAnt.getTableRowByString(this.itemName).click()
        common.clickButtonByName('Show Transformation Details')

        common.waitForModal().within(() => {
          accountPage.getItemRowLength().then((length) => {
            expect(length).to.be.greaterThan(0)
          })
          common.clickButtonByName('Close')
        })
      })

      it('Should revoke an entitlement', { tags: ['@smoke', '@bug_in_code'] }, function () {
        commonAnt.getTableRowByString(this.transformationItemName).within(() => {
          accountPage.clickResetIconX()
        })

        cy.intercept('POST', '**/entitlements/revoke?').as('waitForRevoke')
        commonAnt.waitForModal().within(() => {
          commonAnt.clickButtonByName('Revoke')
        })

        cy.wait('@waitForRevoke').then((res) => {
          expect(res.response.statusCode).to.equal(204)
        })
        cy.assertAlert('Entitlement(s) revoked')

        commonAnt.waitForLoaderToDisappear(30000)
        commonAnt.assertRowNotExist(this.transformationItemName)
      })

      after('Clean up', function () {
        cy.deleteItem(this.itemId)
      })
    })

    describe('License Smoke Tests', { tags: ['@smoke', '@wip'] }, function () {
      const CONTAINER_SELECTOR = '#tab_licenseEntitlements_5_0'

      before('Setup', function () {
        this.licenseName = `Test License Vortex ${Date.now()}`

        cy.generateAppId(32).then((id) => {
          this.referenceId = id
        })

        cy.waitUntil(() => this.referenceId).then(() => {
          cy.createLicense(this.licenseName, this.referenceId, 10, -1, -1).then((id) => {
            this.licenseId = id
          })
        })
      })

      beforeEach('Visit site and search account', function () {
        cy.intercept('**/api2/products/').as('waitForProducts')
        accountPage.searchAccount(this.emailAddress)
        accountPage.navigateToAccountTile('License')
        cy.wait(1000)
        cy.wait('@waitForProducts')
        accountPage.selectProduct(1)
        cy.wait(1000)
        cy.intercept('api/granted-licenses?*').as('waitForLicenses')
        accountPage.selectLicenseType()
        cy.wait('@waitForLicenses')
        common.waitForLoaderToDisappear()
      })

      it('Should grant a license', { tags: '@smoke' }, function () {
        commonAnt.clickButtonByName('Grant License')
        commonAnt.waitForModal().within(() => {
          commonAnt.searchDataTable(this.licenseName)
          cy.intercept('POST', 'api/granted-licenses').as('waitForGrantLicense')
          commonAnt.getTableRowByString(this.licenseName).within(() => {
            commonAnt.clickRadio()
          })
          common.clickButtonByName('Grant')
        })

        cy.wait('@waitForGrantLicense').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })
        cy.assertAlert(`License ${this.licenseName} is granted.`)

        commonAnt.assertRowExist(this.licenseId)
      })

      it('Should view a license', { tags: '@smoke' }, function () {
        commonAnt.searchDataTable(this.licenseName)
        commonAnt
          .getTableRowByString(this.licenseId)
          .invoke('text')
          .then((row) => {
            expect(row).to.include(this.licenseId)
          })
      })

      it('Should revoke a license', { tags: '@smoke' }, function () {
        commonAnt.getTableRowByString(this.licenseId).within(() => {
          accountPage.clickResetIconX()
        })

        cy.intercept('PUT', 'api/granted-licenses/**').as('waitForRevokeLicense')
        commonAnt.waitForModal().within(() => {
          commonAnt.clickButtonByName('Revoke')
        })

        cy.wait('@waitForRevokeLicense').then((res) => {
          expect(res.response.statusCode).to.equal(204)
        })
        cy.assertAlert(`License ${this.licenseName} is revoked.`)

        commonAnt.assertRowNotExist(this.licenseId)
      })

      after('Clean up', function () {
        cy.deleteLicense(this.licenseId)
      })
    })

    describe('Cloud Data Smoke Tests', { tags: '@smoke' }, function () {
      const CONTAINER_SELECTOR = '#tab_cloudData_6_0'

      describe('User Product Smoke Tests', { tags: '@smoke' }, function () {
        before('Setup', function () {
          this.recordKey = common.newUUID()
          this.deleteSuccess = false

          cy.createRecord(this.recordKey, 'userProduct', this.fullPublicId).then((id) => {
            this.ownerId = id
          })
        })

        beforeEach('Visit site and search account', function () {
          cy.intercept('**/api2/products/').as('waitForProducts')
          accountPage.searchAccount(this.emailAddress)
          accountPage.navigateToAccountTile('Cloud Data')
          cy.wait(1000)
          cy.wait('@waitForProducts')

          cy.wait(1000)
          cy.intercept(`api2/stub/cloud-data/admin/users/${this.fullPublicId}/products/${productId}/records?*`).as(
            'waitForRecords'
          )
          accountPage.selectProduct(1)

          cy.wait('@waitForRecords')
          commonAnt.waitForLoaderToDisappear()
        })

        it('Should create a user product record', { tags: '@smoke' }, function () {
          this.createdRecordKey = common.newUUID()

          commonAnt.clickButtonByName('New Record')
          accountPage.inputRecordKey(this.createdRecordKey)
          accountPage.inputRecordTag('tag1 tag2 ')
          commonAnt.clickButtonByName('Next')
          accountPage.inputRecordOpaque('test')
          accountPage.inputRecordProperties(`{"boolean": false, "integer": 1, "string": "test"}`)
          cy.intercept(
            'POST',
            `**/cloud-data/admin/users/${this.fullPublicId}/products/${productId}/records?`,
            (req) => {
              req.on('after:response', (res) => {
                this.createdOwnerId = res.body.ownerId
              })
            }
          ).as('waitForSave')
          commonAnt.clickButtonByName('Create')

          cy.wait('@waitForSave').then((res) => {
            expect(res.response.statusCode).to.equal(201)
          })

          commonAnt.assertRowExist(this.createdRecordKey)

          cy.waitUntil(() => this.createdRecordKey).then(() => {
            cy.deleteRecord(this.createdRecordKey, 'userProduct', this.fullPublicId)
          })
        })

        it('Should diplay a list of user product records', { tags: '@smoke' }, function () {
          commonAnt.getRowLength().then((length) => {
            expect(length).to.be.greaterThan(0)
          })
        })

        it('Should view a user product record', { tags: '@smoke' }, function () {
          commonAnt.getTableRowByString(this.recordKey).within(() => {
            cy.intercept(
              `**/cloud-data/admin/users/${this.fullPublicId}/products/${productId}/records/${this.recordKey}?`
            ).as('waitForRecord')
            commonAnt.clickView()
            cy.wait('@waitForRecord')
          })

          accountPage.assertRecordInfo('userProduct', this.recordKey, this.fullPublicId, productId)
          cy.wait(1000)
          accountPage.assertRecordData()
        })

        it.skip('Should edit a user product record', { tags: '@smoke' }, function () {
          commonAnt.getTableRowByString(this.recordKey).within(() => {
            cy.intercept(
              `**/cloud-data/admin/users/${this.fullPublicId}/products/${productId}/records/${this.recordKey}?`
            ).as('waitForRecord')
            commonAnt.clickView()
            cy.wait('@waitForRecord')
          })

          commonAnt.clickEdit()
          accountPage.inputRecordTag('newTag ')
          commonAnt.navigateToTab('Data')
          commonAnt.getActiveTab().within(() => {
            accountPage.inputRecordOpaque('newOpaqueData')
            accountPage.inputRecordProperties(`{"new": "data", "hello": "there", "general": "kenobi"}`)
          })

          cy.intercept(
            'PATCH',
            `**/cloud-data/admin/users/${this.fullPublicId}/products/${productId}/records/${this.recordKey}?`
          ).as('waitForSave')
          commonAnt.clickButtonByName('Edit record')
          cy.wait('@waitForSave').then((res) => {
            expect(res.response.statusCode).to.equal(200)
          })
        })

        it.skip('Should delete a user product record', { tags: '@smoke' }, function () {
          commonAnt.getTableRowByString(this.recordKey, CONTAINER_SELECTOR).within(() => {
            cy.intercept(
              'DELETE',
              `**/cloud-data/admin/users/${this.fullPublicId}/products/${productId}/records/${this.recordKey}?`
            ).as('waitForDelete')
            commonAnt.clickTrash()
          })

          commonAnt.waitForModal().within(() => {
            commonAnt.clickDelete()
          })

          cy.wait('@waitForDelete').then((res) => {
            if (res.response.statusCode == 200) {
              this.deleteSuccess = true
            }
            expect(res.response.statusCode).to.equal(200)
            commonAnt.assertRowNotExist(this.recordKey, CONTAINER_SELECTOR)
          })
        })

        after('Clean up', function () {
          if (!this.deleteSuccess) {
            cy.deleteRecord(this.recordKey, 'userProduct', this.fullPublicId)
          }
        })
      })

      describe('User Global Smoke Tests', { tags: '@smoke' }, function () {
        before('Setup', function () {
          this.recordKey = common.newUUID()
          this.deleteSuccess = false

          cy.createRecord(this.recordKey, 'userGlobal', this.fullPublicId).then((id) => {
            this.ownerId = id
          })
        })

        beforeEach('Visit site and search account', function () {
          cy.intercept('**/api2/products/').as('waitForProducts')
          accountPage.searchAccount(this.emailAddress)
          cy.wait(1000)
          accountPage.navigateToAccountTile('Cloud Data')
          cy.wait(1000)
          cy.wait('@waitForProducts')
          cy.wait(1000)
          cy.intercept(`api2/stub/cloud-data/admin/users/${this.fullPublicId}/products/${productId}/records?*`).as(
            'waitForRecords'
          )
          accountPage.selectProduct(1)
          cy.wait('@waitForRecords')
          commonAnt.waitForLoaderToDisappear()
          commonAnt.navigateToTab('Global Storage')
          commonAnt.waitForLoaderToDisappear()
        })

        it('Should create a user global record', { tags: '@smoke' }, function () {
          this.createdRecordKey = common.newUUID()

          accountPage.clickOnGlobalNewRecordBtn('New Record', 1)
          accountPage.inputRecordKey(this.createdRecordKey)
          accountPage.inputRecordTag('tag1 tag2 ')

          commonAnt.clickButtonByName('Next')
          accountPage.inputRecordOpaque('test')
          accountPage.inputRecordProperties(`{"boolean": false, "integer": 1, "string": "test"}`)

          cy.intercept('POST', `**/cloud-data/admin/users/${this.fullPublicId}/records?`, (req) => {
            req.on('after:response', (res) => {
              this.createdOwnerId = res.body.ownerId
            })
          }).as('waitForSave')
          commonAnt.clickButtonByName('Create')
          // });

          cy.wait('@waitForSave').then((res) => {
            expect(res.response.statusCode).to.equal(201)
          })

          commonAnt.assertRowExist(this.createdRecordKey)

          cy.waitUntil(() => this.createdRecordKey).then(() => {
            cy.deleteRecord(this.createdRecordKey, 'userGlobal', this.fullPublicId)
          })
        })

        it('Should diplay a list of user global records', { tags: '@smoke' }, function () {
          commonAnt.getRowLength().then((length) => {
            expect(length).to.be.greaterThan(0)
          })
        })

        it('Should view a user global record', { tags: '@smoke' }, function () {
          commonAnt.getTableRowByString(this.recordKey).within(() => {
            cy.intercept(`**/cloud-data/admin/users/${this.fullPublicId}/records/${this.recordKey}?`).as(
              'waitForRecord'
            )
            commonAnt.clickView()
            cy.wait('@waitForRecord')
          })

          accountPage.assertRecordInfo('userGlobal', this.recordKey, this.fullPublicId, productId)
          cy.wait(1000)
          accountPage.assertRecordData()
        })

        it.skip('Should edit a user global record', { tags: '@smoke' }, function () {
          commonAnt.getTableRowByString(this.recordKey, CONTAINER_SELECTOR).within(() => {
            cy.intercept(`**/cloud-data/admin/users/${this.fullPublicId}/records/${this.recordKey}?`).as(
              'waitForRecord'
            )
            commonAnt.clickView()
            cy.wait('@waitForRecord')
          })

          commonAnt.waitForModal().within(() => {
            commonAnt.clickEdit()
            accountPage.inputRecordTag('newTag ')
            commonAnt.navigateToTab('Data')
            commonAnt.getActiveTab().within(() => {
              accountPage.inputRecordOpaque('newOpaqueData')
              accountPage.inputRecordProperties(`{"new": "data", "hello": "there", "general": "kenobi"}`)
            })

            cy.intercept('PATCH', `**/cloud-data/admin/users/${this.fullPublicId}/records/${this.recordKey}?`).as(
              'waitForSave'
            )
            commonAnt.clickButtonByName('Edit record')
            cy.wait('@waitForSave').then((res) => {
              expect(res.response.statusCode).to.equal(200)
            })
          })
        })

        it.skip('Should delete a user global record', { tags: '@smoke' }, function () {
          commonAnt.getTableRowByString(this.recordKey, CONTAINER_SELECTOR).within(() => {
            cy.intercept('DELETE', `**/cloud-data/admin/users/${this.fullPublicId}/records/${this.recordKey}?`).as(
              'waitForDelete'
            )
            commonAnt.clickTrash()
          })

          commonAnt.waitForModal().within(() => {
            commonAnt.clickDelete()
          })

          cy.wait('@waitForDelete').then((res) => {
            if (res.response.statusCode == 200) {
              this.deleteSuccess = true
            }
            expect(res.response.statusCode).to.equal(200)
            commonAnt.assertRowNotExist(this.recordKey, CONTAINER_SELECTOR)
          })
        })

        after('Clean up', function () {
          if (!this.deleteSuccess) {
            cy.deleteRecord(this.recordKey, 'userGlobal', this.fullPublicId)
          }
        })
      })
    })

    after('Clean up', function () {
      cy.deleteAccount(this.platformPublicId)
      cy.deleteAccount(this.socialPublicId)
      cy.deleteAccount(this.devicePublicId)
      cy.deleteAccount(this.fullPublicId)
    })
  })

  describe('Regression Tests', { tags: '@regression' }, function () {
    describe('Account Types Regression Tests', { tags: '@regression' }, function () {
      context('Anonymous Account', function () {
        before('Setup', function () {
          this.firstPartyPlayerId = Date.now()
          this.firstPartyAlias = 'jcheungctp'
          this.deleteSuccess = false

          cy.createSteamAccount(this.firstPartyPlayerId, this.firstPartyAlias, 'none').then((res) => {
            this.anonymousAccessToken = res.body.accessToken
            this.anonymousPublicId = res.body.accountId
          })
        })

        beforeEach('Visit site and search account', function () {
          cy.visitBaseUrl()
          accountPage.navigateToAccounts()
          accountPage.searchAccount(this.anonymousPublicId, 'Public ID')
          commonAnt.waitForLoaderToDisappear()
        })

        it('Should have relevant option', { tags: '@regression' }, function () {
          accountPage.verifyAccountLabel('Legal Responses')
          accountPage.verifyAccountLabel('Purchases')
          accountPage.verifyAccountLabel('Wallet')
          accountPage.verifyAccountLabel('Entitlements')
          accountPage.verifyAccountLabel('Licenses')
        })

        it('Should have user details', { tags: '@regression' }, function () {
          accountPage.getAccountDetails().invoke('text').should('include', 'Anonymous Account')
          accountPage.getUserDetails('Public ID').invoke('text').should('include', this.anonymousPublicId)
          accountPage
            .getUserDetails('Anonymous ID')
            .invoke('text')
            .then((text) => {
              expect(text.replace(/\s+/g, '')).to.have.length(64)
            })
          accountPage.getUserDetails('Platform Type').invoke('text').should('include', 'Steam')
          accountPage.getUserBasicInfoDetails().invoke('text').should('contain', 'Account created')
          accountPage.getUserBasicInfoDetails().invoke('text').should('contain', 'Application Player Sign Up')
          accountPage.getUserDetails('Locale').invoke('text').should('not.be.empty')
        })

        it('Should have global player ban', { tags: '@regression' }, function () {
          accountPage.verifyAccountLabel('Product Ban')
        })

        it('Should not have privacy policy and terms of service accepted', { tags: '@regression' }, function () {
          expect(cy.contains('No documents accepted')).to.exist
        })

        // Delete option is disabled for game studio role
        it.skip('Should be able to delete anonymous account', { tags: ['@regression', '@bug_in_code'] }, function () {
          commonAnt.clickOverflow()
          commonAnt.clickDropdownItem('Delete Account')

          cy.intercept('DELETE', `**/accounts/${this.anonymousPublicId}`).as('waitForDelete')
          // common.clickPopoverButton("Yes");
          commonAnt.waitForModal().within(() => {
            commonAnt.clickDelete()
          })

          cy.wait('@waitForDelete').then((res) => {
            if (res.response.statusCode == 204) {
              this.deleteSuccess = true
            }
            expect(res.response.statusCode).to.equal(204)
          })
        })

        after('Clean up', function () {
          if (!this.deleteSuccess) {
            cy.deleteAccount(this.anonymousPublicId)
          }
        })
      })
    })

    describe('Account Search Regression Tests', { tags: '@regression' }, function () {
      before('Setup', function () {
        this.emailAddress = `ctpshared+${Date.now()}@gmail.com`
        this.firstPartyPlayerId = Date.now()
        this.firstPartyAlias = 'ctpshared'
        this.socialPlatformId = Date.now()
        this.socialPlatformAlias = 'ctpshared'
        this.deviceId = Date.now()
        this.deviceName = 'ctpshared'

        // Create accounts for tests
        cy.createSteamAccount(this.firstPartyPlayerId, this.firstPartyAlias).then((res) => {
          this.steamAccessToken = res.body.accessToken
          this.steamPublicId = res.body.accountId
        })

        cy.createPSNAccount(this.firstPartyPlayerId, this.firstPartyAlias).then((res) => {
          this.psnAccessToken = res.body.accessToken
          this.psnPublicId = res.body.accountId
        })

        cy.createXboxAccount(this.firstPartyPlayerId, this.firstPartyAlias).then((res) => {
          this.xboxAccessToken = res.body.accessToken
          this.xboxPublicId = res.body.accountId
        })

        cy.createEpicAccount(this.firstPartyPlayerId, this.firstPartyAlias).then((res) => {
          this.epicAccessToken = res.body.accessToken
          this.epicPublicId = res.body.accountId
        })

        cy.createFacebookAccount(this.socialPlatformId, this.socialPlatformAlias).then((res) => {
          this.facebookAccessToken = res.body.accessToken
          this.facebookPublicId = res.body.accountId
        })

        cy.createTwitterAccount(this.socialPlatformId, this.socialPlatformAlias).then((res) => {
          this.twitterAccessToken = res.body.accessToken
          this.twitterPublicId = res.body.accountId
        })

        cy.createTwitchAccount(this.socialPlatformId, this.socialPlatformAlias).then((res) => {
          this.twitchAccessToken = res.body.accessToken
          this.twitchPublicId = res.body.accountId
        })

        cy.createGoogleAccount(this.socialPlatformId, this.socialPlatformAlias).then((res) => {
          this.googleAccessToken = res.body.accessToken
          this.googlePublicId = res.body.accountId
        })

        cy.createDeviceAccount(this.deviceId, this.deviceName).then((res) => {
          this.deviceAccessToken = res.body.accessToken
          this.devicePublicId = res.body.accountId
        })

        cy.createFullAccount(this.emailAddress).then((id) => {
          this.fullPublicId = id
          cy.linkByEmailPasswordLegacy(this.steamAccessToken, this.emailAddress)
          cy.linkByEmailPasswordLegacy(this.psnAccessToken, this.emailAddress)
          cy.linkByEmailPasswordLegacy(this.xboxAccessToken, this.emailAddress)
          cy.linkByEmailPasswordLegacy(this.epicAccessToken, this.emailAddress)
          cy.linkByEmailPasswordLegacy(this.facebookAccessToken, this.emailAddress)
          cy.linkByEmailPasswordLegacy(this.twitterAccessToken, this.emailAddress)
          cy.linkByEmailPasswordLegacy(this.twitchAccessToken, this.emailAddress)
          cy.linkByEmailPasswordLegacy(this.googleAccessToken, this.emailAddress)
          cy.linkByEmailPassword(this.deviceAccessToken, this.emailAddress)

          cy.fullAccountLogin(this.emailAddress).then((body) => {
            this.displayName = body.displayName

            cy.createT2GPAccount(body.accessToken).then((res) => {
              this.t2gpAccessToken = res.body.accessToken
              this.t2gpPublicId = res.body.accountId
              cy.linkByEmailPasswordLegacy(res.body.accessToken, this.emailAddress)
            })
          })
        })

        // TODO: Add Nintendo once there is a Switch to sign into
      })

      beforeEach('Visit site and search account', function () {
        cy.visitBaseUrl()
        accountPage.navigateToAccounts()
      })

      it('Should search by first party alias - Steam', { tags: '@regression' }, function () {
        accountPage.searchAccount(this.firstPartyAlias, 'First Party Alias', 'Steam', this.steamPublicId)
        accountPage.getAccountDetails().invoke('text').should('include', 'Platform Account')
        accountPage.getUserDetails('Alias/Gamertag').invoke('text').should('include', this.firstPartyAlias)
        accountPage.getUserDetails('Platform Type').invoke('text').should('include', 'Steam')
      })

      it('Should search by first party alias - PSN', { tags: '@regression' }, function () {
        accountPage.searchAccount(
          this.firstPartyAlias,
          'First Party Alias',
          'Sony Entertainment Network',
          this.psnPublicId
        )
        accountPage.getAccountDetails().invoke('text').should('include', 'Platform Account')
        accountPage.getUserDetails('Alias/Gamertag').invoke('text').should('include', this.firstPartyAlias)
        accountPage.getUserDetails('Platform Type').invoke('text').should('include', 'Sony Entertainment Network')
      })

      it('Should search by first party alias - Xbox', { tags: '@regression' }, function () {
        accountPage.searchAccount(this.firstPartyAlias, 'First Party Alias', 'Xbox Live', this.xboxPublicId)
        accountPage.getAccountDetails().invoke('text').should('include', 'Platform Account')
        accountPage.getUserDetails('Alias/Gamertag').invoke('text').should('include', this.firstPartyAlias)
        // accountPage.getUserDetails("Online Service Type").invoke("text").should("include", "Xbox Live");
        accountPage.getUserDetails('Platform Type').invoke('text').should('include', 'Xbox Live')
      })

      it.skip('Should search by first party alias - Nintendo', { tags: ['@regression', '@wip'] }, function () {
        accountPage.searchAccount(this.firstPartyAlias, 'First Party Alias', 'Nintendo')
        accountPage.getAccountDetails().invoke('text').should('include', 'Platform Account')
        accountPage.getUserDetails('Alias/Gamertag').invoke('text').should('include', this.firstPartyAlias)
        accountPage.getUserDetails('Platform Type').invoke('text').should('include', 'Nintendo')
      })

      it('Should search by first party alias - Epic', { tags: '@regression' }, function () {
        accountPage.searchAccount(this.firstPartyAlias, 'First Party Alias', 'Epic', this.epicPublicId)
        accountPage.getAccountDetails().invoke('text').should('include', 'Platform Account')
        accountPage.getUserDetails('Alias/Gamertag').invoke('text').should('include', this.firstPartyAlias)
        accountPage.getUserDetails('Platform Type').invoke('text').should('include', 'Epic')
      })

      it('Should search by Public ID - T2GP', { tags: '@regression' }, function () {
        accountPage.searchAccount(this.t2gpPublicId, 'Public ID')
        accountPage.getAccountDetails().invoke('text').should('include', 'Platform Account')
        accountPage.getUserDetails('Alias/Gamertag').contains(this.displayName, { matchCase: false }).should('exist')
        accountPage.getUserDetails('Platform Type').invoke('text').should('include', 'T2GP')
      })

      it('Should search by first party player id - Steam', { tags: '@regression' }, function () {
        accountPage.searchAccount(this.firstPartyPlayerId, 'First Party Player ID', 'Steam')
        accountPage.getAccountDetails().invoke('text').should('include', 'Platform Account')
        accountPage.getUserDetails('Platform ID').invoke('text').should('include', this.firstPartyPlayerId)
        accountPage.getUserDetails('Platform Type').invoke('text').should('include', 'Steam')
      })

      it('Should search by first party player id - Sony Entertainment Network', { tags: '@regression' }, function () {
        accountPage.searchAccount(this.firstPartyPlayerId, 'First Party Player ID', 'Sony Entertainment Network')
        accountPage.getAccountDetails().invoke('text').should('include', 'Platform Account')
        accountPage.getUserDetails('Platform ID').invoke('text').should('include', this.firstPartyPlayerId)
        accountPage.getUserDetails('Platform Type').invoke('text').should('include', 'Sony Entertainment Network')
      })

      it('Should search by first party player id - Xbox Live', { tags: '@regression' }, function () {
        accountPage.searchAccount(this.firstPartyPlayerId, 'First Party Player ID', 'Xbox Live')
        accountPage.getAccountDetails().invoke('text').should('include', 'Platform Account')
        accountPage.getUserDetails('Platform ID').invoke('text').should('include', this.firstPartyPlayerId)
        accountPage.getUserDetails('Platform Type').invoke('text').should('include', 'Xbox Live')
      })

      it.skip('Should search by first party player id - Nintendo', { tags: ['@regression', '@wip'] }, function () {
        accountPage.searchAccount(this.firstPartyPlayerId, 'First Party Player ID', 'Nintendo')
        accountPage.getAccountDetails().invoke('text').should('include', 'Platform Account')
        accountPage.getUserDetails('Platform ID').invoke('text').should('include', this.firstPartyPlayerId)
        accountPage.getUserDetails('Platform Type').invoke('text').should('include', 'Nintendo')
      })

      it('Should search by first party player id - Epic', { tags: '@regression' }, function () {
        accountPage.searchAccount(this.firstPartyPlayerId, 'First Party Player ID', 'Epic')
        accountPage.getAccountDetails().invoke('text').should('include', 'Platform Account')
        accountPage.getUserDetails('Platform ID').invoke('text').should('include', this.firstPartyPlayerId)
        accountPage.getUserDetails('Platform Type').invoke('text').should('include', 'Epic')
      })

      it('Should search by first party player id - T2GP', { tags: '@regression' }, function () {
        accountPage.searchAccount(this.fullPublicId, 'First Party Player ID', 'T2GP')
        accountPage.getAccountDetails().invoke('text').should('include', 'Platform Account')
        accountPage.getUserDetails('Platform ID').invoke('text').should('include', this.fullPublicId)
        accountPage.getUserDetails('Platform Type').invoke('text').should('include', 'T2GP')
      })

      it('Should search by social platform id - Facebook', { tags: '@regression' }, function () {
        accountPage.searchAccount(this.socialPlatformId, 'Social Platform ID', 'Facebook')
        accountPage.getAccountDetails().invoke('text').should('include', 'Platform Account')
        accountPage.getUserDetails('Platform ID').invoke('text').should('include', this.socialPlatformId)
        accountPage.getUserDetails('Platform Type').invoke('text').should('include', 'Facebook')
      })

      it('Should search by social platform id - Twitter', { tags: '@regression' }, function () {
        accountPage.searchAccount(this.socialPlatformId, 'Social Platform ID', 'Twitter')
        accountPage.getAccountDetails().invoke('text').should('include', 'Platform Account')
        accountPage.getUserDetails('Platform ID').invoke('text').should('include', this.socialPlatformId)
        accountPage.getUserDetails('Platform Type').invoke('text').should('include', 'Twitter')
      })

      it('Should search by social platform id - Twitch', { tags: '@regression' }, function () {
        accountPage.searchAccount(this.socialPlatformId, 'Social Platform ID', 'Twitch')
        accountPage.getAccountDetails().invoke('text').should('include', 'Platform Account')
        accountPage.getUserDetails('Platform ID').invoke('text').should('include', this.socialPlatformId)
        accountPage.getUserDetails('Platform Type').invoke('text').should('include', 'Twitch')
      })

      it('Should search by social platform id - Google', { tags: '@regression' }, function () {
        accountPage.searchAccount(this.socialPlatformId, 'Social Platform ID', 'Google')
        accountPage.getAccountDetails().invoke('text').should('include', 'Platform Account')
        accountPage.getUserDetails('Platform ID').invoke('text').should('include', this.socialPlatformId)
        accountPage.getUserDetails('Platform Type').invoke('text').should('include', 'Google')
      })

      it('Should search by public id - Device', { tags: '@regression' }, function () {
        accountPage.searchAccount(this.devicePublicId, 'Public ID')
        accountPage.getAccountDetails().invoke('text').should('include', 'Device Account')
        accountPage.getUserDetails('Public ID').invoke('text').should('include', this.devicePublicId)
      })

      after('Clean up', function () {
        cy.deleteAccount(this.steamPublicId)
        cy.deleteAccount(this.psnPublicId)
        cy.deleteAccount(this.xboxPublicId)
        cy.deleteAccount(this.epicPublicId)
        cy.deleteAccount(this.t2gpPublicId)
        cy.deleteAccount(this.facebookPublicId)
        cy.deleteAccount(this.twitterPublicId)
        cy.deleteAccount(this.twitchPublicId)
        cy.deleteAccount(this.googlePublicId)
        cy.deleteAccount(this.devicePublicId)
        cy.deleteAccount(this.fullPublicId)
      })
    })

    describe('Account Info Regression Tests', { tags: '@regression' }, function () {
      context('Matching Pattern', function () {
        before('Setup', function () {
          this.emailAddress = `ctpshared+${Date.now()}@gmail.com`
          this.firstPartyPlayerId = Date.now()
          this.firstPartyAlias = 'ctpshared'
          this.deviceId = Date.now()
          this.deviceName = 'ctpshared'
          this.deleteSuccess = false

          cy.createSteamAccount(this.firstPartyPlayerId, this.firstPartyAlias).then((res) => {
            this.platformAccessToken = res.body.accessToken
            this.platformPublicId = res.body.accountId
          })

          cy.createDeviceAccount(this.deviceId, this.deviceName).then((res) => {
            this.deviceAccessToken = res.body.accessToken
            this.devicePublicId = res.body.accountId
          })

          cy.createFullAccount(this.emailAddress).then((id) => {
            this.fullPublicId = id
            cy.linkByEmailPasswordLegacy(this.platformAccessToken, this.emailAddress)
            cy.linkByEmailPassword(this.deviceAccessToken, this.emailAddress)
          })
        })

        beforeEach('Visit site and search account', function () {
          cy.visitBaseUrl()
          // commonAnt.expandSidebarMenu();
          accountPage.navigateToAccounts()
          accountPage.searchAccount(this.emailAddress)
          common.waitForLoaderToDisappear()
        })

        it('Should not be able to edit account', { tags: '@regression' }, function () {
          accountPage.getDisabledButton('Edit').should('exist')
        })

        //First Name and lastname,dob are visible simillar to customer service Scripts.
        it('Should not be able to view PII in Account History', { tags: '@regression' }, function () {
          cy.intercept('GET', `api/accounts/${this.fullPublicId}/history`).as('waitForHistory')
          commonAnt.clickOverflow()
          commonAnt.clickDropdownItem('history')
          cy.wait('@waitForHistory').then((res) => {
            expect(res.response.statusCode).to.equal(200)
          })
          commonAnt.getRowLength().then((length) => {
            expect(length).to.be.greaterThan(0)
          })
          commonAnt.inputSearchFilter('Create')
          cy.wait(2000)
          commonAnt.clickExpandRowContent()
          accountPage
            .getAccountHistoryJsonData()
            .invoke('text')
            .then((value) => {
              var res = JSON.parse(value)
              expect(res.lastName).to.equal('((hidden))')
              expect(res.firstName).to.equal('((hidden))')
              expect(res.dob).to.equal('((hidden))')
            })
        })

        it('Should be able to view platform accounts', { tags: '@regression' }, function () {
          accountPage.navigateToAccountTile('Linked Accounts')
          commonAnt.navigateToTab('Platform Accounts')
          accountPage.clickOnArrowButton()
          common.waitForLoaderToDisappear()
          accountPage.getUserDetails('Public ID').invoke('text').should('include', this.platformPublicId)
          accountPage.getUserDetails('Alias/Gamertag').invoke('text').should('include', this.firstPartyAlias)
          accountPage.getUserDetails('Platform Type').invoke('text').should('include', 'Steam')
          accountPage.getUserDetails('Platform ID').invoke('text').should('include', this.firstPartyPlayerId)
          accountPage.getUserDetails('Locale').invoke('text').should('not.be.empty')

          // Device Account options are not visible need to be reviewed

          // accountPage.getPortletTitle("Applications Logged Into").should("not.exist");
          // accountPage.getPortletByTitle("Device Accounts").should("exist");

          // accountPage.getPortletByTitle("Device Accounts").within(() => {
          //   accountPage.getDeviceDetails("Device Name").invoke("text").should("include", this.deviceName);
          //   accountPage.getDeviceDetails("Linked by Account ID").invoke("text").should("include", this.devicePublicId);
          //   accountPage.getDeviceDetails("Linked On").invoke("text").should("not.be.empty");
          //   accountPage.getDeviceDetails("Linked On").invoke("text").should("not.equal", "N/A");
          //   accountPage.getDeviceDetails("Linked via App").invoke("text").should("not.be.empty");
          //   accountPage.getDeviceDetails("Linked via App").invoke("text").should("not.equal", "N/A");
          // });
        })

        it(
          'Should be not able to reset legal docs for platform accounts that are linked',
          { tags: '@regression' },
          function () {
            accountPage.navigateToAccountTile('Linked Accounts')
            commonAnt.navigateToTab('Platform Accounts')
            accountPage.clickOnArrowButton()
            common.waitForLoaderToDisappear()
            accountPage.navigateToAccountTile('Legal Responses')
            common.waitForLoaderToDisappear()
            cy.get('.tdi-close-outline').should('not.exist')
          }
        )

        //TODO: should be able to reset legal docs for unlinked accounts
        it('Should unlink device accounts', { tags: '@smoke' }, function () {
          accountPage.navigateToAccountTile('Linked Accounts')
          commonAnt.navigateToTab('Device Accounts')
          cy.wait(1000)
          accountPage.clickUnlink(1)

          cy.intercept('DELETE', `**/accounts/${this.fullPublicId}/unlink/${this.devicePublicId}`).as('waitForUnlink')
          commonAnt.clickButtonByName('Unlink')

          cy.wait('@waitForUnlink').then((res) => {
            expect(res.response.statusCode).to.equal(204)
          })
        })

        it('Should be able to unlink platform accounts', { tags: '@regression' }, function () {
          accountPage.navigateToAccountTile('Linked Accounts')
          commonAnt.navigateToTab('Platform Accounts')
          accountPage.clickUnlink()

          cy.intercept('DELETE', `**/accounts/${this.fullPublicId}/unlink/${this.platformPublicId}`).as('waitForUnlink')
          commonAnt.clickButtonByName('Unlink')

          cy.wait('@waitForUnlink').then((res) => {
            expect(res.response.statusCode).to.equal(204)
          })
        })

        //Delete options are disabled
        it.skip('Should be able to delete full account', { tags: '@regression' }, function () {
          accountPage.clickActionDropdown('Delete Account')

          cy.intercept('DELETE', `**/accounts/${this.fullPublicId}`).as('waitForDelete')
          common.clickPopoverButton('Yes')

          cy.wait('@waitForDelete').then((res) => {
            if (res.response.statusCode == 204) {
              this.deleteSuccess = true
            }
            expect(res.response.statusCode).to.equal(204)
          })
        })

        after('Clean up', function () {
          cy.deleteAccount(this.platformPublicId)
          cy.deleteAccount(this.devicePublicId)
          if (!this.deleteSuccess) {
            cy.deleteAccount(this.fullPublicId)
          }
        })
      })
    })

    describe('Entitlements Regression Tests', { tags: '@regression' }, function () {
      const CONTAINER_SELECTOR = '#tab_entitlements_4_0'

      before('Setup', function () {
        this.emailAddress = `ctpshared+${Date.now()}@gmail.com`
        this.firstPartyAlias = 'user.name'
        this.firstPartyPlayerId = Date.now()
        this.itemName = `Test Item ${Date.now()}`

        cy.createSteamAccount(this.firstPartyPlayerId, this.firstPartyAlias).then((res) => {
          this.platformAccessToken = res.body.accessToken
          this.platformPublicId = res.body.accountId
        })

        cy.createFullAccount(this.emailAddress).then((id) => {
          this.fullPublicId = id
          cy.linkByEmailPasswordLegacy(this.platformAccessToken, this.emailAddress)
        })

        cy.createItem(this.itemName, 3, 'uses', 5, 'inventory', 3).then((id) => {
          this.itemId = id
        })
      })

      beforeEach('Visit site and search account', function () {
        cy.visitBaseUrl()
        // commonAnt.expandSidebarMenu();
        accountPage.navigateToAccounts()
        accountPage.searchAccount(this.emailAddress)

        accountPage.navigateToAccountTile('Entitlements')
        cy.wait(1000)

        cy.intercept('**/entitlements*').as('waitForEntitlements')
        accountPage.selectProduct(1)
        cy.wait('@waitForEntitlements')
        commonAnt.waitForLoaderToDisappear()
      })

      it('Should show current entitlement details - Granted through Technodrome', { tags: '@regression' }, function () {
        commonAnt.clickButtonByName('Grant Item')
        commonAnt.searchDataTable(this.itemName)
        commonAnt.getTableRowByString(this.itemName).within(() => {
          commonAnt.clickCheck()
        })
        commonAnt.clickButtonByName('Next')
        cy.wait(2000)
        commonAnt.clickButtonByName('Next')

        cy.intercept('GET', '**/entitlements**', (req) => {
          req.on('after:response', (res) => {
            this.entitlementId = res.body.data[0].id
          })
        }).as('waitForGrant')

        commonAnt.clickButtonByName('Grant Items')

        cy.wait('@waitForGrant').then((res) => {
          expect(res.response.statusCode).to.equal(200)
        })

        cy.assertAlert('Items Granted')
        commonAnt.waitForLoaderToDisappear(10000)
        commonAnt.getTableRowByString(this.itemName).within(() => {
          commonAnt.clickView()
        })
        commonAnt.getTableRowByIndex().within(() => {
          commonAnt.clickView()
        })

        expect('Consumption History').to.exist
        accountPage
          .getTransactionLabel('Granted date')
          .invoke('text')
          .then(($el) => {
            expect($el.replace('Granted', '').trim().length).to.be.greaterThan(1)
          })
        accountPage
          .getTransactionLabel('Granted In')
          .invoke('text')
          .then(($el) => {
            expect($el.replace('Granted In', '').trim()).to.include('-')
          })

        accountPage
          .getTransactionLabel('Granted by')
          .invoke('text')
          .then(($el) => {
            expect($el.replace('Granted by', '').trim()).to.not.be.empty
          })

        accountPage
          .getTransactionLabel('Reference ID')
          .invoke('text')
          .then(($el) => {
            expect($el.replace('Reference ID', '').trim()).contains('-')
          })

        accountPage
          .getTransactionLabel('Request ID')
          .invoke('text')
          .then(($el) => {
            expect($el.replace('Request ID', '').trim().length).to.be.greaterThan(1)
          })

        cy.waitUntil(() => this.entitlementId).then(() => {
          cy.request({
            method: 'DELETE',
            url: entitlementsBaseUrl + '/entitlements/' + this.entitlementId,
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Basic ' + ecommerceBasicAuth,
              'X-2k-Request-Id': common.newUUID(),
            },
          }).then((res) => {
            expect(res.status).to.equal(204)
          })
        })
      })

      it('Should be able to enter custom data when granting an entitlement', { tags: '@regression' }, function () {
        commonAnt.clickButtonByName('Grant Item')
        commonAnt.searchDataTable(this.itemName)
        commonAnt.getTableRowByString(this.itemName).within(() => {
          commonAnt.clickCheck()
        })
        commonAnt.clickButtonByName('Next')
        cy.wait(2000)
        commonAnt.clickButtonByName('Next')

        commonAnt.waitForLoaderToDisappear()

        accountPage.getCodeEditorTextArea().within(() => {
          accountPage.inputCustomData('test')
        })

        cy.intercept('POST', '**/entitlements/entitlements?').as('waitForGrant')
        commonAnt.clickButtonByName('Grant Items')

        cy.wait('@waitForGrant').then((res) => {
          expect(res.response.statusCode).to.equal(200)
        })
        cy.assertAlert('Items Granted')
        commonAnt.waitForLoaderToDisappear(10000)
        commonAnt.assertRowExist(this.itemName)
      })

      after('Clean up', function () {
        cy.deleteAccount(this.platformPublicId)
        cy.deleteAccount(this.fullPublicId)
        cy.deleteItem(this.itemId)
      })
    })
  })
})
