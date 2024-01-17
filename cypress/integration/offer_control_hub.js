import { OfferControlHub } from '../page-objects/och-campaign-list-page-objects'
import { OCHNewCampaign } from '../page-objects/och-new-campaign-page-objects'
import { OCHCampaignDetails } from '../page-objects/och-campaign-details-page-objects'
import { Common } from '../page-objects/common-ant-page-objects'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

const och = new OfferControlHub()
const ochNewCampaign = new OCHNewCampaign()
const ochCampaignDetails = new OCHCampaignDetails()
const common = new Common()

before('Login', function () {
  // Login
  cy.doAuth()
})

//TODO: define Tags after getting a working version in DEV environment
describe('OCH - Campaign List', function () {
  beforeEach(function () {
    cy.visit('/#/r-offer-control-hub')
  })

  it('OCH page elements should be visible', function () {
    och.getBreadcrumb().contains('Offer Control Hub')
    och.getPageTitle().contains('Campaign management')
    // TODO: subtitle TBD
    och.getPageSubtitle().contains('Lorem ipsum dolor sit amet')
    och.getNewCampaignButton().contains('New Campaign')
    och.getCampaignTable().should('be.visible')
    och.getSearchInput().should('be.visible')
    och.getFilterButton().should('be.visible')
  })

  it('Campaign List should have all elements', function () {
    const rowNames = [
      och.listOfTableTitles().name,
      och.listOfTableTitles().status,
      och.listOfTableTitles().type,
      och.listOfTableTitles().startDate,
      och.listOfTableTitles().endDate,
      och.listOfTableTitles().createDate,
      och.listOfTableTitles().modifiedDate,
      '',
    ]
    common.assertDataTableColumnNames(rowNames)
  })

  it('Campaign list should be paginated', function () {
    cy.intercept('GET', '**/campaigns?*').as('campaignsList')
    const itemsPerPage = 100
    common.selectPaginationLimit(itemsPerPage)
    common.goToLastPageOfTable()
    common.getRowLength().as('numberOfRows')

    cy.wait('@campaignsList').then((res) => {
      common
        .getActivePageOfTableButton()
        .invoke('text')
        .then((lastPageNumber) => {
          common.getRowLength().then((numberOfRows) => {
            let totalRows = (lastPageNumber - 1) * itemsPerPage + numberOfRows
            expect(res.response.body.total).to.equal(totalRows)
          })
        })
    })
  })

  it('Rows should not be empty', function () {
    common.getTableRowByIndex(0).then((row) => {
      cy.wrap(row).within(function () {
        cy.get('td').eq(0).should('not.be.empty')
        cy.get('td').eq(1).should('not.be.empty')
        cy.get('td').eq(2).should('not.be.empty')
        cy.get('td').eq(3).should('not.be.empty')
        cy.get('td').eq(4).should('not.be.empty')
        cy.get('td').eq(5).should('not.be.empty')
        cy.get('td').eq(6).should('not.be.empty')
        cy.get('td')
          .eq(7)
          .within(function () {
            cy.wrap('.tdi-overflow-vertical').should('exist')
            cy.get('.tdi-trash-can').should('exist')
            cy.get('.tdi-arrow-right').should('exist')
          })
      })
    })
  })

  it('should be able to access "New Campaign" page', function () {
    och.getNewCampaignButton().click()
    cy.url().should('contain', '/r-offer-control-hub/create')
  })
})

