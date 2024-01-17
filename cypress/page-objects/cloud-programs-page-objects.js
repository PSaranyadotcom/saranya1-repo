/// <reference types="cypress"/>

export class CloudPrograms {
    constructor() {
        this.cloudProgramListSelector = ".cloud-program-section";
        this.cloudProgramSelector = ".cloud-selector";
    }

    navigateToCloudPrograms(){
        cy.get(".ant-menu").contains("Cloud Programs").click()    
    }

    inputName(name){
        cy.get("textarea").eq(0).clear().type(name);
    }

    clearCode(){
        cy.get("textarea").clear({force:true});
    }

    inputCode(code,index=0){
        // cy.get("textarea").eq(index).type(code);
        cy.get("textarea").eq(index).type(code,{force:true, parseSpecialCharSequences:false,delay:0});
    }

    // selectAppGroup(name="Test App Group Cypress 1"){
    //     cy.get(`${this.cloudProgramSelector} .form-select`).eq(0).click().wait(1000);
    //     cy.waitUntil(() => cy.get(`${this.cloudProgramSelector} .form-select .options`).eq(0).contains(name)).click();
    // }

    selectCloudProgram(name="test",index=1){
        cy.get(`${this.cloudProgramSelector} .ant-select-selector`).eq(0).click({force:true}).type(name);
        cy.get('.ant-select-item-option-content').eq(index).contains(name).click({force:true});
    }

    getCode(){
        return cy.get("code").eq(0).invoke("text");
    } 

    getText(){
        return cy.get(".ace_line").eq(0).invoke("text");
    }

    getBuildNumber(){
        return cy.get(`.ant-table-content .ant-table-row .ant-table-cell`).first().invoke("text");
    }

    getButtonInRow(text){
        return cy.get(`${this.cloudProgramListSelector} .content-table .row button`).contains(text);
    }

    clickOnFailureArrowBtn(index=0){
        cy.get('.ant-table-tbody > .ant-table-row').contains("Failure").siblings('td').find('.tdi-arrow-right').eq(index).click();
    }
    
    checkDeployButtonEnabled(){
      cy.get(".ant-btn.ant-btn-primary.ant-btn-round.btn-header").should("be.enabled");
    }
}
