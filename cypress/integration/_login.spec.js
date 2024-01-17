describe("Do Login", function () {
  it("Should be able to login", function () {
    if (!Cypress.env("auth-token") && !Cypress.env("auth-user")) {
      if (Cypress.env("configFile") === "local") {
        cy.doLocalLogin();
      } else {
        cy.doLogin();
      }
    } else {
      /**
       * NOTE :
       * This part perform login by injecting the cookies to avoid Okta login form
       * required environments are "auth-token" & "auth-user"
       */
      cy.setCookie("x-ctp-auth-token", Cypress.env("auth-token"));
      cy.setCookie("x-ctp-auth-user", Cypress.env("auth-user"));
      cy.wait(5000); // wait for cookies
    }
  });
});
