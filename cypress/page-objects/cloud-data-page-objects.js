/// <reference types="cypress"/>

export class CloudData {
    constructor() {
        this.cloudDataListSelector = ".cloud-data-list";
    }

    navigateToCloudData(){
        cy.get(".ant-menu-submenu-title").contains("Cloud Data").click().parent().then(()=>{
            cy.get("li>.ant-menu-title-content").contains("Cloud Data").click();
        })
    }

    inputKey(name){
        cy.get("input[placeholder='Please provide a record key.']").clear().type(name);
    }

    inputTag(text){
        cy.get(".form-tags input").type(text+'{enter}');
    }

    inputOpaque(code){
        cy.get("textarea").eq(0).focus().clear({force:true}).type(code, {force:true});
    }

    clearOpaque(){
        cy.get("textarea").eq(0).focus().clear({force:true});
    }

    inputProperties(code){
        cy.get("textarea").eq(1).focus().clear({force:true}).type(code, {force:true, parseSpecialCharSequences:false});
    }

    clearProperties(){
        cy.get("textarea").eq(1).focus().clear({force:true});
    }

    attachBlob(file,assert=true,index=0){
        cy.get(".ant-upload input[type='file']").eq(index).attachFile(file);
        if(assert){
            cy.get(".ant-upload-list-item-name").should("have.text", file);
        }
    }

    removeBlob(){
        cy.get(".ant-upload-list button[title='Remove file']").click();
    }

    assertRecordInfo(key, id, tag){
        cy.get(".ant-spin-container").eq(0).within(() => {
            cy.get(".ant-space.ant-space-vertical").invoke("text").then((header) => {
                expect(header).to.include(key);
                expect(header).to.include(`${id}:${key}`); 
            });
            
            cy.get(".ant-tag").invoke("text").then((text) => {
                expect(text).to.include(tag);
            });

            cy.get('strong').contains("Date Created:").parent(".ant-typography").siblings("span").invoke("text").then((date) => {
                expect(date).to.not.be.empty;
            });
        });
    }

    assertUploadButtonCount(Count){
      cy.get(".anticon.anticon-upload").should("have.length",Count);      
    }

    clickOnRoundEditButton(index=0){
     cy.get(".ant-btn.ant-btn-primary.ant-btn-round.ant-btn-sm").eq(index).click({force:true});
    }
    selectBinaryDataSize(size=256){
    cy.get('.ant-select-selection-placeholder').contains("Select chunk size").click({force:true});
    cy.get('.ant-select-item-option-content').contains(`${size}`).click();
    }
    assertChunkUploadIsSuccess(){
        cy.get(".ant-typography.ant-typography-success").invoke('text').should("include","Chunk Upload is success.")
    }
}