describe('OCH - Single Campaign', function () {
  beforeEach(function () {
    cy.intercept('GET', '**/campaigns?*', {
      fixture: 'och_campaign_list.json',
    }).as('campaignList')
    cy.visit('/#/r-offer-control-hub')
    cy.wait('@campaignList')
  })

  it('More Actions Menu should have different options for different status', function () {
    cy.fixture('och.json')
      .its('actionsMenu')
      .then((list) => {
        list.forEach((item) => {
          och.openMoreActionsMenu(common.getDataTableFirstRowByStatus(item.status))
          och.assertActionsList(item.actions)
          och.closeMoreActionsMenu(common.getDataTableFirstRowByStatus(item.status))
        })
      })
  })

  it('Delete should be disable for already activated status', function () {
    cy.fixture('och.json')
      .its('actionsMenu')
      .then((list) => {
        list.forEach((item) => {
          if (item.delete) {
            och.getDeleteRowIcon(common.getDataTableFirstRowByStatus(item.status)).should('be.enabled')
          } else {
            och.getDeleteRowIcon(common.getDataTableFirstRowByStatus(item.status)).should('be.disabled')
          }
        })
      })
  })

  it('Click on a Campaign Should open details page', function () {
    const mockedCampaignId = 'ac3f2743-b62f-48de-8e0a-332a3234766c'
    och.navigateToDetailsPageByCampaignId(mockedCampaignId)
    cy.url().should('contain', '/r-offer-control-hub/' + mockedCampaignId)
  })
})

