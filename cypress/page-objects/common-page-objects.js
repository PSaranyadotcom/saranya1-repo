/// <reference types="cypress"/>
import { v4 as uuidv4 } from "uuid";

export class Common {
    constructor() {

    }

    navigateSidebarMenu(menu, subMenu=null){
        cy.get(".ant-menu").contains(menu).click();
        if(subMenu != null){
            cy.get(".ant-menu").contains(subMenu).click();
        }
    }

    navigateToTab(text){
        cy.get(".nav-tabs a").contains(text).click();
    }

    getTab(text){
        return cy.get(".nav-tabs a").contains(text);
    }

    getTableRowByString(name, selector="") {
        return cy.get(`${selector} .content-table`).contains(new RegExp(`\\b${name}\\b`, "g")).parents(".row.element");
    }

    getTableRowByExactString(name, selector="") {
        return cy.get(".row.content-table [title='"+name+"']").parents(".row.element");
      }  

    getTableRowByIndex(index=0, selector=""){
        return cy.get(`${selector} .content-table .row`).eq(index);
    }

    getRowLength(selector=""){
        //loader element exist for quite longer period.
        cy.get(".row.content-table .loader").should("not.exist").then(() => {
            cy.get(`${selector} .content-table`).then(($content) => {
                cy.wrap($content.find(".row").length).as("length");
            });
        });
        return cy.get("@length");
    }

    getActiveTab(){
        return cy.get(".tab-pane.active");
    }

    getModalSubtitle() {
        return cy.get(".modal-subtitle").wait(1000);
    }

    getReferenceRow(){
        return cy.get(".reference .row").invoke("text");
    }

    getHistoryTableValue(rowHeader){
        return cy.get(".history-meta .col-md-3").contains(rowHeader).siblings(".col-md-9").invoke("text");
    }

    assertRowExist(name, selector="") {
        return cy.get(`${selector} .content-table`).contains(name).should("exist");
    }

    assertRowNotExist(name, selector="") {
        return cy.get(`${selector} .content-table`).contains(name).should("not.exist");
    }

    waitForModal(index=0){
        return cy.waitUntil(() => cy.get(".td-modal").eq(index));
    }

    waitForLoaderToDisappear(timeoutAmount=50000){
        return cy.get(".loader", { timeout: timeoutAmount}).should("not.exist");
    }

    waitForSelectLoading(text, timeoutAmount=null){
        return cy.get(".select2", { timeout: timeoutAmount}).contains(text).should("exist");
    }

    waitForAllSelectLoading(timeoutAmount=null){
        return cy.get(".select2", { multiple:true, timeout: timeoutAmount}).contains("Loading...").should("not.exist");
    }

    newUUID(){
        return uuidv4().replace(/-/g, "");
    }

    selectProduct(product="Test Product Cypress 1"){
        cy.waitUntil(()=>cy.get(".items-product-selector"));
        cy.get(".items-product-selector").contains("-- Select Product --").click({force:true});
        cy.get(".vscomp-search-input").type(product,{force:true}).then(()=>{
            cy.document().its("body").find(".vscomp-option").contains(product).click({force:true});
        })    
    }

    selectAppGroup(appGroupName){
        this.waitForAllSelectLoading();
        cy.wait(2000);
        cy.get(".select2").contains("-- Select Application Group --").click();
        cy.get('input[type="search"]').clear().type(appGroupName);
        cy.document().its("body").find(".select2-results").contains(appGroupName).click();
    }

    selectPaginationLimit(paginationLimit){
        cy.get(".pagination-limit select").select(paginationLimit);
    }

    selectRowFromList(index=0){
        cy.get(`.vertical-two-way-selector-list:eq(${index}) .fa-plus-circle:eq(0)`).click();
    }

    deselectRowFromList(index=1){
        cy.get(`.vertical-two-way-selector-list:eq(${index}) .fa-minus-circle:eq(0)`).click();
    }

    inputFilter(text, index=0){
        cy.get(".filter-fields input").eq(index).type(text, {force:true});
    }

    inputVerticalTwoWayFilter(text, index=0){
        cy.get(".vertical-two-way-selector-filter input").eq(index).type(text, {force:true});
    }

    clickButtonByName(name,index=0){
        cy.get("button:not([disabled])").contains(name).eq(index).click({force:true});
    }

    getButtonByName(name){
        return cy.get("button").contains(name);
    }

    waitForButtonCount(Count){
        cy.get("button").should("have.length.greaterThan",Count)
    }

