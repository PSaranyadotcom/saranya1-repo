/* eslint-disable no-undef */
import { Common as CommonAnt } from '../page-objects/common-ant-page-objects'
import { CloudData } from '../page-objects/cloud-data-page-objects'
const commonAnt = new CommonAnt()
const cloudDataPage = new CloudData()
const productId = Cypress.env('productId')

describe('Non Admin - Sidebar Menu', { tags: '@dev_only' }, function () {
  context('Authentication', function () {
    it('Should login', { tags: ['@smoke'] }, function () {
      cy.doAuth()
    })
  })

  context('Sidebar Menu Tests', function () {
    before(function () {
      cy.visitBaseUrl()
      cy.getCookie('x-ctp-auth-user').then((cookie) => {
        let val = cookie.value
        val = val.split('\\054').join(',')
        val = decodeURI(val)
        val = JSON.parse(JSON.parse(val))
        this.userId = val.id
      })

      cy.getCookie('x-ctp-auth-token').then((cookie) => {
        this.token = cookie.value
      })

      cy.setCookie('technodrome-selectedProduct', Cypress.env('productId'))

      cy.getFeatureFlags().then((values) => {
        this.featureFlags = values
      })

      cloudDataPage.navigateToCloudData()
      cy.intercept(`**/cloud-data/admin/games/${productId}/records**`).as('waitForRecords')
      cy.wait(1000)
      commonAnt.selectProduct()
      cy.wait('@waitForRecords')
      commonAnt.waitForLoaderToDisappear()
      // Possible sidebar items that the user can have access to
      this.technodromeMenu = [
        {
          title: 'Eye Wash',
          route: 'eyewash',
          icon: 'fa fa-futbol-o',
        },
        {
          title: 'Accounts',
          route: 'accounts',
          icon: 'fa fa-user',
          permissions: [
            {
              path: '/api/accounts/{id}',
              method: 'get',
            },
          ],
        },
        {
          title: 'Clients',
          icon: 'fa fa-gamepad',
          route: 'clients',
          permissions: [],
        },
        {
          title: 'User Management',
          route: 'user-management',
          icon: 'fa fa-users',
        },
        {
          title: 'Licenses',
          icon: 'fa fa-certificate',
          route: 'licenses',
          permissions: [
            {
              path: '/api/licenses/',
              method: 'get',
            },
          ],
        },
        {
          title: ['Telemetry', 'Game Data'],
          route: 'telemetry',
          permissions: [
            {
              path: '/api/telemetry/offload-buckets/',
              method: 'get',
            },
          ],
        },
        {
          title: ['Telemetry', 'Rockset Access Request'],
          route: 'telemetry',
          permissions: [
            {
              path: '/api/telemetry/offload-buckets/',
              method: 'get',
            },
          ],
        },
        {
          title: 'Legal Documents',
          route: 'legal',
          icon: 'fa fa-briefcase',
        },
        {
          title: 'Achievements',
          route: 'achievements',
          icon: 'fa fa-shield',
          permissions: [
            {
              path: '/api/achievements/',
              method: 'get',
            },
          ],
        },
        {
          title: ['Commerce', 'Stores'],
          route: 'catalog',
          permissions: [
            {
              path: '/api/catalog/stores',
              method: 'get',
            },
          ],
        },
        {
          title: ['Commerce', 'SKUs'],
          route: 'catalog',
          permissions: [
            {
              path: '/api/catalog/stores',
              method: 'get',
            },
          ],
        },
        {
          title: ['Commerce', 'Items'],
          route: 'items',
          permissions: [
            {
              path: '/api/entitlements/items/',
              method: 'get',
            },
          ],
        },
        {
          title: ['Commerce', 'Codes'],
          route: 'codes',
          permissions: [
            {
              path: '/api/codes/campaigns/',
              method: 'get',
            },
          ],
        },
        {
          title: ['Commerce', 'Currency'],
          route: 'wallet',
          permissions: [
            {
              path: '/api/wallet/currencies/',
              method: 'get',
            },
          ],
        },
        // {
        //   title: "Promotions",
        //   route: "promo",
        //   icon: "fa fa-star",
        //   permissions: [
        //     {
        //       path: "/api/promo/stores",
        //       method: "get",
        //     },
        //   ],
        // },
        // {
        //   title: ["Promotions", "Audit"],
        //   route: "eyewash",
        //   icon: "fa fa-futbol-o",
        //   permissions: [
        //     {
        //       path: "/api/eyewash/products/{id}/placements/",
        //       method: "get",
        //     },
        //   ],
        // },
        {
          title: ['Promotions', 'Placements'],
          route: 'eyewash',
          icon: 'fa fa-futbol-o',
          permissions: [
            {
              path: '/api/eyewash/products/{id}/placements/',
              method: 'get',
            },
          ],
        },
        {
          title: ['Promotions', 'Promos'],
          route: 'eyewash',
          icon: 'fa fa-futbol-o',
          permissions: [
            {
              path: '/api/eyewash/products/{id}/placements/',
              method: 'get',
            },
          ],
        },
        {
          title: ['Promotions', 'User Assignments'],
          route: 'eyewash',
          icon: 'fa fa-futbol-o',
          permissions: [
            {
              path: '/api/eyewash/products/{id}/placements/',
              method: 'get',
            },
          ],
        },
        {
          title: ['First Party Store', 'Titles'],
          route: 'first-party-store-v2-eyewash',
          icon: 'fa fa-futbol-o',
          permissions: [
            {
              path: '/api/eyewash/products/{id}/placements/',
              method: 'get',
            },
          ],
        },
        {
          title: ['First Party Store', 'Offers'],
          route: 'first-party-store-v2-eyewash',
          icon: 'fa fa-futbol-o',
          permissions: [
            {
              path: '/api/eyewash/products/{id}/placements/',
              method: 'get',
            },
          ],
        },
        {
          title: ['First Party Store', 'Entitlements'],
          route: 'first-party-store-v2-eyewash',
          icon: 'fa fa-futbol-o',
          permissions: [
            {
              path: '/api/eyewash/products/{id}/placements/',
              method: 'get',
            },
          ],
        },
        {
          title: ['Cloud Programs', 'Cloud Programs'],
          route: 'eyewash',
          icon: 'fa fa-cloud',
          permissions: [
            {
              path: '/api/cloud-programs',
              method: 'get',
            },
          ],
        },
        {
          title: ['Cloud Programs', 'Game Tuning Data'],
          route: 'eyewash',
          icon: 'fa fa-cloud',
          permissions: [
            {
              path: '/api/cloud-programs',
              method: 'get',
            },
          ],
        },
        {
          title: 'Cloud Data',
          route: 'cloud-data',
          icon: 'fa fa-mixcloud',
          permissions: [
            {
              path: '/api/cloud-data',
              method: 'get',
            },
          ],
        },
        {
          title: 'Service Manager',
          route: 'services',
          icon: 'fa fa-list',
          permissions: [
            {
              path: '/api/discovery/services',
              method: 'get',
            },
          ],
        },
        {
          title: 'Configuration',
          route: 'r-configuration',
          icon: 'fa fa-wrench',
          app: 'react',
        },
        {
          title: 'User Guide',
          route: 'user-guide',
          icon: 'fa fa-map-o',
        },
      ]
    })

    it('Should have relevant menu items', { tags: ['@smoke'] }, function () {
      const options = {
        method: 'GET',
        url: `${Cypress.config('baseUrl')}/api/acl/v1/users/${this.userId}/schema/`,
        headers: {
          authorization: `JWT ${this.token}`,
        },
      }
      const userMenu = []
      cy.request(options).then((res) => {
        let paths = res.body.schema.paths
        // Test sidebar menu items
        this.technodromeMenu.forEach((menuItem) => {
          if (menuItem.permissions) {
            let hasPermission = menuItem.permissions.some((p) => {
              let checkFunc = (path, method) => {
                return !!paths[path] && paths[path].includes(method)
              }
              let ans = checkFunc(p.path, p.method)

              // try without slash
              let length = p.path.length
              if (!ans && p.path.slice(length - 1, length) === '/') {
                let path = p.path.substr(0, length - 1)
                ans = checkFunc(path, p.method)
              }
              return ans
            })
            if (hasPermission) {
              if (Array.isArray(menuItem.title)) {
                menuItem.title.forEach((title) => {
                  if (title === 'Promotions') {
                    commonAnt.clickOnElementByText("[role='menuitem']", title)
                  } else {
                    cy.get('.ant-menu').contains(title).click({ force: true }).should('exist')
                  }
                })
                cy.get('.ant-menu').contains(menuItem.title[0]).click({ force: true })
              } else {
                cy.get('.ant-menu').contains(menuItem.title).should('exist')
              }
              userMenu.push(menuItem.title)
            }
          } else {
            cy.get('.ant-menu').contains(menuItem.title).should('not.exist')
          }
        })

        userMenu.forEach((menuItem) => {
          let sectionValidator = {
            Accounts: 'account',
            Licenses: 'Licenses',
            Achievements: 'Manage Achievements',
            Telemetry: {
              'Game Data': 'Game Data',
              'Rockset Access Request': 'Rockset Access',
            },
            Commerce: {
              Stores: 'Store Management',
              SKUs: 'SKU Management',
              Items: 'Item Management',
              Codes: 'Manage Campaigns',
              Currency: 'Currency Management',
            },
            Promotions: {
              //"Audit": "Auditing",
              Placements: 'Placements',
              Promos: 'Manage Promotions',
              'User Assignments': 'User Assignments',
            },
            'First Party Store': {
              Titles: 'Titles',
              Offers: 'Manage offers',
              Entitlements: 'Manage entitlements',
            },
            'Cloud Programs': {
              'Cloud Programs': 'Cloud Programs',
              'Game Tuning Data': 'Game tuning data',
            },
            'Cloud Data': 'Cloud Data',
          }
          if (Array.isArray(menuItem)) {
            if (menuItem[0] === 'First Party Store') {
              cy.get('.ant-menu').contains(menuItem[0]).click({ force: true })
              if (menuItem[1] === 'Offers') {
                cy.get("a[href='/#/first-party-store-v2-eyewash/offers']").click({ force: true })
              } else {
                cy.get('.ant-menu').contains(menuItem[1]).click({ force: true })
              }
              cy.get('#react-page-content.td-ui-v2')
                .contains(String(sectionValidator[menuItem[0]][menuItem[1]]))
                .should('exist')
            } else if (menuItem[0] === 'Promotions') {
              commonAnt.clickOnElementByText("[role='menuitem']", menuItem[0])
              cy.get('.ant-menu').contains(menuItem[1]).click({ force: true })
              cy.get('.page-title').contains(String(sectionValidator[menuItem[0]][menuItem[1]])).should('exist')
              commonAnt.clickOnElementByText("[role='menuitem']", menuItem[0])
            } else if (menuItem[0] === 'Cloud Programs') {
              commonAnt.clickOnElementByText("[role='menuitem']", menuItem[0])
              cy.get('li.ant-menu-item').contains(menuItem[1]).click({ force: true })
              cy.get('.page-title').contains(String(sectionValidator[menuItem[0]][menuItem[1]])).should('exist')
              commonAnt.clickOnElementByText("[role='menuitem']", menuItem[0])
            } else {
              cy.get('.ant-menu').contains(menuItem[0]).click({ force: true })
              cy.get('.ant-menu').contains(menuItem[1]).click({ force: true }).wait(1000)
              cy.get('.page-title').contains(String(sectionValidator[menuItem[0]][menuItem[1]])).should('exist')
              cy.get('.ant-menu').contains(menuItem[0]).click({ force: true })
            }
          } else {
            if (menuItem === 'Accounts') {
              cy.get('.ant-menu').contains(menuItem).click().wait(500)
              cy.get('#react-page-content').contains(sectionValidator[menuItem]).should('exist')
            } else {
              cy.get('.ant-menu').contains(menuItem).click().wait(500)
              cy.get('.page-title').contains(sectionValidator[menuItem]).should('exist')
            }
          }
        })
      })
    })
  })
})
