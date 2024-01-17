
import { Greencart } from "../my folder/greencart";

const greencart = new Greencart();

describe("this is inside describe blcok",()=>{
    beforeEach(()=>{
        cy.visit(Cypress.env("url"))
     })
   
 
       
          
        
    
    
        
// cy.visit('https://rahulshettyacademy.com/seleniumPractise/#/')


it("my test2",()=>{
 // cy.visit(Cypress.env("url"))
   cy.fixture("my_practice_example.json").then((data)=>{
    console.log(data)
const value=data[1]
    
//let data1=JSON.stringify(data)
//let arr = JSON.parse(data1)
value.prod.forEach((element) => {
    
    greencart.searchProduct().type(element)
    cy.wait(1000)
    value.myprod.forEach((element)=>{
        cy.get('h4.product-name').each(($textname,index,$list)=>{
            const name=$textname.text().trim()
            const elementToMatch=element.trim()
            console.log(name)
            console.log(elementToMatch)
            if(name.includes(elementToMatch)){
                greencart.addToCart().eq(index).click()
            }
        })
}) //fOR each
})

    greencart.checkout().click()
    value.myprod.forEach((element)=>{
     
        console.log(element)
    cy.get("div.product-info p.product-name").should('contain',element)
    
    greencart.proceedToCheckout().click({force:true})
    })
})
var sum=0;
cy.get("tr td:nth-child(4) p").each(($textname,index,$list)=>{
cy.log($textname.text())
    const actVal=$textname.text().trim()
  
        sum=Number(sum)+Number(actVal)
        
}).then(()=>{
    cy.log(sum)
    cy.get('div span.totAmt').each((name)=>{
        const my_val=name.text().trim()
expect(Number(my_val)).to.equal(sum)
})

    
    
})
greencart.promo().type("232343")
greencart.apply().click()

// cy.get("div.promoWrapper span.promoInfo").each((name)=>{
//     expect(name).to.include("Invalid code ..!")
// })
greencart.order().click()
greencart.select().select("Chad")
greencart.agree().check()
greencart.proceed().click()
//cy.go(-2)
cy.get("a").contains("Home").click()
//cy.go('back')
cy.get("h4").contains("Beetroot - 1 Kg").invoke('attr','class').then((name)=>{
const mt_text=name
cy.log(mt_text)
})

    




})
})


