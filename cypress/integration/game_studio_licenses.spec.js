/* eslint-disable no-undef */

import { Common } from '../page-objects/common-ant-page-objects'
import { Licenses } from '../page-objects/licenses-page-objects'

const common = new Common()
const licensesPage = new Licenses()
const emailAddress = `ctpshared+${Date.now()}@gmail.com`

before('Login and setup account', function () {
  // Login
  cy.cleanUpLicenses()
  cy.doAuth()
  this.SELECTOR_LICENSE_LIST = licensesPage.licensesListSelector
  this.baseTitle = 'License'

  cy.createFullAccount(emailAddress).then((id) => {
    this.accountId = id
  })
})

describe('Game Studio - Licenses', function () {
  describe('Smoke Tests', { tags: '@smoke' }, function () {
    before('Setup', function () {
      this.licenseName = `${this.baseTitle} ${Date.now()}`
      this.deleteSuccess = false

      cy.generateAppId(32).then((id) => {
        this.referenceId = id
        cy.createLicense(this.licenseName, id, 10, -1, -1).then((id) => {
          this.licenseId = id
          cy.grantLicense(id, this.accountId).then((id) => {
            this.grantedLicenseId = id
          })
        })
      })
    })

    beforeEach(function () {
      cy.visitBaseUrl()

      // Navigate sidebar and select product
      cy.intercept('**/products').as('waitForProducts')
      licensesPage.navigateToLicenses()
      cy.wait('@waitForProducts')

      // Wait for licenses
      cy.intercept('**/licenses/**').as('waitForLicenses')
      common.selectProduct()
      cy.wait('@waitForLicenses')
      common.waitForLoaderToDisappear()
    })

    it('Should create a Vortex license', { tags: '@smoke' }, function () {
      this.createdLicenseName = `${this.baseTitle} ${Date.now()}`

      common.clickButtonByName('New License')

      licensesPage.inputDescription(this.createdLicenseName, `${this.baseTitle} Description`, 'tag1 tag2 ', 'Vortex')
      licensesPage.inputReferenceId(this.referenceId)

      // Intercept response to get licensesId
      cy.intercept('POST', 'api/licenses/', (req) => {
        req.on('after:response', (res) => {
          this.createdLicenseId = res.body.data.id
        })
      }).as('waitForCreate')
      common.clickButtonByName('Create')

      cy.wait('@waitForCreate').then((res) => {
        expect(res.response.statusCode).to.equal(201)
      })

      common.navigateBreadcrumbByString('Licenses')
      common.assertRowExist(this.createdLicenseName, this.SELECTOR_LICENSE_LIST)

      // Clean up created license
      cy.waitUntil(() => this.createdLicenseId).then(() => {
        cy.deleteLicense(this.createdLicenseId)
      })
    })

    it('Should display a list of licenses', { tags: '@smoke' }, function () {
      common.getRowLength(this.SELECTOR_LICENSE_LIST).then((length) => {
        expect(length).to.be.greaterThan(0)
      })
    })

    it('Should view a Vortex license', { tags: '@smoke' }, function () {
      common.getTableRowByString(this.licenseName, this.SELECTOR_LICENSE_LIST).within(() => {
        common.clickView()
      })
      common.getPageTitle().within(($subtitle) => {
        expect($subtitle.text()).to.include(this.licenseId)
        expect($subtitle.text()).to.include(this.licenseName)
      })
    })

    it('Should edit a Vortex license', { tags: '@smoke' }, function () {
      common.getTableRowByString(this.licenseName, this.SELECTOR_LICENSE_LIST).within(() => {
        common.clickView()
      })
      common.clickEdit()
      this.newLicenseName = `Updated ${this.baseTitle} ${Date.now()}`
      licensesPage.inputDescription(this.newLicenseName, `Updated ${this.baseTitle} Description`, 'tag2 ')
      cy.intercept('GET', '**/licenses/**').as('waitForEdit')
      common.clickButtonByName('Edit')

      cy.wait('@waitForEdit').then((res) => {
        if (res.response.statusCode == 200) {
          this.licenseName = this.newLicenseName
        }
        expect(res.response.statusCode).to.equal(200)
      })
      common.navigateBreadcrumbByString('Licenses')
      common.assertRowExist(this.newLicenseName, this.SELECTOR_LICENSE_LIST)
    })

    it('Should clone a Vortex license', { tags: '@smoke' }, function () {
      common.getTableRowByString(this.licenseName, this.SELECTOR_LICENSE_LIST).within(() => {
        common.clickView()
      })
      common.waitForLoaderToDisappear()
      common.clickOverflow()
      common.clickDropdownItem('Clone License')

      this.clonedLicenseName = `Cloned ${this.baseTitle} ${Date.now()}`

      licensesPage.inputDescription(this.clonedLicenseName, `Cloned ${this.baseTitle} Description`, 'tag3 ')

      cy.intercept('POST', 'api/licenses', (req) => {
        req.on('after:response', (res) => {
          this.clonedLicenseId = res.body.data.id
        })
      }).as('waitForClone')
      common.clickButtonByName('Clone')

      cy.wait('@waitForClone').then((res) => {
        expect(res.response.statusCode).to.equal(201)
      })
      common.navigateBreadcrumbByString('Licenses')
      common.assertRowExist(this.clonedLicenseName, this.SELECTOR_LICENSE_LIST)

      // Clean up cloned license
      cy.waitUntil(() => this.clonedLicenseId).then(() => {
        cy.deleteLicense(this.clonedLicenseId)
      })
    })

    it('Should view Vortex license history', { tags: '@smoke' }, function () {
      common.getTableRowByString(this.licenseName, this.SELECTOR_LICENSE_LIST).within(() => {
        cy.intercept('GET', '**/history').as('waitForHistory')
        common.clickView()
      })

      cy.wait('@waitForHistory').then((res) => {
        expect(res.response.statusCode).to.equal(200)
      })

      common.getRowLength().then((length) => {
        expect(length).to.be.greaterThan(0)
      })
    })

    it('Should view granted Vortex licenses', { tags: ['@smoke', '@wip'] }, function () {
      common.getTableRowByString(this.licenseName, this.SELECTOR_LICENSE_LIST).within(() => {
        cy.intercept('GET', `api/granted-licenses?licenseId=${this.licenseId}`).as('waitForGrantedLicenses')
        common.clickList()
      })

      cy.wait('@waitForGrantedLicenses').then((res) => {
        expect(res.response.statusCode).to.equal(200)
      })

      common.waitForModal().within(() => {
        common.getRowLength().then((length) => {
          expect(length).to.be.greaterThan(0)
        })

        common.assertRowExist(this.grantedLicenseId)

        common.clickButtonByName('Close')
      })
    })

    it('Should delete a Vortex license', { tags: '@smoke' }, function () {
      common.getTableRowByString(this.licenseName, this.SELECTOR_LICENSE_LIST).within(() => {
        common.clickTrash()
      })
      cy.intercept('DELETE', '**/licenses/**').as('waitForDelete')

      common.waitForModal().within(() => {
        common.clickButtonByName('Delete')
      })

      cy.wait('@waitForDelete').then((res) => {
        if (res.response.statusCode == 204) {
          this.deleteSuccess = true
        }
        expect(res.response.statusCode).to.equal(204)
      })
      common.navigateBreadcrumbByString('Licenses')
      common.assertRowNotExist(this.licenseName, this.SELECTOR_LICENSE_LIST)
    })

    after('Clean up', function () {
      if (!this.deleteSuccess) {
        cy.deleteLicense(this.licenseId)
      }
    })
  })

  describe('Regression Tests', { tags: '@regression' }, function () {
    const steamAppId = Cypress.env('steamAppId')

    describe('Pre-Release - Non Privileged Regression Tests', { tags: '@regression' }, function () {
      before('Setup', function () {
        this.licenseName = `${this.baseTitle} ${Date.now()}`
        this.deleteSuccess = false

        cy.createLicense(this.licenseName, steamAppId, 21, 24, 1).then((id) => {
          this.licenseId = id
          cy.grantLicense(id, this.accountId).then((id) => {
            this.grantedLicenseId = id
          })
        })
      })

      beforeEach(function () {
        cy.visitBaseUrl()

        // Navigate sidebar and select product
        cy.intercept('**/products').as('waitForProducts')
        licensesPage.navigateToLicenses()
        cy.wait('@waitForProducts')

        // Wait for licenses
        cy.intercept('**/licenses/**').as('waitForLicenses')
        common.selectProduct()
        cy.wait('@waitForLicenses')
        common.waitForLoaderToDisappear()
      })

      it('Should create a Pre-Release - Non Privileged license', { tags: '@regression' }, function () {
        this.createdLicenseName = `${this.baseTitle} ${Date.now()}`

        common.clickButtonByName('New License')

        licensesPage.inputDescription(
          this.createdLicenseName,
          `${this.baseTitle} Description`,
          'tag1 tag2 ',
          'Pre-Release - Non Privileged'
        )
        licensesPage.selectReferenceId('Test App Cypress 1 (Steam)')
        licensesPage.inputOfflineTtl()
        licensesPage.inputMaxDeviceRegistration()

        // Intercept response to get licensesId
        cy.intercept('POST', 'api/licenses', (req) => {
          req.on('after:response', (res) => {
            this.createdLicenseId = res.body.data.id
          })
        }).as('waitForCreate')
        common.clickButtonByName('Create')

        cy.wait('@waitForCreate').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })
        common.navigateBreadcrumbByString('Licenses')
        common.assertRowExist(this.createdLicenseName, this.SELECTOR_LICENSE_LIST)

        // Clean up created license
        cy.waitUntil(() => this.createdLicenseId).then(() => {
          cy.deleteLicense(this.createdLicenseId)
        })
      })

      it('Should view a Pre-Release - Non Privileged license', { tags: '@regression' }, function () {
        common.getTableRowByString(this.licenseName, this.SELECTOR_LICENSE_LIST).within((row) => {
          common.clickView()
        })

        common.getPageTitle().within(($subtitle) => {
          expect($subtitle.text()).to.include(this.licenseId)
          expect($subtitle.text()).to.include(this.licenseName)
        })
      })

      it('Should edit a Pre-Release - Non Privileged license', { tags: '@regression' }, function () {
        common.getTableRowByString(this.licenseName, this.SELECTOR_LICENSE_LIST).within(() => {
          common.clickView()
        })
        common.clickEdit()
        this.newLicenseName = `Updated ${this.baseTitle} ${Date.now()}`
        licensesPage.inputDescription(this.newLicenseName, `Updated ${this.baseTitle} Description`, 'tag2 ')
        licensesPage.inputOfflineTtl(22)
        licensesPage.inputMaxDeviceRegistration(4)
        cy.intercept('GET', '**/licenses/**').as('waitForEdit')
        common.clickButtonByName('Edit')
        cy.wait('@waitForEdit').then((res) => {
          if (res.response.statusCode == 200) {
            this.licenseName = this.newLicenseName
          }
          expect(res.response.statusCode).to.equal(200)
        })
        common.navigateBreadcrumbByString('Licenses')
        common.assertRowExist(this.newLicenseName, this.SELECTOR_LICENSE_LIST)
      })

      it('Should clone a Pre-Release - Non Privileged license', { tags: '@regression' }, function () {
        common.getTableRowByString(this.licenseName, this.SELECTOR_LICENSE_LIST).within(() => {
          common.clickView()
        })
        common.waitForLoaderToDisappear()
        common.clickOverflow()
        common.clickDropdownItem('Clone License')
        this.clonedLicenseName = `Cloned ${this.baseTitle} ${Date.now()}`
        licensesPage.inputDescription(this.clonedLicenseName, `Cloned ${this.baseTitle} Description`, 'tag3 ')
        licensesPage.inputOfflineTtl()
        licensesPage.inputMaxDeviceRegistration()

        cy.intercept('POST', 'api/licenses', (req) => {
          req.on('after:response', (res) => {
            this.clonedLicenseId = res.body.data.id
          })
        }).as('waitForClone')
        common.clickButtonByName('Clone')

        cy.wait('@waitForClone').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })
        common.navigateBreadcrumbByString('Licenses')
        common.assertRowExist(this.clonedLicenseName, this.SELECTOR_LICENSE_LIST)

        // Clean up cloned license
        cy.waitUntil(() => this.clonedLicenseId).then(() => {
          cy.deleteLicense(this.clonedLicenseId)
        })
      })

      it('Should view Pre-Release - Non Privileged license history', { tags: '@regression' }, function () {
        common.getTableRowByString(this.licenseName, this.SELECTOR_LICENSE_LIST).within(() => {
          cy.intercept('GET', '**/history').as('waitForHistory')
          common.clickView()
        })

        cy.wait('@waitForHistory').then((res) => {
          expect(res.response.statusCode).to.equal(200)
        })
        common.getRowLength().then((length) => {
          expect(length).to.be.greaterThan(0)
        })
      })

      it(
        'Should view granted licenses - Non Privileged license history',
        { tags: ['@regression', '@wip'] },
        function () {
          common.getTableRowByString(this.licenseName, this.SELECTOR_LICENSE_LIST).within((row) => {
            cy.intercept('GET', `api/granted-licenses?licenseId=${this.licenseId}`).as('waitForGrantedLicenses')
            common.clickList(row)
          })

          cy.wait('@waitForGrantedLicenses').then((res) => {
            expect(res.response.statusCode).to.equal(200)
          })

          common.waitForModal().within(() => {
            common.getRowLength().then((length) => {
              expect(length).to.be.greaterThan(0)
            })

            common.assertRowExist(this.grantedLicenseId)

            common.clickButtonByName('Close')
          })
        }
      )

      it('Should delete a Pre-Release - Non Privileged license', { tags: '@regression' }, function () {
        common.getTableRowByString(this.licenseName, this.SELECTOR_LICENSE_LIST).within(() => {
          common.clickTrash()
        })
        cy.intercept('DELETE', '**/licenses/**').as('waitForDelete')
        common.waitForModal().within(() => {
          common.clickButtonByName('Delete')
        })
        cy.wait('@waitForDelete').then((res) => {
          if (res.response.statusCode == 204) {
            this.deleteSuccess = true
          }
          expect(res.response.statusCode).to.equal(204)
        })
        common.navigateBreadcrumbByString('Licenses')
        common.assertRowNotExist(this.licenseName, this.SELECTOR_LICENSE_LIST)
      })

      after('Clean up', function () {
        if (!this.deleteSuccess) {
          cy.deleteLicense(this.licenseId)
        }
      })
    })

    describe('Pre-Release - Privileged Regression Tests', { tags: '@regression' }, function () {
      before('Setup', function () {
        this.licenseName = `${this.baseTitle} ${Date.now()}`
        this.deleteSuccess = false

        cy.createLicense(this.licenseName, steamAppId, 21, 24, 1).then((id) => {
          this.licenseId = id
          cy.grantLicense(id, this.accountId).then((id) => {
            this.grantedLicenseId = id
          })
        })
      })

      beforeEach(function () {
        cy.visitBaseUrl()

        // Navigate sidebar and select product
        cy.intercept('**/products').as('waitForProducts')
        licensesPage.navigateToLicenses()
        cy.wait('@waitForProducts')

        // Wait for licenses
        cy.intercept('**/licenses/**').as('waitForLicenses')
        common.selectProduct()
        cy.wait('@waitForLicenses')
        common.waitForLoaderToDisappear()
      })

      it('Should create a Pre-Release - Privileged license', { tags: '@regression' }, function () {
        this.createdLicenseName = `${this.baseTitle} ${Date.now()}`

        common.clickButtonByName('New License')

        licensesPage.inputDescription(
          this.createdLicenseName,
          `${this.baseTitle} Description`,
          'tag1 tag2 ',
          'Pre-Release - Privileged'
        )
        licensesPage.selectReferenceId('Test App Cypress 1 (Steam)')
        licensesPage.inputOfflineTtl()

        // Intercept response to get licensesId
        cy.intercept('POST', 'api/licenses', (req) => {
          req.on('after:response', (res) => {
            this.createdLicenseId = res.body.data.id
          })
        }).as('waitForCreate')
        common.clickButtonByName('Create')
        cy.wait('@waitForCreate').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })
        common.navigateBreadcrumbByString('Licenses')
        common.assertRowExist(this.createdLicenseName, this.SELECTOR_LICENSE_LIST)

        // Clean up created license
        cy.waitUntil(() => this.createdLicenseId).then(() => {
          cy.deleteLicense(this.createdLicenseId)
        })
      })

      it('Should view a Pre-Release - Privileged license', { tags: '@regression' }, function () {
        common.getTableRowByString(this.licenseName, this.SELECTOR_LICENSE_LIST).within(() => {
          common.clickView()
        })

        common.getPageTitle().within(($subtitle) => {
          expect($subtitle.text()).to.include(this.licenseId)
          expect($subtitle.text()).to.include(this.licenseName)
        })
      })

      it('Should edit a Pre-Release - Privileged license', { tags: '@regression' }, function () {
        common.getTableRowByString(this.licenseName, this.SELECTOR_LICENSE_LIST).within(() => {
          common.clickView()
        })
        common.clickEdit()
        this.newLicenseName = `Updated ${this.baseTitle} ${Date.now()}`

        licensesPage.inputDescription(this.newLicenseName, `Updated ${this.baseTitle} Description`, 'tag2 ')
        licensesPage.inputOfflineTtl()
        cy.intercept('GET', '**/licenses/**').as('waitForEdit')
        common.clickButtonByName('Edit')

        cy.wait('@waitForEdit').then((res) => {
          if (res.response.statusCode == 200) {
            this.licenseName = this.newLicenseName
          }
          expect(res.response.statusCode).to.equal(200)
        })
        common.navigateBreadcrumbByString('Licenses')
        common.assertRowExist(this.newLicenseName, this.SELECTOR_LICENSE_LIST)
      })

      it('Should clone a Pre-Release - Privileged license', { tags: '@regression' }, function () {
        common.getTableRowByString(this.licenseName, this.SELECTOR_LICENSE_LIST).within(() => {
          common.clickView()
        })
        common.waitForLoaderToDisappear()
        common.clickOverflow()
        common.clickDropdownItem('Clone License')

        this.clonedLicenseName = `Cloned ${this.baseTitle} ${Date.now()}`
        licensesPage.inputDescription(this.clonedLicenseName, `Cloned ${this.baseTitle} Description`, 'tag3 ')
        licensesPage.inputOfflineTtl()

        cy.intercept('POST', 'api/licenses', (req) => {
          req.on('after:response', (res) => {
            this.clonedLicenseId = res.body.data.id
          })
        }).as('waitForClone')
        common.clickButtonByName('Clone')

        cy.wait('@waitForClone').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })
        common.navigateBreadcrumbByString('Licenses')
        common.assertRowExist(this.clonedLicenseName, this.SELECTOR_LICENSE_LIST)

        // Clean up cloned license
        cy.waitUntil(() => this.clonedLicenseId).then(() => {
          cy.deleteLicense(this.clonedLicenseId)
        })
      })

      it('Should view Pre-Release - Privileged license history', { tags: '@regression' }, function () {
        common.getTableRowByString(this.licenseName, this.SELECTOR_LICENSE_LIST).within(() => {
          cy.intercept('GET', '**/history').as('waitForHistory')
          common.clickView()
        })

        cy.wait('@waitForHistory').then((res) => {
          expect(res.response.statusCode).to.equal(200)
        })

        common.getRowLength().then((length) => {
          expect(length).to.be.greaterThan(0)
        })
      })

      it('Should view granted licenses - Privileged license history', { tags: ['@regression', '@wip'] }, function () {
        common.getTableRowByString(this.licenseName, this.SELECTOR_LICENSE_LIST).within((row) => {
          cy.intercept('GET', `api/granted-licenses?licenseId=${this.licenseId}`).as('waitForGrantedLicenses')
          common.clickList(row)
        })

        cy.wait('@waitForGrantedLicenses').then((res) => {
          expect(res.response.statusCode).to.equal(200)
        })

        common.waitForModal().within(() => {
          common.getRowLength().then((length) => {
            expect(length).to.be.greaterThan(0)
          })

          common.assertRowExist(this.grantedLicenseId)

          common.clickButtonByName('Close')
        })
      })

      it('Should delete a Pre-Release - Privileged license', { tags: '@regression' }, function () {
        common.getTableRowByString(this.licenseName, this.SELECTOR_LICENSE_LIST).within(() => {
          common.clickTrash()
        })

        cy.intercept('DELETE', '**/licenses/**').as('waitForDelete')

        common.waitForModal().within(() => {
          common.clickButtonByName('Delete')
        })

        cy.wait('@waitForDelete').then((res) => {
          if (res.response.statusCode == 204) {
            this.deleteSuccess = true
          }

          expect(res.response.statusCode).to.equal(204)
        })
        common.navigateBreadcrumbByString('Licenses')
        common.assertRowNotExist(this.licenseName, this.SELECTOR_LICENSE_LIST)
      })

      after('Clean up', function () {
        if (!this.deleteSuccess) {
          cy.deleteLicense(this.licenseId)
        }
      })
    })

    describe('T2GP Regression Tests', { tags: '@regression' }, function () {
      before('Setup T2GP license for test', function () {
        this.licenseName = `${this.baseTitle} ${Date.now()}`
        this.deleteSuccess = false

        cy.createLicense(this.licenseName, steamAppId, 30, 24, 1).then((id) => {
          this.licenseId = id
          cy.grantLicense(id, this.accountId).then((id) => {
            this.grantedLicenseId = id
          })
        })
      })

      beforeEach(function () {
        cy.visitBaseUrl()

        // Navigate sidebar and select product
        cy.intercept('**/products').as('waitForProducts')
        licensesPage.navigateToLicenses()
        cy.wait('@waitForProducts')

        // Wait for licenses
        cy.intercept('**/licenses/**').as('waitForLicenses')
        common.selectProduct()
        cy.wait('@waitForLicenses')
        common.waitForLoaderToDisappear()
      })

      it('Should create a T2GP license', { tags: '@regression' }, function () {
        this.createdLicenseName = `${this.baseTitle} ${Date.now()}`

        common.clickButtonByName('New License')

        licensesPage.inputDescription(
          this.createdLicenseName,
          `${this.baseTitle} Description`,
          'tag1 tag2 ',
          'T2GP-Release'
        )
        licensesPage.inputReferenceId(steamAppId)
        licensesPage.inputOfflineTtl()
        licensesPage.inputMaxDeviceRegistration()
        licensesPage.inputPayloadChiperKey(steamAppId)

        // Intercept response to get licenseId
        cy.intercept('POST', 'api/licenses', (req) => {
          req.on('after:response', (res) => {
            this.createdLicenseId = res.body.data.id
          })
        })
          .as('waitForCreate')
          .then(() => {
            common.clickButtonByName('Create')
          })
        cy.wait(3000)
        cy.wait('@waitForCreate').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })
        common.navigateBreadcrumbByString('Licenses')
        common.assertRowExist(this.createdLicenseName, this.SELECTOR_LICENSE_LIST)
        // Clean up created license
        cy.waitUntil(() => this.createdLicenseId).then(() => {
          cy.deleteLicense(this.createdLicenseId)
        })
      })

      it('Should view a T2GP license', { tags: '@regression' }, function () {
        common.getTableRowByString(this.licenseName, this.SELECTOR_LICENSE_LIST).within(() => {
          common.clickView()
        })

        common.getPageTitle().within(($subtitle) => {
          expect($subtitle.text()).to.include(this.licenseId)
          expect($subtitle.text()).to.include(this.licenseName)
        })
      })

      it('Should edit a T2GP license', { tags: '@regression' }, function () {
        common.getTableRowByString(this.licenseName, this.SELECTOR_LICENSE_LIST).within(() => {
          common.clickView()
        })
        common.clickEdit()

        this.newLicenseName = `Updated ${this.baseTitle} ${Date.now()}`

        licensesPage.inputDescription(this.newLicenseName, `Updated ${this.baseTitle} Description`, 'tag2 ')
        licensesPage.inputOfflineTtl()
        licensesPage.inputMaxDeviceRegistration()

        cy.intercept('GET', '**/licenses/**').as('waitForEdit')
        common.clickButtonByName('Edit')

        cy.wait('@waitForEdit').then((res) => {
          if (res.response.statusCode == 200) {
            this.licenseName = this.newLicenseName
          }
          expect(res.response.statusCode).to.equal(200)
        })
        common.navigateBreadcrumbByString('Licenses')
        common.assertRowExist(this.newLicenseName, this.SELECTOR_LICENSE_LIST)
      })

      it('Should clone a T2GP license', { tags: '@regression' }, function () {
        common.getTableRowByString(this.licenseName, this.SELECTOR_LICENSE_LIST).within(() => {
          common.clickView()
        })
        common.waitForLoaderToDisappear()
        common.clickOverflow()
        common.clickDropdownItem('Clone License')

        this.clonedLicenseName = `Cloned ${this.baseTitle} ${Date.now()}`

        licensesPage.inputDescription(this.clonedLicenseName, `Cloned ${this.baseTitle} Description`, 'tag3 ')
        licensesPage.inputOfflineTtl()
        licensesPage.inputMaxDeviceRegistration()

        cy.intercept('POST', 'api/licenses', (req) => {
          req.on('after:response', (res) => {
            this.clonedLicenseId = res.body.data.id
          })
        }).as('waitForClone')
        common.clickButtonByName('Clone')

        cy.wait('@waitForClone').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })

        common.navigateBreadcrumbByString('Licenses')
        common.assertRowExist(this.clonedLicenseName, this.SELECTOR_LICENSE_LIST)
        // Clean up cloned license
        cy.waitUntil(() => this.clonedLicenseId).then(() => {
          cy.deleteLicense(this.clonedLicenseId)
        })
      })

      it('Should view T2GP license history', { tags: '@regression' }, function () {
        common.getTableRowByString(this.licenseName, this.SELECTOR_LICENSE_LIST).within(() => {
          cy.intercept('GET', '**/history').as('waitForHistory')
          common.clickView()
        })

        cy.wait('@waitForHistory').then((res) => {
          expect(res.response.statusCode).to.equal(200)
        })

        common.getRowLength().then((length) => {
          expect(length).to.be.greaterThan(0)
        })
      })

      it('Should view granted licenses - T2GP license', { tags: ['@regression', '@wip'] }, function () {
        common.getTableRowByString(this.licenseName, this.SELECTOR_LICENSE_LIST).within((row) => {
          cy.intercept('GET', `api/granted-licenses?licenseId=${this.licenseId}`).as('waitForGrantedLicenses')
          common.clickList(row)
        })

        cy.wait('@waitForGrantedLicenses').then((res) => {
          expect(res.response.statusCode).to.equal(200)
        })

        common.waitForModal().within(() => {
          common.getRowLength().then((length) => {
            expect(length).to.be.greaterThan(0)
          })

          common.assertRowExist(this.grantedLicenseId)

          common.clickButtonByName('Close')
        })
      })

      it('Should delete a T2GP license', { tags: '@regression' }, function () {
        common.getTableRowByString(this.licenseName, this.SELECTOR_LICENSE_LIST).within(() => {
          common.clickTrash()
        })

        cy.intercept('DELETE', '**/licenses/**').as('waitForDelete')

        common.waitForModal().within(() => {
          common.clickButtonByName('Delete')
        })

        cy.wait('@waitForDelete').then((res) => {
          if (res.response.statusCode == 204) {
            this.deleteSuccess = true
          }
          expect(res.response.statusCode).to.equal(204)
        })

        common.navigateBreadcrumbByString('Licenses')
        common.assertRowNotExist(this.licenseName, this.SELECTOR_LICENSE_LIST)
      })

      after('Clean up', function () {
        if (!this.deleteSuccess) {
          cy.deleteLicense(this.licenseId)
        }
      })
    })

    describe('License Default Value Regression Tests', { tags: '@regression' }, function () {
      beforeEach(function () {
        cy.visitBaseUrl()

        // Navigate sidebar and select product
        cy.intercept('**/products').as('waitForProducts')
        licensesPage.navigateToLicenses()
        cy.wait('@waitForProducts')

        // Wait for licenses
        cy.intercept('**/licenses/**').as('waitForLicenses')
        common.selectProduct()
        cy.wait('@waitForLicenses')
        common.waitForLoaderToDisappear()
      })

      it('Should create a Vortex License with default values', { tags: '@regression' }, function () {
        this.createdLicenseName = `${this.baseTitle} ${Date.now()}`

        common.clickButtonByName('New License')

        licensesPage.inputDescription(this.createdLicenseName, null, null, 'Vortex')
        licensesPage.inputReferenceId('-')

        // Intercept response to get licensesId
        cy.intercept('POST', 'api/licenses/', (req) => {
          req.on('after:response', (res) => {
            this.createdLicenseId = res.body.data.id
          })
        }).as('waitForCreate')
        common.clickButtonByName('Create')

        cy.wait('@waitForCreate').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })

        common.navigateBreadcrumbByString('Licenses')
        common.assertRowExist(this.createdLicenseName, this.SELECTOR_LICENSE_LIST)

        // Clean up created license
        cy.waitUntil(() => this.createdLicenseId).then(() => {
          cy.deleteLicense(this.createdLicenseId)
        })
      })

      it(
        'Should create a Pre-Release - Non Privileged License with default values',
        { tags: '@regression' },
        function () {
          this.createdLicenseName = `${this.baseTitle} ${Date.now()}`

          common.clickButtonByName('New License')

          licensesPage.inputDescription(
            this.createdLicenseName,
            `${this.baseTitle} Description`,
            'tag1 tag2 ',
            'Pre-Release - Non Privileged'
          )
          licensesPage.selectReferenceId('Test App Cypress 1 (Steam)')

          // Intercept response to get licensesId
          cy.intercept('POST', 'api/licenses/', (req) => {
            req.on('after:response', (res) => {
              this.createdLicenseId = res.body.data.id
            })
          }).as('waitForCreate')
          common.clickButtonByName('Create')

          cy.wait('@waitForCreate').then((res) => {
            expect(res.response.statusCode).to.equal(201)
          })

          common.navigateBreadcrumbByString('Licenses')
          common.assertRowExist(this.createdLicenseName, this.SELECTOR_LICENSE_LIST)

          // Clean up created license
          cy.waitUntil(() => this.createdLicenseId).then(() => {
            cy.deleteLicense(this.createdLicenseId)
          })
        }
      )

      it('Should create a Pre-Release - Privileged License with default values', { tags: '@regression' }, function () {
        this.createdLicenseName = `${this.baseTitle} ${Date.now()}`

        common.clickButtonByName('New License')

        licensesPage.inputDescription(this.createdLicenseName, null, null, 'Pre-Release - Privileged')
        licensesPage.selectReferenceId('Test App Cypress 1 (Steam)')

        // Intercept response to get licensesId
        cy.intercept('POST', 'api/licenses/', (req) => {
          req.on('after:response', (res) => {
            this.createdLicenseId = res.body.data.id
          })
        }).as('waitForCreate')
        common.clickButtonByName('Create')

        cy.wait('@waitForCreate').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })

        common.navigateBreadcrumbByString('Licenses')
        common.assertRowExist(this.createdLicenseName, this.SELECTOR_LICENSE_LIST)

        // Clean up created license
        cy.waitUntil(() => this.createdLicenseId).then(() => {
          cy.deleteLicense(this.createdLicenseId)
        })
      })

      it('Should create a T2GP License with default values', { tags: '@regression' }, function () {
        this.createdLicenseName = `${this.baseTitle} ${Date.now()}`

        common.clickButtonByName('New License')

        licensesPage.inputDescription(this.createdLicenseName, null, null, 'T2GP-Release')
        licensesPage.inputReferenceId(steamAppId)
        licensesPage.inputPayloadChiperKey('payloadChiperKeyDiscription')

        // Intercept response to get licensesId
        cy.intercept('POST', 'api/licenses/', (req) => {
          req.on('after:response', (res) => {
            this.createdLicenseId = res.body.data.id
          })
        }).as('waitForCreate')
        common.clickButtonByName('Create')

        cy.wait('@waitForCreate').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })

        common.navigateBreadcrumbByString('Licenses')
        common.assertRowExist(this.createdLicenseName, this.SELECTOR_LICENSE_LIST)
        // Clean up created license
        cy.waitUntil(() => this.createdLicenseId).then(() => {
          cy.deleteLicense(this.createdLicenseId)
        })
      })
    })
  })
})

after('Clean up account', function () {
  cy.deleteAccount(this.accountId)
})