    clickView(row, index=0) {
        if(row){
            if (row.find(".dropdown-toggle").length > 0) {
                cy.get(".fa-ellipsis-h").eq(0).click({force: true});
            }
        }
        cy.get(".fa-eye").eq(index).click({force: true});
    }

    clickEdit(row) {
        if(row){
            if (row.find(".dropdown-toggle").length > 0) {
                cy.get(".fa-ellipsis-h").eq(0).click({force: true});
            }
        }
        cy.get(".fa-pencil").eq(0).click({force: true});
    }

    clickClone(row) {
        if(row){
            if (row.find(".dropdown-toggle").length > 0) {
                cy.get(".fa-ellipsis-h").eq(0).click({force: true});
            }
        }
        cy.get(".fa-copy").eq(0).click({force: true});
    }

    clickHistory(row) {
        if(row){
            if (row.find(".dropdown-toggle").length > 0) {
                cy.get(".fa-ellipsis-h").eq(0).click({force: true});
            }
        }
        cy.get(".fa-history").eq(0).click({force: true});
    }

    clickTrash(row) {
        if(row){
            if (row.find(".dropdown-toggle").length > 0) {
                cy.get(".fa-ellipsis-h").eq(0).click({force: true});
            }
        }
        cy.get(".fa-trash-o").eq(0).should("be.visible").click({force: true});
    }

    clickExport(row) {
        if(row){
            if (row.find(".dropdown-toggle").length > 0) {
                cy.get(".fa-ellipsis-h").eq(0).click({force: true});
            }
        }
        cy.get(".fa-download").eq(0).click({force: true});
    }

    clickPublish(row) {
        if(row){
            if (row.find(".dropdown-toggle").length > 0) {
                cy.get(".fa-ellipsis-h").eq(0).click({force: true});
            }
        }
        cy.get(".fa-share").eq(0).click({force: true});
    }

    clickList(row) {
        if(row){
            if (row.find(".dropdown-toggle").length > 0) {
                cy.get(".fa-ellipsis-h").eq(0).click({force: true});
            }
        }
        cy.get(".fa-list").eq(0).click({force: true});
    }

    clickBook(row) {
        if(row){
            if (row.find(".dropdown-toggle").length > 0) {
                cy.get(".fa-ellipsis-h").eq(0).click({force: true});
            }
        }
        cy.get(".fa-book").eq(0).click({force: true});
    }

    clickSearch(index=0) {
        cy.get(".fa-search").eq(index).click({force: true});
    }

    clickClose(){
        cy.get("button").contains("Close").click();
    }

    clickSave(){
        cy.get("button").contains("Save").click();
    }

    getSave(){
        return  cy.get("button").contains("Save");
    }

    clickDelete(){
        cy.get("button").contains("Delete").click();
    }

    clickRemove(){
        cy.get("button").contains("Remove").click();
    }

    clickYes(){
        cy.get(".td-modal button").contains("Yes").click();
    }

    getYes(){
        return cy.get(".td-modal button").contains("Yes");
    }

    clickCheckButton(){
        cy.get("button:not([disabled]) .fa-check").click();
    }

    getCheckButton(){
        return cy.get(".fa-check").parent("button");
    }

    clickCheck(index=0){
        cy.get(".centered-check").eq(index).click();
    }

    clickPlus(){
        cy.get("button:not([disabled]) .fa-plus").click();
    }

    clickMinus(multipleClicks=false){
        cy.get("button:not([disabled]) .fa-minus").click({multiple: multipleClicks});
    }

    clickX(){
        cy.get("button:not([disabled]) .fa-times").click();
    }

    getX(){
        return cy.get(".fa-times").parent("button");
    }

    clickPopoverButton(text){
        cy.get(".popover-content").contains(text).click();
    }

    clickTrashIcon(index=0){
        cy.get(".fa-trash-o").eq(index).click();
    }

    clickClearSelected(name){
        cy.get(".select2").contains(name).parents(".select2").within(() => {
            cy.get(".select2-selection__clear").click();
        });

        cy.get("body").then((body) => {
            if (body.find(".select2-results").length > 0) {
                cy.get(".select2 .select2-selection__placeholder").click();
            }
        });
    }

    enterTextToParticularPlaceHolderName(PlaceholderName,text){
        cy.get('.filter-fields input[placeholder="'+PlaceholderName+'"]').clear().type(text, {force:true});
    }

    inputTextToParticularLabel(LabelName,text){
        cy.get("label").contains(LabelName).parents(".form-group").within(() => {
            cy.get("input").eq(0).clear().type(text);
        });
    }

}
