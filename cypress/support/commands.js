// ***********************************************
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/* eslint-disable no-undef */
// eslint-disable-next-line ember-suave/prefer-destructuring
import 'cypress-wait-until'
import 'cypress-file-upload'
import { Common } from '../page-objects/common-page-objects'

const common = new Common()

const _ = Cypress._
const productId = Cypress.env('productId')
const productId1 = Cypress.env('productId1')
const appGroupId1 = Cypress.env('appGroupId1')
const discoveryBaseUrl = Cypress.env('discoveryBaseUrl')
const ssoBaseUrl = Cypress.env('ssoBaseUrl')
const catalogBaseUrl = Cypress.env('catalogBaseUrl')
const cloudProgramBuilderBaseUrl = Cypress.env('cloudProgramBuilderBaseUrl')
const cloudProgramManagerBaseUrl = Cypress.env('cloudProgramManagerBaseUrl')
const entitlementsBaseUrl = Cypress.env('entitlementsBaseUrl')
const codesBaseUrl = Cypress.env('codesBaseUrl')
const walletBaseUrl = Cypress.env('walletBaseUrl')
const purchaseBaseUrl = Cypress.env('purchaseBaseUrl')
const licenseBaseUrl = Cypress.env('licenseBaseUrl')
const achievementsBaseUrl = Cypress.env('achievementsBaseUrl')
const telemetryV1BaseUrl = Cypress.env('telemetryV1BaseUrl')
const cloudDataBaseUrl = Cypress.env('cloudDataBaseUrl')
const promotionsBaseUrl = Cypress.env('promotionsBaseUrl')
const steamAppId = Cypress.env('steamAppId')
const psnAppId = Cypress.env('psnAppId')
const xboxAppId = Cypress.env('xboxAppId')
const nintendoAppId = Cypress.env('nintendoAppId')
const epicAppId = Cypress.env('epicAppId')
const t2gpAppId = Cypress.env('t2gpAppId')
const facebookAppId = Cypress.env('facebookAppId')
const twitterAppId = Cypress.env('twitterAppId')
const twitchAppId = Cypress.env('twitchAppId')
const googleAppId = Cypress.env('googleAppId')
const deviceAppId = Cypress.env('deviceAppId')
const webAppId = Cypress.env('webAppId')
const webBasicAuth = Cypress.env('webBasicAuth')
const ecommerceBasicAuth = Cypress.env('ecommerceBasicAuth')
const appsBasicAuth = Cypress.env('appsBasicAuth')
const telemetryBasicAuth = Cypress.env('telemetryBasicAuth')
const discoveryBasicAuth = Cypress.env('discoveryBasicAuth')
const cloudDataBasicAuth = Cypress.env('cloudDataBasicAuth')
const cloudProgramBasicAuth = Cypress.env('cloudProgramBasicAuth')
const legalDocBasicAuth = Cypress.env('legalDocBasicAuth')
const telemetry_K_V1BaseUrl = Cypress.env('telemetry_K_V1BaseUrl')

Cypress.Commands.add('visitBaseUrl', () => {
  cy.visit('/')
  cy.waitUntil(() => cy.get('.page-content-white'))
})

Cypress.Commands.add('doBasicLocalLogin', () => {
  Cypress.log({
    name: 'doBasicLocalLogin',
  })

  cy.visitBaseUrl()
  cy.contains('Login').click()
  cy.get('input[name=username]').type(Cypress.env('username'))
  cy.get('input[name=password]').type(Cypress.env('password'))
  cy.get('#okta-signin-submit').click()

  cy.waitUntil(() => cy.get('.page-content-white'))
})

/*
 * Method deprecated, due to issues with auth and login.
 * Replaced by doBasicLocalLogin
 */
Cypress.Commands.add('doLocalLogin', (overrides = {}) => {
  Cypress.log({
    name: 'doLocalLogin',
  })

  const options = {
    method: 'GET',
    url: `${Cypress.config('baseUrl')}/api/saml/sso/login`,
    followRedirect: true,
  }

  _.extend(options, overrides)

  // NOTE : Hack to avoid CORS Origin issue for local env
  cy.request(options).then((resp) => {
    let redirectTo = resp.redirects[0].replace('302: ', '')
    cy.visit(redirectTo)
  })

  cy.get('input[name=username]').type(Cypress.env('username'))
  // need to click Next button when login through console.okta.com, okta preview for local not using Next button
  cy.get('body').then(($body) => {
    // synchronously query for element
    if ($body.find('#idp-discovery-submit').length) {
      cy.get('#idp-discovery-submit').click()
    }
  })
  cy.get('input[name=password]').type(Cypress.env('password'))
  cy.get('#okta-signin-submit').click()

  cy.wait(5000) // There is a delay for token set
})

Cypress.Commands.add('doLogin', () => {
  cy.visitBaseUrl()
  cy.contains('Login').click()
  cy.loginByGoogleAuthentication()
  cy.waitUntil(() => cy.get('.page-content-white'))
})

Cypress.Commands.add('doAuth', () => {
  cy.getCookie('x-ctp-auth-token').then((cookie) => {
    if (cookie === null) {
      if (!Cypress.env('auth-token') && !Cypress.env('auth-user')) {
        if (Cypress.env('configFile') === 'local') {
          cy.doBasicLocalLogin()
        } else {
          cy.doLogin()
        }
      } else {
        /**
         * NOTE :
         * This part perform login by injecting the cookies to avoid Okta login form
         * required environments are "auth-token" & "auth-user"
         */
        cy.setCookie('x-ctp-auth-token', Cypress.env('auth-token'))
        cy.setCookie('x-ctp-auth-user', Cypress.env('auth-user'))
      }
    } else if (cookie != null) {
      cy.visitBaseUrl().then(() => {
        cy.get('body')
          .wait(3000)
          .then(($body) => {
            if ($body.find('button.login-button').length) {
              cy.intercept('POST', '**/sso/consume')
                .as('waitForLogin')
                .then(() => {
                  cy.get('button').contains('Login').click()
                })
              cy.wait('@waitForLogin')
            }
          })
      })
    }
  })
})

Cypress.Commands.add('loginByGoogleAuthentication', () => {
  cy.waitUntil(() => cy.get('.okta-container'))
  cy.get("input[type='text']").clear().type(Cypress.env('username'))
  cy.get("input[type='submit']").click()
  cy.wait(7000)
  cy.waitUntil(() => cy.get('div #signin-container'))
  cy.get('.okta-form-title').then(($ele) => {
    if ($ele.text() === 'Verify with your password') {
      cy.inputPassword()
      cy.get('.okta-form-title').then(($ele) => {
        if ($ele.text() === "Verify it's you with a security method") {
          cy.get('.authenticator-label')
            .contains('Google Authenticator')
            .parent()
            .siblings('div')
            .contains('Select')
            .click()
        } else if ($ele.text() !== 'Verify with Google Authenticator') {
          cy.get('[class="link js-switchAuthenticator"]').click()
          cy.get('.authenticator-label')
            .contains('Google Authenticator')
            .parent()
            .siblings('div')
            .contains('Select')
            .click()
        }
      })
      cy.inputAuthTokenSecret()
    } else if ($ele.text() === 'Verify with Google Authenticator') {
      cy.inputAuthTokenSecret()
      cy.get('.okta-form-title').then(($ele) => {
        if ($ele.text() === "Verify it's you with a security method") {
          cy.get('.authenticator-label').contains('Password').parent().siblings('div').contains('Select').click()
        } else if ($ele.text() !== 'Verify with your password') {
          cy.get('[class="link js-switchAuthenticator"]').click()
          cy.get('.authenticator-label').contains('Password').parent().siblings('div').contains('Select').click()
        }
      })
      cy.inputPassword()
    } else if ($ele.text() === "Verify it's you with a security method") {
      cy.get('.authenticator-label').contains('Password').parent().siblings('div').contains('Select').click()
      cy.inputPassword()
      cy.get('.okta-form-title').then(($ele) => {
        if ($ele.text() === "Verify it's you with a security method") {
          cy.get('.authenticator-label')
            .contains('Google Authenticator')
            .parent()
            .siblings('div')
            .contains('Select')
            .click()
        } else if ($ele.text() !== 'Verify with Google Authenticator') {
          cy.get('[class="link js-switchAuthenticator"]').click()
          cy.get('.authenticator-label')
            .contains('Google Authenticator')
            .parent()
            .siblings('div')
            .contains('Select')
            .click()
        }
      })
      cy.inputAuthTokenSecret()
    } else {
      cy.get('[class="link js-switchAuthenticator"]').click()
      cy.get('.authenticator-label')
        .contains('Google Authenticator')
        .parent()
        .siblings('div')
        .contains('Select')
        .click()
      cy.inputAuthTokenSecret()
      cy.get('[class="link js-switchAuthenticator"]').click()
      cy.get('.authenticator-label').contains('Password').parent().siblings('div').contains('Select').click()
      cy.inputPassword()
    }
  })
})

Cypress.Commands.add('inputPassword', () => {
  cy.get("input[type='password']").clear().type(Cypress.env('password'), { log: false })
  cy.get("input[type='submit']").click()
  cy.wait(1000)
})

Cypress.Commands.add('inputAuthTokenSecret', () => {
  cy.task('generateOTP', Cypress.env('token_secret')).then((token) => {
    cy.get("input[type='text']").type(token)
  })
  cy.get('input[type=submit]').click()
  cy.wait(1000)
})

