/* eslint-disable no-undef */
import {Common} from "../page-objects/common-ant-page-objects"
import {Item} from "../page-objects/items-v2-page-objects"

const common = new Common();
const itemPage = new Item();
const productId = Cypress.env("productId");
const entitlementsBaseUrl = Cypress.env("entitlementsBaseUrl");
const ecommerceBasicAuth = Cypress.env("ecommerceBasicAuth");
let deleteSuccess = false;
let deleteGrantedEntlment=false;

before("Setup item for tests", function(){
  // Login
  cy.CleanUpItems();
  cy.doAuth();
  cy.getFeatureFlags().then((values) => {
    this.featureFlags = values;
  });

  this.SELECTOR_ITEMS_LIST = itemPage.itemListSelector;
  this.baseTitle = "Item";
  this.itemName = `${this.baseTitle} ${Date.now()}`;
  this.emailAddress = `ctpshared+${Date.now()}@gmail.com`;
  this.transformationItemName = `${this.baseTitle} Transformation ${Date.now()}`;
  this.transformationSkuName = `${this.baseTitle} SKU ${Date.now()}`;

  // Create item for transformation test
  cy.createItem(this.transformationItemName, 3, "uses", 5,"inventory",3).then((id) => {
    this.transformationItemId = id;
  });

  // Create SKU for transformation test
  cy.createSKUWithoutStore(this.transformationSkuName).then((id) => {
    this.transformationSkuId = id;
  });

  // Create item
  cy.waitUntil(() => this.transformationItemId && this.transformationSkuId).then(() => {
    cy.request({
      method: "POST",
      url: entitlementsBaseUrl + "/items",
      headers: {
        "Content-Type": "application/json",  
        "Authorization": "Basic " + ecommerceBasicAuth
      },
      body: {
        "productId": productId,
        "name": this.itemName,
        "description": "description",
        "tags": ["tag1"],
        "type": 3,
        "uses": 5,
        "inventory":3,
        "customData": "{}",
        "sellbackValues": [
          {
            "currency": "TST",
            "amount": 10
          }
        ],
        "transformations": [
          {
              "type": 0,
              "itemId": this.transformationItemId,
              "quantity": 1
          },
          {
              "type": 1,
              "skuId": this.transformationSkuId,
              "quantity": 1
          },
          {
              "type": 2,
              "currency": "TST",
              "amount": 10
          }
        ]
      }
    }).then((res) => {
      cy.parseIdFromHeader(res).then((id) => {
        this.itemId = id;
      });
    });
  });

  cy.createFullAccount(this.emailAddress).then((id) => {
    this.fullPublicId = id;
  });
  cy.waitUntil(() => this.fullPublicId && this.itemId).then(() => {
  cy.grantEntitlements(this.fullPublicId,this.itemId).then((id)=>{
    this.grantedEntitlementId=id;
  })
})
});

