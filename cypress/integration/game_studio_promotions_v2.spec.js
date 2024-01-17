/* eslint-disable no-undef */
import { Common } from '../page-objects/common-ant-page-objects'
import { Common as Commonv1 } from '../page-objects/common-page-objects'
import { Placements } from '../page-objects/promotions-placements-page-objects'
import { Promos } from '../page-objects/promotions-promos-page-objects'
import { Segments } from '../page-objects/promotions-segments-page-objects'
import { ManagePromotions } from '../page-objects/promotions-manage-promos-page-objects'

const commonAnt = new Common()
const commonv1 = new Commonv1()
const placementsPage = new Placements()
const promosPage = new Promos()
const segmentsPage = new Segments()
const managePromoPage = new ManagePromotions()
const productId = Cypress.env('productId')
const productId1 = Cypress.env('productId1')
const appGroupId1 = Cypress.env('appGroupId1')

before('Login and get feature flags', function () {
  cy.doAuth()
  cy.getFeatureFlags().then((values) => {
    this.featureFlags = values
  })
})

describe('Game Studio - promotions V2', function () {
  describe('Smoke Tests', { tags: '@smoke' }, function () {
    describe('Audit Smoke Tests', { tags: ['@smoke', '@bug_in_code'] }, function () {
      // Audit endpoints broken currently due to TD cred leak
    })

    describe('Placements Smoke Tests', { tags: '@smoke' }, function () {
      before('Setup', function () {
        this.baseTitle = 'Placement'
        this.SELECTOR_PLACEMENT_LIST = placementsPage.placementsList
        this.placementName = `${this.baseTitle} ${Date.now()}`
        this.deleteSuccess = false
        cy.cleanUpExistingPlacements().then(() => {
          cy.createPlacement(this.placementName).then((id) => {
            this.placementId = id
          })
        })
      })

      beforeEach(function () {
        cy.visitBaseUrl()
        cy.intercept('api2/products').as('waitForProducts')
        cy.intercept(`api/eyewash/products/${productId}/placements/**`).as('waitForPlacements')
        commonAnt.navigateSidebarMenu('Promotions', 'Placements')
        cy.wait('@waitForProducts')
        commonAnt.selectProduct()
        cy.wait('@waitForPlacements')
        commonAnt.waitForLoaderToDisappear()
      })

      it('Should create a placement', { tags: '@smoke' }, function () {
        this.createdPlacementName = `${this.baseTitle} ${Date.now()}`
        this.createdPlacementId = commonAnt.newUUID()
        commonAnt.clickButtonByName('New Placement')
        placementsPage.inputID(this.createdPlacementId)
        placementsPage.inputName(this.createdPlacementName)
        placementsPage.inputDescription(`${this.baseTitle} Description`)
        placementsPage.inputAspectRatio()
        placementsPage.toggleAllowMultipleContent()
        cy.intercept('POST', `api/eyewash/products/${productId}/placements/`).as('waitForCreate')
        commonAnt.clickButtonByName('Create placement')

        cy.wait('@waitForCreate').then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })

        commonAnt.searchDataTable(this.createdPlacementName)
        commonAnt.assertRowExist(this.createdPlacementName)
        // Clean up created placement
        cy.waitUntil(() => this.createdPlacementId).then(() => {
          cy.deletePlacement(this.createdPlacementId)
        })
      })

      it('Should display a list of placements', { tags: '@smoke' }, function () {
        commonAnt.getRowLength().then((length) => {
          expect(length).to.be.greaterThan(0)
        })
      })

      it('Should view a placement', { tags: '@smoke' }, function () {
        commonAnt.searchDataTable(this.placementName)
        commonAnt.getTableRowByString(this.placementName).within(() => {
          commonAnt.clickView()
        })
        placementsPage.assertPlacementInfo(this.placementId, this.placementName)
      })

      it('Should edit a placement', { tags: '@smoke' }, function () {
        commonAnt.searchDataTable(this.placementName)
        commonAnt.getTableRowByString(this.placementName).within((row) => {
          commonAnt.clickView()
        })

        commonAnt.clickEdit()
        this.newPlacementName = `Updated ${this.baseTitle} ${Date.now()}`
        this.newPlacementId = commonAnt.newUUID()

        placementsPage.inputID(this.newPlacementId)
        placementsPage.inputName(this.newPlacementName)
        placementsPage.inputDescription(`Updated ${this.baseTitle} Description`)
        placementsPage.inputAspectRatio(4, 3)
        placementsPage.toggleAllowMultipleContent()
        cy.intercept('PUT', `api/eyewash/products/${productId}/placements/${this.placementId}`).as(
          'waitForUpdatePlacement'
        )
        commonAnt.clickButtonByName('Update placement')
        cy.wait('@waitForUpdatePlacement').then((res) => {
          if (res.response.statusCode == 200) {
            this.placementId = this.newPlacementId
            this.placementName = this.newPlacementName
          }
          expect(res.response.statusCode).to.equal(200)
        })
        commonAnt.navigateBreadcrumbByString('Placements')
        commonAnt.searchDataTable(this.newPlacementName)
        commonAnt.assertRowExist(this.newPlacementName)
      })

      it('Should delete a placement', { tags: '@smoke' }, function () {
        commonAnt.searchDataTable(this.placementName)
        commonAnt.getTableRowByString(this.placementName).within((row) => {
          commonAnt.clickTrash()
        })

        commonAnt.waitForModal().within(() => {
          cy.intercept('DELETE', `api/eyewash/products/${productId}/placements/${this.placementId}/`).as(
            'waitForDelete'
          )
          commonAnt.clickButtonByName('Delete')
        })

        cy.wait('@waitForDelete').then((res) => {
          if (res.response.statusCode == 204) {
            this.deleteSuccess = true
          }
          expect(res.response.statusCode).to.equal(204)
        })

        commonAnt.waitForLoaderToDisappear()
        commonAnt.assertRowNotExist(this.placementName)
      })

      after('Clean up', function () {
        if (!this.deleteSuccess) {
          cy.deletePlacement(this.placementId)
        }
      })
    })

    describe('Promos Smoke Tests', { tags: ['@smoke'] }, function () {
      before('Setup', function () {
        this.baseTitle = 'Promo'
        this.SELECTOR_PROMO_LIST = promosPage.promosList
        this.promoName = `${this.baseTitle} ${Date.now()}`
        this.deleteSuccess = false

        cy.cleanUpExistingPromo().then(() => {
          cy.createPromo(this.promoName).then((id) => {
            this.promoId = id
          })
        })
      })

      beforeEach(function () {
        cy.visitBaseUrl()
        cy.intercept('api2/products').as('waitForProducts')
        commonAnt.navigateSidebarMenu('Promotions', 'Promos')
        cy.wait('@waitForProducts')
        commonv1.waitForAllSelectLoading()
        cy.intercept(`api/eyewash/products/${productId}/productGroups/${appGroupId1}/promos**`).as('waitForpromos')
        promosPage.selectProduct()
        commonAnt.waitForLoaderToDisappear()
        commonv1.waitForAllSelectLoading()
        promosPage.selectProductGroup()
        promosPage.selectEnvironment()
        cy.wait('@waitForpromos')
        commonv1.waitForLoaderToDisappear()
      })

      it('Should create a promo', { tags: ['@smoke'] }, function () {
        let createdPromoName = `${this.baseTitle} ${Date.now()}`
        promosPage.clickCreatePromo()
        promosPage.inputName(createdPromoName)
        promosPage.inputDescription(`${this.baseTitle} Description`)
        promosPage.selectType()
        promosPage.inputDate()
        promosPage.inputDisplayCount()
        promosPage.inputDisplayDuration()
        promosPage.inputMetaData()

        // Intercept response to get promoId
        cy.intercept('POST', `api/eyewash/products/${productId}/productGroups/${appGroupId1}/promos/`, (req) => {
          req.on('after:response', (res) => {
            this.createdpromoId = res.body.id
          })
        }).as('waitForSave')
        commonAnt.forceClickButtonByName('Save')

        cy.wait('@waitForSave', { responseTimeout: 15000 }).then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })

        commonv1.waitForLoaderToDisappear()
        cy.contains('Back to Promo List').click({ force: true })
        commonv1.waitForLoaderToDisappear()
        commonv1.inputFilter(createdPromoName, 1)
        commonv1.assertRowExist(createdPromoName)

        // Clean up created promo
        cy.waitUntil(() => this.createdpromoId).then(() => {
          cy.deletePromo(this.createdpromoId)
        })
      })

      it('Should display a list of promos', { tags: '@smoke' }, function () {
        commonv1.waitForLoaderToDisappear()
        commonv1.getRowLength().then((length) => {
          expect(length).to.be.greaterThan(0)
        })
      })

      it('Should view a promo', { tags: ['@smoke'] }, function () {
        commonv1.inputFilter(this.promoName, 1)
        commonv1.waitForLoaderToDisappear()
        commonv1.getTableRowByString(this.promoName).within(() => {
          cy.intercept(`api/eyewash/products/${productId}/productGroups/${appGroupId1}/promos/${this.promoId}**`).as(
            'waitForPromo'
          )
          commonv1.clickView()
          cy.wait('@waitForPromo')
        })
        commonv1.waitForLoaderToDisappear()
        promosPage.assertPromoData(this.promoName, this.promoId)
      })

      it('Should edit a promo', { tags: ['@smoke'] }, function () {
        commonv1.inputFilter(this.promoName, 1)
        commonv1.waitForLoaderToDisappear()
        commonv1.getTableRowByString(this.promoName).within(() => {
          commonv1.clickEdit()
        })
        commonv1.waitForLoaderToDisappear()
        this.newPromoName = `Updated ${this.baseTitle} ${Date.now()}`

        cy.wait(2000)
        promosPage.inputName(this.newPromoName)
        promosPage.inputDescription(`Updated ${this.baseTitle} Description`)
        promosPage.selectType('1stPartyStore')
        promosPage.inputDate(15, 20)
        promosPage.inputDisplayCount(2)
        promosPage.inputDisplayDuration(48)
        promosPage.selectFirstPartyOffer()
        cy.intercept(
          'PUT',
          `api/eyewash/products/${productId}/productGroups/${appGroupId1}/promos/${this.promoId}/`
        ).as('waitForSave')
        cy.wait(1000)
        commonAnt.forceClickButtonByName('Save')
        cy.wait('@waitForSave').then(function (res) {
          if (res.response.statusCode == 200) {
            this.promoName = this.newPromoName
          }
          expect(res.response.statusCode).to.equal(200)
        })
        promosPage.backToPromo()
        commonv1.waitForLoaderToDisappear(30000)
        promosPage.filterNameXclose()
        // commonAnt.click();
        commonv1.inputFilter(this.newPromoName, 1)
        commonv1.assertRowExist(this.newPromoName)
      })

      it('Should delete a promo', { tags: ['@smoke'] }, function () {
        commonv1.inputFilter(this.promoName, 1)
        commonv1.waitForLoaderToDisappear(30000)
        commonv1.getTableRowByString(this.promoName).within(() => {
          commonv1.clickTrash()
        })

        cy.intercept(
          'DELETE',
          `api/eyewash/products/${productId}/productGroups/${appGroupId1}/promos/${this.promoId}/**`
        ).as('waitForDelete')

        commonv1.waitForModal().within(() => {
          commonv1.clickButtonByName('Yes')
        })

        cy.wait('@waitForDelete').then((res) => {
          if (res.response.statusCode == 204) {
            this.deleteSuccess = true
          }
          expect(res.response.statusCode).to.equal(204)
        })

        commonv1.waitForLoaderToDisappear()
        commonv1.assertRowNotExist(this.promoName)
      })

      after('Clean up', function () {
        if (!this.deleteSuccess) {
          cy.deletePromo(this.promoId)
        }
      })
    })

    describe('Segment Smoke Tests', { tags: ['@smoke'] }, function () {
      before('Setup', function () {
        this.baseTitle = 'Segment'
        this.segmentName = `${this.baseTitle} ${Date.now()}`
        this.deleteSuccess = false
        cy.createSegment(this.segmentName).then((id) => {
          this.segmentId = id

          cy.waitUntil(() => this.segmentId).then(() => {
            cy.createSegmentRules({
              segmentId: this.segmentId,
              creatrioName: 'Criterianew',
              category: 'Country',
            }).then((id) => {
              this.ruleId = id
            })
          })
        })
      })

      beforeEach(function () {
        cy.visitBaseUrl()
        cy.intercept('api2/products').as('waitForProducts')
        commonAnt.navigateSidebarMenu('Promotions', 'Segments')
        cy.wait('@waitForProducts')
        cy.intercept(`api2/stub/promotions/segmentation/products/${productId}/segments**`).as('waitForSegments')
        segmentsPage.selectProduct()
        cy.wait('@waitForSegments')
        commonAnt.waitForLoaderToDisappear()
      })

      it('Should create a Segment', { tags: '@smoke' }, function () {
        this.createdSegmentsName = `${this.baseTitle} ${Date.now()}`
        commonAnt.clickButtonByName('New segment')
        segmentsPage.inputName(this.createdSegmentsName)
        commonAnt.clickButtonByName('New criteria')

        segmentsPage.addCriteriaDetails({
          Category: 'Account Level',
          Condition: 'IS',
          Value: 'Data-Lite',
        })
        commonAnt.clickPlus()

        segmentsPage.addCriteriaDetails({
          Category: 'Country',
          Condition: 'IS',
          Value: 'Bahrain',
          index: 1,
        })

        commonAnt.waitForModal().within(() => {
          commonAnt.clickButtonByName('Save')
        })

        cy.intercept('POST', `api2/stub/promotions/segmentation/products/${productId}/segments?`, (req) => {
          req.on('after:response', (res) => {
            this.createdsegmentId = res.body.data.id
          })
        }).as('waitForCreate')
        commonAnt.clickButtonByName('Create')
        cy.wait('@waitForCreate', { responseTimeout: 15000 }).then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })
        cy.wait(1000)
        commonAnt.searchDataTable(this.createdSegmentsName)
        commonAnt.assertRowExist(this.createdSegmentsName)
        cy.waitUntil(() => this.createdsegmentId).then(() => {
          cy.deleteSegment(this.createdsegmentId)
        })
      })

      it('Should display a list of Segments', { tags: '@smoke' }, function () {
        commonAnt.getRowLength().then((length) => {
          expect(length).to.be.greaterThan(0)
        })
      })

      it('Should view a Segment', { tags: '@smoke' }, function () {
        commonAnt.searchDataTable(this.segmentName)
        commonAnt.getTableRowByString(this.segmentName).within(() => {
          commonAnt.clickView()
        })
        cy.wait(1000)
        segmentsPage.assertSegmentInfo(this.segmentId, this.segmentName)
      })

      it('Should edit a Segment', { tags: ['@smoke'] }, function () {
        commonAnt.searchDataTable(this.segmentName)
        commonAnt.getTableRowByString(this.segmentName).within((row) => {
          commonAnt.clickView()
        })
        commonAnt.clickEdit()
        this.newSegmentName = `Updated ${this.baseTitle} ${Date.now()}`
        segmentsPage.inputName(this.newSegmentName)
        cy.intercept('PUT', `api2/stub/promotions/segmentation/products/${productId}/segments/*`).as(
          'waitForUpdateSegment'
        )

        commonAnt.waitForModal().within(() => {
          commonAnt.clickButtonByName('Save')
        })

        cy.wait('@waitForUpdateSegment').then((res) => {
          if (res.response.statusCode == 201) {
            this.segmentName = this.newSegmentName
          }
          expect(res.response.statusCode).to.equal(201)
        })

        segmentsPage.clickOnCategoryEditBtn()
        segmentsPage.addCriteriaDetails({
          Category: 'Console',
          Condition: 'IS',
          Value: 'Unknown',
          listInCreate: false,
        })
        commonAnt.navigateBreadcrumbByString('Segments')
        cy.waitUntil(() => this.segmentName).then(() => {
          commonAnt.searchDataTable(this.segmentName)
          commonAnt.assertRowExist(this.segmentName)
        })
      })

      it('Should delete a Segments', { tags: '@smoke' }, function () {
        commonAnt.searchDataTable(this.segmentName)
        commonAnt.getTableRowByString(this.segmentName).within((row) => {
          commonAnt.clickTrash()
        })
        commonAnt.waitForModal().within(() => {
          cy.intercept(
            'DELETE',
            `api2/stub/promotions/segmentation/products/${productId}/segments/${this.segmentId}*`
          ).as('waitForDelete')
          commonAnt.clickButtonByName('Delete')
        })

        cy.wait('@waitForDelete').then((res) => {
          if (res.response.statusCode == 200) {
            this.deleteSuccess = true
          }
          expect(res.response.statusCode).to.equal(200)
        })

        commonAnt.waitForLoaderToDisappear()
        commonAnt.assertRowNotExist(this.segmentName)
      })

      after('Clean up', function () {
        if (!this.deleteSuccess) {
          cy.deleteSegmentRules(this.segmentId, this.ruleId)
          cy.deleteSegment(this.segmentId)
        }
      })
    })

    describe('Manage Promotions Smoke Tests', { tags: ['@smoke'] }, function () {
      const metaData = `{"boolean":false,"integer":1,"string":"test"}`

      before('Setup', function () {
        this.baseTitle = 'Promo'
        this.promoName = `${this.baseTitle} ${Date.now()}`
        this.placementName = `Placement ${Date.now()}`
        this.deleteSuccess = false
        cy.cleanUpExistingPromo().then(() => {
          cy.createPromo(this.promoName).then((id) => {
            this.promoId = id
          })
        })
        cy.cleanUpExistingPlacements().then(() => {
          cy.createPlacement(this.placementName).then((id) => {
            this.placementId = id
          })
        })
      })

      beforeEach(function () {
        cy.visitBaseUrl()
        cy.intercept('**/products').as('waitForProducts')
        commonAnt.navigateSidebarMenu('Promotions', 'Manage Promotions')
        cy.wait('@waitForProducts')
        cy.intercept(`api/eyewash/products/${productId}/productGroups/**`).as('waitForPromotions')
        managePromoPage.selectProduct()
        managePromoPage.selectappGroup()
        cy.wait('@waitForPromotions')
        commonAnt.waitForLoaderToDisappear()
      })

      it('Should create a Promotion', { tags: '@smoke' }, function () {
        this.createdPromotionName = `${this.baseTitle} ${Date.now()}`

        commonAnt.clickButtonByName('New Promotion')

        managePromoPage.enterPromotionDetails(this.createdPromotionName)
        managePromoPage.inputMetaData(metaData)
        commonAnt.clickButtonByName('Next')
        commonAnt.clickButtonByName('Select New Placement')

        commonAnt.waitForModal().within(() => {
          managePromoPage.checkPlacementCheckBox(this.placementName)
          commonAnt.clickButtonByName('Confirm')
        })

        commonAnt.clickButtonByName('Next')
        managePromoPage.uploadZipFile('variants.zip')
        cy.wait(1000)
        commonAnt.clickButtonByName('Next')
        managePromoPage.enterCreativePageDetails()
        commonAnt.clickButtonByName('Next')
        managePromoPage.matchAssetsToPlacements()
        cy.intercept('POST', `api/eyewash/products/${productId}/productGroups/${appGroupId1}/promos/`, (req) => {
          req.on('after:response', (res) => {
            this.createdpromoId = res.body.id
          })
        }).as('waitForCreate')

        commonAnt.clickButtonByName('Create')
        commonAnt.waitForModal(1).within(() => {
          commonAnt.clickButtonByName('Yes')
        })

        cy.wait('@waitForCreate', { responseTimeout: 15000 }).then((res) => {
          expect(res.response.statusCode).to.equal(201)
        })

        commonAnt.waitForLoaderToDisappear()
        cy.assertAlert('Promotion created.')

        cy.waitUntil(() => this.createdpromoId).then(() => {
          managePromoPage.assertManagePromoInfo(this.createdPromotionName, this.createdpromoId)
        })

        commonAnt.navigateToTab('Creative')
        managePromoPage.ValidateCreativeDetails()
        commonAnt.navigateToTab('Metadata')
        cy.wait(1500)
        managePromoPage.ValidateMetaDataDetails(metaData)

        cy.waitUntil(() => this.createdpromoId).then(() => {
          cy.deletePromo(this.createdpromoId)
        })
      })

      it('Should display a list of Manage Promotions', { tags: '@smoke' }, function () {
        commonAnt.getRowLength().then((length) => {
          expect(length).to.be.greaterThan(0)
        })
      })

      it('Should view a Manage Promotions', { tags: '@smoke' }, function () {
        commonAnt.searchDataTable(this.promoName)
        commonAnt.getTableRowByString(this.promoName).within(() => {
          commonAnt.clickView()
        })
        cy.wait(1000)
        cy.waitUntil(() => this.promoId).then(() => {
          managePromoPage.assertManagePromoInfo(this.promoName, this.promoId)
        })

        commonAnt.navigateToTab('Creative')
        commonAnt.navigateToTab('Metadata')
        cy.wait(1500)
        managePromoPage.ValidateMetaDataDetails()
      })

      it('Should edit a Manage Promotions', { tags: '@smoke' }, function () {
        commonAnt.searchDataTable(this.promoName)
        commonAnt.getTableRowByString(this.promoName).within(() => {
          commonAnt.clickView()
        })

        commonAnt.waitForLoaderToDisappear()
        commonAnt.clickEdit()
        this.newPromoName = `Updated ${this.baseTitle} ${Date.now()}`
        managePromoPage.enterPromotionDetails(this.newPromoName)

        cy.intercept('PUT', `api/eyewash/products/${productId}/productGroups/${appGroupId1}/promos/*`, (req) => {
          req.on('after:response', (res) => {
            this.promoId = res.body.id
          })
        }).as('waitForUpdatePromo')

        commonAnt.clickButtonByName('Submit')

        cy.wait('@waitForUpdatePromo').then((res) => {
          if (res.response.statusCode == 200) {
            this.promoName = this.newPromoName
          }
          expect(res.response.statusCode).to.equal(200)
        })

        commonAnt.waitForLoaderToDisappear()
        cy.assertAlert('Promotion edited successfully')

        cy.waitUntil(() => [this.promoName, this.promoId]).then(() => {
          managePromoPage.assertManagePromoInfo(this.promoName, this.promoId)
        })

        commonAnt.navigateToTab('Creative')
        commonAnt.navigateToTab('Metadata')
        cy.wait(1500)
        managePromoPage.ValidateMetaDataDetails()
      })

      it('Should delete a Manage Promotion', { tags: '@smoke' }, function () {
        commonAnt.searchDataTable(this.promoName)
        commonAnt.getTableRowByString(this.promoName).within((row) => {
          commonAnt.clickTrash()
        })

        cy.intercept(
          'DELETE',
          `api/eyewash/products/${productId}/productGroups/${appGroupId1}/promos/${this.promoId}/**`
        ).as('waitForDelete')
        commonAnt.waitForModal().within(() => {
          commonAnt.clickButtonByName('Delete')
        })

        cy.wait('@waitForDelete').then((res) => {
          if (res.response.statusCode == 204) {
            this.deleteSuccess = true
          }
          expect(res.response.statusCode).to.equal(204)
        })

        cy.assertAlert(`Record "${this.promoName}" deleted from DEVELOPMENT, TEST and PRODUCTION environments.`)
        commonAnt.waitForLoaderToDisappear()
        commonAnt.assertRowNotExist(this.promoName)
      })

      after('Clean up', function () {
        if (!this.deleteSuccess) {
          cy.deletePromo(this.promoId)
        }
        cy.deletePlacement(this.placementId)
      })
    })
  })
})