Cypress.Commands.add('getFeatureFlags', () => {
  cy.getCookie('x-ctp-auth-token').then((jwt) => {
    cy.request({
      method: 'GET',
      url: `/api/configs`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${jwt.value}`,
      },
    }).then((res) => {
      res.body.results.forEach((result) => {
        if (result.name == 'featureFlags') {
          return cy.wrap(result.value)
        }
      })
    })
  })
})

Cypress.Commands.add('getConfiguration', (configurationName) => {
  cy.getCookie('x-ctp-auth-token').then((jwt) => {
    cy.request({
      method: 'GET',
      url: `/api/configs`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${jwt.value}`,
      },
    }).then((res) => {
      res.body.results.forEach((result) => {
        if (result.name == configurationName) {
          return cy.wrap(result.value)
        }
      })
    })
  })
})

Cypress.Commands.add('getService', (appGroupId) => {
  cy.request(
    {
      method: 'GET',
      url: discoveryBaseUrl + '/services?appGroupId=' + appGroupId,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + discoveryBasicAuth,
      },
    },
    { failOnStatusCode: false }
  ).then((res) => {
    expect(res.status).to.equal(200)
    return res.body[0]
  })
})

Cypress.Commands.add('addServiceEndpoint', (appGroupId, serviceEndpoint, serviceName) => {
  cy.request({
    method: 'POST',
    url: discoveryBaseUrl + '/services',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + discoveryBasicAuth,
    },
    body: {
      appGroupId: appGroupId,
      baseUrl: serviceEndpoint,
      name: serviceName,
      tags: ['public'],
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
    return res.body.serviceId
  })
})

Cypress.Commands.add('deleteServiceEndpoint', (serviceId) => {
  cy.request({
    method: 'DELETE',
    url: discoveryBaseUrl + '/services/' + serviceId,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + discoveryBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
  })
})

Cypress.Commands.add('assertAlert', (message) => {
  cy.get('.ant-notification').then((notification) => {
    expect(notification.length).to.equal(1)
  })

  cy.get('.ant-notification-notice').then(($alert) => {
    expect($alert.text()).to.include(message)
  })
})

Cypress.Commands.add('parseIdFromHeader', (res) => {
  var temp = res.headers['location'].split('/')
  expect(temp[temp.length - 1]).to.not.be.empty
  return temp[temp.length - 1].toString()
})