describe('OCH - New Campaign', function () {
  beforeEach(function () {
    cy.visit('/#/r-offer-control-hub/create')
  })

  it('all elements should be visible', function () {
    ochNewCampaign.getBreadcrumb().contains('Offer Control Hub')
    ochNewCampaign.getPageTitle().contains('New campaign')
    ochNewCampaign.getPageSubtitle().contains('Campaign details')
    ochNewCampaign.getCampaignNameLabel().contains('Name')
    ochNewCampaign.getCampaignNameCounter().contains('0/256')
    ochNewCampaign.getCampaignNameInput().invoke('attr', 'placeholder').should('eq', 'Enter a name for this campaign')
    ochNewCampaign.getCampaignTypeLabel().contains('Type')
    ochNewCampaign.getCampaignTypeInput().should('be.visible')
    ochNewCampaign.getCampaignStartDateLabel().contains('Start date (PT)')
    ochNewCampaign.getCampaignStartDateInput().should('be.visible')
    ochNewCampaign.getCampaignEndDateLabel().contains('End date (PT)')
    ochNewCampaign.getCampaignEndDateInput().should('be.visible')
    ochNewCampaign.getCampaignDescriptionLabel().contains('Description(optional)')
    ochNewCampaign.getCampaignDescriptionCounter().invoke('attr', 'data-count').should('eq', '0 / 256')
    ochNewCampaign
      .getCampaignDescriptionInput()
      .invoke('attr', 'placeholder')
      .should('eq', 'Enter a description for the goal of this campaign')
    ochNewCampaign.getCancelButton().should('be.enabled')
    ochNewCampaign.getCreateEditButton().should('be.disabled')
  })

  it('name should have max of 256 chars', function () {
    const text = Cypress._.repeat('1234567890', 26)
    ochNewCampaign.getCampaignNameInput().type(text)
    ochNewCampaign.getCampaignNameCounter().should('have.text', '256/256')
    ochNewCampaign.getCampaignNameInput().invoke('attr', 'value').should('eq', text.substr(0, 256))
  })

  it('description should have max of 256 chars', function () {
    const text = Cypress._.repeat('1234567890', 26)
    ochNewCampaign.getCampaignDescriptionInput().type(text)
    ochNewCampaign.getCampaignDescriptionCounter().invoke('attr', 'data-count').should('eq', '256 / 256')
    ochNewCampaign.getCampaignDescriptionInput().should('have.text', text.substr(0, 256))
  })

  it('should be able to search the type', function () {
    const campaignType = 'Fixed Period'
    ochNewCampaign.selectCampaignType(campaignType)
    ochNewCampaign.getSelectedCampaignType().should('have.text', campaignType)
  })

  it('should be able to select start and end dates', function () {
    const startDate = ochNewCampaign.formatDateTime(dayjs())
    const endDate = ochNewCampaign.formatDateTime(dayjs().add(1, 'day'))

    ochNewCampaign.insertDateTime(ochNewCampaign.getCampaignStartDateInput(), startDate)
    ochNewCampaign.insertDateTime(ochNewCampaign.getCampaignEndDateInput(), endDate)
    ochNewCampaign.getCampaignStartDateInput().invoke('attr', 'value').should('eq', startDate)
    ochNewCampaign.getCampaignEndDateInput().invoke('attr', 'value').should('eq', endDate)
  })

  it('create campaign with success', function () {
    const dayOffSet = dayjs().unix().toString()
    const campaignName = 'Automated Test ' + dayOffSet
    const campaignType = 'Fixed Period'
    const startDate = ochNewCampaign.formatDateTime(dayjs().add(1, 'day'))
    const endDate = ochNewCampaign.formatDateTime(dayjs().add(2, 'day'))
    const campaignDescription = campaignName + ' description'
    const campaignStatus = 'Defined'

    ochNewCampaign.getCampaignNameInput().type(campaignName)
    ochNewCampaign.selectCampaignType(campaignType)
    ochNewCampaign.insertDateTime(ochNewCampaign.getCampaignStartDateInput(), startDate)
    ochNewCampaign.insertDateTime(ochNewCampaign.getCampaignEndDateInput(), endDate)
    ochNewCampaign.getCampaignDescriptionInput().type(campaignDescription)

    const createdDate = ochNewCampaign.formatDateTime(dayjs().tz('America/Los_Angeles'))

    ochNewCampaign.getCreateEditButton().click()
    cy.url().should('match', /r-offer-control-hub$/)
    cy.assertAlert(
      'Campaign Created successfully.' + 'The Campaign ' + campaignName + ' has been successfully created.'
    )
    common.waitForLoaderToDisappear()
    common.searchDataTable(dayOffSet)
    common.waitForLoaderToDisappear()
    och.assertCampaignOnTable(campaignName, campaignStatus, startDate, endDate, createdDate, createdDate)
  })

  it('should create with only mandatory fields', function () {
    const campaignName = 'Automated Test ' + dayjs()
    const campaignType = 'Fixed Period'
    const startDate = ochNewCampaign.formatDateTime(dayjs().add(1, 'day'))
    const endDate = ochNewCampaign.formatDateTime(dayjs().add(2, 'day'))

    ochNewCampaign.getCampaignNameInput().type(campaignName)
    ochNewCampaign.getCreateEditButton().should('be.disabled')
    ochNewCampaign.selectCampaignType(campaignType)
    ochNewCampaign.getCreateEditButton().should('be.disabled')
    ochNewCampaign.insertDateTime(ochNewCampaign.getCampaignStartDateInput(), startDate)
    ochNewCampaign.getCreateEditButton().should('be.disabled')
    ochNewCampaign.insertDateTime(ochNewCampaign.getCampaignEndDateInput(), endDate)
    ochNewCampaign.getCreateEditButton().should('be.enabled')
    ochNewCampaign.getCreateEditButton().click()
    cy.url().should('match', /r-offer-control-hub$/)
    cy.assertAlert(
      'Campaign Created successfully.' + 'The Campaign ' + campaignName + ' has been successfully created.'
    )
  })

  it('cancel campaign with success', function () {
    const campaignName = 'Automated Test ' + dayjs()
    const campaignType = 'Periodic'
    const startDate = ochNewCampaign.formatDateTime(dayjs().add(1, 'day'))
    const endDate = ochNewCampaign.formatDateTime(dayjs().add(2, 'day'))
    const campaignDescription = campaignName + ' description'

    ochNewCampaign.getCampaignNameInput().type(campaignName)
    ochNewCampaign.selectCampaignType(campaignType)
    ochNewCampaign.insertDateTime(ochNewCampaign.getCampaignStartDateInput(), startDate)
    ochNewCampaign.insertDateTime(ochNewCampaign.getCampaignEndDateInput(), endDate)
    ochNewCampaign.getCampaignDescriptionInput().type(campaignDescription)
    ochNewCampaign.getCancelButton().click()
    common.clickModalButtonByName('Yes, please proceed')
    cy.url().should('match', /r-offer-control-hub$/)
    ochNewCampaign.getNotificationAlert().should('not.exist')
  })

  it('start date should not be in the past', function () {
    const startDate = ochNewCampaign.formatDateTime(dayjs().subtract(8, 'hour').subtract(1, 'minute'))
    ochNewCampaign.insertDateTime(ochNewCampaign.getCampaignStartDateInput(), startDate)
    cy.assertAlert('Start date cannot be in the past.')
  })

  it('end date should not be before start date', function () {
    const startDate = ochNewCampaign.formatDateTime(dayjs().add(3, 'day'))
    const endDate = ochNewCampaign.formatDateTime(dayjs().add(3, 'day').subtract(2, 'minute'))
    ochNewCampaign.insertDateTime(ochNewCampaign.getCampaignStartDateInput(), startDate)
    ochNewCampaign.insertDateTime(ochNewCampaign.getCampaignEndDateInput(), endDate)
    cy.assertAlert('End date must be later than start date.')
  })

  it('should show confirmation alert when leaving unsaved Campaign', function () {
    const campaignName = 'Automated Test Leave Campaign '
    const confirmationTitle = 'Confirmation'
    const confirmationText =
      'Your campaign will not be created if you leave this page. Any unsaved changes will be lost. Are you sure you want to leave without saving?'
    const urlRegex = /r-offer-control-hub\/create$/

    ochNewCampaign.getCampaignNameInput().type(campaignName)
    ochNewCampaign.getCancelButton().click()
    ochNewCampaign.assertAndCancelConfirmationModal(confirmationTitle, confirmationText, urlRegex)

    common.navigateBreadcrumbByString('Offer Control Hub')
    ochNewCampaign.assertAndCancelConfirmationModal(confirmationTitle, confirmationText, urlRegex)

    common.navigateSidebarMenu('Clients')
    ochNewCampaign.assertAndCancelConfirmationModal(confirmationTitle, confirmationText, urlRegex)
  })
})

