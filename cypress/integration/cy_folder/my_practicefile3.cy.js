
import {Registration} from "../my folder/registration_file"
const reg=new Registration()
describe("this is inside describe blcok",()=>{
    it("my test2",()=>{
        cy.fixture("my_practice_example").then((data)=>{
console.log(data)
        let variable=data[1]
        cy.visit(Cypress.env("url2"))
        variable.name.forEach((element) => {
           // if (element && element.name) {
            //const name1=element.name
            console.log(element)
            reg.myName().type(element)
            reg.asser().should("have.value",element)
          //  }
        });
        variable.email.forEach((element) => {
          
           console.log(element)
           reg.myEmail().type(element)
         
       });
       variable.pass.forEach((element) => {
          
        console.log(element)
        reg.myPassword().type(element) 
      
    });
    reg.check().check()
    reg.gender().select("Female")
    reg.radio2().check() 
     reg.radio1().should('be.enabled')
     reg.radio1().should('not.be.checked')// we can use check method also for radio buttons
     reg.disable().should("be.disabled")
     reg.submit().click() 
     reg.text().should('contain','Success!')
     reg.date().click()
     
    })
    })
})