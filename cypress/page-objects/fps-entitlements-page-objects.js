/// <reference types="cypress"/>

export class Entitlements {
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

    inputEpicStoreData(sandboxName, itemId){
        cy.get(".ant-form").within(() => {
            cy.get("label").contains("Epic Store Sandbox").parents(".ant-form-item").within(() => {
                cy.get("input").click();
                cy.document().its("body").find(".ant-select-dropdown").contains(sandboxName).click();
            });

            cy.get("label").contains("Epic Store Item ID").parents(".ant-form-item").within(() => {
                cy.get("input").eq(0).clear().type(itemId);
            });
        });
    }

    inputEpicSandboxData(name, id){
        cy.get("input[placeholder='Enter a name for the Sandbox']").type(name);
        cy.get("input[placeholder='Enter a valid Sandbox ID']").type(id);
    }

    inputXboxStoreData(id){
        cy.get(".ant-form").within(() => {
            cy.get("label").contains("Xbox legacy product ID").parents(".ant-form-item").within(() => {
                cy.get("input").eq(0).clear().type(id);
            });
        });
    }

    inputSteamStoreData(id, isDLC=false){
        let label = "Item Def ID";
        cy.get(".ant-form").within(() => {
            if(isDLC){
                label = "Application ID"
            }
            cy.get("label").contains(label).parents(".ant-form-item").within(() => {
                cy.get("input").eq(0).clear().type(id);
            });
        });
    }

    inputPSNStoreData(region, label){
        cy.get(".store-card-container").contains(region).click();

        cy.waitUntil(() => cy.get("div:visible .ant-modal-content")).wait(500).within(() => {
            cy.get("label").contains("Entitlement Label").parents(".ant-form-item").within(() => {
                cy.get("input").eq(0).clear().type(label);
            });
        });
    }

    inputNintendoStoreData(id){
        cy.get(".ant-form").within(() => {
            cy.get("label").contains("Nintendo Item ID").parents(".ant-form-item").within(() => {
                cy.get("input").eq(0).clear().type(id);
            });
        });
    }

    toggleDLC(){
        cy.get("button[role='switch']").click();
    }

    clickNewEntitlement(){
        cy.get(".ant-btn").contains("New entitlement").click();
    }

    clickView(){
        cy.get(".ant-btn .tdi-arrow-right").click();
    }

    assertEntitlementInfo(name, id, description="description", dlc="No"){
        cy.get(".title-row").eq(0).invoke("text").then((header) => {
            expect(header).to.include(name);
            expect(header).to.include(id);
        });

        cy.get(".ant-typography.page-subtitle").eq(0).invoke("text").then((text) => {
            expect(text).to.include(description);
        });

        cy.get(".product-row").invoke("text").then((text) => {
            expect(text).to.include(dlc);
        });

        cy.get(".basic-info").invoke("text").then((date) => {
            expect(date).to.not.be.empty;
        });
    }
}