describe('OCH - SideBar Menu', function () {
  beforeEach(function () {
    cy.intercept('GET', '/api2/features*', {
      fixture: 'och_features.json',
    }).as('featureToggles')
    cy.visitBaseUrl()
    cy.wait('@featureToggles')
  })

  it('SideBarMenu should have OCH when featureToggle is True', function () {
    common.navigateSidebarMenu('Offer Control Hub')
    cy.url().should('contain', '/r-offer-control-hub')
  })
})

describe('OCH - Delete Campaign', function () {
  beforeEach(function () {
    cy.visit('/#/r-offer-control-hub/create')
  })

  it('Should be able to delete a campaign', function () {
    const campaignName = 'Automated Test ' + dayjs()
    const expectedTitle = 'Delete campaign'
    const expectedText =
      'You are deleting campaign ' +
      campaignName +
      '. The action is permanent and cannot be undone. Are you sure you want to proceed?'

    ochNewCampaign.createCampaign(campaignName, dayjs().add(2, 'days'), dayjs().add(4, 'days'))
    common.searchDataTable(campaignName)

    och.deleteCampaign(common.getTableRowByString(campaignName))

    common.assertModalTitleAndText(expectedTitle, expectedText)
    common.clickButtonByName('Delete')
    cy.assertAlert('Campaign Deleted successfully.The Campaign ' + campaignName + ' has been successfully deleted.')
    common.searchDataTable(campaignName)
    common.assertRowNotExist(campaignName)
  })

  it('Should be able to cancel de deletion of a campaign', function () {
    const campaignName = 'Automated Test ' + dayjs()

    ochNewCampaign.createCampaign(campaignName, dayjs().add(2, 'days'), dayjs().add(4, 'days'))
    common.searchDataTable(campaignName)

    och.deleteCampaign(common.getTableRowByString(campaignName))
    common.clickButtonByName('Cancel')
    common.searchDataTable(campaignName)
    common.assertRowExist(campaignName)
  })
})

