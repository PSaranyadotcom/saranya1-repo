/// <reference types="cypress"/>
import {Common} from "../page-objects/common-page-objects"

const common = new Common();
export class Apps {
    constructor() {
        this.appListSelector = ".tab-pane.active";
    }

    inputName(name){
        cy.get("input").eq(0).clear().type(name);
    }

    inputAccessTokenLifetime(seconds){
        common.inputTextToParticularLabel("Access Token Lifetime",seconds)
    }

    inputRefreshTokenLifetime(seconds){
        common.inputTextToParticularLabel("Refresh Token Lifetime",seconds)
    }

    inputJWTServiceVersion(text){
        cy.get("input").eq(0).type(text);
    }

    inputRedirectDomaint(text){
        cy.get("input").eq(0).type(text);
        cy.get("button").contains("Add").click();
    }

    inputTranslationTitle(text){
        cy.get("input").eq(0).type(text);
    }

    inputFirstPartyID(text){
        cy.contains("First Party ID").parents(".form-group").within(() => {
            cy.get("input").type(text);
        });
    }

    inputNintendoCredentials(clientId, clientSecret){
        cy.get("input[placeholder='Client ID (required)']").clear().type(clientId);
        cy.get("input[placeholder='Client Secret (required)']").clear().type(clientSecret);
    }

    selectJWTAlgorithm(text){
        cy.get(".select2").eq(0).click();
        cy.document().its("body").find(".select2-results").contains(text).click();
    }

    selectApplicationType(text){
        cy.get(".select2").eq(1).click();
        cy.document().its("body").find(".select2-results").contains(text).click();
    }

    selectDeviceType(text){
        cy.get(".select2").eq(2).click();
        cy.document().its("body").find(".select2-results").contains(text).click();
    }

    selectAuthProvider(text){
        cy.get(".select2").eq(0).click();
        cy.document().its("body").find(".select2-results").contains(text).click();
    }

    selectFirstPartyValidation(value="TRUE"){
        cy.get("label").contains("Always Enforce First Party Validation").parents(".form-group").within(() => {
            cy.get(".select2").eq(0).click();
            cy.document().its("body").find(".select2-results").contains(value).click();
        });
    }

    selectNintendoEnvironment(text="(lp1) Retail - General Users"){
        cy.get(".select2").eq(2).click();
        cy.document().its("body").find(".select2-results").contains(text).click();
    }

    selectIssuePlayFabTicket(text){
        cy.get(".select2").eq(0).click();
        cy.document().its("body").find(".select2-results").contains(text).click();     
    }

    selectTranslation(text){
        cy.get("select").eq(0).select(text)
        cy.get(".fa-plus").click();
    }

    toggleLoginFlows(index){
        cy.get(".bootstrap-switch").eq(index).click();
    }

    getDeviceTypeOptions(){
        cy.get(".select2").contains("-- Select Device Type --").eq(0).click();
        return cy.document().its("body").find(".select2-results__options > li");
    }

    getAuthFormByIndex(index=0){
        return cy.get(".auth-form").eq(index);
    }
}