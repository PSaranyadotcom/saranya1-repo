/// <reference types="cypress"/>

export class SKU {
    constructor() {
        this.skuListSelector = ".catalog-list";
    }

    inputName(name){
        cy.get("input[placeholder='Enter a name for the SKU']").clear().type(name);
    }

    inputDescription(text){
        cy.get("textarea[placeholder='Enter a description for the SKU']").clear().type(text);
    }

    inputTag(text){
        cy.get(".form-tags input").type(text);
    }

    inputCurrency(currencyCode, amount=null, toggle=true){
        cy.get(".ant-table-row > .ant-table-cell").eq(2).contains(currencyCode).parents(".ant-table-row").within(() => {
            if(toggle){
                cy.get(".ant-checkbox-input").click();
            }
            if(amount != null){
                cy.get(".ant-input").clear().type(amount);
            }
        });
    }

    inputItem(itemId, amount=null, toggle=true){
        cy.get(".ant-table-row > .ant-table-cell").contains(itemId).parents(".ant-table-row").within(() => {
            if(toggle){
                cy.get(".ant-checkbox-input").click();
            }
            if(amount != null){
                cy.get(".ant-input").clear().type(amount);
            }
        });
    }

    selectFPSEntitlement(text){
        cy.get(".ant-form").eq(0).within(() => {
            cy.get("label[title='1st Party Entitlement']").parents(".ant-form-item").within(() => {
                cy.get(".ant-select").click();
                cy.get("input#firstPartyEntitlementId").type(text);
                cy.document().its("body").find(".ant-select-item").contains(text).click();
            });
        });
    }

    deselectFPSEntitlement(){
        cy.get(".ant-form").eq(0).within(() => {
            cy.get("label[title='1st Party Entitlement']").parents(".ant-form-item").within(() => {
                //cy.get("input").clear({force: true});
                cy.get(".ant-select-clear").click({force: true});
            });
        });
    }

    clickViewSKUHistory(){
        cy.get(".ant-dropdown-menu-item").contains("View SKU history").click();
    }

    toggleSkuRepurchaseButton(){
        cy.contains("Allow re-purchase of unique items").parent("indicator").siblings(".switch-label").within(() => {
            cy.get(".ant-switch").click();
        });
    }

    getSkuRepurchaseButton(){
        cy.contains("Allow re-purchase of unique items").parent("indicator").siblings(".switch-label").within(() => {
            return cy.get(".ant-switch");
        });
    }

    assertSkuInfo(name, id, description="description", tags=["tag1", "tag2"]){
        cy.get(".ant-spin-container").eq(0).within(() => {
            cy.get(".header-section").invoke("text").then((header) => {
                expect(header).to.include(name);
                expect(header).to.include(id); 
            });

            cy.get(".page-subtitle").invoke("text").then((text) => {
                expect(text).to.include(description);
            });

            cy.get(".ant-tag").each(tag => {
                cy.get(tag).invoke("text").then((text) => {
                    expect(tags).to.include(text);
                });
            });

            cy.get(".basic-info").invoke("text").then((date) => {
                expect(date).to.not.be.empty;
            });
        });
    }
}