describe('OCH - Search and Filter Campaign', function () {
  let campaignName
  let startDate
  let endDate

  before(function () {
    cy.visit('/#/r-offer-control-hub/create')
    campaignName = 'Automated Test ' + dayjs()
    startDate = dayjs().add(14, 'days')
    endDate = dayjs().add(21, 'days')

    ochNewCampaign.createCampaign(campaignName, startDate, endDate)
  })

  beforeEach(function () {
    cy.visit('/#/r-offer-control-hub')
  })

  it('All Search and filter element should be visible', function () {
    och.getFilterInactiveCheckbox().parent().should('be.visible')
    och.getFilterInactiveCheckboxText().contains('Show also expired and cancelled campaigns')
    och.getSearchInput().should('be.visible')
    och.assertSearchTypeList(['Name'])
    och.getSearchButton().should('be.visible')
    och.showFilters()
    och.getCustomFilterArea().should('be.visible')
    och.getFilterByNameLabel().should('contain', 'Name')
    och.getFilterByName().should('be.visible')
    och.getFilterByStatusLabel().should('contain', 'Status')
    och.getFilterByStatus().should('be.visible')
    och.getFilterByTypeLabel().should('contain', 'Type')
    och.getFilterByType().should('be.visible')
    och.getFilterByTimeRangeLabel().should('contain', 'Time range (PT)')
    och.getFilterByTimeRange().should('be.visible')
    och.getFilterCreatedLabel().should('contain', 'Created between (PT)')
    och.getFilterCreated().should('be.visible')
    och.getFilterByModifiedLabel().should('contain', 'Modified between (PT)')
    och.getFilterByModified().should('be.visible')
    och.getSaveCustomFilter().should('be.visible')
    och.getResetFilters().should('be.visible')
  })

  it('should be able to search by name', function () {
    common.searchDataTable(campaignName)
    common.assertRowExist(campaignName)
  })

  it('should be possible to show also expired and cancelled campaigns', function () {
    och.getFilterInactiveCheckbox().uncheck()
    och.showFilters()
    cy.fixture('och.json')
      .its('activeStatus')
      .then((list) => {
        och.assertFilterStatusList(list)
      })
    och.getFilterInactiveCheckbox().check()
    och.showFilters()
    cy.fixture('och.json')
      .its('allStatus')
      .then((list) => {
        och.assertFilterStatusList(list)
      })
  })

  it('should be able to filter by name, status and type', function () {
    och.showFilters()
    och.getFilterByName().type(campaignName)
    common.waitForLoaderToDisappear()
    common.assertRowExist(campaignName)
    och.addFilterByType(och.listOfTypes().fixedPeriod)
    common.assertRowExist(campaignName)
    och.addFilterByStatus(och.listOfStatus().defined)
    common.assertRowExist(campaignName)
    och.addFilterByType(och.listOfTypes().evergreen)
    och.addFilterByStatus(och.listOfStatus().live)
    common.assertRowExist(campaignName)
    och.removeFilterWithKeyword(och.listOfTypes().fixedPeriod)
    common.assertRowNotExist(campaignName)
    och.removeFilterWithKeyword(och.listOfTypes().evergreen)
    common.assertRowExist(campaignName)
    och.removeFilterWithKeyword(och.listOfStatus().defined)
    common.assertRowNotExist(campaignName)
    och.removeFilterWithKeyword(och.listOfStatus().live)
    common.assertRowExist(campaignName)
  })

  it('should be able to filter by dates', function () {
    const startDateStr = och.formatDateTime(startDate)
    const endDateStr = och.formatDateTime(endDate)

    och.showFilters()
    och.getFilterByName().type(campaignName)

    och.insertTimeRangeDates(startDateStr, endDateStr)
    common.assertRowExist(campaignName)

    och.insertTimeRangeDates(och.formatDateTime(startDate.add(30, 'days')), och.formatDateTime(endDate.add(30, 'days')))
    common.assertRowNotExist(campaignName)

    och.insertTimeRangeDates(och.formatDateTime(startDate.add(1, 'days')), och.formatDateTime(endDate.add(8, 'days')))
    common.assertRowExist(campaignName)

    och.insertTimeRangeDates(
      och.formatDateTime(startDate.subtract(30, 'days')),
      och.formatDateTime(endDate.subtract(30, 'days'))
    )
    common.assertRowNotExist(campaignName)

    och.insertTimeRangeDates(
      och.formatDateTime(startDate.subtract(3, 'days')),
      och.formatDateTime(endDate.subtract(3, 'days'))
    )
    common.assertRowExist(campaignName)

    och.insertTimeRangeDates(
      och.formatDateTime(startDate.add(2, 'days')),
      och.formatDateTime(endDate.subtract(2, 'days'))
    )
    common.assertRowExist(campaignName)

    och.insertTimeRangeDates(
      och.formatDateTime(startDate.subtract(2, 'days')),
      och.formatDateTime(endDate.add(2, 'days'))
    )
    common.assertRowExist(campaignName)
  })
})

