/* eslint-disable no-undef */
import {Common} from "../page-objects/common-page-objects"
import {Campaign} from "../page-objects/codes-campaign-page-objects"

const common = new Common();
const campaignPage = new Campaign();

let deleteSuccess = false;

before("Setup campaign for tests", function(){
  // Login
  cy.doAuth();

  this.SELECTOR_CAMPAIGN_LIST = campaignPage.campaignListSelector;
  this.baseTitle = "Campaign";
  this.campaignName = `${this.baseTitle} ${Date.now()}`;
  this.licenseName = `${this.baseTitle} Licences ${Date.now()}`

  cy.generateAppId(32).then((id) => {
    this.referenceId = id;
    cy.createLicense(this.licenseName, id, 10, -1, -1).then((id) => {
      this.licenseId = id;
    })
    cy.waitUntil(()=>this.licenseId).then(()=>{
      cy.cleanUpCampaign(this.licenseId);
   
    })
  });
  cy.createCampaign(this.campaignName).then((id) => {
    this.campaignId = id;
  });
});

describe("Game Studio - Campaign", {tags: ["@smoke","@wip"]}, function () {
  context("Activities", function () {
    beforeEach(function(){
      cy.visitBaseUrl();

      // Navigate sidebar and select product
      cy.intercept("**/products").as("waitForProducts");
      common.navigateSidebarMenu("Commerce", "Codes");
      cy.wait("@waitForProducts");

      // Wait for campaigns to load
      cy.intercept("**/campaigns**").as("waitForCampaigns");
      common.selectProduct();
      cy.wait("@waitForCampaigns");
      common.waitForLoaderToDisappear();
    });

    it("Should create a campaign", {tags: "@smoke"}, function () {
      this.createdCampaignName = `${this.baseTitle} ${Date.now()}`;

      common.clickButtonByName("Create Campaign");
      common.waitForModal().within(() => {
        campaignPage.inputDescription(this.createdCampaignName, `${this.baseTitle} Description`, "tag1 tag2 ");
  
        // Intercept response to get campaignId
        cy.intercept("POST", "api/codes/campaigns", (req) => {
          req.on('after:response', (res) => {
            this.createdCampaignId = res.body.data.id;
          });
        }).as("waitForSave");
        common.clickButtonByName("Save");
      });

      cy.wait("@waitForSave").then((res) => {
        expect(res.response.statusCode).to.equal(201);
      });

      common.assertRowExist(this.createdCampaignName, this.SELECTOR_CAMPAIGN_LIST);

      // Clean up created campaign
      cy.waitUntil(() => this.createdCampaignId).then(() => {
        cy.deleteCampaign(this.createdCampaignId);
      });
    });

    it("Should display a list of campaigns", {tags: "@smoke"}, function () {
      common.getRowLength(this.SELECTOR_CAMPAIGN_LIST).then((length) => {
        expect(length).to.be.greaterThan(0);
      });
    });

    it("Should view a campaign", {tags: "@smoke"}, function () {
      common.getTableRowByString(this.campaignName, this.SELECTOR_CAMPAIGN_LIST).then((row) => {
        common.clickView(row);
      });
      
      common.waitForModal().within(() => {
        common.getModalSubtitle().then(($subtitle) => {
          expect($subtitle.text()).to.include(this.campaignId);
          expect($subtitle.text()).to.include(this.campaignName);
        });

        common.clickButtonByName("Close");
      });
    });

    it("Should edit a campaign", {tags: "@smoke"}, function () {
      common.getTableRowByString(this.campaignName, this.SELECTOR_CAMPAIGN_LIST).then((row) => {
        common.clickEdit(row);
      });

      this.newCampaignName = `Updated ${this.baseTitle} ${Date.now()}`;

      common.waitForModal().within(() => {
        campaignPage.inputDescription(this.newCampaignName, `Updated ${this.baseTitle} Description`, "tag2 ");

        cy.intercept("PUT", "**/campaigns/**").as("waitForSave");
        common.clickButtonByName("Save");
      });

      cy.wait("@waitForSave").then((res) => {
        if(res.response.statusCode == 204){
          this.campaignName = this.newCampaignName;
        }
        expect(res.response.statusCode).to.equal(204);
      });

      common.assertRowExist(this.newCampaignName, this.SELECTOR_CAMPAIGN_LIST);
    });
    
    it("Should clone a campaign", {tags: "@smoke"}, function () {
      common.getTableRowByString(this.campaignName, this.SELECTOR_CAMPAIGN_LIST).then((row) => {
        common.clickClone(row);
      });
      
      this.clonedCampaignName = `Cloned ${this.baseTitle} ${Date.now()}`;

      common.waitForModal().within(() => {
        campaignPage.inputDescription(this.clonedCampaignName, `Cloned ${this.baseTitle} Description`, "tag3 ");

        cy.intercept("POST", "api/codes/campaigns", (req) => {
          req.on('after:response', (res) => {
            this.clonedCampaignId = res.body.data.id;
          });
        }).as("waitForSave");
        common.clickButtonByName("Save");
      });

      cy.wait("@waitForSave").then((res) => {
        expect(res.response.statusCode).to.equal(201);
      });

      common.assertRowExist(this.clonedCampaignName, this.SELECTOR_CAMPAIGN_LIST);

      // Clean up cloned campaign
      cy.waitUntil(() => this.clonedCampaignId).then(() => {
        cy.deleteCampaign(this.clonedCampaignId);
      });
    });

    it("Should view campaign history", {tags: "@smoke"}, function () {
      common.getTableRowByString(this.campaignName, this.SELECTOR_CAMPAIGN_LIST).within((row) => {
        cy.intercept("GET", "**/history").as("waitForHistory");
        common.clickHistory(row);
      });

      cy.wait("@waitForHistory").then((res) => {
        expect(res.response.statusCode).to.equal(200);
      });

      common.waitForModal().within(() => {
        common.getRowLength().then((length) => {
          expect(length).to.be.greaterThan(0);
        });
        
        common.clickButtonByName("Close");
      });
    });

    it("Should delete a campaign", {tags: "@smoke"}, function () {
      common.getTableRowByString(this.campaignName, this.SELECTOR_CAMPAIGN_LIST).within((row) => {
        common.clickTrash(row);
      })

      common.waitForModal().within(() => {
        common.clickButtonByName("Delete");
      });

      cy.intercept("DELETE", "**/campaigns/**").as("waitForDelete");
      common.waitForModal(1).within(() => {
        common.clickButtonByName("Yes");
      });

      cy.wait("@waitForDelete").then((res) => {
        if(res.response.statusCode == 204){
          deleteSuccess = true;
        }
        
        expect(res.response.statusCode).to.equal(204);
      });
      
      common.assertRowNotExist(this.campaignName, this.SELECTOR_CAMPAIGN_LIST);
    });
  });
});

after("Clean up campaign", function(){
  if(!deleteSuccess){
    cy.deleteCampaign(this.campaignId);
  }
  cy.deleteLicense(this.licenseId);
});