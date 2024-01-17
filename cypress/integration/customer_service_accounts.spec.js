/* eslint-disable no-undef */
import { Common as CommonAnt } from '../page-objects/common-ant-page-objects'
import { Common } from '../page-objects/common-page-objects'
import { Account } from '../page-objects/accounts-v2-page-objects'

const common = new Common()
const commonAnt = new CommonAnt()
const accountPage = new Account()
const webAppId = Cypress.env('webAppId')
const ssoBaseUrl = Cypress.env('ssoBaseUrl')
const codesBaseUrl = Cypress.env('codesBaseUrl')
const ecommerceBasicAuth = Cypress.env('ecommerceBasicAuth')
var emailAddress = `ctpshared+${Date.now()}@gmail.com`
const firstPartyPlayerId = Date.now()
const firstPartyAlias = 'ctpshared'
const socialPlatformId = Date.now()
const socialPlatformAlias = 'ctpshared'
const deviceId = Date.now()
const deviceName = 'ctpshared'

before('Setup', function () {
  // Login
  cy.doAuth()

  cy.createSteamAccount(firstPartyPlayerId, firstPartyAlias).then((res) => {
    this.platformAccessToken = res.body.accessToken
    this.platformPublicId = res.body.accountId
  })

  cy.createGoogleAccount(socialPlatformId, socialPlatformAlias).then((res) => {
    this.socialAccessToken = res.body.accessToken
    this.socialPublicId = res.body.accountId
  })

  cy.createDeviceAccount(deviceId, deviceName).then((res) => {
    this.deviceAccessToken = res.body.accessToken
    this.devicePublicId = res.body.accountId
  })

  cy.createFullAccount(emailAddress).then((id) => {
    this.fullPublicId = id
    cy.linkByEmailPasswordLegacy(this.platformAccessToken, emailAddress)
    cy.linkByEmailPasswordLegacy(this.socialAccessToken, emailAddress)
    cy.linkByEmailPassword(this.deviceAccessToken, emailAddress)
  })

  cy.fullAccountLogin(emailAddress).then((body) => {
    this.fullAccessToken = body.accessToken
  })
})

