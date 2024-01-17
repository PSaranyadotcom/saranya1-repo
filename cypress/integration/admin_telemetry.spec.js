/* eslint-disable no-undef */
import { Common } from '../page-objects/common-page-objects'
import { Telemetry } from '../page-objects/telemetry-page-objects'

const common = new Common()
const telemetryPage = new Telemetry()

before('Login and get feature flags', function () {
  // Login
  cy.doAuth()
  cy.getFeatureFlags().then((values) => {
    this.featureFlags = values
  })

  this.baseTitle = 'Telemetry'
  this.SELECTOR_LIST = telemetryPage.activeTabSelector
})

describe('Internal Admin - Telemetry', { tags: ['@smoke', '@wip', '@dev_only'] }, function () {
  describe('Telemetry-K Activities', { tags: ['@smoke', '@wip', '@dev_only'] }, function () {
    describe('Smoke Tests', { tags: ['@smoke', '@wip', '@dev_only'] }, function () {
      before('Setup', function () {
        this.appGroupName = `${this.baseTitle} App Group ${Date.now()}`
        this.queueName = `${this.baseTitle} Queue ${Date.now()}`

        cy.createAppGroup(this.appGroupName).then((id) => {
          this.appGroupId = id

          cy.createQueue(this.queueName, id).then((id) => {
            this.queueId = id
          })

          cy.createBucketMapping(id)
        })
      })

      beforeEach(function () {
        cy.visitBaseUrl()

        cy.intercept('**/products')
          .as('waitForProducts')
          .then(() => {
            telemetryPage.navigateToTelemetry()
          })

        common.waitForAllSelectLoading()
        cy.wait('@waitForProducts').then(() => {
          common.selectProduct()
        })

        common.waitForAllSelectLoading()
        // Wait for queues to load
        cy.intercept('**/queues**')
          .as('waitForQueues')
          .then(() => {
            common.selectAppGroup(this.appGroupName)
          })
        cy.wait('@waitForQueues')
        common.waitForLoaderToDisappear()
      })

      it('Should upgrade an app group to use Kafka', { tags: ['@smoke', '@wip', '@dev_only'] }, function () {
        common.clickButtonByName('Upgrade Telemetry to use Kafka')

        cy.intercept('POST', 'api/telemetry/app-group/onboard')
          .as('waitForOnboard')
          .then(() => {
            common.clickYes()
          })

        cy.wait('@waitForOnboard').then((res) => {
          expect(res.response.statusCode).to.equal(200)
        })

        telemetryPage.getCreateOffloadBucketButton().should('not.exist')
        telemetryPage.getUpdateOffloadBucketButton().should('not.exist')
        common.getButtonByName('Upgrade Telemetry to use Kafka').should('not.exist')

        cy.assertAlert('Successfully onboarded App Group Configuration')
      })

      it(
        'Should not upgrade Discovery if it is not configured',
        { tags: ['@smoke', '@wip', '@dev_only'] },
        function () {
          common.clickButtonByName('Upgrade Discovery')
          common.getYes().should('not.exist')
        }
      )

      it('Should upgrade Discovery if it is configured', { tags: ['@smoke', '@wip', '@dev_only'] }, function () {
        cy.addServiceEndpoint(
          this.appGroupId,
          `https://${Cypress.env('environment')}.telemetry.api.2kcoretech.online/telemetry/v2`,
          'telemetry'
        ).then((id) => {
          this.serviceId = id

          // Discovery can take up to 5 minutes to settle, need a non hard-coded solution
          cy.wait(300000)
          // for(let i = 0; i < 60; i++){
          //   cy.wait(5000);
          //   cy.getService(this.appGroupId).then((body) => {
          //     if(body.baseUrl == `https://${Cypress.env("environment")}.telemetry.api.2kcoretech.online/telemetry/v2`){
          //       i = 60;
          //       return false;
          //     }
          //   });
          // }
        })

        cy.reload()
        cy.wait(3000)
        common.waitForAllSelectLoading()
        cy.intercept('**/queues**')
          .as('waitForQueues')
          .then(() => {
            common.selectAppGroup(this.appGroupName)
          })
        cy.wait('@waitForQueues')
        common.waitForLoaderToDisappear()

        common.clickButtonByName('Upgrade Discovery')
        cy.intercept('PUT', '**/services/**')
          .as('waitForServices')
          .then(() => {
            common.clickYes()
          })

        cy.wait('@waitForServices').then((res) => {
          expect(res.response.statusCode).to.equal(200)
        })

        common.getButtonByName('Upgrade Discovery').should('not.exist')

        cy.wait(300000)
        cy.getService(this.appGroupId).then((body) => {
          expect(body.baseUrl).to.equal(
            `https://${Cypress.env('environment')}.telemetryk.api.2kcoretech.online/telemetry/v2`
          )
        })
      })

      it('Should cleanup topics', { tags: ['@smoke', '@wip', '@dev_only'] }, function () {
        common.clickButtonByName('Topic Cleanup')
        cy.intercept('DELETE', `api/telemetry/app-group/topic-cleanup?appGroupId=${this.appGroupId}`).as(
          'waitForCleanup'
        )
        common.waitForModal().within(() => {
          common.clickButtonByName('Yes')
        })

        cy.wait('@waitForCleanup').then((res) => {
          expect(res.response.statusCode).to.equal(200)
        })

        cy.assertAlert('Successfully cleanup topic')
        common.waitForLoaderToDisappear()
        common.waitForButtonCount(2)
        common.getButtonByName('Topic Cleanup').should('not.exist')
        common.getButtonByName('Upgrade Telemetry to use Kafka').should('exist')
      })

      it(
        'Should view Rockset Access when product/app group does not use Rockset Access',
        { tags: ['@smoke', '@wip', '@dev_only'] },
        function () {
          common.clickButtonByName('Rockset Access')
          telemetryPage.verifyIntegrationStatus('No integration found')
          telemetryPage.verifyHelpfulDocsExistance()
        }
      )

      it(
        'Should view Rockset Access when product/app group does used Rockset Access',
        { tags: ['@smoke', '@wip', '@dev_only'] },
        function () {
          telemetryPage.selectRocksetProduct()
          common.selectAppGroup('TelemetryK Integration Test')
          common.waitForLoaderToDisappear()
          common.clickButtonByName('Rockset Access')
          telemetryPage.verifyIntegrationStatus('Successful')
          telemetryPage.verifyUserListExists()
          telemetryPage.verifyHelpfulDocsExistance()
        }
      )

      after('Clean up', function () {
        cy.rollbackAppGroupFromTelemetryK(this.appGroupId)
        cy.getAppGroupConfigAfterRollBack(this.appGroupId)
        cy.deleteAppGroup(this.appGroupId)
      })
    })
  })
})
