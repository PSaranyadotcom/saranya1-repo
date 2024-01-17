/// <reference types="cypress"/>

export class LegalDocument{

    constructor(){
        this.selectorTabDescription = ".td-modal .tab-pane:eq(0)";
        this.selectorTabApplications = ".td-modal .tab-pane:eq(1)";
        this.selectorTabLocalizations = ".td-modal .tab-pane:eq(2)";
        this.legalDocListSelector = ".document-list";
    }

    filterByApp(ApplicationName="Test App Cypress (User Admin)") {
        cy.get(".select2-selection__rendered").contains("ALL APPLICATIONS").click().then(()=>{
          cy.get(".select2-search__field").type(ApplicationName);
          cy.get("ul.select2-results__options li").eq(0).click({force:true});
        })
    }

    navigateToLegalDocuments(){
        cy.get(".ant-menu-item").contains("Legal Documents").click();
    }

    selectDocumentType(text){
        cy.get(`${this.selectorTabDescription}`).contains("-- Select Document Type --").click();
        cy.get(".select2-results").contains(text).click({force:true});
    }

    editDocumentType(text){
        cy.get(".select2 .selection:eq(1)").click();
        cy.get(".select2-results").contains(text).click();
    }

    selectRegion(text){
        cy.get(`${this.selectorTabDescription}`).contains("-- Select Region --").click();
        cy.get(".select2-results").contains(text).click({force:true});
    }

    editRegion(text){
        cy.get(".select2 .selection:eq(0)").click();
        cy.get(".select2-results").contains(text).click();
    }

    inputDateInLocalization(date){
        cy.get(`${this.selectorTabLocalizations} .translation-form:eq(0) input:eq(1)`).type(date.toLocaleDateString());
    }

    inputTitle(text){
        cy.get(`${this.selectorTabLocalizations} .translation-form:eq(0) input:eq(0)`).clear().type(text);
    }

    inputContent(text){
        cy.get( `${this.selectorTabLocalizations} .translation-form:eq(0) textarea`).clear().type(text);
    }

    getDocumentId(){
        var id;
        cy.get(".modal-subtitle span").then(($el) => {
            id = $el.text().split(" ").pop();
            cy.wrap(id).as("DocumentId");
          });
       return cy.get("@DocumentId");
    }

}