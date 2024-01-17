/* eslint-disable no-undef */
import {Common} from "../page-objects/common-ant-page-objects"
import {Titles} from "../page-objects/fps-titles-page-objects"
import {Offers} from "../page-objects/fps-offers-page-objects"
import {Entitlements} from "../page-objects/fps-entitlements-page-objects"
// import cypress from "cypress";

const common = new Common();
const titlesPage = new Titles();
const offersPage = new Offers();
const entitlementsPage = new Entitlements();

before("Login and get feature flags", function(){
  cy.doAuth();
  cy.getFeatureFlags().then((values) => {
    this.featureFlags = values;
  });
});

describe("Game Studio - First Party Store", function(){
  describe("Smoke Tests", {tags: "@smoke"}, function(){
    describe("Titles Smoke Tests", {tags: "@smoke"}, function(){
      before("Setup", function() {
        this.baseTitle = "Title";
        this.titleName = `${this.baseTitle} ${Date.now()}`;
        this.deleteSuccess = false;
        this.titleId = "";
        cy.cleanUpExistingFPSTitles();
      });
  
      beforeEach(function(){
        cy.visitBaseUrl();
        cy.intercept("api/eyewash/titles/list/").as("waitForTitles");
        cy.intercept("api/products").as("waitForProducts");
        common.navigateSidebarMenu("First Party Store", "Titles");
        cy.wait("@waitForTitles");
        common.waitForLoaderToDisappear();
      });
  
      it("Should create a title", {tags: "@smoke"}, function(){ 
        titlesPage.clickNewTitle();
  
        // Details Page
        titlesPage.inputName(this.titleName);
        titlesPage.selectProductInForm("Test Product Cypress 2");
        titlesPage.inputDescription(`${this.baseTitle} Description`);

        // Intercept response to get titleId
        cy.intercept("POST", "api/eyewash/titles/", (req) => {
          req.on("after:response", (res) => {
            this.titleId = res.body.id;
          });
        }).as("waitForSave");
        common.clickButtonByName("Create");
  
        cy.assertAlert(`${this.titleName} was created`);
        cy.wait("@waitForSave").then((res) => {
          expect(res.response.statusCode).to.equal(201);
        });
  
        common.navigateBreadcrumbByString("First Party");
        common.searchDataTable(this.titleName);
        common.assertRowExist(this.titleName);
      });
  
      it("Should display a list of titles", {tags: "@smoke"}, function(){
        common.getRowLength().then((length) => {
          expect(length).to.be.greaterThan(0);
        });
      });

      it("Should view a title", {tags: "@smoke"}, function(){
        common.searchDataTable(this.titleName);
        common.getTableRowByString(this.titleName).within(() => {
          cy.intercept(`api/eyewash/titles/${this.titleId}`).as("waitForTitle");
          titlesPage.clickView();
          cy.wait("@waitForTitle");
        });
        titlesPage.assertTitleInfo(this.titleName, this.titleId);
      });
  
      it("Should edit a title", {tags: ["@smoke"]}, function(){
        common.searchDataTable(this.titleName);
        common.getTableRowByString(this.titleName).within(() => {
          titlesPage.clickView();
        });
 
        this.newTitleName = `Updated ${this.baseTitle} ${Date.now()}`;
  
        common.clickEdit();
        common.waitForModal().within(() => {
          titlesPage.inputName(this.newTitleName);
          titlesPage.inputDescription(`Updated ${this.baseTitle} Description`);
          cy.intercept("PUT", `api/eyewash/titles/${this.titleId}`).as("waitForSave");
          common.clickButtonByName("Save");
          cy.wait("@waitForSave").then((res) => {
            if(res.response.statusCode == 200){
              this.titleName = this.newTitleName;
            }
            expect(res.response.statusCode).to.equal(200);
          });
        });
        
        common.clickStoreContainer("Steam");
        titlesPage.inputSteamStoreData();
        cy.intercept("POST", `api/eyewash/titles/${this.titleId}/stores/**`).as("waitForSave");
        common.clickButtonByName("Save");
        cy.wait("@waitForSave").then((res) => {
          expect(res.response.statusCode).to.equal(201);
        });
        
        common.navigateBreadcrumbByString("First Party");
      });
  
      it("Should delete a title", {tags: "@smoke"}, function(){  
        common.selectPaginationLimit(100);
        common.getTableRowByString(this.titleName).within(() => {
          common.clickTrash();
        });
  
        common.waitForModal().within(() => {
          cy.intercept("DELETE", `api/eyewash/titles/${this.titleId}/`).as("waitForDelete");
          common.clickButtonByName("Delete");
        });
  
        cy.assertAlert(`Title deleted`);
        cy.wait("@waitForDelete").then((res) => {
          if(res.response.statusCode == 204){
            this.deleteSuccess = true;
          }
          expect(res.response.statusCode).to.equal(204);
        });
  
        common.waitForLoaderToDisappear();
        common.searchDataTable(this.titleName);
        common.assertRowNotExist(this.titleName);
      });

      after("Clean up", function(){
        if(!this.deleteSuccess){
          cy.deleteFPSTitle(this.titleId);
        }
      });
    });
    
    describe("Offers Smoke Tests", {tags: "@smoke"}, function(){
      before("Setup", function() {
        this.baseTitle = "Offer";
        this.offerName = `${this.baseTitle} ${Date.now()}`;
        this.deleteSuccess = false;

        cy.createFPSOffer(this.offerName).then((id) => {
          this.offerId = id;
        });
      });
  
      beforeEach(function(){
        cy.visitBaseUrl();
  
        cy.intercept("api/eyewash/offers/list/").as("waitForOffers");
        cy.intercept("api2/products").as("waitForProducts");
        common.navigateSidebarMenu("First Party Store", "Offers");
        cy.wait("@waitForProducts");
        common.selectProduct();
        cy.wait("@waitForOffers");
        common.waitForLoaderToDisappear();
      });
  
      it("Should create an offer", {tags: "@smoke"}, function(){
        this.createdOfferName = `${this.baseTitle} ${Date.now()}`;

        offersPage.clickNewOffer();
  
        // Details Page
        offersPage.inputName(this.createdOfferName);
        offersPage.selectOfferType("In Game");
        offersPage.inputDescription(`${this.baseTitle} Description`);

        // Intercept response to get offerId
        cy.intercept("POST", "api/eyewash/offers/", (req) => {
          req.on("after:response", (res) => {
            this.createdOfferId = res.body.id;
          });
        }).as("waitForSave");
        common.clickButtonByName("Create");
  
        //cy.assertAlert(`${this.createdOfferName} was created`);
        cy.wait("@waitForSave").then((res) => {
          expect(res.response.statusCode).to.equal(201);
        });
  
        common.navigateBreadcrumbByString("Offers");
        common.searchDataTable(this.createdOfferName);
        common.assertRowExist(this.createdOfferName);

        // Clean up created offer
        cy.waitUntil(() => this.createdOfferId).then(() => {
          cy.deleteFPSOffer(this.createdOfferId);
        });
      });
  
      it("Should display a list of offer", {tags: "@smoke"}, function(){
        common.getRowLength().then((length) => {
          expect(length).to.be.greaterThan(0);
        });
      });
  
      it("Should view an offer", {tags: "@smoke"}, function(){
        common.searchDataTable(this.offerName);
        common.getTableRowByString(this.offerName).within(() => {
          cy.intercept(`api/eyewash/offers/${this.offerId}`).as("waitForOffer");
          offersPage.clickView();
          cy.wait("@waitForOffer");
        });

        offersPage.assertOfferInfo(this.offerName, this.offerId);
      });
  
      it("Should edit an offer", {tags: ["@smoke"]}, function(){
        common.searchDataTable(this.offerName);
        common.getTableRowByString(this.offerName).within(() => {
          offersPage.clickView();
        });
  
        this.newOfferName = `Updated ${this.baseTitle} ${Date.now()}`;
  
        common.clickEdit();
        common.waitForModal().within(() => {
          offersPage.inputName(this.newOfferName);
          offersPage.selectOfferType("Cross Game");
          offersPage.inputDescription(`Updated ${this.baseTitle} Description`);
          cy.intercept("PUT", `api/eyewash/offers/${this.offerId}`).as("waitForSave");
          common.clickButtonByName("Save");
          cy.wait("@waitForSave").then((res) => {
            if(res.response.statusCode == 200){
              this.offerName = this.newOfferName;
            }
            expect(res.response.statusCode).to.equal(200);
          });
        });
        
        common.clickStoreContainer("Steam");
        offersPage.inputSteamStoreData(common.newUUID());
        cy.intercept("POST", `api/eyewash/offers/${this.offerId}/stores/**`).as("waitForSave");
        common.clickButtonByName("Save");
        cy.wait("@waitForSave").then((res) => {
          expect(res.response.statusCode).to.equal(201);
        });
        
        common.navigateBreadcrumbByString("Offers");
      });
  
      it("Should delete an offer", {tags: ["@smoke"]}, function(){  
        common.selectPaginationLimit(100);
        common.getTableRowByString(this.offerName).within(() => {
          common.clickTrash();
        });
  
        common.waitForModal().within(() => {
          cy.intercept("DELETE", `api/eyewash/offers/${this.offerId}`).as("waitForDelete");
          common.clickButtonByName("OK");
        });

        //cy.assertAlert(`Offer deleted`);
        cy.wait("@waitForDelete").then((res) => {
          if(res.response.statusCode == 204){
            this.deleteSuccess = true;
          }
          expect(res.response.statusCode).to.equal(204);
        });
  
        common.waitForLoaderToDisappear();
        common.selectPaginationLimit(100);
        common.assertRowNotExist(this.offerName);
      });

      after("Clean up", function(){
        if(!this.deleteSuccess){
          cy.deleteFPSOffer(this.offerId);
        }
      });
    });

    describe("Entitlements Smoke Tests", {tags: "@smoke"}, function(){
      before("Setup", function() {
        this.baseTitle = "Entitlement";
        this.entitlementName = `${this.baseTitle} ${Date.now()}`;
        this.deleteSuccess = false;
        cy.cleanUpExistingEntitlement().then(()=>{
          cy.createFPSEntitlement(this.entitlementName).then((id) => {
            this.entitlementId = id;
          });
        });     
      });
  
      beforeEach(function(){
        cy.visitBaseUrl();
  
        cy.intercept("api/eyewash/entitlements/list/").as("waitForEntitlements");
        cy.intercept("api2/products").as("waitForProducts");
        common.navigateSidebarMenu("First Party Store", "Entitlements");
        cy.wait("@waitForProducts");
        common.selectProduct();
        cy.wait("@waitForEntitlements");
        common.waitForLoaderToDisappear();
      });
  
      it("Should create an entitlement", {tags: "@smoke"}, function(){
        this.createdEntitlementName = `${this.baseTitle} ${Date.now()}`;

        entitlementsPage.clickNewEntitlement();
  
        // Details Page
        entitlementsPage.inputName(this.createdEntitlementName);
        entitlementsPage.inputDescription(`${this.baseTitle} Description`);
        entitlementsPage.toggleDLC();

        // Intercept response to get entitlementId
        cy.intercept("POST", "api/eyewash/entitlements/", (req) => {
          req.on("after:response", (res) => {
            this.createdEntitlementId = res.body.id;
          });
        }).as("waitForSave");
        common.clickButtonByName("Create");
        
        //cy.assertAlert(`${this.createdEntitlementName} was created`);
        cy.wait("@waitForSave").then((res) => {
          expect(res.response.statusCode).to.equal(201);
        });
        
        common.navigateBreadcrumbByString("Entitlements");
        common.searchDataTable(this.createdEntitlementName);
          common.assertRowExist(this.createdEntitlementName);

          // Clean up created entitlement
          cy.waitUntil(() => this.createdEntitlementId).then(() => {
            cy.deleteFPSEntitlement(this.createdEntitlementId);
          });
      });
  
      it("Should display a list of entitlements", {tags: "@smoke"}, function(){
        common.getRowLength().then((length) => {
          expect(length).to.be.greaterThan(0);
        });
      });
  
      it("Should view an entitlement", {tags: "@smoke"}, function(){
        common.searchDataTable(this.entitlementName);
        common.getTableRowByString(this.entitlementName).within(() => {
          cy.intercept(`api/eyewash/entitlements/${this.entitlementId}`).as("waitForEntitlement");
          entitlementsPage.clickView();
          cy.wait("@waitForEntitlement");
        });

        entitlementsPage.assertEntitlementInfo(this.entitlementName, this.entitlementId);
      });
  
      it("Should edit an entitlement", {tags: "@smoke"}, function(){
            common.searchDataTable(this.entitlementName);
            common.getTableRowByString(this.entitlementName).within(() => {
          entitlementsPage.clickView();
        });

        // Doesn't have 'Updated' in the name because it puts the name over 32 characters
        this.newEntitlementName = `${this.baseTitle} ${Date.now()}`;
  
        common.clickEdit();
        common.waitForModal().within(() => {
          entitlementsPage.inputName(this.newEntitlementName);
          entitlementsPage.inputDescription(`Updated ${this.baseTitle} Description`);
          entitlementsPage.toggleDLC();
          cy.intercept("PUT", `api/eyewash/entitlements/${this.entitlementId}`).as("waitForSave");
          common.clickButtonByName("Save");
          cy.wait("@waitForSave").then((res) => {
            if(res.response.statusCode == 200){
              this.entitlementName = this.newEntitlementName;
            }
            expect(res.response.statusCode).to.equal(200);
          });
    
             });
        
        common.clickStoreContainer("Steam");
        entitlementsPage.inputSteamStoreData(common.newUUID(), true);
        cy.intercept("POST", `api/eyewash/entitlements/${this.entitlementId}/stores/**`).as("waitForSave");
        common.clickButtonByName("Save");
        cy.wait("@waitForSave").then((res) => {
          expect(res.response.statusCode).to.equal(201);
        });
        common.navigateBreadcrumbByString("Entitlements");
      });
  
      it("Should delete an entitlement", {tags: ["@smoke"]}, function(){  
        common.searchDataTable(this.entitlementName);
        common.getTableRowByString(this.entitlementName).within(() => {
          common.clickTrash();
        });
  
        common.waitForModal().within(() => {
          cy.intercept("DELETE", `api/eyewash/entitlements/${this.entitlementId}`).as("waitForDelete");
          common.clickButtonByName("OK");
        });

        //cy.assertAlert(`Entitlement deleted`);
        cy.wait("@waitForDelete").then((res) => {
          if(res.response.statusCode == 204){
            this.deleteSuccess = true;
          }
          expect(res.response.statusCode).to.equal(204);
        });
        common.waitForLoaderToDisappear();
        common.searchDataTable(this.entitlementName);
        common.assertRowNotExist(this.entitlementName);
      });

      after("Clean up", function(){
        if(!this.deleteSuccess){
          cy.deleteFPSEntitlement(this.entitlementId);
        }
      });
    });
  });

  describe("Regression Tests", {tags: ["@regression"]}, function(){
    describe("Entitlements Regression Tests", {tags: "@regression"}, function(){
      before("Setup", function() {
        this.baseTitle = "Entitlement";
        this.entitlementName = `${this.baseTitle} ${Date.now()}`;
        this.deleteSuccess = false;

        cy.createFPSEntitlement(this.entitlementName).then((id) => {
          this.entitlementId = id;
        });
      });
  
      beforeEach(function(){
        cy.visitBaseUrl();
  
        cy.intercept("api/eyewash/entitlements/list/").as("waitForEntitlements");
        cy.intercept("api2/products").as("waitForProducts");
        common.navigateSidebarMenu("First Party Store", "Entitlements");
        cy.wait("@waitForProducts");
        common.selectProduct();
        cy.wait("@waitForEntitlements");
        common.waitForLoaderToDisappear();
      });
  
      it("Should add Epic store data to an entitlement", {tags: ["@regression", "bug_in_code"]}, function(){
        common.searchDataTable(this.entitlementName);
        common.getTableRowByString(this.entitlementName).within(() => {
          entitlementsPage.clickView();
        });

        this.sandboxName = `${this.baseTitle} Sandbox ${Date.now()}`;
        this.sandboxId = common.newUUID();
        this.itemId = common.newUUID();
        
        common.clickStoreContainer("Epic Games");
        common.clickButtonByName("Manage sandboxes");
        common.waitForModal().within(() => {
          common.clickButtonByName("Add");
          entitlementsPage.inputEpicSandboxData(this.sandboxName, this.sandboxId);
          cy.intercept("POST", "api/eyewash/sandboxes/", (req) => {
            req.on("after:response", (res) => {
              this.createdSandboxId = res.body.id;
            });
          }).as("waitForSandboxSave");
          common.clickPlus();
          common.clickButtonByName("Save");
        });
        cy.wait("@waitForSandboxSave").then((res) => {
          expect(res.response.statusCode).to.equal(201);
        });
        entitlementsPage.inputEpicStoreData(this.sandboxName, this.itemId);
        cy.intercept("POST", `api/eyewash/entitlements/${this.entitlementId}/stores/**`).as("waitForSave");
        common.clickButtonByName("Save");
        cy.wait("@waitForSave").then((res) => {
          expect(res.response.statusCode).to.equal(201);
        });
        common.clickButtonByName("Back to stores");
        common.getStoreContainer("Epic Games").within(() => {
          common.assertTagSuccess();
        });
        
        common.navigateBreadcrumbByString("Entitlements");
        
        cy.waitUntil(() => this.createdSandboxId).then(() => {
          cy.deleteSandbox(this.createdSandboxId);
        });
      });

      it("Should add Xbox store data to an entitlement", {tags: "@regression"}, function(){
        common.searchDataTable(this.entitlementName);
        common.getTableRowByString(this.entitlementName).within(() => {
          entitlementsPage.clickView();
        });

        this.productId = common.newUUID();
        
        common.clickStoreContainer("Xbox One");
        entitlementsPage.inputXboxStoreData(this.productId);
        cy.intercept("POST", `api/eyewash/entitlements/${this.entitlementId}/stores/**`).as("waitForSave");
        common.clickButtonByName("Save");
        cy.wait("@waitForSave").then((res) => {
          expect(res.response.statusCode).to.equal(201);
        });
        common.clickButtonByName("Back to stores");
        common.getStoreContainer("Xbox One").within(() => {
          common.assertTagSuccess();
        });
        
        common.navigateBreadcrumbByString("Entitlements");
      });

      it("Should add Steam store data to an entitlement", {tags: "@regression"}, function(){
        common.searchDataTable(this.entitlementName);
        common.getTableRowByString(this.entitlementName).within(() => {
          entitlementsPage.clickView();
        });

        this.itemDefId = common.newUUID();
        
        common.clickStoreContainer("Steam");
        entitlementsPage.inputSteamStoreData(this.itemDefId);
        cy.intercept("POST", `api/eyewash/entitlements/${this.entitlementId}/stores/**`).as("waitForSave");
        common.clickButtonByName("Save");
        cy.wait("@waitForSave").then((res) => {
          expect(res.response.statusCode).to.equal(201);
        });
        common.clickButtonByName("Back to stores");
        common.getStoreContainer("Steam").within(() => {
          common.assertTagSuccess();
        });
        
        common.navigateBreadcrumbByString("Entitlements");
      });

      it("Should add PSN store data to an entitlement", {tags: "@regression"}, function(){
        common.searchDataTable(this.entitlementName);
        common.getTableRowByString(this.entitlementName).within(() => {
          entitlementsPage.clickView();
        });

        this.productLabel = `Label ${Date.now()}`;
        
        common.clickStoreContainer("PlayStation 4");

        cy.intercept("POST", `api/eyewash/entitlements/${this.entitlementId}/stores/**`).as("waitForSave");
        entitlementsPage.inputPSNStoreData("SCEA", this.productLabel);
        common.clickButtonByName("Save");
        cy.wait("@waitForSave").then((res) => {
          expect(res.response.statusCode).to.equal(201);
        });
        common.getStoreContainer("SCEA").within(() => {
          common.assertTagSuccess();
        });

        entitlementsPage.inputPSNStoreData("SCEE", this.productLabel);
        common.clickButtonByName("Save");
        cy.wait("@waitForSave").then((res) => {
          expect(res.response.statusCode).to.equal(201);
        });
        common.getStoreContainer("SCEE").within(() => {
          common.assertTagSuccess();
        });

        entitlementsPage.inputPSNStoreData("SCEJ", this.productLabel);
        common.clickButtonByName("Save");
        cy.wait("@waitForSave").then((res) => {
          expect(res.response.statusCode).to.equal(201);
        });
        common.getStoreContainer("SCEJ").within(() => {
          common.assertTagSuccess();
        });

        common.clickButtonByName("Back");
        common.getStoreContainer("PlayStation 4").within(() => {
          common.assertTagSuccess();
        });
        
        common.navigateBreadcrumbByString("Entitlements");
      });

      it("Should add Nintendo store data to an entitlement", {tags: "@regression"}, function(){
        common.searchDataTable(this.entitlementName);
        common.getTableRowByString(this.entitlementName).within(() => {
          entitlementsPage.clickView();
        });

        this.itemId = common.newUUID();
        
        common.clickStoreContainer("Nintendo");
        entitlementsPage.inputNintendoStoreData(this.itemId);
        cy.intercept("PUT", `api/eyewash/entitlements/${this.entitlementId}/nintendoGlobalData/`).as("waitForSave");
        common.clickButtonByName("Save");
        cy.wait("@waitForSave").then((res) => {
          expect(res.response.statusCode).to.equal(204);
        });
        common.clickButtonByName("Back");
        common.getStoreContainer("Nintendo").within(() => {
          common.assertTagSuccess();
        });
        
        common.navigateBreadcrumbByString("Entitlements");
      });

      after("Clean up", function(){
        if(!this.deleteSuccess){
          cy.deleteFPSEntitlement(this.entitlementId);
        }
      });
    });
  });
});
