describe("my test",()=>{
it("this is my test",()=>{
    cy.visit("https://demoapps.qspiders.com/mouseHover?sublist=0")
    cy.get(".w-6.h-6.mt-4.absolute.ml-72.cursor-pointer").click()
    //cy.get('input[name="rangeValue"]').invoke('show').should('be.visible')
})
})