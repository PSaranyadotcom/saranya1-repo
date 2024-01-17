/* eslint-disable no-undef */
import {Common} from "../page-objects/common-page-objects"
import {LegalDocument} from "../page-objects/legal-documents-page-object"

const common= new Common();
const legalDocPage=new LegalDocument();

describe("Admin - Legal Documents", function () {
  context.only("Authentication", function () {
    it("Check Auth", function () {
      cy.doAuth();
    });
  });

  context("Activities", function () {
    before(function () {
     this.SELECTORE_TAB_DESC=legalDocPage.selectorTabDescription;
     this.SELECTORE_TAB_APP=legalDocPage.selectorTabApplications;
     this.SELECTORE_TAB_LOCALIZATION=legalDocPage.selectorTabLocalizations
     this.SELECTOR_LEGAL_DOC_LIST=legalDocPage.legalDocListSelector
      cy.cleanUpLegalDocuments();
    });

    beforeEach(function () {
      cy.intercept("/api/legal/documents").as("getDocuments");
      cy.visitBaseUrl();
      legalDocPage.navigateToLegalDocuments();
      cy.wait("@getDocuments");
    });

    it("Should create a document", {tags: "@wip"}, function () {
      common.clickButtonByName("Create Document");
      cy.wait(1000);
      let date = new Date();
      // Tab Description
      legalDocPage.selectDocumentType("Unknown");
      legalDocPage.selectRegion("scea")

      // Tab Applications
      common.navigateToTab("Applications");
      common.getActiveTab().within(()=>{
         common.inputVerticalTwoWayFilter("Test App Cypress (User Admin)",1);
         common.selectRowFromList();
      });

      // Tab Localizations
      common.navigateToTab("Localizations");
      legalDocPage.inputDateInLocalization(date);
      cy.intercept("POST","/api/legal/documents").as("saveLegalDoc");
      common.clickButtonByName("Save");

      cy.wait("@saveLegalDoc").then((res) => {
        expect(res.response.statusCode).to.equal(204);
      });
    });

    it("Should display list of documents", {tags: "@wip"}, function () {
      legalDocPage.filterByApp();
      common.getRowLength(this.SELECTOR_LEGAL_DOC_LIST).then((length) => {
        expect(length).to.be.greaterThan(0);
      });
    });

    it("Should be able to open view modal", {tags: "@wip"}, function () {
      legalDocPage.filterByApp();
      common.getRowLength(this.SELECTOR_LEGAL_DOC_LIST).then((length) => {
        common.getTableRowByIndex(length-1).then((row)=>{
          common.clickView(row); 
        });
      });
        common.navigateToTab("Applications");
        common.navigateToTab("Localizations");
    });

    it("Should edit a document", {tags: "@wip"}, function () {
      legalDocPage.filterByApp();
        common.getRowLength(this.SELECTOR_LEGAL_DOC_LIST).then((length) => {
          common.getTableRowByIndex(length-1).then((row)=>{
            common. clickEdit(row); 
          });
        });

        // Tab Description
        legalDocPage.editDocumentType("scee")
        legalDocPage.editRegion("EULA");

        // Tab Localizations
        common.navigateToTab("Localizations");
        legalDocPage.inputTitle("Test Title");
        legalDocPage.inputContent("Test Content");

        cy.intercept("PUT","/api/legal/documents/**").as("UpdateLegalDoc");
        common.clickButtonByName("Save");
         cy.wait("@UpdateLegalDoc").then((res) => {
           expect(res.response.statusCode).to.equal(204);
         });
    });

    it("Should open history modal", {tags: "@wip"}, function () {
      legalDocPage.filterByApp();
        common.getRowLength(this.SELECTOR_LEGAL_DOC_LIST).then((length) => {
          common.getTableRowByIndex(length-1).then((row)=>{
            common.clickHistory(row); 
          });
        cy.wait(3000);
        cy.contains("Close").click();
      });
    });

    it("Should delete a document", {tags: "@wip"}, function () {
       legalDocPage.filterByApp();
        common.getRowLength(this.SELECTOR_LEGAL_DOC_LIST).then((length) => {
          common.getTableRowByIndex(length-1).then((row)=>{
            common.clickTrash(row); 
          });
        });
        cy.wait(4000);
        legalDocPage.getDocumentId().then((id)=>{
          cy.log(id);
          common.clickButtonByName("Delete");
          cy.contains("Yes, please proceed").click();
          cy.wait(15000).then(() => {
            cy.contains(id).should("not.exist");
          });
        });
    });
  });
});