describe('OCH - Campaign Details', function () {
  let campaignName
  let startDate
  let endDate
  let campaignDescription

  before(function () {
    cy.visit('/#/r-offer-control-hub/create')
    cy.intercept('POST', '**/campaigns*').as('campaignCreation')
    campaignName = 'Automated Test ' + dayjs()
    campaignDescription = campaignName + ' description'
    startDate = dayjs().add(2, 'days')
    endDate = dayjs().add(4, 'days')

    ochNewCampaign.createCampaignNoValidation(campaignName, campaignDescription, startDate, endDate)
    cy.wait('@campaignCreation').its('response.body').as('campaignId')
  })

  beforeEach(function () {
    cy.intercept('GET', '**/campaigns*').as('campaignView')
    cy.visit('/#/r-offer-control-hub/' + this.campaignId)
    cy.wait('@campaignView').its('response.body.results').as('results')
  })

  it('All elements should be visible', function () {
    ochCampaignDetails.getBreadcrumb().should('have.text', 'Offer Control Hub')
    ochCampaignDetails.getCampaignName().should('have.text', campaignName)
    ochCampaignDetails.getCampaignId().should('have.text', this.campaignId)
    ochCampaignDetails.getCampaignStatus().should('have.text', 'defined')
    ochCampaignDetails.getCampaignDescription().should('have.text', campaignDescription)
    ochCampaignDetails.getMoreActionsButton().should('be.visible').should('be.enabled')
    ochCampaignDetails.getCampaignEditButton().should('be.visible')
    ochCampaignDetails.getCampaignSubmitButton().should('be.visible')
    ochCampaignDetails.getCampaignType().prev().should('have.text', 'Type: ')
    ochCampaignDetails.getCampaignType().should('have.text', 'Fixed period')
    ochCampaignDetails.getCampaignStartDate().prev().should('have.text', 'Start date (PT): ')
    ochCampaignDetails.getCampaignStartDate().should('have.text', ochCampaignDetails.startEndFormatDateTime(startDate))
    ochCampaignDetails.getCampaignEndDate().prev().should('have.text', 'End date (PT): ')
    ochCampaignDetails.getCampaignEndDate().should('have.text', ochCampaignDetails.startEndFormatDateTime(endDate))
    ochCampaignDetails.assertCreatedAndModifiedDates(this.results[0].createdAt, this.results[0].createdAt)
  })
})
