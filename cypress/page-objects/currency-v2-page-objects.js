/// <reference types="cypress"/>

export class Currency {
    constructor() {
        this.currencyListSelector = ".currencies-table";
    }

    inputCurrency(name, code, description=null){
        cy.get('input[id="name"]').clear().type(name);
        cy.get('input[id="currencyCode"]').clear().type(code);
        if(description != null){
            cy.get("textarea").eq(0).clear().type(description);
        }
    }

    editCurrency(name, description=null){
        cy.get('input[id="name"]').clear().type(name);
        if(description != null){
            cy.get("textarea").eq(0).clear().type(description);
        }
    }

    assertCurrencyDescription(){
        cy.get('.ant-table-expanded-row').eq(0).within(() => {
            cy.get('.ant-typography').eq(1).invoke("text").then((text) => {
                expect(text).to.include("description");
            });
        });
    }

    selectInventory(type){
        cy.get(".ant-radio-button-wrapper").contains(type).click();
    }
    
    clickHistory(){
        cy.get('button .tdi-history').eq(0).click();
    }

    closeHistory(){
        cy.get('button .ant-modal-close-x').eq(0).click();
    }
}