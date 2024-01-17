/// <reference types="cypress"/>

export class Store {
    constructor() {
        this.storeListSelector = ".catalog-list";
    }

    selectType(type){
        cy.get(".ant-radio-button-wrapper").contains(type).click();
    }

    selectRounding(type){
        cy.get(".ant-radio-button-wrapper").contains(type).click();
    }

    inputName(name){
        cy.get("input[placeholder='Enter a name for the Store']").clear().type(name);
    }

    inputDescription(text){
        cy.get("textarea[placeholder='Enter a description for the Store']").clear().type(text);
    }

    importStore(file){
        cy.get(".ant-upload input[type='file']").attachFile(file);
    }

    checkTargetedStore(){
        cy.get(".ant-checkbox").click();
    }

    clickNewStore(){
        cy.get("button").contains("New Store").click();
    }

    clickCreateStore(){
        cy.get("button").contains("Create store").click();
    }

    clickUpdateStore(){
        cy.get("button").contains("Update store").click();
    }

    clickImportStore(){
        cy.get("button").contains("Import store").click();
    }

    clickImport(){
        cy.get("button").contains("Import").click();
    }

    clickViewStoreHistory(){
        cy.get(".ant-dropdown-menu-item").contains("View Store history").click();
    }

    clickExportStore(){
        cy.get(".ant-dropdown-menu-item").contains("Export store").click();
    }

    clickPublishStore(){
        cy.get(".ant-dropdown-menu-item").contains("Publish store").click();
    }

    assertStoreInfo(name, id, env="Development", description="description"){
        cy.get(".ant-spin-container").eq(0).within(() => {
            cy.get(".header-section").invoke("text").then((header) => {
                expect(header).to.include(name);
                expect(header).to.include(id); 
                expect(header).to.include(env);
            });

            cy.get(".page-subtitle").invoke("text").then((text) => {
                expect(text).to.include(description);
            });

            cy.get(".basic-info").invoke("text").then((date) => {
                expect(date).to.not.be.empty;
            });
        });
    }
}