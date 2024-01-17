export class Greencart{
    searchProduct(){
        return cy.get(".search-keyword").clear()

    }
    addToCart(){
        return cy.get('.product-action button')
       
        
    }
    checkout(){
        return cy.get(".cart-icon img")
    }
    proceedToCheckout(){
        return cy.contains("PROCEED TO CHECKOUT")
    }
    promo(){
        return cy.get(".promoCode")
    }
    apply(){
        return cy.contains("Apply")
    }
    order(){
        return cy.contains("Place Order")
    }
    select(){
        return cy.get('select[style="width: 200px;"]')
    }
    agree(){
        return cy.get(".chkAgree")
    }
    proceed(){
        return cy.contains("Proceed")
    }

}