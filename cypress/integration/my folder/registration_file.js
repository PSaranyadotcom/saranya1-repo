export class Registration{
    myName(){
        //return cy.get(".form-control.ng-pristine.ng-invalid.ng-touched")
        return cy.get('input[name="name"]:nth-child(1)').clear()
       
    }
    myEmail(){
        return cy.get('input[name="email"]').clear()
    }
    myPassword(){
        return cy.get('#exampleInputPassword1').clear()
    }
    check(){
        return cy.get("#exampleCheck1")
    }
    gender(){
        return cy.get("#exampleFormControlSelect1")
    }
    radio2(){
        return cy.get("#inlineRadio2")
    }
    radio1(){
        return cy.get("#inlineRadio1")
    }
    disable(){
        return cy.get(".form-check-input")
    }
    asser(){
        //return cy.get(".form-control.ng-pristine.ng-invalid.ng-touched")
        return cy.get('input[name="name"]:nth-child(2)')
    }
    submit(){
        return cy.get(".btn.btn-success")
    }
    text(){
        return cy.get(".alert.alert-success.alert-dismissible")
    }
    date(){
        return cy.get('[type="date"]')
    }

}