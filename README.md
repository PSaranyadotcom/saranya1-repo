# End to End Test

## Overview
End to End Testing is a Software testing methodology to test an application flow from start to end. The purpose of End to end testing is to simulate the real user scenario and validate the system under test and its components for integration and data integrity.


## Pre requisites
* NPM
* Okta Account
* Config File


## Setup Config file
Config File in "e2e/cypress/config" directory can help us to set some environment values that will be used in test. Default values are stored in "e2e/cypress.json".

We can also inject some values from env into config file, this approach helps in pipeline work.

Note: Requires "npm install"

        $ node set-config-file.js --env=<env> --oktaUsername=<username> --oktaPassword=<password> --tokenSecret=<tokenSecret>

## Obtain Token Secret
Please read "obtain-token-secret.pdf"

## Ubuntu/Debian Dependencies

        $ sudo apt-get install libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb

        [Source](https://docs.cypress.io/guides/continuous-integration/introduction#Dependencies)

## How to run?

1. Go to "e2e" directory
2. Install cypress by using npm

        $ npm install

3. Execute the cypress
    - Interactive (Browser UI)

            // using specific config file
            $ npx cypress open -e configFile=stg

            // default run, this will use dev.json in cypress/config directory as a configFile
            $ npx cypress open 

    - Headlessly

            // using specific config file
            $ npx cypress run -e configFile=stg

            // default run, this will use dev.json in cypress/config directory as a configFile
            $ npx cypress run 

## Run specific file(s)
We can execute single spec AND multiple spec files by providing path to file that can be separated with comma [,]
We can also specify the specs to run with tags and scripts we define
        
        $ npx cypress run -s cypress/integration/_login.spec.js,cypress/integration/achievement.spec.js
        $ npx cypress run -s "cypress/integration/*.spec.js"
        $ npx cypress run -e grepTags="-@bug_in_code+-@wip+@smoke" -s cypress/integration/game_studio*.spec.js
        $ npm run test:game_studio:dev

## Test Accounts
Account used for tests can be changed under e2e/cypress/config/<env>.json by editing the username and password field to use different Okta credentials.
Test accounts used for testing are outlined in https://hub.gametools.dev/display/2KCORE/Technodrome+Test+Accounts+and+Roles+for+Permission+Testing and include:

        svccoretechtest7@2k.com - Game studio account w/ the Banana Stand Studio role
        svccoretechtest9@2k.com - Customer service account w/ the Customer Service Agent role
        svccoretechtest11@2k.com - Admin account w/ the Internal Clients Admin and Internal Telemetry Admin roles

## Cypress in Jenkins
https://ctp-web.2kcoretech.online/job/Technodrome/job/dev/job/e2e-tests/

The failed test will archive screenshoots file. You can access it in the Status page of failed build number via Jenkins page.

## Issues & Troubleshooting

1. Error ENOSPC / inotify watchers when running interactive-mode in Ubuntu.

        Check current watch limit:
        $ cat /proc/sys/fs/inotify/max_user_watches

        Temporary solution:
        $ sudo sysctl fs.inotify.max_user_watches=524288
        $ sudo sysctl -p

        Set limit permanently:
        $ echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
        $ sudo sysctl -p

        More details visit :
        https://github.com/guard/listen/blob/master/README.md
        https://github.com/guard/listen/wiki/Increasing-the-amount-of-inotify-watchers