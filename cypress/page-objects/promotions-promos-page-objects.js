/// <reference types="cypress"/>

import {Common} from "../page-objects/common-ant-page-objects"

const common = new Common();

export class Promos {
    constructor() {
        this.promosList = ".eyewash-promo-list";
    }

    inputName(name){
        cy.get("label").contains("Name").parents(".form-group").within(() => {
            cy.get("input").eq(0).clear().type(name);
        });
    }


    inputDescription(text){
        cy.get("label").contains("Description").parents(".form-group").within(() => {
            cy.get("textarea").eq(0).clear().type(text);
        });
    }

    inputDate(startDate=1, endDate=15){
        cy.get(".date-picker__button").eq(0).click();
        cy.document().its("body").find(".date-picker__day").contains(startDate).click();
        cy.document().its("body").find(".date-picker__header__button--next").click();
        cy.document().its("body").find(".date-picker__day").contains(endDate).click();
    }

    inputDisplayCount(text=1){
        cy.get("label").contains("Display Count").parents(".form-group").within(() => {
            cy.get("input").eq(0).clear().type(text);
        });
    }

    inputDisplayDuration(text=24){
        cy.get("label").contains("Display Duration In Hours").parents(".form-group").within(() => {
            cy.get("input").eq(0).clear().type(text);
        });
    }

    inputMetaData(text="{}"){
        cy.get("label").contains("Metadata").parents("fieldset").within(() => {
            cy.get("textarea").eq(0).focus().clear({force:true}).type(text, {force:true});
        });
    }

    selectProductGroup(productGroupName="Test App Group Cypress 1"){
        cy.get(".product-group-dropdown-container .select2").click();
        cy.wait(1000);
        cy.get(".select2-dropdown").within(()=>{
            cy.get(".select2-search__field").clear().type(productGroupName);
            common.clickOnElementByText("ul.select2-results__options li",productGroupName)
        })
        //cy.document().its("body").find(".select2-results").contains(productGroupName).click();
    }

    selectEnvironment(env="DEVELOPMENT"){
        cy.get(".env-dropdown-container .select2").click();
        cy.document().its("body").find(".select2-results").contains(env).click();
    }

    selectProduct(product="Test Product Cypress 1"){
        cy.get(".product-dropdown-container").within(()=>{
            cy.contains("-- Select Product --").click();
        })
        cy.get('.vscomp-search-input').clear().type(product);
        cy.document().its("body").find(".vscomp-option").contains(product).click({force:true});
    }

    selectType(type="infoOnly"){
        cy.get("label").contains("Type").parents(".field-control").within(() => {
            cy.get('select').select(type); 
        });
    }

    selectFirstPartyOffer(name){
        cy.wait(1000);
        cy.get("label").contains("First party offer").parents(".add-promo-form").within(() => {
            cy.contains("-- Select First party offer --").click();
            cy.document().its("body").find(".select2-results li").eq(0).click();
        });
    }

    clickCreatePromo(){
        cy.get(".create-promo").click();
    }

    toggleAllowMultipleContent(){
        cy.get(".mt-checkbox").click();
    }

    assertPromoData(id, name, description="description", aspectRatio="16:9", multipleContent="NO"){
        cy.get("p.eyewash-promo-view-child.eyewash-promo-basic-info").invoke("text").then((text) => {
            expect(text.replace(/\s+/g, " ")).to.include(id);
        });
        
        cy.get("p.eyewash-promo-view-child.eyewash-promo-basic-info").invoke("text").then((text) => {
            expect(text.replace(/\s+/g, " ")).to.include(name);
        });

        cy.get(".promo-data-container .eyewash-promo-basic-info table").invoke("text").then((text) => {
            expect(text.replace(/\s+/g, " ")).to.include(description);
        });
        

        // cy.get(".placement-list-col-aspect-ratio").invoke("text").then((text) => {
        //     expect(text.replace(/\s+/g, " ")).to.include(aspectRatio);
        // });

        // cy.get(".placement-list-col-multiple").invoke("text").then((text) => {
        //     expect(text.replace(/\s+/g, " ")).to.include(multipleContent);
        // });
    }

    backToPromo(){
        cy.get(".ember-view").contains(' Back to Promo List').click();
    }
    filterNameXclose(){
        cy.get('div.field span[role="button"]').click();
    }

}
