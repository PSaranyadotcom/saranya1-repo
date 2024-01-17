/// <reference types="cypress"/>

export class Placements {
    constructor() {
        this.placementsList = ".eyewash-placement-list";
    }

    inputID(id){
        cy.get("label").contains("Placement ID").parents(".ant-row.ant-form-item").within(() => {
            cy.get("input").eq(0).clear().type(id);
        });
    }

    inputName(name){
        cy.get("label").contains("Name").parents(".ant-row.ant-form-item").within(() => {
            cy.get("input").eq(0).clear().type(name);
        });
    }

    inputDescription(text){
        cy.get("label").contains("Description").parents(".ant-row.ant-form-item").within(() => {
            cy.get("textarea").eq(0).clear().type(text);
        });
    }

    inputAspectRatio(width=16, height=9){
        cy.get("label").contains("Aspect Ratio").parents(".ant-row.ant-form-item").within(() => {
            cy.get("input").eq(0).clear().type(width);
            cy.get("input").eq(1).clear().type(height);
        });
    }

    toggleAllowMultipleContent(){
        cy.get(".ant-switch").click();
    }

    assertPlacementInfo(id, name, description="description", aspectRatio="16 : 9", multipleContent="No"){
        cy.wait(2000);
        cy.get(".ant-spin-container .id").eq(0).invoke("text").then((text) => {
            expect(text.replace(/\s+/g, " ")).to.include(id);
        });

        cy.get(".ant-spin-container").invoke("text").then((text) => {
            expect(text.replace(/\s+/g, " ")).to.include(name);
        });

        cy.get(".ant-spin-container .ant-typography.page-subtitle").invoke("text").then((text) => {
            expect(text.replace(/\s+/g, " ")).to.include(description);
        });

        cy.get(".ant-spin-container").invoke("text").then((text) => {
            expect(text.replace(/\s+/g, " ")).to.include(aspectRatio);
        });

        cy.get(".ant-spin-container").invoke("text").then((text) => {
            expect(text.replace(/\s+/g, " ")).to.include(multipleContent);
        });
    }

    clickEdit() {
        cy.get(".tdi-edit").click();
    }
}