describe("Game Studio - Items", {tags: "@smoke"}, function() {
  context("CRUD & Clone Consumable Non-Unique Item", function() {
    beforeEach(function () {
      cy.doAuth();
      cy.visitBaseUrl();

      cy.intercept("**/products").as("waitForProducts");
      itemPage.navigateToItems();

      cy.wait("@waitForProducts").then(() => {
        cy.intercept("GET", "**/entitlements/items**").as("waitForitems");
        common.selectProduct();
      });
      
      cy.wait("@waitForitems");
      common.waitForLoaderToDisappear();
    });

    it("Should create a consumable non-unique item", {tags: "@smoke"}, function() {
      this.createdItemName = `${this.baseTitle} ${Date.now()}`;

      itemPage.clickNewItem();

      itemPage.inputName(this.createdItemName);
      itemPage.selectItemType("Consumable");
      itemPage.intrinsicValue(20)
      itemPage.inputUses();
      itemPage.inputDescription(`${this.baseTitle} Description`);
      itemPage.inputTag("tag1 tag2 ");
      itemPage.inputCustomData();
 
      cy.intercept("POST", "/api/entitlements/items", (req) => {
        req.on("after:response", (res) => {
          this.createdItemId = res.body.data.id;
        });
      }).as("waitForSave");
      itemPage.clickCreateItem();
      cy.assertAlert("Item created.");
      
      cy.wait("@waitForSave").then((res) => {
        expect(res.response.statusCode).to.equal(201);
      });
       
      common.searchDataTable(this.createdItemName);
      common.assertRowExist(this.createdItemName, this.SELECTOR_ITEMS_LIST);
      // Clean up created item
      cy.waitUntil(() => this.createdItemId).then(() => {
        cy.deleteItem(this.createdItemId);
      });
    });

    it("Should display a list of items", {tags: "@smoke"}, function() {
      common.getRowLength(this.SELECTOR_ITEMS_LIST).then((length) => {
        expect(length).to.be.greaterThan(0);
      });
    });

    it("Should view a consumable non-unique item", {tags: "@smoke"}, function() {
      common.searchDataTable(this.itemName);
      common.getTableRowByString(this.itemName, this.SELECTOR_ITEMS_LIST).within((row) => {
        common.clickView();
      });
      common.waitForLoaderToDisappear();
      itemPage.assertItemInfo(this.itemName, this.itemId);
    });

    it("Should edit a consumable non-unique item", {tags: "@smoke"}, function() {
      common.searchDataTable(this.itemName);
      common.getTableRowByString(this.itemName, this.SELECTOR_ITEMS_LIST).within((row) => {
        common.clickView();
      });
      common.waitForLoaderToDisappear();
      common.clickEdit();

      this.oldItemName = this.itemName;
      this.itemName = `Updated ${this.baseTitle} ${Date.now()}`;
      this.newDescription = `Updated ${this.baseTitle} Description`;

      common.waitForModal().within(() => {
        // Description tab
        common.getActiveTab().within(() => {
          itemPage.inputName(this.itemName);
          itemPage.inputDescription(this.newDescription);
          itemPage.inputTag("tag2 ");
          itemPage.inputCustomData("updated");
        });
        common.clickSave();
        cy.wait(2000);

        cy.intercept("PUT", "/api/entitlements/items/**").as("waitForSave").then(() => {
          common.clickButtonByName("Save");
        });
      });

      cy.wait("@waitForSave").then((res) => {
        expect(res.response.statusCode).to.equal(204);
      });

      itemPage.assertItemInfo(this.itemName, this.itemId, "Non-Unique", this.newDescription, "Consumable");

      cy.on("fail", (err) => {
        this.itemName = this.oldItemName;
        throw err;
      });
    });

    it("Should view consumable non-unique item history", {tags: "@smoke"}, function() {
      common.searchDataTable(this.itemName);
      common.getTableRowByString(this.itemName, this.SELECTOR_ITEMS_LIST).within((row) => {
        common.clickView();
      });
      common.waitForLoaderToDisappear();
      
      cy.intercept("GET", "**/history*").as("waitForHistory").then(() => {
        common.clickOverflow();

        common.clickDropdownItem("View Item history");
      });
      common.waitForLoaderToDisappear();

      cy.wait("@waitForHistory").then((res) => {
        expect(res.response.statusCode).to.equal(200);
      });

      common.getRowLength().then((length) => {
        expect(length).to.be.greaterThan(0);
      });
    });

    it("Should clone a consumable non-unique item", {tags: "@smoke"}, function() {
      common.searchDataTable(this.itemName);
      common.getTableRowByString(this.itemName, this.SELECTOR_ITEMS_LIST).within((row) => {
        common.clickClone();
      });
      common.waitForLoaderToDisappear();

      this.clonedItemName = `Cloned ${this.baseTitle} ${Date.now()}`;

      itemPage.inputName(this.clonedItemName);
      itemPage.intrinsicValue(20) 
      itemPage.inputDescription(`Cloned ${this.baseTitle} Description`);
      itemPage.inputTag("tag3 ");
      itemPage.inputCustomData("cloned");
      cy.intercept("POST", "/api/entitlements/items", (req) => {
        req.on("after:response", (res) => {
          this.clonedItemId = res.body.data.id;
        });
      }).as("waitForSave").then(() => {
        //common.clickNext();
        common.clickButtonByName("Clone Item");
      });
      
      cy.wait("@waitForSave").then((res) => {
        expect(res.response.statusCode).to.equal(201);
        common.searchDataTable(this.clonedItemName);
        common.assertRowExist(this.clonedItemName, this.SELECTOR_ITEMS_LIST);
      });

      // Clean up cloned item
      cy.waitUntil(() => this.clonedItemId).then(() => {
        cy.deleteItem(this.clonedItemId);
      });
    });

    //Grant entitlement to a user and verify row exists in item entitlements
    it("Should view item entitlement(s)", {tags: "@smoke"}, function() {
      common.getTableRowByString(this.itemName, this.SELECTOR_ITEMS_LIST).within(() => {
        common.clickView();
      });
       common.getTableRowByIndex().should("include.text",this.fullPublicId);
       cy.wait(2000);
       cy.deleteGrantedEntitlement(this.grantedEntitlementId).then(()=>{
        deleteGrantedEntlment=true;
       })
    });

    it("Should delete a consumable non-unique item", {tags: "@smoke"}, function() {
      common.searchDataTable(this.itemName);
      //Deleting Granted Entitlement before deleting the  
      if(!deleteGrantedEntlment){
        cy.deleteGrantedEntitlement(this.grantedEntitlementId);
        deleteGrantedEntlment=true;
      }
      common.getTableRowByString(this.itemName, this.SELECTOR_ITEMS_LIST).within((row) => {
        common.clickTrash();
      });
       
      cy.intercept("PATCH", "/api/entitlements/items/**").as("waitForDelete").then(() => {
        common.waitForModal().within(() => {
          common.clickDelete();
        });
      });
      cy.wait("@waitForDelete").then((res) => {
        if(expect(res.response.statusCode).to.equal(204)){
          deleteSuccess = true;
        } 
      });

      cy.assertAlert(`Item "${this.itemName}" deleted`);

      common.searchDataTable(this.itemName);
      common.assertRowNotExist(this.itemName, this.SELECTOR_ITEMS_LIST);
    });
  });
});

after("Clean up item", function(){
  if(!deleteGrantedEntlment){
    cy.deleteGrantedEntitlement(this.grantedEntitlementId);
  }
  if(!deleteSuccess){
    cy.deleteItem(this.itemId);
  }
  cy.deleteItem(this.transformationItemId);
  cy.deleteSKU(this.transformationSkuId);
  cy.deleteAccount(this.fullPublicId);
});