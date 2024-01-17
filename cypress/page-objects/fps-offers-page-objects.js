/// <reference types="cypress"/>

export class Offers {
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
    
    inputSteamStoreData(id, type="Title"){
        cy.get(".ant-form").within(() => {
            cy.get("label").contains("Offer type").parents(".ant-form-item").within(() => {
                cy.get(".ant-select").click();
                cy.document().its("body").find(".ant-select-item").contains(type).click({force:true});
            });
        });

        cy.get(".ant-form").within(() => {
            cy.get("label").contains("Steam Application ID").parents(".ant-form-item").within(() => {
                cy.get("input").eq(0).clear().type(id);
            });
        });
    }
    
    selectOfferType(type="In Game"){
        cy.get(".ant-form").within(() => {
            cy.get("label").contains("Offer Type").parents(".ant-form-item").within(() => {
                cy.get(".ant-select").click();
                cy.document().its("body").find(".ant-select-item").contains(type).click({force:true});
            });
        });
    }

    clickNewOffer(){
        cy.get(".ant-btn").contains("New offer").click();
    }

    clickView(){
        cy.get(".ant-btn .tdi-arrow-right").click();
    }

    assertOfferInfo(name, id, description="description"){
        cy.get(".title-row").eq(0).invoke("text").then((header) => {
            expect(header).to.include(name);
            expect(header).to.include(id);
        });

        cy.get(".ant-typography.page-subtitle").eq(0).invoke("text").then((text) => {
            expect(text).to.include(description);
        });

        cy.get(".basic-info").invoke("text").then((date) => {
            expect(date).to.not.be.empty;
        });
    }
}