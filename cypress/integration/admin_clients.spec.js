/* eslint-disable no-undef */
import { Common } from '../page-objects/common-page-objects'
import { Products } from '../page-objects/clients-product-page-objects'
import { AppGroups } from '../page-objects/clients-app-group-page-objects'
import { Apps } from '../page-objects/clients-app-page-objects'

const common = new Common()
const productPage = new Products()
const appGroupPage = new AppGroups()
const appPage = new Apps()
const productId = Cypress.env('productId')
let appGroupName = `Test App Group Cypress ${Date.now()}`
let productDeleteStatus = false

before('Login', function () {
  cy.cleanUpAppGroupsAndApps()
  cy.cleanUpAppsBasedOnPartialAppName()
  cy.doAuth()
})

describe('Internal Admin - Clients', function () {
  describe('Smoke Tests', { tags: '@smoke' }, function () {
    before('Setup', function () {
      this.productName = 'Test Product Cypress 1'
      this.appName = `Test App Cypress ${Date.now()}`

      cy.createAppGroup(appGroupName).then((id) => {
        this.appGroupId = id
        cy.createApp(this.appName, id).then((id) => {
          this.appId = id
        })
      })
    })

    describe('Product Smoke Tests', { tags: '@smoke' }, function () {
      before(function () {
        this.SELECTOR_TAB = productPage.productListSelector
      })

      beforeEach(function () {
        cy.visitBaseUrl()

        cy.intercept('**/products').as('waitForProducts')
        common.navigateSidebarMenu('Clients')
        cy.wait('@waitForProducts')
        // common.inputFilter(this.productName, 1);
        common.enterTextToParticularPlaceHolderName('Product Name', this.productName)
        cy.wait(2000)
      })

      it('Should display a list of products', { tags: '@smoke' }, function () {
        common.getRowLength(this.SELECTOR_TAB).then((length) => {
          expect(length).to.be.greaterThan(0)
        })
      })

      it('Should view a product', { tags: '@smoke' }, function () {
        common.enterTextToParticularPlaceHolderName('Product ID', productId)
        cy.wait(2000)
        common.getTableRowByString(this.productName, this.SELECTOR_TAB).within((row) => {
          common.clickView(row)
        })

        common.waitForModal().within(() => {
          common.getModalSubtitle().then(($subtitle) => {
            expect($subtitle.text()).to.include(productId)
            expect($subtitle.text()).to.include(this.productName)
          })

          common.inputVerticalTwoWayFilter('Test App Group Cypress 1', 1)
          productPage.getAppGroupList().invoke('text').should('include', 'Test App Group Cypress 1')

          common.clickButtonByName('Close')
        })
      })

      //Clone product creating permission record in permission section.
      it.skip('Should clone a product', { tags: ['@smoke', '@wip'] }, function () {
        common.getTableRowByExactString(this.productName, this.SELECTOR_TAB).within((row) => {
          common.clickClone(row)
        })

        this.clonedProductName = `${this.productName} Cloned ${Date.now()}`
        common.waitForModal().within(() => {
          common.getReferenceRow().then((text) => {
            expect(text).to.include(productId)
            expect(text).to.include(this.productName)
          })

          productPage.inputName(this.clonedProductName)

          cy.intercept('POST', 'api2/products', (req) => {
            req.on('after:response', (res) => {
              this.clonedProductId = res.body.data.id
            })
          }).as('waitForSave')
          common.clickButtonByName('Save')
        })

        cy.wait('@waitForSave').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })
        common.waitForLoaderToDisappear(30000)
        common.assertRowExist(this.clonedProductName, this.SELECTOR_TAB)

        // Clean up cloned product
        cy.waitUntil(() => this.clonedProductId).then(() => {
          cy.deleteProduct(this.clonedProductId)
          productDeleteStatus = true
        })
      })

      it('Should view product history', { tags: '@smoke' }, function () {
        common.getTableRowByString(this.productName, this.SELECTOR_TAB).within((row) => {
          cy.intercept(`**/history`).as('waitForHistory')
          common.clickHistory(row)
        })

        cy.wait('@waitForHistory').then((res) => {
          expect(res.response.statusCode).to.equal(200)
        })
        common.waitForLoaderToDisappear(300000)
        common.waitForModal().within(() => {
          common.getRowLength().then((length) => {
            expect(length).to.be.greaterThan(0)
          })

          common.clickButtonByName('Close')
        })
      })

      //Clone product creating permission record in permission section.
      // after("Clean up", function(){
      //   if(!productDeleteStatus){
      //     cy.waitUntil(() => this.clonedProductId).then(() => {
      //     cy.deleteProduct(this.clonedProductId)
      //     })
      //   }
      //   });
    })

    describe('App Group Smoke Tests', { tags: '@smoke' }, function () {
      before('Setup', function () {
        this.SELECTOR_TAB = appGroupPage.appGroupListSelector
        this.newAppName = `Test App Cypress ${Date.now()}`

        // cy.createApp(this.newAppName).then((id) => {
        //   this.newAppId = id;
        // });
      })

      beforeEach(function () {
        cy.visitBaseUrl()
        cy.intercept('**/products').as('waitForProducts')
        common.navigateSidebarMenu('Clients')
        common.navigateToTab('Application Groups')
        cy.wait('@waitForProducts')
        common.selectProduct()
      })

      it('Should create an app group', { tags: '@smoke' }, function () {
        this.createdAppGroupName = `Test App Group Cypress ${Date.now()}`

        common.clickButtonByName('Create Application Group')
        common.waitForModal().within(() => {
          common.getActiveTab().within(() => {
            appGroupPage.inputName(this.createdAppGroupName)
          })

          //cannot add application beacuse while creating appliaction we need to add application group for application then it will show under this
          // common.navigateToTab("Add Applications");
          // common.getActiveTab().within(() => {
          //   common.inputVerticalTwoWayFilter(this.newAppId);
          //   common.selectRowFromList();
          // });

          common.navigateToTab('Add Service Endpoints')
          common.getActiveTab().within(() => {
            common.inputVerticalTwoWayFilter('sso', 1)
            common.selectRowFromList()
          })

          // Intercept response to get appGroupId
          cy.intercept('POST', 'api/app-groups', (req) => {
            req.on('after:response', (res) => {
              this.createdAppGroupId = res.body.data.id
            })
          }).as('waitForSave')
          common.clickButtonByName('Save')
        })

        cy.wait('@waitForSave').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })
        common.waitForLoaderToDisappear(30000)
        common.assertRowExist(this.createdAppGroupName, this.SELECTOR_TAB)
        //Wait is required here to successfully perform delete action.
        cy.wait(2000)
        // Clean up created app group
        cy.waitUntil(() => this.createdAppGroupId).then(() => {
          cy.deleteAppGroup(this.createdAppGroupId)
        })
      })

      it('Should display a list of app groups', { tags: '@smoke' }, function () {
        common.getRowLength(this.SELECTOR_TAB).then((length) => {
          expect(length).to.be.greaterThan(0)
        })
      })

      it('Should view an app group', { tags: '@smoke' }, function () {
        common.getTableRowByString(appGroupName, this.SELECTOR_TAB).within((row) => {
          common.clickView(row)
        })
        common.waitForModal().within(() => {
          common.getModalSubtitle().then(($subtitle) => {
            expect($subtitle.text()).to.include(this.appGroupId)
            expect($subtitle.text()).to.include(appGroupName)
          })

          common.clickButtonByName('Close')
        })
      })

      it('Should edit an app group', { tags: '@smoke' }, function () {
        common.getTableRowByString(appGroupName, this.SELECTOR_TAB).within((row) => {
          common.clickEdit(row)
        })

        this.newAppGroupName = `Test App Group Cypress Updated ${Date.now()}`
        common.waitForModal().within(() => {
          common.getActiveTab().within(() => {
            appGroupPage.inputName(this.newAppGroupName)
          })

          //cannot add application beacuse while creating appliaction we need to add application group for application then it will show under this
          // common.navigateToTab("Add Applications");
          // common.getActiveTab().within(() => {
          //   common.deselectRowFromList();
          // });

          common.navigateToTab('Add Service Endpoints')
          common.getActiveTab().within(() => {
            common.inputVerticalTwoWayFilter('sso', 1)
            common.selectRowFromList()
          })

          cy.intercept('PUT', 'api/app-groups/*').as('waitForSave')
          common.clickButtonByName('Save')
        })

        cy.wait('@waitForSave').then((res) => {
          if (res.response.statusCode == 204) {
            appGroupName = this.newAppGroupName
          }
          expect(res.response.statusCode).to.equal(204)
        })
        //need this wait to reflect edited change
        cy.wait(10000)
        common.waitForLoaderToDisappear(30000)
        common.assertRowExist(this.newAppGroupName, this.SELECTOR_TAB)
      })

      it('Should clone an app group', { tags: '@smoke' }, function () {
        this.clonedAppGroupName = `Test App Group Cypress Cloned ${Date.now()}`

        common.getTableRowByString(appGroupName, this.SELECTOR_TAB).within((row) => {
          common.clickClone(row)
        })
        common.waitForModal().within(() => {
          appGroupPage.inputName(this.clonedAppGroupName)

          cy.intercept('POST', 'api/app-groups', (req) => {
            req.on('after:response', (res) => {
              this.clonedAppGroupId = res.body.data.id
            })
          }).as('waitForSave')
          common.clickButtonByName('Save')
        })

        cy.wait('@waitForSave').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })

        common.getActiveTab().within(() => {
          common.inputFilter(this.clonedAppGroupName, 3)
        })
        common.waitForLoaderToDisappear(30000)
        common.assertRowExist(this.clonedAppGroupName, this.SELECTOR_TAB)

        // Clean up cloned app group
        cy.waitUntil(() => this.clonedAppGroupId).then(() => {
          cy.deleteAppGroup(this.clonedAppGroupId)
        })
      })

      it('Should view app group history', { tags: '@smoke' }, function () {
        common.getTableRowByString(appGroupName, this.SELECTOR_TAB).within((row) => {
          cy.intercept(`**/history`).as('waitForHistory')
          common.clickHistory(row)
        })
        cy.wait(1000)
        cy.wait('@waitForHistory').then((res) => {
          expect(res.response.statusCode).to.equal(200)
        })
        common.waitForModal().within(() => {
          appGroupPage.waitForLoaderToDisappear(30000)
          common.getRowLength().then((length) => {
            expect(length).to.be.greaterThan(0)
          })

          common.clickButtonByName('Close')
        })
      })

      // after("Clean up", function(){
      //   cy.deleteApp(this.newAppId);
      // });
    })

    describe('App Smoke Tests', { tags: '@smoke' }, function () {
      beforeEach(function () {
        cy.visitBaseUrl()

        // Navigate sidebar and select product
        cy.intercept('**/products').as('waitForProducts')
        common.navigateSidebarMenu('Clients')
        cy.wait('@waitForProducts')
        common.navigateToTab('Applications')
        //common.waitForLoaderToDisappear();
        common.selectAppGroup(appGroupName)
        common.waitForLoaderToDisappear(30000)
      })

      it('Should create an app', { tags: '@smoke' }, function () {
        this.createdAppName = `Test App Cypress ${Date.now()}`

        common.getActiveTab().within(() => {
          common.clickButtonByName('Create Application')
        })
        common.waitForModal().within(() => {
          // Basic Fields tab
          common.getActiveTab().within(() => {
            appPage.inputName(this.createdAppName)
            appPage.inputAccessTokenLifetime(1000)
            appPage.inputRefreshTokenLifetime(2000)
            appPage.selectJWTAlgorithm('RS256')
            appPage.selectApplicationType('Base Game')
            appPage.selectDeviceType('Windows 7')
            appPage.toggleLoginFlows(0)
            appPage.toggleLoginFlows(1)
            appPage.toggleLoginFlows(2)
            appPage.toggleLoginFlows(3)
          })

          // Auth Providers tab
          common.navigateToTab('Auth Providers')
          common.getActiveTab().within(() => {
            appPage.getAuthFormByIndex(0).within(() => {
              appPage.selectAuthProvider('Web')
            })
          })

          // Additional Fields tab
          common.navigateToTab('Additional Fields')
          common.getActiveTab().within(() => {
            appPage.inputJWTServiceVersion('2.0.0')
            appPage.selectIssuePlayFabTicket('False')
          })

          // Application ACLs tab
          common.navigateToTab('Application ACLs')
          common.getActiveTab().within(() => {
            common.inputVerticalTwoWayFilter('aclAuthServer')
            common.selectRowFromList()
            common.selectRowFromList()
          })

          // Privileged ACLs tab
          common.navigateToTab('Privileged ACLs')
          common.getActiveTab().within(() => {
            common.inputVerticalTwoWayFilter('aclAuthServer')
            common.selectRowFromList()
            common.selectRowFromList()
          })

          // Redirect Domains tab
          common.navigateToTab('Redirect Domains')
          common.getActiveTab().within(() => {
            appPage.inputRedirectDomaint('2k.com')
          })

          // Translations tab
          common.navigateToTab('Translations')
          common.getActiveTab().within(() => {
            appPage.selectTranslation('en-US')
            appPage.inputTranslationTitle(this.createdAppName)
          })

          // Intercept response to get appId
          cy.intercept('POST', 'api/apps', (req) => {
            req.on('after:response', (res) => {
              this.createdAppId = res.body.data.id
            })
          }).as('waitForSave')
          common.clickButtonByName('Save')
        })

        cy.wait('@waitForSave').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })
        common.waitForLoaderToDisappear(30000)
        common.assertRowExist(this.createdAppName, this.SELECTOR_TAB)

        // Clean up created app
        cy.waitUntil(() => this.createdAppId).then(() => {
          cy.deleteApp(this.createdAppId)
        })
      })

      it('Should display a list of apps', { tags: '@smoke' }, function () {
        common.getRowLength().then((length) => {
          expect(length).to.be.greaterThan(0)
        })
      })

      it('Should view an app', { tags: '@smoke' }, function () {
        common.getTableRowByString(this.appName, this.SELECTOR_TAB).within((row) => {
          common.clickView(row)
        })
        common.waitForModal().within(() => {
          common.getModalSubtitle().then(($subtitle) => {
            expect($subtitle.text()).to.include(this.appId)
            expect($subtitle.text()).to.include(this.appName)
          })

          common.clickButtonByName('Close')
        })
      })

      it('Should edit an app', { tags: '@smoke' }, function () {
        common.getTableRowByString(this.appName, this.SELECTOR_TAB).within((row) => {
          common.clickEdit(row)
        })

        this.newAppName = `Test App Cypress Updated ${Date.now()}`
        common.waitForModal().within(() => {
          // Basic Fields tab
          common.getActiveTab().within(() => {
            appPage.inputName(this.newAppName)
            appPage.inputAccessTokenLifetime(1000)
            appPage.inputRefreshTokenLifetime(2000)
            appPage.selectJWTAlgorithm('RS256')
            appPage.selectApplicationType('Base Game')
            appPage.selectDeviceType('Windows 7')
            appPage.toggleLoginFlows(0)
            appPage.toggleLoginFlows(1)
            appPage.toggleLoginFlows(2)
            appPage.toggleLoginFlows(3)
          })

          // Auth Providers tab
          common.navigateToTab('Auth Providers')
          common.getActiveTab().within(() => {
            appPage.getAuthFormByIndex(0).within(() => {
              appPage.selectAuthProvider('Steam')
            })

            appPage.getAuthFormByIndex(1).within(() => {
              appPage.selectAuthProvider('Web')
              appPage.selectFirstPartyValidation()
              common.clickPlus()
            })
          })

          // Additional Fields tab
          common.navigateToTab('Additional Fields')
          common.getActiveTab().within(() => {
            appPage.inputJWTServiceVersion('2.0.0')
            appPage.selectIssuePlayFabTicket('True')
          })

          // Application ACLs tab
          common.navigateToTab('Application ACLs')
          common.getActiveTab().within(() => {
            common.deselectRowFromList()
            common.inputVerticalTwoWayFilter('aclAuthServer')
            common.selectRowFromList()
          })

          // Privileged ACLs tab
          common.navigateToTab('Privileged ACLs')
          common.getActiveTab().within(() => {
            common.deselectRowFromList()
            common.inputVerticalTwoWayFilter('aclAuthServer')
            common.selectRowFromList()
          })

          // Redirect Domains tab
          common.navigateToTab('Redirect Domains')
          common.getActiveTab().within(() => {
            appPage.inputRedirectDomaint('2k.com')
          })

          // Translations tab
          common.navigateToTab('Translations')
          common.getActiveTab().within(() => {
            appPage.selectTranslation('it-IT')
            common.getActiveTab().within(() => {
              appPage.inputTranslationTitle(this.appName)
            })
          })

          cy.intercept('PUT', 'api/apps/*').as('waitForSave')
          common.clickButtonByName('Save')
        })

        cy.wait('@waitForSave').then((res) => {
          if (res.response.statusCode == 204) {
            this.appName = this.newAppName
          }
          expect(res.response.statusCode).to.equal(204)
        })
        common.waitForLoaderToDisappear(30000)
        common.assertRowExist(this.newAppName, this.SELECTOR_TAB)
      })

      it('Should clone an app', { tags: '@smoke' }, function () {
        common.getTableRowByString(this.appName, this.SELECTOR_TAB).within((row) => {
          common.clickClone(row)
        })

        this.clonedAppName = `Test App Cypress Cloned ${Date.now()}`
        common.waitForModal().within(() => {
          // Basic Fields tab
          common.getActiveTab().within(() => {
            appPage.inputName(this.clonedAppName)
            appPage.inputAccessTokenLifetime(36000)
            appPage.inputRefreshTokenLifetime(72000)
            appPage.selectJWTAlgorithm('HS256')
            appPage.selectApplicationType('Website')
            appPage.selectDeviceType('Web')
            appPage.toggleLoginFlows(0)
            appPage.toggleLoginFlows(1)
            appPage.toggleLoginFlows(2)
            appPage.toggleLoginFlows(3)
          })

          // Auth Providers tab
          common.navigateToTab('Auth Providers')
          common.getActiveTab().within(() => {
            appPage.getAuthFormByIndex(0).within(() => {
              appPage.selectAuthProvider('Xbox Live')
            })
          })

          // Additional Fields tab
          common.navigateToTab('Additional Fields')
          common.getActiveTab().within(() => {
            appPage.inputJWTServiceVersion('1.0.0')
          })

          // Application ACLs tab
          common.navigateToTab('Application ACLs')
          common.getActiveTab().within(() => {
            common.inputVerticalTwoWayFilter('aclAuthServer')
            common.selectRowFromList()
          })

          // Privileged ACLs tab
          common.navigateToTab('Privileged ACLs')
          common.getActiveTab().within(() => {
            common.inputVerticalTwoWayFilter('aclAuthServer')
            //common.selectRowFromList();
            cy.get('.vertical-two-way-selector-list:eq(0) .fa-plus-circle:eq(1)').click()
          })

          // Redirect Domains tab
          common.navigateToTab('Redirect Domains')
          common.getActiveTab().within(() => {
            appPage.inputRedirectDomaint('google.com')
          })

          // Translations tab
          common.navigateToTab('Translations')
          common.getActiveTab().within(() => {
            common.clickButtonByName('Remove')
            appPage.selectTranslation('fr-FR')
            common.getActiveTab().within(() => {
              appPage.inputTranslationTitle(this.clonedAppName)
            })
          })

          cy.intercept('POST', 'api/apps', (req) => {
            req.on('after:response', (res) => {
              this.clonedAppId = res.body.data.id
            })
          }).as('waitForSave')
          common.clickButtonByName('Save')
        })

        cy.wait('@waitForSave').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })
        common.waitForLoaderToDisappear(30000)
        common.assertRowExist(this.clonedAppName, this.SELECTOR_TAB)

        // Clean up cloned app
        cy.waitUntil(() => this.clonedAppId).then(() => {
          cy.deleteApp(this.clonedAppId)
        })
      })

      it('Should view app history', { tags: '@smoke' }, function () {
        common.getTableRowByString(this.appName, this.SELECTOR_TAB).within((row) => {
          cy.intercept(`**/history`).as('waitForHistory')
          common.clickHistory(row)
        })

        cy.wait('@waitForHistory').then((res) => {
          expect(res.response.statusCode).to.equal(200)
        })
        common.waitForModal().within(() => {
          appGroupPage.waitForLoaderToDisappear()
          common.getRowLength().then((length) => {
            expect(length).to.be.greaterThan(0)
          })

          common.clickButtonByName('Close')
        })
      })
    })

    after('Clean up', function () {
      cy.deleteAppGroup(this.appGroupId)
      cy.deleteApp(this.appId)
    })
  })

  describe('Regression Tests', { tags: '@regression' }, function () {
    before('Setup', function () {
      cy.getConfiguration('deviceType').then((value) => {
        this.deviceTypes = value
      })

      this.SELECTOR_TAB = '.tab-pane.active'
      this.appGroupName = `Test App Group Cypress ${Date.now()}`

      cy.createAppGroup(this.appGroupName).then((id) => {
        this.appGroupId = id
      })
    })

    beforeEach(function () {
      cy.wait(2000)
      cy.visitBaseUrl()

      // Navigate sidebar and select product
      cy.intercept('**/products').as('waitForProducts')
      common.navigateSidebarMenu('Clients')
      cy.wait('@waitForProducts')
      common.navigateToTab('Applications')
      //common.waitForLoaderToDisappear();
      common.selectAppGroup(this.appGroupName)
      common.waitForLoaderToDisappear(30000)
    })

    it('Should have deviceType options matching the Technodrome configuration', { tags: '@regression' }, function () {
      this.index = 0

      common.getActiveTab().within(() => {
        common.clickButtonByName('Create Application')
      })

      common.waitForModal().within(() => {
        common.getActiveTab().within(() => {
          appPage.getDeviceTypeOptions().each((type) => {
            expect(this.deviceTypes[this.index].label).to.include(type.text().replace(/\n|\r/g, '').trim())
            this.index++
          })
        })
      })
    })

    it(
      'Should convert the First Party Id to a decimal value when creating Xbox app',
      { tags: '@regression' },
      function () {
        this.createdAppName = `Test App Cypress ${Date.now()}`

        common.getActiveTab().within(() => {
          common.clickButtonByName('Create Application')
        })
        common.waitForModal().within(() => {
          // Basic Fields tab
          common.getActiveTab().within(() => {
            appPage.inputName(this.createdAppName)
            appPage.selectApplicationType('Base Game')
            appPage.selectDeviceType('Windows 7')
          })

          // Auth Providers tab
          common.navigateToTab('Auth Providers')
          common.getActiveTab().within(() => {
            appPage.getAuthFormByIndex(0).within(() => {
              appPage.selectAuthProvider('Xbox Live')
              appPage.inputFirstPartyID('0123456789')
            })
          })

          // Intercept response to get appId
          cy.intercept('POST', 'api/apps', (req) => {
            req.on('after:response', (res) => {
              this.createdAppId = res.body.data.id
            })
          }).as('waitForSave')
          common.clickButtonByName('Save')
        })

        cy.wait('@waitForSave').then((res) => {
          expect(res.response.statusCode).to.equal(201)
          // Assert that firstPartyId has been converted from hexadecimal to decimal value: 0123456789 -> 4886718345
          expect(res.response.body.data.attributes.onlineAuthTypes[1].firstPartyId).to.equal(4886718345)
        })

        common.waitForLoaderToDisappear(30000)
        common.assertRowExist(this.createdAppName, this.SELECTOR_TAB)

        // Clean up created app
        cy.waitUntil(() => this.createdAppId).then(() => {
          cy.deleteApp(this.createdAppId)
        })
      }
    )

    it('Should be able to add Nintendo credentials', { tags: '@regression' }, function () {
      this.createdAppName = `Test App Cypress ${Date.now()}`
      this.clientId = common.newUUID()
      this.clientSecret = common.newUUID()

      common.getActiveTab().within(() => {
        common.clickButtonByName('Create Application')
      })
      common.waitForModal().within(() => {
        // Basic Fields tab
        common.getActiveTab().within(() => {
          appPage.inputName(this.createdAppName)
          appPage.selectApplicationType('Base Game')
          appPage.selectDeviceType('Switch')
        })

        // Auth Providers tab
        common.navigateToTab('Auth Providers')
        common.getActiveTab().within(() => {
          appPage.getAuthFormByIndex(0).within(() => {
            appPage.selectAuthProvider('Nintendo')
            appPage.selectNintendoEnvironment()
            common.clickButtonByName('Add Nintendo Credential')
            appPage.inputNintendoCredentials(this.clientId, this.clientSecret)
          })
        })

        // Intercept response to get appId
        cy.intercept('POST', 'api/apps', (req) => {
          req.on('after:response', (res) => {
            this.createdAppId = res.body.data.id
          })
        }).as('waitForSave')
        common.clickButtonByName('Save')
      })

      cy.wait('@waitForSave').then((res) => {
        expect(res.response.statusCode).to.equal(201)
      })

      common.waitForLoaderToDisappear(30000)
      common.assertRowExist(this.createdAppName, this.SELECTOR_TAB)

      // Clean up created app
      cy.waitUntil(() => this.createdAppId).then(() => {
        cy.deleteApp(this.createdAppId)
      })
    })

    after('Clean up', function () {
      cy.deleteAppGroup(this.appGroupId)
    })
  })
})
