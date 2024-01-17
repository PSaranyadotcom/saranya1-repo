/// <reference types="cypress"/>

export class AppGroups {
    constructor() {
        this.appGroupListSelector = ".tab-pane.active";
    }

    inputName(name){
        cy.get("input").eq(0).clear().type(name);
    }
    waitForLoaderToDisappear(timeoutAmount=null){
        return cy.get(".loader", { timeout: timeoutAmount}).should("not.exist");
    }
}