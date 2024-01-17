/// <reference types="cypress"/>

export class Products {
    constructor() {
        this.productListSelector = ".tab-pane.active";
    }

    inputName(name){
        cy.get("input").eq(0).clear().type(name);
    }

    getAppGroupList(){
        return cy.get(".vertical-two-way-selector-list");
    }
}