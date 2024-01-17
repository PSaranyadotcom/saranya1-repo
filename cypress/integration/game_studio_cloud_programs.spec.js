/* eslint-disable no-undef */
import { Common } from '../page-objects/common-ant-page-objects'
import { Common as Commonv1 } from '../page-objects/common-page-objects'
import { CloudPrograms } from '../page-objects/cloud-programs-page-objects'

const common = new Common()
const commonv1 = new Commonv1()
const cloudProgramPage = new CloudPrograms()

before('Login', function () {
  cy.doAuth()

  this.SELECTOR_CLOUD_PROGRAM_LIST = cloudProgramPage.cloudProgramListSelector
  this.cloudProgramName = 'test-jacky'

  cy.cleanUpCloudPrograms()
})

describe('Game Studio - Cloud Programs', function () {
  describe('Smoke Tests', { tags: ['@smoke'] }, function () {
    beforeEach(function () {
      cy.visitBaseUrl()
      cy.intercept('**/products').as('waitForProducts')
      cloudProgramPage.navigateToCloudPrograms()
      cy.wait('@waitForProducts').wait(1000)

      cy.intercept(`**/cloud-programs/services?`).as('waitForCloudPrograms')
      common.selectProduct()
      cy.wait('@waitForCloudPrograms')

      common.waitForLoaderToDisappear()
    })

    it('Should create new Cloud Program', { tags: ['@smoke'] }, function () {
      // Temporarily use generateAppId for Cloud Program name due to limitations on the service side
      // this.createdCloudProgramName = `test-cypress-${Date.now()}`;
      cy.generateAppId(6).then((id) => {
        this.randomString = id
      })

      cy.waitUntil(() => this.randomString).then(() => {
        this.createdCloudProgramName = `test-${this.randomString}`
      })

      common.clickButtonByName('Create Cloud Program')
      common.waitForModal().within(() => {
        cy.fixture('cloud_program.go').then((code) => {
          cloudProgramPage.inputCode(code)
        })
        common.clickButtonByName('Create')
      })

      common.waitForModal(1).within(() => {
        cloudProgramPage.inputName(this.createdCloudProgramName)
        cy.intercept('POST', `**/cloud-programs/services/${this.createdCloudProgramName}?`).as('waitForSave')
        common.clickButtonByName('Accept')
      })

      cy.wait('@waitForSave').then((res) => {
        expect(res.response.statusCode).to.equal(201)
        cy.intercept(`**/cloud-programs/status/${this.createdCloudProgramName}/1?`).as('waitForBuildStatus')
      })
      cy.get('.loader', { timeout: 500000 }).should('not.exist')
      cy.wait('@waitForBuildStatus')
      cy.wait(2000)
      common.getTableRowByIndex().within(() => {
        common.clickView()
      })

      cloudProgramPage.checkDeployButtonEnabled()
    })

    it('Should display a list of cloud programs', { tags: ['@smoke'] }, function () {
      cy.wait(3000)
      cy.intercept(`**/cloud-programs/status/${this.createdCloudProgramName}?*`).as('waitForBuilds')
      cloudProgramPage.selectCloudProgram(this.createdCloudProgramName)
      cy.wait('@waitForBuilds')
      common.waitForLoaderToDisappear()
      common.getRowLength(this.SELECTOR_CLOUD_PROGRAM_LIST).then((length) => {
        expect(length).to.be.greaterThan(0)
      })
    })

    it('Should create new build for cloud program', { tags: ['@smoke'] }, function () {
      // Cloud Programs service needs to finish debug build as well
      cy.wait(120000)
      cy.intercept(`**/cloud-programs/status/${this.createdCloudProgramName}?*`).as('waitForBuilds')
      cloudProgramPage.selectCloudProgram(this.createdCloudProgramName)
      cy.wait('@waitForBuilds')
      common.waitForLoaderToDisappear()
      cloudProgramPage.getBuildNumber().then((buildNumber) => {
        this.buildNumber = buildNumber
      })

      common.clickButtonByName('New Build')
      common.waitForModal().within(() => {
        cy.fixture('cloud_program.go').then((code) => {
          cloudProgramPage.inputCode(code)
        })

        cy.intercept('POST', `**/cloud-programs/publish/${this.createdCloudProgramName}?*`).as('waitForSave')
        common.clickButtonByName('Create')
      })
      common.waitForLoaderToDisappear(300000)
      cy.wait('@waitForSave', { requestTimeout: 300000 }).then((res) => {
        expect(res.response.statusCode).to.equal(201)
      })
      cy.get('.loader', { timeout: 500000 }).should('not.exist')
      cy.wait(2000)
      cloudProgramPage.getBuildNumber().then((buildNumber) => {
        expect(buildNumber).to.be.equal((parseInt(this.buildNumber) + 1).toString())
      })
    })
    // Skipped due to DNATEC-3166
    it('Should view failed build logs and code', { tags: ['@smoke', '@wip'] }, function () {
      // Cloud Programs service needs to finish debug build as well
      cy.wait(120000)
      cy.intercept(`**/cloud-programs/status/${this.createdCloudProgramName}?*`).as('waitForBuilds')
      cloudProgramPage.selectCloudProgram(this.createdCloudProgramName)
      cy.wait('@waitForBuilds')
      common.waitForLoaderToDisappear()
      common.clickButtonByName('New Build')
      common.waitForModal().within(() => {
        cloudProgramPage.clearCode()
        cloudProgramPage.inputCode('test')
        cy.intercept('POST', `**/cloud-programs/publish/${this.createdCloudProgramName}?*`).as('waitForSave')
        common.clickButtonByName('Create')
      })

      cy.wait('@waitForSave').then((res) => {
        expect(res.response.statusCode).to.equal(500)
      })
      cy.get('.loader', { timeout: 500000 }).should('not.exist')
      cy.wait(2000)
      cloudProgramPage.clickOnFailureArrowBtn()
      cy.wait(2000)
      common.waitForLoaderToDisappear(300000)
      cloudProgramPage.getText().then((text) => {
        expect(text).to.include('test')
      })
      common.navigateToTab('View log')
      cloudProgramPage.getCode().then((text) => {
        expect(JSON.stringify(text)).to.not.be.empty
      })
    })

    it('Should deploy a build', { tags: ['@smoke'] }, function () {
      cy.intercept(`**/cloud-programs/status/${this.createdCloudProgramName}?*`).as('waitForBuilds')
      cloudProgramPage.selectCloudProgram(this.createdCloudProgramName)
      cy.wait('@waitForBuilds')
      common.waitForLoaderToDisappear(300000)
      common
        .getTableRowByString('Success')
        .eq(0)
        .within(() => {
          common.clickView()
        })
      cy.wait(7000)
      cy.intercept(`**/cloud-programs/${this.createdCloudProgramName}/get?`).as('waitForDeploy')
      common.clickButtonByName('Deploy')
      cy.wait(1000)
      common.clickButtonByName('Yes, please proceed')

      cy.wait('@waitForDeploy').then((res) => {
        expect(res.response.statusCode).to.equal(200)
        common.waitForLoaderToDisappear(300000)

        common.getButtonByName('Deployed').should('exist')
      })
    })

    it('Should view service logs', { tags: ['@smoke'] }, function () {
      cy.wait(3000)
      cy.intercept(`**/cloud-programs/status/${this.createdCloudProgramName}?*`).as('waitForBuilds')
      cloudProgramPage.selectCloudProgram(this.createdCloudProgramName)
      cy.wait('@waitForBuilds')
      common.waitForLoaderToDisappear()
      cy.intercept(`**/cloud-programs/${this.createdCloudProgramName}/logs?`).as('waitForLogs')
      common.clickButtonByName('View Service Logs')
      common.waitForModal().within(() => {
        cy.wait('@waitForLogs').then((res) => {
          expect(res.response.statusCode).to.equal(200)
          cloudProgramPage.getCode().then((text) => {
            expect(text).to.not.be.empty
            expect(text).to.not.equal('No available logs to preview.')
          })
        })
        common.clickButtonByName('Close')
      })
    })
  })
})
