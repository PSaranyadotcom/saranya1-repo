/// <reference types="cypress"/>


export class Titles {
    constructor() {
        
    }

    inputName(name){
        cy.get(".ant-form").within(() => {
            cy.get("label").contains("Name").parents(".ant-form-item").within(() => {
                cy.get("input").eq(0).clear().type(name);
            });
        });
    }

    inputDescription(text){
        cy.get(".ant-form").within(() => {
            cy.get("label").contains("Description").parents(".ant-form-item").within(() => {
                cy.get("textarea").eq(0).clear().type(text);
            });
        });
    }

    inputSteamStoreData(id="13123"){
        cy.get(".ant-form").within(() => {
            cy.get("label").contains("Steam Application ID").parents(".ant-form-item").within(() => {
                cy.get("input").eq(0).clear().type(id);
            });
        });
    }

    selectProduct(productName="Test Product Cypress 1"){
        cy.get("button").contains("Filters").click();

        cy.get(".ant-row.FilterBar.false").within(() => {
            cy.get(".ant-select input").eq(0).click().type(productName);
            cy.document().its("body").find(".ant-select-item").contains(productName).click({force:true});
        });
    }

    selectProductInForm(productName="Test Product Cypress 1"){
        cy.get(".ant-form").within(() => {
            cy.get("label").contains("Product").parents(".ant-form-item").within(() => {
                cy.get(".ant-select input").click().type(productName);
                cy.document().its("body").find(".ant-select-item").contains(productName).click({force:true});
            });
        });
    }

    clickNewTitle(){
        cy.get(".ant-btn").contains("New title").click();
    }

    clickView(){
        cy.get(".ant-btn .tdi-arrow-right").click();
    }

    assertTitleInfo(name, id, description="Title Description", productName="Test Product Cypress 2"){
        cy.get(".title-row").should("contain.text",name);
        cy.get(".title-row").eq(0).invoke("text").then((header) => {
            expect(header).to.include(name);
            expect(header).to.include(id);
        });

        cy.get(".ant-typography.page-subtitle").eq(0).invoke("text").then((text) => {
            expect(text).to.include(description);
        });

        cy.get(".product-row").invoke("text").then((text) => {
            expect(text).to.include(productName);
        });

        cy.get(".basic-info").invoke("text").then((date) => {
            expect(date).to.not.be.empty;
        });
    }
}