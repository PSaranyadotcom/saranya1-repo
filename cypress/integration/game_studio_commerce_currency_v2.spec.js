/* eslint-disable no-undef */
import {Common} from "../page-objects/common-ant-page-objects"
import {Currency} from "../page-objects/currency-v2-page-objects"

const common = new Common();
const currencyPage = new Currency();
let createdCurrencyDeleteSuccess=false;
let deleteSuccess = false;

before("Setup currency for tests", function(){
  // Login
  cy.doAuth();
  cy.cleanUpCurrency();

  this.SELECTOR_CURRENCY_LIST = currencyPage.currencyListSelector;
  this.baseTitle = "Currency";
  this.currencyName = `${this.baseTitle} ${Date.now()}`;
  cy.generateCurrencyCode().then((code) => {
    this.currencyCode = code;
  });

  cy.waitUntil(() => this.currencyCode).then(() => {
    cy.createCurrency(this.currencyName, this.currencyCode).then((id) => {
      this.currencyId = id;
    });
  });
});


describe("Game Studio - Currency", {tags: ["@smoke"]}, function () {
  context("Activities", function () {
    beforeEach(function () {
      cy.visitBaseUrl();

      // Navigate sidebar and select product
      cy.intercept("**/products").as("waitForProducts");
      common.navigateSidebarMenu("Commerce", "Currency");
      cy.wait("@waitForProducts");

      // Wait for currencies
      cy.intercept("**/currencies**").as("waitForCurrencies")
      common.selectProduct();
      cy.wait("@waitForCurrencies");
      common.waitForLoaderToDisappear();
    });

    it("Should create a currency", {tags: "@smoke"}, function () {
      this.createdCurrencyName = `${this.baseTitle} ${Date.now()}`;
      cy.generateCurrencyCode().then((code) => {
        this.createdCurrencyCode = code;
        common.clickButtonByName("New Currency");
        currencyPage.selectInventory("2K");
        currencyPage.inputCurrency(this.createdCurrencyName, this.createdCurrencyCode, `${this.baseTitle} Description`);
      });

      cy.intercept("POST", "**/wallet/currencies**", (req) => {
        req.on("after:response", (res) => {
          this.createdCurrencyId = res.body.data.id;
        });
      }).as("waitForSave");
      common.clickButtonByName("Create Currency");

      cy.wait("@waitForSave").then((res) => {
        expect(res.response.statusCode).to.equal(201);
      });

      common.searchDataTable(this.createdCurrencyName);
      common.assertRowExist(this.createdCurrencyName, this.SELECTOR_CURRENCY_LIST);

      // Clean up created currency
      cy.waitUntil(() => this.createdCurrencyId).then(() => {
        cy.deleteCurrency(this.createdCurrencyId);
      });
    });

    it("Should display a list of currencies", {tags: "@smoke"}, function () {
      common.getRowLength(this.SELECTOR_CURRENCY_LIST).then((length) => {
        expect(length).to.be.greaterThan(0);
      });
    });

    it("Should view a currency", {tags: "@smoke"}, function () {
      common.searchDataTable(this.currencyName);
      common.getTableRowByString(this.currencyName, this.SELECTOR_CURRENCY_LIST).within((row) => {
        common.clickExpand();
      });

      currencyPage.assertCurrencyDescription();
      common.clickCollapse();
    });

    it("Should edit a currency", {tags: "@smoke"}, function () {
      common.searchDataTable(this.currencyName);
      common.getTableRowByString(this.currencyName, this.SELECTOR_CURRENCY_LIST).within((row) => {
        common.clickEdit();
      });

      this.newCurrencyName = `Updated ${this.baseTitle} ${Date.now()}`;

      common.waitForModal().within(() => {
        currencyPage.editCurrency(this.newCurrencyName, `Updated ${this.baseTitle} Description`);
  
        cy.intercept("PUT", "**/currencies/**").as("waitForSave");
        common.clickButtonByName("Save");
      });

      cy.wait("@waitForSave").then((res) => {
        if(res.response.statusCode == 204){
          this.currencyName = this.newCurrencyName;
          this.currencyCode = this.newCurrencyCode;
        }
        expect(res.response.statusCode).to.equal(204);
      });

      common.searchDataTable(this.newCurrencyName)
      common.assertRowExist(this.newCurrencyName, this.SELECTOR_CURRENCY_LIST);
    });

    it("Should view currency history", {tags: "@smoke"}, function () {
      common.searchDataTable(this.currencyName)
      common.getTableRowByString(this.currencyName, this.SELECTOR_CURRENCY_LIST).within((row) => {
        cy.intercept("GET", "**/history**").as("waitForHistory");
        currencyPage.clickHistory();
      });

      cy.wait("@waitForHistory").then((res) => {
        expect(res.response.statusCode).to.equal(200);
      });

      common.waitForModal().within(() => {
        common.getRowLength().then((length) => {
          expect(length).to.be.greaterThan(0);
        });
        currencyPage.closeHistory();
      });
    });

    it("Should delete a currency", {tags: "@smoke"}, function () {
      common.searchDataTable(this.currencyName);
      common.getTableRowByString(this.currencyName, this.SELECTOR_CURRENCY_LIST).within((row) => {
        common.clickTrash();
      });

      cy.intercept("DELETE", "**/currencies/**").as("waitForDelete");

      common.waitForModal().within(() => {
        common.clickButtonByName("Delete");
      });
      
      cy.wait("@waitForDelete").then((res) => {
        if(res.response.statusCode == 204){
          deleteSuccess = true;
        }
        expect(res.response.statusCode).to.equal(204)
      });

      common.searchDataTable(this.currencyName);
      common.assertRowNotExist(this.currencyName, this.SELECTOR_CURRENCY_LIST);
    });
  });
});

after("Clean up currency", function(){
  if(!deleteSuccess){
    cy.deleteCurrency(this.currencyId);
  }
});