describe('Customer Service - Accounts', { tags: '@smoke' }, function () {
  context('Account Search', function () {
    beforeEach('Visit site and search account', function () {
      cy.visitBaseUrl()
      accountPage.navigateToAccounts()
    })

    it('Should search by email address', { tags: '@smoke' }, function () {
      accountPage.searchAccount(emailAddress)
      accountPage.getAccountDetails().invoke('text').should('include', 'Full Account')
      accountPage.getUserDetails('Email address').invoke('text').should('include', emailAddress)
    })

    it('Should search by first party alias', { tags: '@smoke' }, function () {
      accountPage.searchAccount(firstPartyAlias, 'First Party Alias', 'Steam', this.platformPublicId)
      accountPage.getAccountDetails().invoke('text').should('include', 'Platform Account')
      accountPage.getUserDetails('Alias/Gamertag').invoke('text').should('include', firstPartyAlias)
    })

    it('Should search by first party player id', { tags: '@smoke' }, function () {
      accountPage.searchAccount(firstPartyPlayerId, 'First Party Player ID', 'Steam')
      accountPage.getAccountDetails().invoke('text').should('include', 'Platform Account')
      accountPage.getUserDetails('Platform ID').invoke('text').should('include', firstPartyPlayerId)
    })

    it('Should search by social platform id', { tags: '@smoke' }, function () {
      accountPage.searchAccount(socialPlatformId, 'Social Platform ID', 'Google')
      accountPage.getAccountDetails().invoke('text').should('include', 'Platform Account')
      accountPage.getUserDetails('Platform ID').invoke('text').should('include', socialPlatformId)
    })

    it('Should search by public id', { tags: '@smoke' }, function () {
      accountPage.searchAccount(this.fullPublicId, 'Public ID')
      accountPage.getAccountDetails().invoke('text').should('include', 'Full Account')
      accountPage.getUserDetails('Public ID').invoke('text').should('include', this.fullPublicId)
    })
  })

  context('Account Info Activities', function () {
    beforeEach('Visit site and search account', function () {
      cy.visitBaseUrl()
      accountPage.navigateToAccounts()
      cy.intercept(`**/accounts/${this.fullPublicId}`).as('waitForAppsLoggedInto')
      accountPage.searchAccount(emailAddress)
      commonAnt.waitForLoaderToDisappear(30000)
      cy.wait('@waitForAppsLoggedInto')
    })

    it(
      'Should have permissions Account: View Apps Signed Into, View PII, Ban, and Modify Newsletters',
      { tags: ['@smoke'] },
      function () {
        // Check permission Account: View Apps Signed Into
        commonAnt.clickButtonByName('1 applications logged into')
        commonAnt.waitForModal(1).within(() => {
          commonAnt.getRowLength().then((length) => {
            expect(length).to.be.greaterThan(0)
          })

          commonAnt
            .getTableRowByIndex()
            .invoke('text')
            .then((text) => {
              expect(text.replace(/\n|\r/g, '')).to.not.be.empty
            })
          commonAnt.clickX()
        })

        // Check permission Account: View PII
        accountPage.getUserDetails('First name').invoke('text').should('not.include', '-')
        accountPage.getUserDetails('Last name').invoke('text').should('not.include', '-')
        accountPage.getUserDetails('Date of birth').invoke('text').should('not.include', '-')

        // Check permission Account: Ban
        //todo : Need to update the product ban scripts according to Technodrome 1.54.0 changes.
        // accountPage.getBanToggle().should("exist");

        // Check permission Account: Modify Newsletters
        accountPage.navigateToAccountTile('Marketing Attributes')
        accountPage.getNewsletterToggle().should('exist')
      }
    )

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

    it('Should be able to view PII in history', { tags: '@smoke' }, function () {
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
      cy.wait(2000)
      accountPage
        .getAccountHistoryJsonData()
        .invoke('text')
        .then((value) => {
          var res = JSON.parse(value)
          expect(res.lastName).to.not.equal('((hidden))')
          expect(res.firstName).to.not.equal('((hidden))')
          expect(res.dob).to.not.equal('((hidden))')
        })
    })

    it('Should be able to unlink accounts', { tags: '@smoke' }, function () {
      accountPage.navigateToAccountTile('Linked Accounts')
      commonAnt.navigateToTab('Platform Accounts')
      commonAnt.getDataTableByIndex(0).within(() => {
        accountPage.getUnlink().should('exist')
      })

      commonAnt.navigateToTab('Social Accounts')
      commonAnt.getDataTableByIndex(0).within(() => {
        accountPage.getUnlink().should('exist')
      })

      commonAnt.navigateToTab('Device Accounts')
      commonAnt.getDataTableByIndex(0).within(() => {
        accountPage.getUnlink().should('exist')
      })
    })

    it('Should view linked platform account', { tags: '@smoke' }, function () {
      accountPage.navigateToAccountTile('Linked Accounts')
      commonAnt.navigateToTab('Platform Accounts')
      commonAnt.getDataTableByIndex(0).within(() => {
        commonAnt.clickView()
      })

      accountPage.getAccountDetails().invoke('text').should('include', 'Platform Account')
      accountPage.getUserDetails('Public ID').invoke('text').should('include', this.platformPublicId)
      accountPage.getUserDetails('Alias/Gamertag').invoke('text').should('include', firstPartyAlias)
      accountPage.getUserDetails('Platform Type').invoke('text').should('include', 'Steam')
      //accountPage.getUserDetails("Date of birth").should("not.have.class", "hidden-pii");
      accountPage.getUserDetails('Platform ID').invoke('text').should('include', firstPartyPlayerId)
      accountPage.getUserDetails('Locale').invoke('text').should('not.be.empty')
      accountPage.getUserBasicInfoDetails().invoke('text').should('contain', 'Account created')
      accountPage.getUserBasicInfoDetails().invoke('text').should('contain', 'Application Player Sign Up')
      accountPage.getUserBasicInfoDetails().invoke('text').should('contain', 'applications logged into')
      //needs to be reviewed because this information no longer displayed on the page

      // accountPage.getPortletByTitle("Device Accounts").should("exist");

      // accountPage.getPortletByTitle("Device Accounts").within(() => {
      //   accountPage.getDeviceDetails("Device Name").invoke("text").should("include", deviceName);
      //   accountPage.getDeviceDetails("Linked by Account ID").invoke("text").should("include", this.devicePublicId);
      //   accountPage.getDeviceDetails("Linked On").invoke("text").should("not.be.empty");
      //   accountPage.getDeviceDetails("Linked On").invoke("text").should("not.equal", "N/A");
      //   accountPage.getDeviceDetails("Linked via App").invoke("text").should("not.be.empty");
      //   accountPage.getDeviceDetails("Linked via App").invoke("text").should("not.equal", "N/A");
      // });
    })

    it('Should show device account', { tags: '@smoke' }, function () {
      accountPage.navigateToAccountTile('Linked Accounts')
      commonAnt.navigateToTab('Device Accounts')
      commonAnt
        .getTableRowByIndex(0, '.rAccountDevicesTable')
        .invoke('text')
        .then((value) => {
          expect(value).to.contain(deviceName)
          expect(value).to.contain(this.devicePublicId)
        })
    })

    it('Should view linked device account', { tags: '@smoke' }, function () {
      accountPage.navigateToAccountTile('Linked Accounts')
      commonAnt.navigateToTab('Device Accounts')
      commonAnt.getDataTableByIndex(1).within(() => {
        commonAnt.clickView()
      })
      commonAnt.waitForLoaderToDisappear()
      accountPage.getAccountDetails().invoke('text').should('include', 'Device Account')
      accountPage.getUserDetails('Public ID').invoke('text').should('include', this.devicePublicId)
      accountPage.getUserDetails('Alias/Gamertag').invoke('text').should('include', deviceName)
      //accountPage.getUserDetails("Date of birth").should("not.have.class", "hidden-pii");
      accountPage.getUserDetails('Device ID').invoke('text').should('include', deviceId)
      accountPage.getUserDetails('Locale').invoke('text').should('not.be.empty')
      accountPage.getUserBasicInfoDetails().invoke('text').should('contain', 'Account created')
      accountPage.getUserBasicInfoDetails().invoke('text').should('contain', 'Application Player Sign Up')
      accountPage.getUserBasicInfoDetails().invoke('text').should('contain', 'applications logged into')
    })

    it('Should toggle newsletters', { tags: '@smoke' }, function () {
      cy.intercept('PATCH', '**/accounts/**').as('waitForNewsletter')
      accountPage.navigateToAccountTile('Marketing Attributes')
      accountPage.getNewsLetterMasterConsent().click()

      commonAnt.getTableRowByString('Mafia').within(() => {
        accountPage.getNewsletterToggle().click()
      })
      commonAnt.clickButtonByName('Subscribe')
      cy.wait('@waitForNewsletter').then((res) => {
        expect(res.response.statusCode).to.equal(204)
      })
      cy.wait(4000)
      // Check if account has newsletter
      cy.request({
        method: 'GET',
        url: ssoBaseUrl + '/user/accounts/me',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + this.fullAccessToken,
        },
      }).then((res) => {
        expect(res.status).to.equal(200)
        expect(res.body.subscribedNewsletters[0]).to.includes('mafia')
      })
    })

    it('Should edit account details', { tags: '@smoke' }, function () {
      const updatedEmailAddress = `ctpshared+${Date.now()}@gmail.com`
      let dob = '06/12/1997'

      common.clickButtonByName('Edit')

      commonAnt.waitForModal().then(() => {
        accountPage.editPageDetails(updatedEmailAddress, dob)
      })

      cy.intercept('PATCH', `/api/accounts/${this.fullPublicId}`).as('waitForPatchSave')
      common.clickButtonByName('Save')

      cy.wait('@waitForPatchSave').then((res) => {
        expect(res.response.statusCode).to.equal(204)
        emailAddress = updatedEmailAddress
      })

      accountPage.getUserDetails('Email address').invoke('text').should('include', updatedEmailAddress)
      accountPage.getUserDetails('Date of birth').invoke('text').should('include', '30 June 1997')
      accountPage.getUserDetails('First name').invoke('text').should('not.include', '-')
      accountPage.getUserDetails('Last name').invoke('text').should('not.include', '-')
      accountPage.getUserDetails('Public ID').invoke('text').should('not.include', this.platformPublicId)
    })
  })

  context('Codes Activities', function () {
    const CONTAINER_SELECTOR = '#tab_codes_2_0'

    before('Setup', function () {
      this.itemName = `Test Durable Item ${Date.now()}`
      this.campaignName = `Test Campaign ${Date.now()}`

      cy.createItem(this.itemName, 1).then((id) => {
        this.itemId = id
      })

      cy.createCampaign(this.campaignName).then((id) => {
        this.campaignId = id
      })

      // Create codeset
      cy.waitUntil(() => this.campaignId && this.itemId).then(() => {
        cy.request({
          method: 'POST',
          url: codesBaseUrl + '/codesets',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Basic ' + ecommerceBasicAuth,
          },
          body: {
            campaignId: this.campaignId,
            name: `Test Codeset ${Date.now()}`,
            grantedItemsWithQuantity: [
              {
                itemId: this.itemId,
                quantity: 1,
              },
            ],
            type: 0,
            redeemLimit: 1,
          },
        }).then((res) => {
          cy.parseIdFromHeader(res).then((id) => {
            this.codesetId = id
          })
        })
      })

      // Generate code
      cy.waitUntil(() => this.codesetId).then(() => {
        cy.generateAndGetCode(this.codesetId, 0, 8, 1).then((code) => {
          this.code = code
        })
      })
      // Redeem Code
      cy.waitUntil(() => this.code).then(() => {
        cy.redeemCode(this.platformAccessToken, this.code)
      })
    })

    beforeEach('Visit site', function () {
      cy.visitBaseUrl()
      accountPage.navigateToAccounts()
      accountPage.searchAccount(emailAddress)
      commonAnt.waitForLoaderToDisappear(30000)
    })

    it('Should view a Code', { tags: '@smoke' }, function () {
      accountPage.navigateToAccountTile('Linked Accounts')
      common.waitForLoaderToDisappear(30000)
      commonAnt.getDataTableByIndex(0).within(() => {
        commonAnt.clickView()
      })
      accountPage.navigateToAccountTile('Codes')
      commonAnt.getTableRowByString(this.code).should('exist')
    })

    after('Clean up', function () {
      cy.deleteCampaign(this.campaignId)
      cy.deleteItem(this.itemId)
    })
  })

  context('Legal Responses Activities', function () {
    beforeEach('Visit site', function () {
      cy.visitBaseUrl()
      accountPage.navigateToAccounts()
    })

    it('Should confirm that TOS and PP have been accepted', { tags: '@smoke' }, function () {
      accountPage.searchAccount(emailAddress)
      accountPage.navigateToAccountTile('Legal Responses')
      commonAnt.waitForLoaderToDisappear()
      commonAnt.getRowLength().then((length) => {
        expect(length).to.be.equal(2)
      })
      accountPage.getActiveTab().within(() => {
        //Accepted text is not present instead here it updated to checkmark
        accountPage.verifySuccessCheckMark()
        accountPage.verifySuccessCheckMark(1)
      })
    })

    it('Should not be able to reset legal responses if platform account is linked', { tags: '@smoke' }, function () {
      accountPage.searchAccount(this.platformPublicId, 'Public ID')
      accountPage.navigateToAccountTile('Legal Responses')
      commonAnt.waitForLoaderToDisappear()
      accountPage.getActiveTab().within(() => {
        accountPage.clickResetIconX()
      })

      commonAnt.waitForModal().within(() => {
        cy.intercept('POST', '**/responses/**').as('waitForReset')
        commonAnt.clickButtonByName('Reset')
        commonAnt.clickX()
      })

      cy.wait('@waitForReset').then((res) => {
        expect(res.response.statusCode).to.equal(404)
      })

      accountPage.getActiveTab().within(() => {
        accountPage.clickResetIconX(1)
      })

      commonAnt.waitForModal().within(() => {
        cy.intercept('DELETE', '**/responses/**').as('waitForReset')
        commonAnt.clickButtonByName('Reset')
        commonAnt.clickX()
      })

      cy.wait('@waitForReset').then((res) => {
        expect(res.response.statusCode).to.equal(404)
      })
    })

    it('Should be able to reset legal responses if platform account is unlinked', { tags: '@smoke' }, function () {
      cy.unlinkAccountByAccessToken(this.platformAccessToken)

      accountPage.searchAccount(this.platformPublicId, 'Public ID')
      accountPage.navigateToAccountTile('Legal Responses')

      accountPage.getActiveTab().within(() => {
        accountPage.clickResetIconX()
      })

      commonAnt.waitForModal().within(() => {
        cy.intercept('POST', '**/responses/**').as('waitForReset')
        commonAnt.clickButtonByName('Reset')
      })

      cy.wait('@waitForReset').then((res) => {
        expect(res.response.statusCode).to.equal(204)
      })
      commonAnt.waitForLoaderToDisappear(30000)

      accountPage.getActiveTab().within(() => {
        //Message changed from "No Documents are available" to "No Data"
        expect(cy.contains('No Data')).to.exist
      })
    })
  })

  context('Notes Activities', function () {
    const CONTAINER_SELECTOR = '#tab_notes_3_0'

    beforeEach('Visit site', function () {
      cy.visitBaseUrl()
      accountPage.navigateToAccounts()
      accountPage.searchAccount(emailAddress)
      accountPage.navigateToAccountTile('Notes')
    })

    it('Should create a note', { tags: '@smoke' }, function () {
      commonAnt.clickButtonByName('Create Note')
      commonAnt.waitForModal().within(() => {
        accountPage.inputNote('Note test')

        cy.intercept('POST', '**/notes').as('waitForSave')
        commonAnt.clickButtonByName('Create')
      })

      cy.wait('@waitForSave').then((res) => {
        expect(res.response.statusCode).to.equal(200)
      })
    })

    it('Should view a note', { tags: '@smoke' }, function () {
      // There is no right arrow to view note instead updated and displaying details in Expand space
      commonAnt.expandAndViewNote('Note test')
    })

    it('Should edit a note', { tags: '@smoke' }, function () {
      commonAnt.getTableRowByIndex(0).within(() => {
        commonAnt.clickEdit()
      })

      commonAnt.waitForModal().within(() => {
        accountPage.inputNote('Updated note')

        cy.intercept('PUT', '**/notes/**').as('waitForSave')
        commonAnt.clickButtonByName('Save')
      })

      cy.wait('@waitForSave').then((res) => {
        expect(res.response.statusCode).to.equal(204)
      })
    })

    it('Should view note history', { tags: '@smoke' }, function () {
      commonAnt.getTableRowByIndex(0).within(() => {
        commonAnt.clickHistory()
      })
      commonAnt.waitForModal().within(() => {
        commonAnt.getRowLength().then((length) => {
          expect(length).to.be.greaterThan(0)
        })
        commonAnt.clickX()
      })
    })

    it('Should delete a note', { tags: '@smoke' }, function () {
      commonAnt.getTableRowByIndex(0).within(() => {
        commonAnt.clickTrash()
      })

      commonAnt.waitForModal().within(() => {
        cy.intercept('DELETE', '**/notes/**').as('waitForDelete')
        commonAnt.clickButtonByName('Delete')
      })

      cy.wait('@waitForDelete').then((res) => {
        expect(res.response.statusCode).to.equal(204)
      })
      cy.assertAlert('Note deleted.')

      cy.contains('No Data').should('exist')
    })
  })

  describe('Ban Activities', function () {
    beforeEach('Visit site', function () {
      cy.visitBaseUrl()
      accountPage.navigateToAccounts()
      cy.intercept(`**/accounts/${this.fullPublicId}`).as('waitForAppsLoggedInto')
      accountPage.searchAccount(emailAddress)
      commonAnt.waitForLoaderToDisappear(30000)
      cy.wait('@waitForAppsLoggedInto')
    })

    context('Global Ban Test Cases', function () {
      let removeGlobalBanStatus = false

      it('Should create a global ban', { tags: '@smoke' }, function () {
        accountPage.navigateToAccountTile('Product Bans')

        commonAnt.waitForModal(1).within(() => {
          common.clickButtonByName('New Product Ban')
        })

        commonAnt.waitForModal(2).within(() => {
          accountPage.getBanToggle().click()
          cy.intercept('POST', '**/bans/global*').as('waitForSave')
          commonAnt.clickButtonByName('Create ban')
        })

        commonAnt.clickButtonByName('Confirm')

        cy.wait('@waitForSave').then((res) => {
          expect(res.response.statusCode).to.equal(204)
        })
        commonAnt.waitForModal(1).within(() => {
          commonAnt.assertRowExist('Global')
          commonAnt.clickX()
        })

        accountPage.getUserDetails('Product Ban').invoke('text').should('include', 'Global Ban Active')
        accountPage.getTileDetails('Product Bans').invoke('text').should('include', 'Global ban across all products')

        cy.VerifyBannedAccountByLogin(emailAddress)

        //Remove Global Ban
        cy.waitUntil(() => this.fullPublicId).then(() => {
          cy.deleteGlobalAndProductBan(this.fullPublicId)
        })
      })

      it('Should read a global ban', { tags: '@smoke' }, function () {
        //Global ban via API req
        cy.createGlobalBan(this.fullPublicId, true)

        cy.reload()
        //View the globally banned account
        accountPage.getUserDetails('Product Ban').invoke('text').should('include', 'Global Ban Active')
        accountPage.getTileDetails('Product Bans').invoke('text').should('include', 'Global ban across all products')
        accountPage.navigateToAccountTile('Product Bans')

        commonAnt.waitForModal(1).within(() => {
          commonAnt.assertRowExist('Global')
          commonAnt.clickX()
        })
      })

      it('Should remove a global ban', { tags: '@smoke' }, function () {
        accountPage.navigateToAccountTile('Product Bans')
        commonAnt.waitForLoaderToDisappear(30000)

        commonAnt.waitForModal(1).within(() => {
          cy.intercept('POST', '**/bans/global*').as('waitForSave')
          accountPage.removeProductBan()
        })

        commonAnt.clickButtonByName('Confirm')

        cy.wait('@waitForSave').then((res) => {
          expect(res.response.statusCode).to.equal(204)
          removeGlobalBanStatus = true
        })

        commonAnt.waitForModal(1).within(() => {
          commonAnt.clickX()
        })

        accountPage.getUserDetails('Product Ban').invoke('text').should('include', '0 Active Bans')
        accountPage.getTileDetails('Product Bans').invoke('text').should('include', '0 bans across 0 products')
      })

      after('Remove Global ban', function () {
        if (!removeGlobalBanStatus) {
          cy.deleteGlobalAndProductBan(this.fullPublicId)
        }
      })
    })

    context('Product Ban Test Cases', function () {
      let removeProductBanStatus = false

      it('Should create a product ban', { tags: '@smoke' }, function () {
        accountPage.navigateToAccountTile('Product Bans')

        commonAnt.waitForModal(1).within(() => {
          common.clickButtonByName('New Product Ban')
        })

        commonAnt.waitForModal(2).within(() => {
          accountPage.productBansPage()
          cy.intercept('POST', '**/bans*').as('waitForSave')
          commonAnt.clickButtonByName('Create ban')
        })

        commonAnt.clickButtonByName('Confirm')

        cy.wait('@waitForSave').then((res) => {
          expect(res.response.statusCode).to.equal(200)
        })

        commonAnt.waitForModal(1).within(() => {
          commonAnt.assertRowExist('Test Product Cypress 1')
          commonAnt.clickX()
        })

        accountPage
          .getUserDetails('Product Ban')
          .invoke('text')
          .then((txt) => {
            expect(txt).to.contains('1 Active Bans')
          })

        accountPage
          .getTileDetails('Product Bans')
          .invoke('text')
          .then((txt) => {
            expect(txt).to.contains('1 bans across 1 products')
          })

        cy.VerifyBannedAccountByLogin(emailAddress)

        //Remove Global Ban
        cy.waitUntil(() => this.fullPublicId).then(() => {
          cy.deleteGlobalAndProductBan(this.fullPublicId)
        })
      })

      it('Should view a product ban ', { tags: '@smoke' }, function () {
        //product ban via API req
        cy.createProductBan(this.fullPublicId)

        //Refresh the page to see the updated ban status
        cy.reload()

        accountPage.getUserDetails('Product Ban').invoke('text').should('include', '1 Active Bans')
        accountPage.getTileDetails('Product Bans').invoke('text').should('include', '1 bans across 1 products')

        accountPage.navigateToAccountTile('Product Bans')

        commonAnt.waitForModal(1).within(() => {
          commonAnt.assertRowExist('Test Product Cypress 1')
          commonAnt.clickX()
        })
      })

      it('Should remove a product ban', { tags: '@smoke' }, function () {
        accountPage.navigateToAccountTile('Product Bans')

        commonAnt.waitForModal(1).within(() => {
          cy.intercept('POST', '**/bans*').as('waitForSave')
          accountPage.removeProductBan('Test Product Cypress 1')
        })

        commonAnt.clickButtonByName('Confirm')
        cy.wait('@waitForSave').then((res) => {
          expect(res.response.statusCode).to.equal(200)
          removeProductBanStatus = true
        })

        commonAnt.waitForModal(1).within(() => {
          commonAnt.clickX()
        })

        accountPage.getUserDetails('Product Ban').invoke('text').should('include', '0 Active Bans')
        accountPage.getTileDetails('Product Bans').invoke('text').should('include', '1 bans across 1 products')
      })

      after('Remove product ban', function () {
        if (!removeProductBanStatus) {
          cy.deleteGlobalAndProductBan(this.fullPublicId)
        }
      })
    })
  })
})

after('Clean up', function () {
  cy.deleteAccount(this.platformPublicId)
  cy.deleteAccount(this.socialPublicId)
  cy.deleteAccount(this.devicePublicId)
  cy.deleteAccount(this.fullPublicId)
})
