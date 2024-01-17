describe("this is inside describe blcok",()=>{
    it("my test2",()=>{
        cy.visit(Cypress.env("url1"))
        cy.get('[value="radio1"]').click()
        cy.get("#autocomplete").type("india")
        cy.get("#dropdown-class-example").select('Option1')
       
        cy.get('[type="checkbox"]:visible').check()
        cy.pause()
        
        cy.get('[type="checkbox"]:visible').uncheck(['option1','option2'])
        //cy.get("#openwindow").click()
        //cy.get("#opentab").invoke('removeAttr','target').click()
        cy.wait(3000)
        cy.get("div.mouse-hover button#mousehover").trigger('mouseover')
        cy.get(".mouse-hover-content a").eq(1).click({force:true})
        cy.get("tr td").eq(1).each(($el,index,$list)=>{
            const val=$el.text()
            if(val.includes("python")){
                cy.get("tr td:nth-child(2)").eq(index).next().then((val1)=>{
                    const val2=val1.text()
                   expect(val2).to.eq("25")
                //    cy.wrap(val2).should('eq','28')
                })
            }
            
            })
            cy.get("#hide-textbox").click()
            cy.get("#show-textbox").click()
            cy.get("#displayed-text").type("displayed")
            cy.get("#displayed-text").should('have.value','displayed')
            cy.get("tr td:nth-child(3)").each(($el,index,$list)=>{
                if($el.text().includes("Mumbai")){
                    cy.get("tr td:nth-child(3)").eq(index).next().then((myval)=>{
                        const myval1=myval.text()
                        expect(myval1).to.eq("37")
                    })
                }
    })
   cy.get('tr th[style="position: sticky; top: 0;"]').eq(0).should('have.text','Name')
   cy.get('tr th').eq(0).should('have.text','Instructor')
   
    })
})
