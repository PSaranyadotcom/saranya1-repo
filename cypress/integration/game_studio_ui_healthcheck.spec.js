/* eslint-disable no-undef */
describe('Game Studio - UI Healthcheck', function () {
  describe('Login', { tags: '@smoke' }, function () {
    it('Should log the user in', { tags: '@smoke' }, function () {
      cy.doAuth()
    })
  })

  describe('Sidebar', { tags: '@smoke' }, function () {
    let featureFlags = {}

    before(function () {
      cy.doAuth()
      cy.getFeatureFlags().then((values) => {
        featureFlags = values
      })
      cy.visitBaseUrl()
    })

    it('Should have Accounts menu', { tags: '@smoke' }, function () {
      cy.get('.ant-menu').contains('Accounts').click()
      cy.get('#react-page-content').contains('E-mail Address').should('exist')
    })

    it('Should have Licenses menu', { tags: '@smoke' }, function () {
      cy.get('.ant-menu').contains('Licenses').click()
      cy.wait(1000)
      cy.get('#react-page-content.td-ui-v2').contains('Licenses').should('exist')
    })

    it('Should have Telemetry menu', { tags: '@smoke' }, function () {
      cy.get('.ant-menu').contains('Telemetry').click()
      cy.get('.ant-menu').contains('Game Data').click()
      cy.get('#react-page-content').contains('Game Data').should('exist')
      cy.get('.ant-menu').contains('Rockset Access Request').click()
      cy.get('#react-page-content').contains('Rockset Access').should('exist')
    })

    /*
     * Achievements section deprecated, so this test should be skipped.
     */
    it.skip('Should have Achievements menu', { tags: '@smoke' }, function () {
      cy.get('.ant-menu').contains('Achievements').click()
      cy.get('.page-content').contains('Manage Achievements').should('exist')
    })

    it('Should have Commerce menus', { tags: '@smoke' }, function () {
      cy.get('.ant-menu').contains('Commerce').click()
      cy.get('.ant-menu').contains('Stores').click()
      cy.get('#react-page-content').contains('Store Management').should('exist')
      cy.get('.ant-menu').contains('SKUs').click()
      cy.get('#react-page-content').contains('SKU Management').should('exist')
      cy.then(() => {
        cy.get('.ant-menu').contains('Items').click()
        cy.get('#react-page-content').contains('Item Management').should('exist')
      })
      cy.get('.ant-menu').contains('Codes').click()
      cy.get('#react-page-content').contains('Campaign Management').should('exist')
      cy.get('.ant-menu').contains('Currency').click()
      cy.get('#react-page-content').contains('Currency Management').should('exist')
    })

    it('Should have Cloud Programs menu', { tags: '@smoke' }, function () {
      cy.get('.ant-menu').contains('Cloud Programs').click()
      cy.get('#react-page-content').contains('Cloud Programs').should('exist')
    })

    it('Should have Cloud Data menu', { tags: '@smoke' }, function () {
      cy.get('.ant-menu').contains('Cloud Data').click()
      cy.get('.ant-menu.ant-menu-sub').contains('Cloud Data').click()
      cy.get('#react-page-content').contains('Cloud Data').should('exist')
      cy.get('.ant-menu.ant-menu-sub').contains('Game Tuning Data').click()
      cy.get('#react-page-content').contains('Game tuning data').should('exist')
    })
  })

  describe('Assembly Modal', { tags: '@smoke' }, function () {
    it('Should not able to open Assembly Modal', { tags: '@smoke' }, function () {
      cy.visitBaseUrl()
      cy.get('.top-menu .fa-info-circle').should('not.exist')
    })
  })

  describe('Router', { tags: '@smoke' }, function () {
    before(function () {
      cy.doAuth()
    })
    it('Should able to directly visit /#/accounts', { tags: '@smoke' }, function () {
      cy.visit('/#/r-accounts')
      cy.contains('E-mail Address').should('exist')
    })

    it('Should able to directly visit /#/r-items', { tags: '@smoke' }, function () {
      cy.visit('/#/r-items')
      cy.contains('Item Management').should('exist')
    })

    it('Should able to directly visit /#/licenses', { tags: '@smoke' }, function () {
      cy.visit('/#/licenses')
      cy.contains('Licenses').should('exist')
    })

    it('Should able to directly visit /#/telemetry/game-data ', { tags: '@smoke' }, function () {
      cy.visit('/#/telemetry/game-data')
      cy.contains('Game Data').should('exist')
    })

    it('Should able to directly visit /#/r-telemetry/rockset-access ', { tags: '@smoke' }, function () {
      cy.visit('/#/r-telemetry/rockset-access')
      cy.contains('Rockset Access').should('exist')
    })

    /*
     * Achievements section deprecated, so this test should be skipped.
     */
    it.skip('Should able to directly visit /#/achievements', { tags: '@smoke' }, function () {
      cy.visit('/#/achievements')
      cy.get('.page-content').contains('Manage Achievements').should('exist')
    })

    it('Should able to directly visit /#/codes', { tags: '@smoke' }, function () {
      cy.visit('/#/codes')
      cy.contains('Manage Campaigns').should('exist')
    })

    it('Should able to directly visit /#/r-stores', { tags: '@smoke' }, function () {
      cy.visit('/#/r-stores')
      cy.contains('Store Management').should('exist')
    })

    it('Should able to directly visit /#/r-skus', { tags: '@smoke' }, function () {
      cy.visit('/#/r-skus')
      cy.contains('SKU Management').should('exist')
    })

    it('Should able to directly visit /#/r-cloud-programs', { tags: '@smoke' }, function () {
      cy.visit('/#/r-cloud-programs')
      cy.waitUntil(() => cy.get('#react-page-content').contains('Cloud Programs'))
      cy.get('#react-page-content').contains('Cloud Programs').should('exist')
    })

    it('Should able to directly visit /#/r-cloud-data', { tags: '@smoke' }, function () {
      cy.visit('/#/r-cloud-data')
      cy.get('#react-page-content').contains('Cloud Data').should('exist')
    })

    it('Should able to directly visit /#/r-wallet', { tags: '@smoke' }, function () {
      cy.visit('/#/r-wallet')
      cy.contains('Currency Management').should('exist')
    })
  })

  describe('Logout', { tags: '@smoke' }, function () {
    it('Should logout the user', { tags: '@smoke' }, function () {
      cy.visitBaseUrl()
      cy.get('button').contains('Logout').click()
      cy.get('button').contains('Login').should('exist')
    })
  })
})
