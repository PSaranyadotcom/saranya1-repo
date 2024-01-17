/// <reference types="cypress"/>

export class Campaign {
    constructor() {
        this.campaignListSelector = ".codes-campaigns-campaign-section";
    }
    
    inputDescription(name, description=null, tags=null){
        cy.get("input").eq(0).clear().type(name);
        if(description != null){
            cy.get("textarea").eq(0).clear().type(description);
        }
        if(tags != null){
            cy.get("input").eq(1).type(tags);
        }
    }
}