/// <reference types="cypress"/>

export class Item {
    constructor() {
        this.itemListSelector = ".item-list";
    }

    navigateToItems(){
        cy.get(".ant-menu").contains("Commerce").click();
        cy.get(".ant-menu").contains("Items").click();
    }

    navigateToSellbackValuesTab(){
        cy.get(".ant-tabs-tab-btn").contains("Sellback Values").click();
    }

    inputName(name){
        cy.get("input[id='name']").clear().type(name);
    }

    intrinsicValue(value){
        cy.get(".ant-form").within(() => {
            cy.get("label").contains("Intrinsic Value").parents(".ant-form-item").within(() => {
                cy.get("input").eq(0).clear().type(value);
            });
        });
    }

    inputDescription(text){
        cy.get("textarea[id='description']").clear().type(text);
    }

    inputTag(text){
        cy.get(".form-tags input").type(text);
    }

    inputCustomData(text="{}"){
        cy.get(".code-editor textarea").eq(0).clear({force:true}).type(text, {force:true});
    }
    
    inputUses(count=1){
        cy.get("input[placeholder='Enter a number between 1 and 999']").clear().type(count);
    }

    selectItemType(type="Durable"){
        cy.get(".ant-radio-button-wrapper").contains(type).click();
    }

    toggleUniqueness(){
        cy.get(".ant-checkbox-wrapper").contains("Unique").click();
    }

    inputCurrency(currencyCode="Test Currency", amount=100){
        cy.get(".ant-table-row > .ant-table-cell").contains(currencyCode).parents(".ant-table-row").within(() => {
            cy.get(".ant-checkbox-wrapper").click();
            cy.get(".ant-input").clear().type(amount);
        });
    }

    clickNewItem(){
        cy.get("button").contains("New Item").click();
    }

    clickAddSellbackValue(){
        cy.get("button").contains("Add sellback value").click();
    }

    clickCreateItem(){
        cy.get("button").contains("Create Item").click();
    }
    
    clickViewItemHistory(){
        cy.get(".ant-dropdown-menu-item").contains("View Item history").click();
    }

    assertItemInfo(name, id, unique="Non-Unique", description="description", type="Consumable"){
        cy.get(".ant-spin-container").eq(0).within(() => {
            cy.get(".header-section").invoke("text").then((header) => {
                // expect(header).to.include(name);
                expect(header).to.include(id);
                expect(header).to.include(unique);
            });

            cy.get(".page-subtitle").invoke("text").then((text) => {
                expect(text).to.include(description);
            });

            cy.get(".additional-objects").invoke("text").then((text) => {
                expect(text).to.include(type);
            });

            cy.get(".basic-info").invoke("text").then((date) => {
                expect(date).to.not.be.empty;
            });
        });
    }
}
