/// <reference types="cypress"/>

export class Currency {
    constructor() {
        this.currencyListSelector = ".currencies-table";
    }

    inputCurrency(name, code, description=null){
        cy.get("#name").clear().type(name);
        cy.get("#currencyCode").clear().type(code);
        if(description != null){
            cy.get("#description").clear().type(description);
        }
    }

    selectInventory(type){
        cy.get(".ant-radio-button-wrapper").contains(type).click();
    }
    
    // Currency uses a different trash icon
    clickTrash(row) {
        if(row){
            if (row.find(".dropdown-toggle").length > 0) {
                cy.get(".fa-ellipsis-h").eq(0).click({force: true});
            }
        }
        cy.get(".fa-trash").eq(0).click({force: true});
    }
}