// TODO: Get service URLs with Discovery when TD App auth is provided
Cypress.Commands.add('beginDiscovery', () => {
  let services = [
    'achievements',
    'license',
    'telemetry',
    'sso',
    'purchase',
    'codes',
    'catalog',
    'entitlements',
    'wallet',
  ]
  let serviceUrls = new Object()
  // GET service endpoints
  cy.request({
    method: 'GET',
    url: `${Cypress.env('discoveryBaseUrl')}/services`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Application `,
    },
  }).then((res) => {
    services.forEach((service) => {
      res.body.forEach(($el) => {
        if ($el.name == service) {
          serviceUrls[service] = $el.baseUrl
        }
      })
    })
  })
})

Cypress.Commands.add('generateCurrencyCode', () => {
  const realCurrencies = [
    'AED',
    'ARS',
    'AUD',
    'BRL',
    'CAD',
    'CHF',
    'CLP',
    'CNY',
    'COP',
    'CRC',
    'EUR',
    'GBP',
    'HKD',
    'ILS',
    'IDR',
    'INR',
    'JPY',
    'KRW',
    'KWD',
    'KZT',
    'MXN',
    'MYR',
    'NOK',
    'NZD',
    'PEN',
    'PHP',
    'PLN',
    'QAR',
    'RUB',
    'SAR',
    'SGD',
    'THB',
    'TRY',
    'TWD',
    'UAH',
    'USD',
    'UYU',
    'VND',
    'ZAR',
  ]

  let result = ''
  const char = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  while (result.length != 3) {
    result += char.charAt(Math.floor(Math.random() * char.length))
    if (realCurrencies.includes(result)) {
      result = ''
    }
  }

  return result.toString()
})

Cypress.Commands.add('generateAppId', (length) => {
  let result = ''
  const char = '0123456789abcdef'
  for (let i = 0; i < length; i++) {
    result += char.charAt(Math.floor(Math.random() * char.length))
  }
  return result.toString()
})

// acceptanceState = all, none, pp, tos
Cypress.Commands.add('createSteamAccount', (firstPartyPlayerId, firstPartyAlias, acceptanceState = 'all') => {
  cy.request({
    method: 'POST',
    url: ssoBaseUrl + '/auth/tokens',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Application ' + steamAppId,
    },
    body: {
      locale: 'en-US',
      accountType: 'platform',
      credentials: {
        type: 'steam',
        steamUserId: firstPartyPlayerId,
        steamProfileName: firstPartyAlias,
        encryptedAppTicket: 'a0',
      },
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
    cy.wrap(res)
      .as('accountResponse')
      .then(() => {
        cy.acceptLegalDocs(acceptanceState).then(() => {
          return cy.get('@accountResponse')
        })
      })
  })
})

Cypress.Commands.add('createPSNAccount', (firstPartyPlayerId, firstPartyAlias, acceptanceState = 'all') => {
  cy.request({
    method: 'POST',
    url: ssoBaseUrl + '/auth/tokens',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Application ' + psnAppId,
    },
    body: {
      locale: 'en-US',
      accountType: 'platform',
      credentials: {
        type: 'psn',
        psnAccountId: firstPartyPlayerId,
        psnOnlineId: firstPartyAlias,
        psnAuthCode: 'rYo1En',
        dob: '01/01/2000',
        psnEnvironment: 1,
        psnRegion: 'scea',
      },
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
    cy.wrap(res)
      .as('accountResponse')
      .then(() => {
        cy.acceptLegalDocs(acceptanceState).then(() => {
          return cy.get('@accountResponse')
        })
      })
  })
})

Cypress.Commands.add('createXboxAccount', (firstPartyPlayerId, firstPartyAlias, acceptanceState = 'all') => {
  cy.request({
    method: 'POST',
    url: ssoBaseUrl + '/auth/tokens',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Application ' + xboxAppId,
    },
    body: {
      locale: 'en-US',
      accountType: 'platform',
      credentials: {
        type: 'xbl',
        xblXuid: firstPartyPlayerId,
        xblGamertag: firstPartyAlias,
        ageGroup: '3',
        xstsToken: 'unvalidated',
      },
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
    cy.wrap(res)
      .as('accountResponse')
      .then(() => {
        cy.acceptLegalDocs(acceptanceState).then(() => {
          return cy.get('@accountResponse')
        })
      })
  })
})

// TODO: need a Switch to get valid nsaToken and naAuthCode
Cypress.Commands.add('createNintendoAccount', (firstPartyPlayerId, firstPartyAlias, acceptanceState = 'all') => {
  cy.request({
    method: 'POST',
    url: ssoBaseUrl + '/auth/tokens',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Application ' + nintendoAppId,
    },
    body: {
      locale: 'en-US',
      accountType: 'platform',
      credentials: {
        type: 'nintendo',
        nsaId: firstPartyPlayerId,
        nsaNickname: firstPartyAlias,
        nsaToken: '',
        naAuthCode: '',
      },
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
    cy.wrap(res)
      .as('accountResponse')
      .then(() => {
        cy.acceptLegalDocs(acceptanceState).then(() => {
          return cy.get('@accountResponse')
        })
      })
  })
})

Cypress.Commands.add('createEpicAccount', (firstPartyPlayerId, firstPartyAlias, acceptanceState = 'all') => {
  cy.request({
    method: 'POST',
    url: ssoBaseUrl + '/auth/tokens',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Application ' + epicAppId,
    },
    body: {
      locale: 'en-US',
      accountType: 'platform',
      credentials: {
        type: 'epic',
        epicUserId: firstPartyPlayerId,
        epicUserName: firstPartyAlias,
        epicAccessToken: '0',
      },
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
    cy.wrap(res)
      .as('accountResponse')
      .then(() => {
        cy.acceptLegalDocs(acceptanceState).then(() => {
          return cy.get('@accountResponse')
        })
      })
  })
})

Cypress.Commands.add('createT2GPAccount', (accessToken, acceptanceState = 'all') => {
  cy.request({
    method: 'POST',
    url: ssoBaseUrl + '/auth/tokens',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Application ' + t2gpAppId,
    },
    body: {
      locale: 'en-US',
      accountType: 'platform',
      credentials: {
        type: 't2gp',
        accessToken: accessToken,
      },
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
    cy.wrap(res)
      .as('accountResponse')
      .then(() => {
        cy.acceptLegalDocs(acceptanceState).then(() => {
          // Make request again to get new accessToken
          cy.request({
            method: 'POST',
            url: ssoBaseUrl + '/auth/tokens',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Application ' + t2gpAppId,
            },
            body: {
              locale: 'en-US',
              accountType: 'platform',
              credentials: {
                type: 't2gp',
                accessToken: accessToken,
              },
            },
          }).then((res) => {
            return res
          })
        })
      })
  })
})

Cypress.Commands.add('createFacebookAccount', (socialPlatformId, socialPlatformAlias, acceptanceState = 'all') => {
  cy.request({
    method: 'POST',
    url: ssoBaseUrl + '/auth/tokens',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Application ' + facebookAppId,
    },
    body: {
      locale: 'en-US',
      accountType: 'platform',
      credentials: {
        type: 'facebook',
        facebookId: socialPlatformId,
        facebookName: socialPlatformAlias,
        facebookToken: '0',
      },
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
    cy.wrap(res)
      .as('accountResponse')
      .then(() => {
        cy.acceptLegalDocs(acceptanceState).then(() => {
          return cy.get('@accountResponse')
        })
      })
  })
})

Cypress.Commands.add('createTwitterAccount', (socialPlatformId, socialPlatformAlias, acceptanceState = 'all') => {
  cy.request({
    method: 'POST',
    url: ssoBaseUrl + '/auth/tokens',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Application ' + twitterAppId,
    },
    body: {
      locale: 'en-US',
      accountType: 'platform',
      credentials: {
        type: 'twitter',
        twitterId: socialPlatformId,
        twitterUserName: socialPlatformAlias,
        twitterAccessToken: '0',
        twitterAccessTokenSecret: '0',
      },
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
    cy.wrap(res)
      .as('accountResponse')
      .then(() => {
        cy.acceptLegalDocs(acceptanceState).then(() => {
          return cy.get('@accountResponse')
        })
      })
  })
})

Cypress.Commands.add('createTwitchAccount', (socialPlatformId, socialPlatformAlias, acceptanceState = 'all') => {
  cy.request({
    method: 'POST',
    url: ssoBaseUrl + '/auth/tokens',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Application ' + twitchAppId,
    },
    body: {
      locale: 'en-US',
      accountType: 'platform',
      credentials: {
        type: 'twitch',
        twitchId: socialPlatformId,
        twitchUserName: socialPlatformAlias,
        twitchAccessToken: '0',
      },
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
    cy.wrap(res)
      .as('accountResponse')
      .then(() => {
        cy.acceptLegalDocs(acceptanceState).then(() => {
          return cy.get('@accountResponse')
        })
      })
  })
})

Cypress.Commands.add('createGoogleAccount', (socialPlatformId, socialPlatformAlias, acceptanceState = 'all') => {
  cy.request({
    method: 'POST',
    url: ssoBaseUrl + '/auth/tokens',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Application ' + googleAppId,
    },
    body: {
      locale: 'en-US',
      accountType: 'platform',
      credentials: {
        type: 'google',
        googleId: socialPlatformId,
        googleDisplayName: socialPlatformAlias,
        googleAccessToken: '0',
      },
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
    cy.wrap(res)
      .as('accountResponse')
      .then(() => {
        cy.acceptLegalDocs(acceptanceState).then(() => {
          return cy.get('@accountResponse')
        })
      })
  })
})

Cypress.Commands.add('createDeviceAccount', (deviceId, deviceName, acceptanceState = 'all') => {
  cy.request({
    method: 'POST',
    url: ssoBaseUrl + '/auth/tokens',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Application ' + deviceAppId,
    },
    body: {
      locale: 'en-US',
      accountType: 'device',
      credentials: {
        type: 'device',
        deviceId: deviceId,
        deviceName: deviceName,
        dob: '01/01/2000',
      },
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
    cy.wrap(res)
      .as('accountResponse')
      .then(() => {
        cy.acceptLegalDocs(acceptanceState).then(() => {
          // Make request again to get new accessToken
          cy.request({
            method: 'POST',
            url: ssoBaseUrl + '/auth/tokens',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Application ' + deviceAppId,
            },
            body: {
              locale: 'en-US',
              accountType: 'device',
              credentials: {
                type: 'device',
                deviceId: deviceId,
                deviceName: deviceName,
                dob: '01/01/2000',
              },
            },
          }).then((res) => {
            return res
          })
        })
      })
  })
})

Cypress.Commands.add('createUndisclosedAccount', (accessToken, firstPartyPlayerId, onlineServiceType = 3) => {
  cy.request({
    method: 'POST',
    url: ssoBaseUrl + '/server/user/accounts/batch/upsert-first-party/',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + accessToken,
    },
    body: [
      {
        onlineServiceType: onlineServiceType,
        firstPartyId: firstPartyPlayerId,
        // TODO: Change from hard coded to get legal manifest
        legalDocuments: ['6de65154033c4a60b2b02326d13cbd65', '84ebb5a3ad1e49dc94c83fb4dcd1367a'],
      },
    ],
  }).then((res) => {
    expect(res.status).to.equal(200)
    return res
  })
})

Cypress.Commands.add('getServerAuth', () => {
  cy.generateAppId(32).then((instanceId) => {
    cy.request({
      method: 'POST',
      url: ssoBaseUrl + '/auth/tokens',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + webBasicAuth,
      },
      body: {
        locale: 'en-US',
        accountType: 'server',
        credentials: {
          type: 'server',
          instanceId: instanceId,
        },
      },
    }).then((res) => {
      expect(res.status).to.equal(200)
      return res.body.accessToken
    })
  })
})

Cypress.Commands.add('acceptLegalDocs', (acceptanceState) => {
  let accessToken = ''
  let termsOfService = ''
  let privacyPolicy = ''
  let tosAccepted = true
  let ppAccepted = true

  switch (acceptanceState) {
    case 'all':
      break

    case 'none':
      tosAccepted = false
      ppAccepted = false
      break

    case 'tos':
      ppAccepted = false
      break

    case 'pp':
      tosAccepted = false
      break
  }

  cy.get('@accountResponse')
    .then((res) => {
      accessToken = res.body.accessToken
      res.body.legalManifest.forEach(($el) => {
        if ($el.type == 1) {
          termsOfService = $el.documentId
        } else if ($el.type == 2) {
          privacyPolicy = $el.documentId
        }
      })
    })
    .then(() => {
      cy.request({
        method: 'POST',
        url: ssoBaseUrl + '/user/accounts/me/responses',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + accessToken,
        },
        body: [
          {
            documentId: termsOfService,
            isAccepted: tosAccepted,
          },
          {
            documentId: privacyPolicy,
            isAccepted: ppAccepted,
          },
        ],
      }).then((res) => {
        expect(res.status).to.equal(201)
      })
    })
})

Cypress.Commands.add('createFullAccount', (emailAddress) => {
  cy.request({
    method: 'POST',
    url: ssoBaseUrl + '/user/accounts',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Application ' + webAppId,
    },
    body: {
      firstName: 'First',
      lastName: 'Last',
      displayName: 'Display',
      email: emailAddress,
      password: 'Asdf1234!',
      dob: '1/1/2000',
      locale: 'en-US',
      isEmailVerified: true,
      isDobVerified: true,
    },
  }).then((res) => {
    expect(res.status).to.equal(201)
    cy.parseIdFromHeader(res).then((id) => {
      return id
    })
  })
})

Cypress.Commands.add('linkByEmailPasswordLegacy', (accessToken, emailAddress) => {
  cy.request({
    method: 'POST',
    url: ssoBaseUrl + '/user/accounts/me/links/parent',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + accessToken,
    },
    body: {
      email: emailAddress,
      password: 'Asdf1234!',
    },
  }).then((res) => {
    expect(res.status).to.equal(201)
  })
})

Cypress.Commands.add('linkByEmailPassword', (accessToken, emailAddress, linkType = 'parent') => {
  cy.request({
    method: 'POST',
    url: ssoBaseUrl + '/user/accounts/me/links',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + accessToken,
    },
    body: {
      email: emailAddress,
      password: 'Asdf1234!',
      linkType: linkType,
    },
  }).then((res) => {
    expect(res.status).to.equal(201)
  })
})

Cypress.Commands.add('linkByAccessToken', (accessToken, targetAccessToken, linkType = 'parent') => {
  cy.request({
    method: 'POST',
    url: ssoBaseUrl + '/user/accounts/me/links',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + accessToken,
    },
    body: {
      accessToken: targetAccessToken,
      linkType: linkType,
    },
  }).then((res) => {
    expect(res.status).to.equal(201)
  })
})

Cypress.Commands.add('unlinkAccountByAccessToken', (accessToken) => {
  cy.request({
    method: 'DELETE',
    url: ssoBaseUrl + '/user/accounts/me/links/parent',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + accessToken,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('fullAccountLogin', (emailAddress) => {
  cy.request({
    method: 'POST',
    url: ssoBaseUrl + '/auth/tokens',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Application ' + webAppId,
    },
    body: {
      locale: 'en-US',
      accountType: 'full',
      credentials: {
        type: 'emailPassword',
        email: emailAddress,
        password: 'Asdf1234!',
      },
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
    return res.body
  })
})

Cypress.Commands.add('deleteAccount', (fullPublicId) => {
  cy.request({
    method: 'DELETE',
    url: ssoBaseUrl + '/user/accounts/' + fullPublicId,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + webBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('createStore', (storeName) => {
  cy.request({
    method: 'POST',
    url: catalogBaseUrl + '/stores',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
    body: {
      productId: productId,
      type: 0,
      name: storeName,
      description: 'description',
      isPublishedToDigitalRiver: false,
      isTargeted: false,
    },
  }).then((res) => {
    cy.parseIdFromHeader(res).then((id) => {
      return id
    })
  })
})

Cypress.Commands.add('exportStore', (storeId) => {
  cy.request({
    method: 'GET',
    url: `${catalogBaseUrl}/stores/${storeId}/export`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
    return res.body
  })
})

Cypress.Commands.add('cleanUpStoreAndOfferRecords', () => {
  var arr = []
  cy.request({
    method: 'GET',
    url: `${catalogBaseUrl}/stores?productId=${productId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    cy.wrap(parseInt(res.headers['x-2k-result-total'])).as('totalCount')
  })
  cy.get('@totalCount').then((totalCount) => {
    if (totalCount != 0) {
      cy.request({
        method: 'GET',
        url: `${catalogBaseUrl}/stores?productId=${productId}&offset=0&limit=${parseInt(totalCount)}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + ecommerceBasicAuth,
        },
      }).then((res) => {
        for (var i = 0; i < totalCount; i++) {
          cy.getAllOffersCreatedInsideStoreId(res.body[i].id).then((body) => {
            if (body.length > 0) {
              for (var i = 0; i < body.length; i++) {
                cy.deleteOffer(body[i].id)
                arr.push(body[i].id)
              }
            }
          })
          if (i < totalCount - 10) {
            cy.deleteStore(res.body[i].id)
          }
        }
      })
    }
  })
})

Cypress.Commands.add('cleanUpSkuRecords', () => {
  cy.request({
    method: 'GET',
    url: `${catalogBaseUrl}/skus?productId=${productId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    cy.wrap(parseInt(res.headers['x-2k-result-total'])).as('totalCount')
  })
  cy.get('@totalCount').then((totalCount) => {
    if (totalCount != 0) {
      cy.request({
        method: 'GET',
        url: `${catalogBaseUrl}/skus?productId=${productId}&pageNumber=0&pageSize=${parseInt(totalCount)}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + ecommerceBasicAuth,
        },
      }).then((res) => {
        for (var i = 0; i < totalCount - 10; i++) {
          cy.getAllSkuDependencies(res.body[i].id).then((body) => {
            if (body.length > 0) {
              for (var i = 0; i < body.length; i++) {
                cy.deleteSkuDependencies(body[i].skuId, body[i].resourceType, body[i].resourceId)
              }
            }
          })
          cy.deleteSKU(res.body[i].id)
        }
      })
    }
  })
})

Cypress.Commands.add('getAllSkuDependencies', (SkuId) => {
  cy.request({
    method: 'GET',
    url: `${catalogBaseUrl}/skus/dependencies?skuId=${SkuId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
    return res.body
  })
})

Cypress.Commands.add('deleteSkuDependencies', (SkuId, resourceType, resourceId) => {
  cy.request({
    method: 'DELETE',
    url: `${catalogBaseUrl}/skus/dependencies?skuId=${SkuId}&resourceType=${resourceType}&resourceId=${resourceId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('getAllOffersCreatedInsideStoreId', (storeId) => {
  cy.request({
    method: 'GET',
    url: `${catalogBaseUrl}/offers?storeId=${storeId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
    return res.body
  })
})

Cypress.Commands.add('deleteStore', (storeId) => {
  cy.request({
    method: 'DELETE',
    url: catalogBaseUrl + '/stores/' + storeId,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('createSKU', (storeId, skuName) => {
  cy.request({
    method: 'POST',
    url: catalogBaseUrl + '/skus',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
    body: {
      storeId: storeId,
      name: skuName,
      description: 'description',
      tags: ['tag1'],
      includedCurrencies: [
        {
          currency: 'TST',
          amount: 100,
        },
      ],
    },
  }).then((res) => {
    cy.parseIdFromHeader(res).then((id) => {
      return id
    })
  })
})

Cypress.Commands.add('createSKUWithoutStore', (skuName) => {
  cy.request({
    method: 'POST',
    url: catalogBaseUrl + '/skus',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
    body: {
      productId: productId,
      name: skuName,
      description: 'description',
      tags: ['tag1'],
      includedCurrencies: [
        {
          currency: 'TST',
          amount: 100,
        },
      ],
    },
  }).then((res) => {
    cy.parseIdFromHeader(res).then((id) => {
      return id
    })
  })
})

Cypress.Commands.add('deleteSKU', (skuId) => {
  cy.request({
    method: 'DELETE',
    url: catalogBaseUrl + '/skus/' + skuId,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('createOffer', (storeId, skuId, offerName) => {
  var startdate = +new Date()
  var enddate = new Date()
  enddate = enddate.setMonth(enddate.getMonth() + 1)
  cy.request({
    method: 'POST',
    url: catalogBaseUrl + '/offers',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
    body: {
      storeId: storeId,
      skuId: skuId,
      name: offerName,
      description: 'description',
      tags: ['tag1'],
      pricings: [
        {
          isDefault: true,
          country: '__',
          priceValues: [
            {
              currency: 'TST',
              amount: 10,
              discountAmount: 5,
            },
          ],
        },
      ],
      startDate: startdate,
      endDate: enddate,
      priority: 1,
      isTargeted: false,
      type: 0,
    },
  }).then((res) => {
    cy.parseIdFromHeader(res).then((id) => {
      return id
    })
  })
})

Cypress.Commands.add('createOfferWithMultipleCurrency', (storeId, skuId, offerName) => {
  var startdate = +new Date()
  var enddate = new Date()
  enddate = enddate.setMonth(enddate.getMonth() + 1)
  cy.request({
    method: 'POST',
    url: catalogBaseUrl + '/offers',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
    body: {
      storeId: storeId,
      skuId: skuId,
      name: offerName,
      description: 'description',
      tags: ['tag1'],
      pricings: [
        {
          isDefault: true,
          country: '__',
          priceValues: [
            {
              currency: 'CXP',
              amount: 10,
              discountAmount: 5,
            },
            {
              currency: 'TST',
              amount: 10,
              discountAmount: 5,
            },
            {
              currency: 'CYI',
              amount: 10,
              discountAmount: 5,
            },
          ],
        },
      ],
      startDate: startdate,
      endDate: enddate,
      priority: 1,
      isTargeted: false,
      type: 0,
    },
  }).then((res) => {
    cy.parseIdFromHeader(res).then((id) => {
      return id
    })
  })
})

Cypress.Commands.add('createSalesEvent', (salesEventName, storeId, offerId) => {
  var startdate = +new Date()
  var enddate = new Date()
  enddate = enddate.setMonth(enddate.getMonth() + 1)
  cy.request({
    method: 'POST',
    url: catalogBaseUrl + '/stores/' + storeId + '/salesevents',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
    body: {
      name: salesEventName,
      description: 'description',
      discount: 10,
      from: startdate,
      until: enddate,
      includedOffers: [offerId],
      customData: 'custom data',
    },
  }).then((res) => {
    expect(res.status).to.equal(201)
    cy.parseIdFromHeader(res).then((id) => {
      return id
    })
  })
})
Cypress.Commands.add('deleteSalesEvent', (storeId, eventId) => {
  cy.request({
    method: 'DELETE',
    url: `${catalogBaseUrl}/stores/${storeId}/salesevents/${eventId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('deleteOffer', (offerId) => {
  cy.request({
    method: 'DELETE',
    url: catalogBaseUrl + '/offers/' + offerId,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add(
  'createFpim',
  (firstPartyName, fpimProductId, fpimProductName, skuId, additionalKey, additionalValue) => {
    let requestBody = {
      productId: productId,
      firstPartyName: firstPartyName,
      firstPartyItemId: fpimProductId,
      firstPartyItemName: fpimProductName,
      skuId: skuId,
    }
    requestBody[additionalKey] = additionalValue

    cy.request({
      method: 'POST',
      url: catalogBaseUrl + '/firstpartyitemmappings',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + ecommerceBasicAuth,
      },
      body: requestBody,
    }).then((res) => {
      cy.parseIdFromHeader(res).then((id) => {
        return id
      })
    })
  }
)

Cypress.Commands.add('getFpim', (firstPartyName) => {
  cy.request({
    method: 'GET',
    url: catalogBaseUrl + `/firstpartyitemmappings?productId=${productId}&firstPartyName=${firstPartyName}&limit=1000`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    return res
  })
})

Cypress.Commands.add('deleteFpim', (fpimId) => {
  cy.request({
    method: 'DELETE',
    url: catalogBaseUrl + '/firstpartyitemmappings/' + fpimId,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

// type: 0=Durable unique, 1=Durable non-unique, 2=Consumable unique, 3=Consumable non-unique
Cypress.Commands.add(
  'createItem',
  (itemName, type, additionalKey, additionalValue, additionalKey1, additionalValue1) => {
    let requestBody = {
      productId: productId,
      name: itemName,
      description: 'description',
      tags: ['tag1'],
      type: type,
      customData: '{}',
      intrinsicValue: 0,
    }
    requestBody[additionalKey] = additionalValue
    requestBody[additionalKey1] = additionalValue1

    cy.request({
      method: 'POST',
      url: entitlementsBaseUrl + '/items',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + ecommerceBasicAuth,
      },
      body: requestBody,
    }).then((res) => {
      cy.parseIdFromHeader(res).then((id) => {
        return id
      })
    })
  }
)

Cypress.Commands.add('grantEntitlements', (accountId, itemId) => {
  const requestId = common.newUUID()
  cy.request({
    method: 'POST',
    url: `${entitlementsBaseUrl}/entitlements`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
      'X-2k-Request-Id': requestId,
    },
    body: [
      {
        productId: productId,
        accountId: accountId,
        itemId: itemId,
        quantity: 1,
        referenceId: requestId,
        customData: 'string',
      },
    ],
  }).then((res) => {
    expect(res.status).to.equal(201)
    return res.body[0].id
  })
})

Cypress.Commands.add('deleteGrantedEntitlement', (grantedEntitlementId) => {
  const requestId = common.newUUID()
  cy.request({
    method: 'DELETE',
    url: `${entitlementsBaseUrl}/entitlements/${grantedEntitlementId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
      'X-2k-Request-Id': requestId,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('CleanUpItems', () => {
  cy.request({
    method: 'GET',
    url: `${entitlementsBaseUrl}/items?productId=${productId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    cy.wrap(parseInt(res.headers['x-2k-result-total'])).as('totalCount')
  })
  cy.get('@totalCount').then((totalCount) => {
    if (totalCount != 0) {
      cy.request({
        method: 'GET',
        url: `${entitlementsBaseUrl}/items?productId=${productId}&pageNumber=0&pageSize=${parseInt(totalCount)}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + ecommerceBasicAuth,
        },
      }).then((res) => {
        //maintaining only 10 record in items page
        let skuDependency = []
        let itemIdToBeDeleted = []
        for (let i = 0; i < totalCount - 10; i++) {
          cy.getItemDependencies(res.body[i].id).then((body) => {
            if (body.length > 0) {
              for (var i = 0; i < body.length; i++) {
                // skipping the item which has sku dependencies and those will be cleaned up in the sku clean up.
                if (body[i].resourceType !== 1) {
                  itemIdToBeDeleted.push(body[i].itemId)
                  cy.deleteItemDependencies(body[i].resourceType, body[i].resourceId)
                  cy.deleteItem(res.body[i].id)
                } else {
                  skuDependency.push(body[i].itemId)
                }
              }
            }
          })
        }
        cy.then(() => {
          for (let i = 0; i < totalCount - 10; i++) {
            if (!itemIdToBeDeleted.includes(res.body[i].id) && !skuDependency.includes(res.body[i].id)) {
              cy.deleteItem(res.body[i].id)
            }
          }
        })
      })
    }
  })
})

Cypress.Commands.add('getItemDependencies', (itemId) => {
  cy.request({
    method: 'GET',
    url: `${entitlementsBaseUrl}/dependencies?itemId=${itemId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
    return res.body
  })
})

Cypress.Commands.add('deleteItemDependencies', (resourceType, resourceId) => {
  cy.request({
    method: 'DELETE',
    url: `${entitlementsBaseUrl}/dependencies?resourceType=${resourceType}&resourceId=${resourceId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('deleteItem', (itemId) => {
  cy.request({
    method: 'DELETE',
    url: entitlementsBaseUrl + '/items/' + itemId,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('createCampaign', (campaignName) => {
  cy.request({
    method: 'POST',
    url: codesBaseUrl + '/campaigns',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
    body: {
      productId: productId,
      name: campaignName,
    },
  }).then((res) => {
    cy.parseIdFromHeader(res).then((id) => {
      return id
    })
  })
})

Cypress.Commands.add('cleanUpCampaign', (licenseId) => {
  var arrLicenses = []
  cy.request({
    method: 'GET',
    url: `${licenseBaseUrl}/licenses?productId=${productId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  })
    .then((res) => {
      if (res.body.length > 0) {
        for (let i = 0; i < res.body.length; i++) {
          arrLicenses.push(res.body[i].id)
        }
      }
    })
    .then(() => {
      cy.request({
        method: 'GET',
        url: `${codesBaseUrl}/campaigns?productId=${productId}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + ecommerceBasicAuth,
        },
      }).then((res) => {
        cy.wrap(parseInt(res.headers['x-2k-result-total'])).as('totalCount')
      })
      cy.get('@totalCount').then((totalCount) => {
        if (totalCount != 0) {
          cy.request({
            method: 'GET',
            url: `${codesBaseUrl}/campaigns?productId=${productId}&pageNumber=0&pageSize=${parseInt(totalCount)}`,
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Basic ' + ecommerceBasicAuth,
            },
          }).then((res) => {
            for (var i = 0; i < res.body.length - 5; i++) {
              cy.request({
                method: 'GET',
                url: `${codesBaseUrl}/codesets?campaignId=${res.body[i].id}`,
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: 'Basic ' + ecommerceBasicAuth,
                },
              }).then((res) => {
                var codeSetJson = res.body
                if (codeSetJson.length > 0) {
                  for (let k = 0; k < codeSetJson.length; k++) {
                    if (codeSetJson[k].grantedLicenseIds !== undefined) {
                      if (codeSetJson[k].grantedLicenseIds.length > 0) {
                        for (let j = 0; j < codeSetJson[k].grantedLicenseIds.length; j++) {
                          if (arrLicenses.includes(codeSetJson[k].grantedLicenseIds[j])) {
                            cy.deleteCodeset(codeSetJson[k].id)
                          } else {
                            cy.editCodesetLicense(
                              codeSetJson[k].name,
                              codeSetJson[k].id,
                              licenseId,
                              codeSetJson[k].redeemLimit,
                              codeSetJson[k].version,
                              codeSetJson[k].type
                            ).then(() => {
                              cy.deleteCodeset(codeSetJson[k].id)
                            })
                          }
                        }
                      }
                    } else {
                      cy.deleteCodeset(codeSetJson[k].id)
                    }
                  }
                }
              })
              cy.deleteCampaign(res.body[i].id)
            }
          })
        }
      })
    })
})

Cypress.Commands.add('deleteCampaign', (campaignId) => {
  cy.request({
    method: 'DELETE',
    url: codesBaseUrl + '/campaigns/' + campaignId,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

// type: 0=Numeric, 1=Hex, 2=Alphanumeric
Cypress.Commands.add('generateAndGetCode', (codesetId, type, length, amount) => {
  cy.request({
    method: 'POST',
    url: codesBaseUrl + '/codesets/' + codesetId + '/codecreations',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
    body: {
      generatedCodes: {
        type: type,
        length: length,
        number: amount,
      },
    },
  })
    .wait(3000)
    .then((res) => {
      expect(res.status).to.equal(201)
      // Get code
      cy.request({
        method: 'GET',
        url: codesBaseUrl + '/codes?codeSetId=' + codesetId,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + ecommerceBasicAuth,
        },
      }).then((res) => {
        expect(res.body[0]).to.have.property('code')
        return res.body[0].code
      })
    })
})

Cypress.Commands.add('redeemCode', (accessToken, code) => {
  cy.request({
    method: 'POST',
    url: codesBaseUrl + '/redemptions/me',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + accessToken,
    },
    body: {
      code: code,
    },
  }).then((res) => {
    expect(res.status).to.equal(201)
  })
})

Cypress.Commands.add(
  'createCodeset',
  (campaignId, codeSetName, skuId = null, uniqueItemId = null, nonUniqueItemId = null, licenseId = null) => {
    let requestBody = {
      campaignId: campaignId,
      name: codeSetName,
      description: 'description',
      tags: ['tag1'],
      type: 0,
      redeemLimit: 1,
    }

    if (skuId != null) {
      requestBody.grantedSkuId = skuId
    }

    if (uniqueItemId != null) {
      requestBody.grantedItemIds = uniqueItemId
    }

    if (nonUniqueItemId != null) {
      requestBody.grantedItemsWithQuantity = [
        {
          itemId: nonUniqueItemId,
          quantity: 1,
        },
      ]
    }

    if (licenseId != null) {
      requestBody.grantedLicenseIds = licenseId
    }

    cy.request({
      method: 'POST',
      url: codesBaseUrl + '/codesets',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + ecommerceBasicAuth,
      },
      body: requestBody,
    }).then((res) => {
      cy.parseIdFromHeader(res).then((id) => {
        return id
      })
    })
  }
)

Cypress.Commands.add('editCodesetLicense', (codeSetName, codeSetId, grantedLicenseIds, redeemLimit, version, type) => {
  let requestBody = {
    name: codeSetName,
    grantedLicenseIds: [grantedLicenseIds],
    redeemLimit: redeemLimit,
    type: type,
    version: version,
  }

  cy.request({
    method: 'PUT',
    url: codesBaseUrl + '/codesets/' + codeSetId,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
    body: requestBody,
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('deleteCodeset', (codesetId) => {
  cy.request({
    method: 'DELETE',
    url: codesBaseUrl + '/codesets/' + codesetId,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('createCurrency', (currencyName, currencyCode, inventory) => {
  cy.request({
    method: 'POST',
    url: walletBaseUrl + '/currencies',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
    body: {
      productId: productId,
      currencyCode: currencyCode,
      name: currencyName,
      inventory: inventory,
      description: 'description',
      state: 0,
    },
  }).then((res) => {
    cy.parseIdFromHeader(res).then((id) => {
      return id
    })
  })
})

// Actions: 1 = Credit Currency, -1 = Debit Currency
Cypress.Commands.add('transaction', (publicId, action, currencyCode, amountEarned, amountGranted) => {
  cy.request({
    method: 'POST',
    url: walletBaseUrl + '/transactions',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
    body: {
      requestId: Date.now(),
      accountId: publicId,
      productId: productId,
      currencyCode: currencyCode,
      action: action,
      amountEarned: amountEarned,
      amountGranted: amountGranted,
    },
  }).then((res) => {
    expect(res.status).to.equal(201)
  })
})

Cypress.Commands.add('cleanUpCurrency', () => {
  cy.request({
    method: 'GET',
    url: `${walletBaseUrl}/currencies?productId=${productId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    cy.wrap(parseInt(res.headers['x-2k-result-total'])).as('totalCount')
  })
  cy.get('@totalCount').then((totalCount) => {
    if (totalCount != 0) {
      cy.request({
        method: 'GET',
        url: `${walletBaseUrl}/currencies?productId=${productId}&offset=0&limit=${parseInt(totalCount)}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + ecommerceBasicAuth,
        },
      }).then((res) => {
        //Maintaining the 10 records of currency
        for (let i = 0; i < res.body.length - 10; i++) {
          const currencyCode = res.body[i].currencyCode
          if (currencyCode !== 'TST' && currencyCode !== 'AAA' && currencyCode !== 'CXP' && currencyCode !== 'CYI') {
            cy.getAllCurrencyDependenciesForSpecifiedCurrencyCode(currencyCode).then((res) => {
              if (res.body.length > 0) {
                for (let i = 0; i < res.body.length; i++) {
                  cy.deleteCurrencyDependencies(res.body[i].resourceType, res.body[i].resourceId)
                }
              }
            })
            cy.deleteCurrency(res.body[i].id)
          }
        }
      })
    }
  })
})

Cypress.Commands.add('deleteCurrency', (currencyId) => {
  cy.request({
    method: 'DELETE',
    url: walletBaseUrl + '/currencies/' + currencyId,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('deleteCurrencyDependencies', (resourceType, resourceId) => {
  cy.request({
    method: 'DELETE',
    url: `${walletBaseUrl}/currencies/dependencies`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
    body: [
      {
        resourceType: resourceType,
        resourceId: resourceId,
      },
    ],
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('getAllCurrencyDependenciesForSpecifiedCurrencyCode', (currencyCode) => {
  cy.request({
    method: 'GET',
    url: `${walletBaseUrl}/currencies/dependencies?productId=${productId}&currencyCode=${currencyCode}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
    return res
  })
})

// type: 10=Vortex, 21=Non-Privileged, 22-Privileged
Cypress.Commands.add('createLicense', (licenseName, referenceId, type, offlineTtl, maxDeviceRegistration) => {
  cy.request({
    method: 'POST',
    url: licenseBaseUrl + '/licenses',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
    body: {
      productId: productId,
      name: licenseName,
      description: 'description',
      tags: ['tag1'],
      referenceId: referenceId,
      type: type,
      offlineTtl: offlineTtl,
      maxDeviceRegistration: maxDeviceRegistration,
      payloadCipherKey: 'string',
    },
  }).then((res) => {
    cy.parseIdFromHeader(res).then((id) => {
      return id
    })
  })
})

Cypress.Commands.add('cleanUpLicenses', () => {
  cy.request({
    method: 'GET',
    url: `${licenseBaseUrl}/licenses?productId=${productId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    cy.wrap(parseInt(res.headers['x-2k-result-total'])).as('totalCount')
  })
  cy.get('@totalCount').then((totalCount) => {
    if (totalCount != 0) {
      cy.request({
        method: 'GET',
        url: `${licenseBaseUrl}/licenses?productId=${productId}&offset=0&limit=${parseInt(totalCount)}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + ecommerceBasicAuth,
        },
      }).then((res) => {
        for (let i = 0; i < res.body.length - 5; i++) {
          cy.getLicenseDependencies(res.body[i].id).then((Body) => {
            if (Body.length > 0) {
              for (let i = 0; i < Body.length; i++) {
                cy.deleteDependenciesofLicense(Body[i].resourceType, Body[i].resourceId)
              }
            }
          })
          cy.deleteLicense(res.body[i].id)
        }
      })
    }
  })
})

Cypress.Commands.add('getLicenseDependencies', (licenseId) => {
  cy.request({
    method: 'GET',
    url: licenseBaseUrl + '/dependencies?licenseId=' + licenseId,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
    return res.body
  })
})

Cypress.Commands.add('deleteDependenciesofLicense', (resourceType, resourceId) => {
  cy.request({
    method: 'DELETE',
    url: `${licenseBaseUrl}/dependencies?resourceType=${resourceType}&resourceId=${resourceId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('deleteLicense', (licenseId) => {
  cy.request({
    method: 'DELETE',
    url: licenseBaseUrl + '/licenses/' + licenseId,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('grantLicense', (licenseId, accountId) => {
  cy.generateAppId(36).then((transactionId) => {
    cy.request({
      method: 'POST',
      url: licenseBaseUrl + '/grantedlicenses/',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + ecommerceBasicAuth,
      },
      body: [
        {
          licenseId: licenseId,
          accountId: accountId,
          transactionId: transactionId,
        },
      ],
    }).then((res) => {
      expect(res.status).to.equal(201)
      return res.body[0].id
    })
  })
})

Cypress.Commands.add('createPurchase', (accessToken, storeId, offerId, currencyCode, amount) => {
  const requestId = common.newUUID()
  cy.request({
    method: 'POST',
    url: purchaseBaseUrl + '/transactions/walletPurchases/me',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + accessToken,
    },
    body: {
      storeId: storeId,
      offerId: offerId,
      country: 'US',
      requestId: requestId,
      expectedPrice: [
        {
          currency: currencyCode,
          amount: amount,
        },
      ],
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
    return res.body.id
  })
})

Cypress.Commands.add('createAchievement', (achievementName, achievedIcon, unachievedIcon) => {
  cy.request({
    method: 'POST',
    url: achievementsBaseUrl + '/achievements',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
    body: {
      productId: productId,
      adminName: achievementName,
      adminDescription: 'description',
      achievedIcon: achievedIcon,
      unachievedIcon: unachievedIcon,
      hidden: false,
      localizations: [
        {
          locale: 'en-US',
          localizedName: achievementName,
          localizedDescription: 'description',
        },
      ],
    },
  }).then((res) => {
    cy.parseIdFromHeader(res).then((id) => {
      return id
    })
  })
})

Cypress.Commands.add('deleteAchievement', (achievementId) => {
  cy.request({
    method: 'DELETE',
    url: achievementsBaseUrl + '/achievements/' + achievementId,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('createAppGroup', (appGroupName) => {
  cy.request({
    method: 'POST',
    url: ssoBaseUrl + '/app/groups',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + appsBasicAuth,
    },
    body: {
      productId: productId,
      name: appGroupName,
    },
  }).then((res) => {
    cy.parseIdFromHeader(res).then((id) => {
      return id
    })
  })
})

Cypress.Commands.add('deleteAppGroup', (appGroupId) => {
  cy.request({
    method: 'DELETE',
    url: ssoBaseUrl + '/app/groups/' + appGroupId,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + appsBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('createApp', (appName, appGroupId) => {
  cy.request({
    method: 'POST',
    url: ssoBaseUrl + '/app/apps',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + appsBasicAuth,
    },
    body: {
      name: appName,
      groupId: appGroupId,
      type: 0,
      deviceType: 0,
      onlineServiceType: 0,
      accessTokenTtl: 3600,
      refreshTokenTtl: 7200,
      isHidden: false,
      acls: ['aclAuthServerItemGet'],
      privilegedAcls: ['aclAuthServerLicenseGet'],
    },
  }).then((res) => {
    cy.parseIdFromHeader(res).then((id) => {
      return id
    })
  })
})

Cypress.Commands.add('cleanUpAppGroupsAndApps', () => {
  cy.fetchTheTotalCountOfRecords('GET', `${ssoBaseUrl}/app/groups`, appsBasicAuth).then((totalAppGroupCount) => {
    if (totalAppGroupCount != 0) {
      var Quotient = Math.floor(totalAppGroupCount / 1000)
      for (var j = 0; j < Quotient + 1; j++) {
        cy.getAppGroupsBasedOnOffsetAndLimitValue(j * 1000).then((body) => {
          for (let i = 0; i < body.length; i++) {
            if (body[i].productId === productId) {
              //Filtering below Required application ids from response for the test product cypress 1 product operation.
              if (
                body[i].id !== 'b6b2885b368b47ea94eb66be158be11e' &&
                body[i].id !== 'e4bdbe314da14808b3cecff94663dd39' &&
                body[i].id !== '14f595725d0442b780a9dfa3c7200adb'
              ) {
                cy.getAppGrouphistory(body[i].id).then((histRespose) => {
                  if (histRespose.body.length > 1) {
                    for (let k = 0; k < histRespose.body.length; k++) {
                      var changesObj = JSON.parse(histRespose.body[k].changes)
                      if (changesObj[0].field == 'appId' && changesObj[0].newValue) {
                        cy.fetchTheTotalCountOfRecords('GET', `${ssoBaseUrl}/app/apps`, appsBasicAuth).then(
                          (appCount) => {
                            if (appCount != 0) {
                              var Quotient = Math.floor(appCount / 1000)
                              for (var i = 0; i < Quotient + 1; i++) {
                                cy.getAppsBasedOnOffsetAndLimitValue(i * 1000).then((body) => {
                                  for (var j = 0; j < body.length; j++) {
                                    if (body[j].id === changesObj[0].newValue) {
                                      cy.deleteApp(changesObj[0].newValue)
                                    }
                                  }
                                })
                              }
                            }
                          }
                        )
                      }
                    }
                    cy.deleteAppGroup(histRespose.body[0].appGroupId)
                  } else {
                    cy.deleteAppGroup(histRespose.body[0].appGroupId)
                  }
                })
              }
            }
          }
        })
      }
    }
  })
})

Cypress.Commands.add('cleanUpAppsBasedOnPartialAppName', (PartialAppName = 'Test App Cypress 16') => {
  cy.fetchTheTotalCountOfRecords('GET', `${ssoBaseUrl}/app/apps`, appsBasicAuth).then((totalCount) => {
    if (totalCount != 0) {
      var count = parseInt(totalCount)
      var value = Math.floor(count / 1000)
      for (var i = 0; i < value + 1; i++) {
        cy.getAppsBasedOnOffsetAndLimitValue(i * 1000).then((body) => {
          for (var j = 0; j < body.length; j++) {
            if (body[j].name.includes(PartialAppName)) {
              cy.deleteApp(body[j].id)
            }
          }
        })
      }
    }
  })
})

Cypress.Commands.add('fetchTheTotalCountOfRecords', (method, url, Auth) => {
  cy.request({
    method: method,
    url: url,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Auth,
    },
  }).then((res) => {
    var count = parseInt(res.headers['x-2k-result-total'])
    expect(count).not.to.be.null
    return count
  })
})

Cypress.Commands.add('getAppsBasedOnOffsetAndLimitValue', (offset) => {
  cy.request({
    method: 'GET',
    url: `${ssoBaseUrl}/app/apps?offset=${offset}&limit=1000`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + appsBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
    return res.body
  })
})

Cypress.Commands.add('getAppGroupsBasedOnOffsetAndLimitValue', (offset) => {
  cy.request({
    method: 'GET',
    url: `${ssoBaseUrl}/app/groups?offset=${offset}&limit=1000`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + appsBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
    return res.body
  })
})

Cypress.Commands.add('getAppGrouphistory', (appGroupId) => {
  cy.request({
    method: 'GET',
    url: `${ssoBaseUrl}/app/groups/${appGroupId}/history`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + appsBasicAuth,
    },
  }).then((res) => {
    return res
  })
})

Cypress.Commands.add('deleteApp', (appId) => {
  cy.request({
    method: 'DELETE',
    url: ssoBaseUrl + '/app/apps/' + appId,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + appsBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('deleteProduct', (deleteProductId) => {
  cy.request({
    method: 'DELETE',
    url: ssoBaseUrl + '/app/products/' + deleteProductId,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + appsBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('createBucketMapping', (appGroupId) => {
  cy.request({
    method: 'POST',
    url: telemetryV1BaseUrl + '/createBucketMapping',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + telemetryBasicAuth,
    },
    body: {
      accountName: 'Analytics-Account',
      appGroupId: appGroupId,
      bucketName: 'qactp-data-telemetryv2-dev-api-2kctp',
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
  })
})

Cypress.Commands.add('createQueue', (queueName, appGroupId) => {
  cy.request({
    method: 'POST',
    url: telemetryV1BaseUrl + '/createQueue',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + telemetryBasicAuth,
    },
    body: {
      appGroupId: appGroupId,
      queue: {
        name: queueName,
        priority: 1,
        sampling: 100,
        maxSize: -1,
        flushOnCount: 5,
        flushDelayRetryInSeconds: 4,
        flushPeriodicallyInSeconds: 100,
      },
    },
  }).then((res) => {
    return res.body.result.queue.id
  })
})

Cypress.Commands.add('rollbackAppGroupFromTelemetryK', (appGroupId) => {
  cy.request({
    method: 'DELETE',
    url: `${telemetry_K_V1BaseUrl}/onboarding?appGroupId=${appGroupId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + telemetryBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
  })
})

Cypress.Commands.add('getAppGroupConfigAfterRollBack', (appGroupId) => {
  cy.request({
    method: 'GET',
    url: `${telemetry_K_V1BaseUrl}/getAppGroupConfiguration?appGroupId=${appGroupId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + telemetryBasicAuth,
    },
    failOnStatusCode: false,
  }).then((res) => {
    expect(res.status).to.equal(404)
  })
})

Cypress.Commands.add('deleteQueue', (queueId, appGroupId) => {
  cy.request({
    method: 'DELETE',
    url: telemetryV1BaseUrl + '/deleteQueue',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + telemetryBasicAuth,
    },
    body: {
      appGroupId: appGroupId,
      queueId: queueId,
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
  })
})

Cypress.Commands.add('createEvent', (eventName, queueId, appGroupId, priority = 0, sampling = 100) => {
  cy.request({
    method: 'POST',
    url: telemetryV1BaseUrl + '/createEvent',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + telemetryBasicAuth,
    },
    body: {
      appGroupId: appGroupId,
      queueId: queueId,
      event: {
        name: eventName,
        priority: priority,
        sampling: sampling,
      },
    },
  }).then((res) => {
    return res.body.result.event.id
  })
})

Cypress.Commands.add('deleteEvent', (eventId, queueId, appGroupId) => {
  cy.request({
    method: 'DELETE',
    url: telemetryV1BaseUrl + '/deleteEvent',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + telemetryBasicAuth,
    },
    body: {
      appGroupId: appGroupId,
      eventId: eventId,
      queueId: queueId,
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
  })
})

Cypress.Commands.add('createRecord', (recordKey, storeType = 'game', accountId = null) => {
  let url = ''
  switch (storeType) {
    case 'game':
      url = cloudDataBaseUrl + `/admin/games/${productId}/records`
      break
    case 'userProduct':
      url = cloudDataBaseUrl + `/admin/users/${accountId}/products/${productId}/records`
      break
    case 'userGlobal':
      url = cloudDataBaseUrl + `/admin/users/${accountId}/records`
      break
  }
  cy.request({
    method: 'POST',
    url: url,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + cloudDataBasicAuth,
    },
    body: {
      record: {
        key: recordKey,
        opaque: 'test',
        properties: {
          boolean: false,
          integer: 1,
          string: 'test',
        },
        tags: ['tag1'],
      },
    },
  }).then((res) => {
    expect(res.status).to.equal(201)
    return res.body.ownerId
  })
})

Cypress.Commands.add('deleteRecord', (recordKey, storeType = 'game', accountId = null) => {
  let url = ''
  switch (storeType) {
    case 'game':
      url = cloudDataBaseUrl + `/admin/games/${productId}/records/${recordKey}`
      break
    case 'userProduct':
      url = cloudDataBaseUrl + `/admin/users/${accountId}/products/${productId}/records/${recordKey}`
      break
    case 'userGlobal':
      url = cloudDataBaseUrl + `/admin/users/${accountId}/records/${recordKey}`
      break
  }
  cy.request({
    method: 'DELETE',
    url: url,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + cloudDataBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('createFPSTitle', (titleName) => {
  cy.request({
    method: 'POST',
    url: promotionsBaseUrl + `/titles`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
    body: {
      name: titleName,
      description: 'description',
      productId: productId,
    },
  }).then((res) => {
    expect(res.status).to.equal(201)
    return res.body.id
  })
})

Cypress.Commands.add('deleteFPSTitle', (id) => {
  cy.request({
    method: 'DELETE',
    url: promotionsBaseUrl + `/titles/` + id,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('cleanUpExistingFPSTitles', () => {
  cy.request({
    method: 'POST',
    url: promotionsBaseUrl + `/titles/list`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
    body: {
      limit: 100,
      offset: 0,
      filter: {
        productIds: [productId1],
      },
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
    if (res.body.data.length) {
      cy.deleteFPSTitle(res.body.data[0].id)
    }
  })
})

Cypress.Commands.add('createFPSOffer', (offerName) => {
  cy.request({
    method: 'POST',
    url: promotionsBaseUrl + `/offers`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
    body: {
      name: offerName,
      description: 'description',
      offerType: 'inGame',
      productIds: [productId],
    },
  }).then((res) => {
    expect(res.status).to.equal(201)
    return res.body.id
  })
})

Cypress.Commands.add('deleteFPSOffer', (id) => {
  cy.request({
    method: 'DELETE',
    url: promotionsBaseUrl + `/offers/` + id,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('RetrieveAllEntitlementRecords', () => {
  cy.request({
    method: 'POST',
    url: `${promotionsBaseUrl}/entitlements/list`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
    body: {
      filter: {
        productIds: [productId],
      },
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
    return res
  })
})

Cypress.Commands.add('cleanUpExistingEntitlement', () => {
  cy.RetrieveAllEntitlementRecords().then((res) => {
    cy.wrap(res.body.total).as('TotalRecords')
  })
  cy.get('@TotalRecords').then((totalCount) => {
    for (var i = totalCount; i > 50; i--) {
      cy.RetrieveAllEntitlementRecords().then((res) => {
        cy.deleteFPSEntitlement(res.body.data[0].id).then(() => {
          cy.log('Deleted Entitlement record id' + res.body.data[0].id)
        })
      })
    }
  })
})

Cypress.Commands.add('cleanUpLegalDocuments', () => {
  var arr = []
  cy.request({
    method: 'GET',
    url: `${ssoBaseUrl}/legal/documents`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + legalDocBasicAuth,
    },
  }).then((res) => {
    cy.wrap(parseInt(res.headers['x-2k-result-total'])).as('totalCount')
  })

  cy.get('@totalCount').then((totalCount) => {
    if (totalCount != 0) {
      cy.request({
        method: 'GET',
        url: `${ssoBaseUrl}/legal/documents?offset=0&limit=${parseInt(totalCount)}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + legalDocBasicAuth,
        },
      }).then((res) => {
        for (var i = 0; i < totalCount; i++) {
          if (res.body[i].appId === '7354b992773e4e7e9fd2270b1ae5aa7b') {
            arr.push(res.body[i].id)
          }
        }
      })
    }
  })
  cy.then(() => {
    for (var i = 0; i < arr.length; i++) {
      if (i < arr.length - 5) {
        cy.DeleteLegalDoc(arr[i])
      }
    }
  })
})

Cypress.Commands.add('DeleteLegalDoc', (DocummentId) => {
  cy.request({
    method: 'DELETE',
    url: `${ssoBaseUrl}/legal/documents/${DocummentId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + legalDocBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('cleanUpCloudPrograms', () => {
  cy.request({
    method: 'GET',
    url: `${cloudProgramBuilderBaseUrl}/services`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + cloudProgramBasicAuth,
      'x-2k-product-id': productId,
    },
  }).then((res) => {
    var services = JSON.parse(res.body).services
    if (services != null) {
      if (services.length >= 1) {
        for (var i = 0; i < services.length; i++) {
          if (services[i] !== 'test-jacky') {
            cy.deleteCloudProgramDeployments(services[i])
            cy.deleteCloudProgramServices(services[i])
          }
        }
      }
    }
  })
})

Cypress.Commands.add('deleteCloudProgramDeployments', (CloudProgramName) => {
  cy.request({
    method: 'DELETE',
    url: `${cloudProgramManagerBaseUrl}/admin/services/${CloudProgramName}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + cloudProgramBasicAuth,
      'x-2k-product-id': productId,
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
  })
})

Cypress.Commands.add('deleteCloudProgramServices', (CloudProgramName) => {
  cy.request({
    method: 'DELETE',
    url: `${cloudProgramBuilderBaseUrl}/services/${CloudProgramName}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + cloudProgramBasicAuth,
      'x-2k-product-id': productId,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('createFPSEntitlement', (entitlementName) => {
  cy.request({
    method: 'POST',
    url: promotionsBaseUrl + `/entitlements`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
    body: {
      name: entitlementName,
      description: 'description',
      productId: productId,
      isDLC: false,
    },
  }).then((res) => {
    expect(res.status).to.equal(201)
    return res.body.id
  })
})

Cypress.Commands.add('deleteFPSEntitlement', (id) => {
  cy.request({
    method: 'DELETE',
    url: promotionsBaseUrl + `/entitlements/` + id,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('deleteSandbox', (id) => {
  cy.request({
    method: 'DELETE',
    url: promotionsBaseUrl + `/sandboxes/` + id,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('RetrieveAllPlacementRecords', () => {
  cy.request({
    method: 'GET',
    url: `${promotionsBaseUrl}/products/${productId}/placements`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
    return res
  })
})

Cypress.Commands.add('cleanUpExistingPlacements', () => {
  cy.RetrieveAllPlacementRecords().then((res) => {
    cy.wrap(res.body.total).as('TotalRecords')
  })
  cy.get('@TotalRecords').then((totalCount) => {
    for (let i = totalCount; i > 10; i--) {
      cy.RetrieveAllPlacementRecords().then((res) => {
        cy.deletePlacement(res.body.data[0].placementId)
      })
    }
  })
})

Cypress.Commands.add('createPlacement', (placementName) => {
  cy.generateAppId(32).then((placementId) => {
    cy.request({
      method: 'POST',
      url: `${promotionsBaseUrl}/products/${productId}/placements`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + ecommerceBasicAuth,
      },
      body: {
        name: placementName,
        description: 'description',
        aspectRatio: {
          width: 16,
          height: 9,
        },
        allowMultipleContent: false,
        placementId: placementId,
      },
    }).then((res) => {
      expect(res.status).to.equal(201)
      return res.body.placementId
    })
  })
})

Cypress.Commands.add('deletePlacement', (id) => {
  cy.request({
    method: 'DELETE',
    url: `${promotionsBaseUrl}/products/${productId}/placements/${id}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('createPromo', (promoName) => {
  const date = new Date(Date.now())
  const futureDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
  const startDate = date.toISOString()
  const endDate = futureDate.toISOString()
  cy.request({
    method: 'POST',
    url: `${promotionsBaseUrl}/products/${productId}/productGroups/${appGroupId1}/promos`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
    body: {
      name: promoName,
      description: 'description',
      startAt: startDate,
      endAt: endDate,
      rewards: {},
      store: {},
      promoType: 'infoOnly',
      externalId: 0,
      metadata: {},
      displayCount: 1,
      displayDurationInHrs: 24,
    },
  }).then((res) => {
    expect(res.status).to.equal(201)
    return res.body.id
  })
})

Cypress.Commands.add('RetrieveAllPromoRecords', (offset) => {
  cy.request({
    method: 'GET',
    url: `${promotionsBaseUrl}/products/${productId}/productGroups/${appGroupId1}/promos?offset=${offset}&limit=100`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    return res
  })
})

Cypress.Commands.add('cleanUpExistingPromo', () => {
  cy.RetrieveAllPromoRecords(0).then((res) => {
    cy.wrap(res.body.total).as('TotalRecords')
  })
  cy.get('@TotalRecords').then((totalCount) => {
    var Quotient = Math.floor(totalCount / 100)
    var promoIds = []
    for (var i = Quotient; i >= 0; i--) {
      cy.RetrieveAllPromoRecords(i * 100).then((res) => {
        if (res.body.data.length > 0) {
          for (let j = 0; j < res.body.data.length; j++) {
            promoIds.push(res.body.data[j].id)
          }
        }
      })
    }
    //Maintaining 10 records
    cy.then(() => {
      for (let i = 0; i < promoIds.length - 10; i++) {
        cy.deletePromo(promoIds[i])
      }
    })
  })
})

Cypress.Commands.add('deletePromo', (id) => {
  cy.request({
    method: 'DELETE',
    url: `${promotionsBaseUrl}/products/${productId}/productGroups/${appGroupId1}/promos/${id}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('createSegment', (segmentName, condition = '&&') => {
  cy.request({
    method: 'POST',
    url: `${promotionsBaseUrl}/segmentation/products/${productId}/segments`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
    body: {
      condition: condition,
      name: segmentName,
    },
  }).then((res) => {
    expect(res.status).to.equal(201)
    expect(res.body.id).not.be.empty
    return res.body.id
  })
})

Cypress.Commands.add(
  'createSegmentRules',
  ({
    segmentId,
    category,
    creatrioName,
    operator = '=',
    country = ['IN', 'US'],
    platform = ['0'],
    console = ['1', '3'],
    age = ['23'],
    accountLevel = ['0'],
    condition = '&&',
  }) => {
    var categoryValues

    if (category == 'Country') {
      categoryValues = {
        country: {
          operator: operator,
          values: country,
        },
      }
    } else if (category == 'Console') {
      categoryValues = {
        console: {
          operator: operator,
          values: console,
        },
      }
    } else if (category == 'Platform') {
      categoryValues = {
        console: {
          operator: operator,
          values: platform,
        },
      }
    } else if (category == 'Newsletter Age') {
      categoryValues = {
        age: {
          operator: operator,
          values: age,
        },
      }
    } else if (category == 'User Account Level Permissions') {
      categoryValues = {
        accountLevel: {
          operator: operator,
          values: accountLevel,
        },
      }
    }

    cy.request({
      method: 'POST',
      url: `${promotionsBaseUrl}/segmentation/products/${productId}/segments/${segmentId}/rules`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + ecommerceBasicAuth,
      },
      body: {
        name: creatrioName,
        condition: condition,
        categories: categoryValues,
      },
    }).then((res) => {
      expect(res.status).to.equal(201)
      expect(res.body.id).not.be.empty
      return res.body.id
    })
  }
)

Cypress.Commands.add('deleteSegment', (segmentId) => {
  cy.request({
    method: 'DELETE',
    url: `${promotionsBaseUrl}/segmentation/products/${productId}/segments/${segmentId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('deleteSegmentRules', (segmentId, ruleId) => {
  cy.request({
    method: 'DELETE',
    url: `${promotionsBaseUrl}/segmentation/products/${productId}/segments/${segmentId}/rules/${ruleId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + ecommerceBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('createGlobalBan', (accountId, Status) => {
  cy.request({
    method: 'PUT',
    url: `${ssoBaseUrl}/user/accounts/${accountId}/bans/global`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + webBasicAuth,
    },
    body: {
      isGloballyBanned: Status,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('createProductBan', (accountId) => {
  var startDate = new Date()
  startDate.setMonth(startDate.getMonth() + 4)

  cy.request({
    method: 'POST',
    url: `${ssoBaseUrl}/user/accounts/${accountId}/bans`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + webBasicAuth,
    },
    body: {
      expiresOn: +startDate,
      productId: productId,
    },
  }).then((res) => {
    expect(res.status).to.equal(200)
  })
})

Cypress.Commands.add('deleteGlobalAndProductBan', (accountId) => {
  cy.request({
    method: 'DELETE',
    url: `${ssoBaseUrl}/user/accounts/${accountId}/bans`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + webBasicAuth,
    },
  }).then((res) => {
    expect(res.status).to.equal(204)
  })
})

Cypress.Commands.add('VerifyBannedAccountByLogin', (emailAddress) => {
  cy.request({
    method: 'POST',
    url: ssoBaseUrl + '/auth/tokens',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Application ' + webAppId,
    },
    body: {
      locale: 'en-US',
      accountType: 'full',
      credentials: {
        type: 'emailPassword',
        email: emailAddress,
        password: 'Asdf1234!',
      },
    },
    failOnStatusCode: false,
  }).then((res) => {
    expect(res.status).to.equal(403)
    expect(res.body.message).to.include('The account is banned')
  })
})

Cypress.Commands.add('verifyTheTextOfTheElement', (selector, textValue) => {
  cy.get(selector).then((ele) => {
    if (ele.text() == textValue) {
      return true
    } else {
      return false
    }
  })
})
