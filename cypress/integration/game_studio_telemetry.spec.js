/* eslint-disable no-undef */
import {Common} from "../page-objects/common-page-objects"
import {Telemetry} from "../page-objects/telemetry-page-objects"

const common = new Common();
const telemetryPage = new Telemetry();

before("Setup App Groups for tests", function(){
  // Login
  cy.doAuth();
  cy.getFeatureFlags().then((values) => {
    this.featureFlags = values;
  });

  this.baseTitle = "Telemetry";
  this.SELECTOR_LIST = telemetryPage.activeTabSelector;
  this.defaultQueueName = "Default";
  this.appGroupName = `${this.baseTitle} App Group ${Date.now()}`;
  this.destinationAppGroupName = `${this.baseTitle} Destination App Group ${Date.now()}`;
  this.AWSAccountName = "Analytics-Account";
  this.bucketName = "qactp-data-telemetryv2-dev-api-2kctp";

  cy.createAppGroup(this.appGroupName).then((id) => {
    this.appGroupId = id;
  });

  cy.createAppGroup(this.destinationAppGroupName).then((id) => {
    this.destinationAppGroupId = id;
  });
});

describe("Game Studio - Telemetry", {tags: ["@smoke", "@wip","@dev_only"]}, function () {
  context("Config Activities", function () {
    before(function(){
      this.deleteSuccess = true;
    });

    beforeEach(function(){
      cy.visitBaseUrl();

      cy.intercept("**/products").as("waitForProducts").then(() => {
        telemetryPage.navigateToTelemetry();
      });

      common.waitForAllSelectLoading();
      cy.wait("@waitForProducts").then(() => {
        common.selectProduct();
      });

      common.waitForAllSelectLoading();

      common.selectAppGroup(this.appGroupName);

      common.waitForLoaderToDisappear();
    });

    it("Should create a queue when user gets started", {tags: ["@smoke", "@dev_only"]}, function () {
      common.waitForModal().within(() => {
        // Intercept response to get queueId
        cy.intercept("POST", "api/telemetry/queues", (req) => {
          req.on("after:response", (res) => {
            this.defaultQueueId = res.body.data.id;
          });
        }).as("waitForQueue").then(() => {
          telemetryPage.clickGetStarted();
        });

        cy.wait("@waitForQueue").then((res) => {
          expect(res.response.statusCode).to.equal(200);
        });
      });

      common.waitForLoaderToDisappear();
      common.waitForModal().within(() => {
        common.clickClose();
      });

      common.assertRowExist(this.defaultQueueName, this.SELECTOR_LIST);
    });

    it("Should add an offload bucket", {tags: ["@smoke", "@dev_only"]}, function () {
      cy.wait(2000);
      telemetryPage.clickAddBucket();
      common.waitForModal(0).within(() => {
       telemetryPage.clickAddBucket();
      });
      common.waitForModal(1).within(()=> {
      telemetryPage.inputBucketName(this.bucketName);
      telemetryPage.selectAWSAccount(this.AWSAccountName);
      telemetryPage.clickRegister();
      });

      cy.intercept("POST", "**/telemetry/offload-buckets").as("waitForOffloadBucket").then(() => {
        common.clickYes();
      });

      cy.wait("@waitForOffloadBucket").then((res) => {
        expect(res.response.statusCode).to.equal(200);
      });

        common.assertRowExist(this.AWSAccountName, "");
        common.assertRowExist(this.bucketName, "");
        common.clickClose();

      telemetryPage.getUpdateOffloadBucketButton().should("exist");
    });

    it("Should delete an offload bucket", {tags: ["@smoke", "@dev_only"]}, function () {
      cy.wait(3000)
      telemetryPage.clickUpdateOffloadBucket();

      common.waitForModal().within(() => {
        common.clickTrashIcon();
      });

      cy.intercept("DELETE", "**/telemetry/offload-buckets/**").as("waitForDeleteOffloadBucket").then(() => {
        common.clickYes();
      });

      cy.wait("@waitForDeleteOffloadBucket").then((res) => {
        expect(res.response.statusCode).to.equal(200);
      });

      cy.assertAlert("Bucket deleted successfully");

      common.waitForModal().within(() => {
        // wait needed to avoid JS error
        common.assertRowNotExist(this.AWSAccountName, "");
        common.assertRowNotExist(this.bucketName, "");
        common.clickClose();
      });
      
      cy.reload();
      common.waitForAllSelectLoading();
      cy.wait(3000);
      common.selectAppGroup(this.appGroupName);
      common.waitForLoaderToDisappear();
      cy.waitUntil(() => telemetryPage.getCreateOffloadBucketButton()).should("exist");

      cy.on("fail", (err) => {
        this.deleteSuccess = false;
        throw err;
      });
    });

    after("Re-add offload bucket", function() {
      if(this.deleteSuccess){
        cy.createBucketMapping(this.appGroupId);
      }
    });
  });

  context("Queue Activities", function () {
    before("Setup Queue", function() { 
      this.queueName = `${this.baseTitle} Queue ${Date.now()}`;

      cy.createQueue(this.queueName, this.appGroupId).then((id) => {
        this.queueId = id;
      });
    });

    beforeEach(function(){
      cy.visitBaseUrl();

      cy.intercept("**/products").as("waitForProducts").then(() => {
        telemetryPage.navigateToTelemetry();
      });

      common.waitForAllSelectLoading();
      cy.wait("@waitForProducts").then(() => {
        common.selectProduct();
      });
      
      common.waitForAllSelectLoading();

      // Wait for queues to load
      cy.intercept("**/queues**").as("waitForQueues").then(() => {
        common.selectAppGroup(this.appGroupName);
      });
      cy.wait("@waitForQueues");
      common.waitForLoaderToDisappear();     
    });

    it("Should create a queue", {tags: ["@smoke", "@dev_only"]}, function () {
      this.createdQueueName = `${this.baseTitle} Queue ${Date.now()}`;

      telemetryPage.clickCreateQueue();
      
      common.waitForModal().within(() => {
        telemetryPage.inputName(this.createdQueueName);

        telemetryPage.navigateToAdvancedTab();
        common.getActiveTab().within(() => {
          telemetryPage.inputAdvancedQueueConfig();
        }); 
  
        cy.intercept("POST", "api/telemetry/queues").as("waitForSave").then(() => {
          common.clickSave();
        });
      });

      cy.wait("@waitForSave").then((res) => {
        expect(res.response.statusCode).to.equal(200);
      });

      common.assertRowExist(this.createdQueueName, this.SELECTOR_LIST);
    });

    it("Should display a list of queues", {tags: ["@smoke", "@dev_only"]}, function () {
      common.getRowLength(this.SELECTOR_LIST).then((length) => {
        expect(length).to.be.greaterThan(0);
      });
    });

    it("Should view a queue", {tags: ["@smoke", "@dev_only"]}, function () {
      common.getTableRowByString(this.queueName, this.SELECTOR_LIST).within((row) => {
        common.clickView(row);
      });
      
      common.waitForModal().within(() => {
        common.getModalSubtitle().then(($subtitle) => {
          expect($subtitle.text()).to.include(this.queueId);
          expect($subtitle.text()).to.include(this.queueName);
        });

        common.clickClose();
      });
    });

    it("Should edit a queue", {tags: ["@smoke", "@dev_only"]}, function () {
      common.getTableRowByString(this.queueName, this.SELECTOR_LIST).within((row) => {
        common.clickEdit(row);
      });

      this.oldQueueName = this.queueName;
      this.queueName = `Updated ${this.baseTitle} Queue ${Date.now()}`;

      common.waitForModal().within(() => {
        telemetryPage.inputName(this.queueName);

        telemetryPage.navigateToAdvancedTab();
        common.getActiveTab().within(() => {
          telemetryPage.inputAdvancedQueueConfig(2, 50, 2, 10, 20);
        }); 
  
        cy.intercept("PUT", "api/telemetry/queues/**").as("waitForSave").then(() => {
          common.clickSave();
        });
      });

      cy.wait("@waitForSave").then((res) => {
        expect(res.response.statusCode).to.equal(200);
      });

      common.assertRowExist(this.queueName, this.SELECTOR_LIST);

      cy.on("fail", (err) => {
        this.queueName = this.oldQueueName;
        throw err;
      });
    });
    
    it("Should clone a queue", {tags: ["@smoke", "@dev_only"]}, function () {
      common.getTableRowByString(this.queueName, this.SELECTOR_LIST).within((row) => {
        common.clickClone(row);
      });
      
      this.clonedQueueName = `Cloned ${this.baseTitle} Queue ${Date.now()}`;

      common.waitForModal().within(() => {
        common.getReferenceRow().then((text) => {
          expect(text).to.include(this.queueId);
          expect(text).to.include(this.queueName);
        });

        telemetryPage.inputName(this.clonedQueueName);

        telemetryPage.navigateToAdvancedTab();
        common.getActiveTab().within(() => {
          telemetryPage.inputAdvancedQueueConfig(3, 75, 5, 3, 5);
        }); 

        // Intercept response to get queueId
        cy.intercept("POST", "api/telemetry/queues", (req) => {
          req.on("after:response", (res) => {
            this.clonedQueueId = res.body.data.id;
          });
        }).as("waitForSave").then(() => {
          common.clickSave();
        });
      });

      cy.wait("@waitForSave").then((res) => {
        expect(res.response.statusCode).to.equal(200);
      });

      common.assertRowExist(this.clonedQueueName, this.SELECTOR_LIST);
    });

    it("Should delete a queue", {tags: ["@smoke", "@dev_only"]}, function () {
      common.getTableRowByString(this.queueName, this.SELECTOR_LIST).within((row) => {
        common.clickTrash(row);
      });

      common.waitForModal().within(() => {
        common.clickDelete();
      });

      cy.intercept("DELETE", "api/telemetry/queues/**").as("waitForDelete").then(() => {
        common.clickYes();
      });
      
      cy.wait("@waitForDelete").then((res) => {
        expect(res.response.statusCode).to.equal(200);
      });

      common.assertRowNotExist(this.queueName, this.SELECTOR_LIST);
    });
  });

  context("Event Activities", function () {
    before("Setup Event", function(){
      this.queueName = `${this.baseTitle} Queue ${Date.now()}`;
      this.destinationQueueName = `${this.baseTitle} Destination Queue ${Date.now()}`;
      this.eventName = `${this.baseTitle} Event ${Date.now()}`;
      this.moveEventName = `${this.baseTitle} Move Event ${Date.now()}`;
      
      cy.createQueue(this.queueName, this.appGroupId).then((id) => {
        this.queueId = id;
      });

      cy.createQueue(this.destinationQueueName, this.appGroupId).then((id) => {
        this.destinationQueueId = id;
      });

      cy.waitUntil(() => this.queueId).then(() => {
        cy.createEvent(this.eventName, this.queueId, this.appGroupId).then((id) => {
          this.eventId = id;
        });

        cy.createEvent(this.moveEventName, this.queueId, this.appGroupId).then((id) => {
          this.moveEventId = id;
        });
      });
    });

    beforeEach(function(){
      cy.visitBaseUrl();

      cy.intercept("**/products").as("waitForProducts").then(() => {
        telemetryPage.navigateToTelemetry();
      });

      common.waitForAllSelectLoading();
      cy.wait("@waitForProducts").then(() => {
        common.selectProduct();
      });

      common.waitForAllSelectLoading();

      // Wait for queues to load
      cy.intercept("**/queues**").as("waitForQueues").then(() => {
        common.selectAppGroup(this.appGroupName);
      });
      cy.wait("@waitForQueues");

      telemetryPage.navigateToEventsTab();
      common.waitForAllSelectLoading();

      // Wait for events to load
      common.getActiveTab().within(() => {
        cy.intercept("api/telemetry/events?**").as("waitForEvents").then(() => {
          telemetryPage.selectQueue(this.queueName);
        });
      });

      cy.wait("@waitForEvents");
      common.waitForLoaderToDisappear();     
    });

    it("Should create an event", {tags: ["@smoke", "@dev_only"]}, function () {
      this.createdEventName = `${this.baseTitle} Event ${Date.now()}`;

      telemetryPage.clickCreateEvent();
      
      common.waitForModal().within(() => {
        telemetryPage.inputName(this.createdEventName);

        telemetryPage.navigateToAdvancedTab();
        common.getActiveTab().within(() => {
          telemetryPage.inputAdvancedEventConfig();
        }); 

        // Intercept response to get eventId
        cy.intercept("POST", "api/telemetry/events", (req) => {
          req.on("after:response", (res) => {
            this.createdEventId = res.body.data.id;
          });
        }).as("waitForSave").then(() => {
          common.clickSave();
        });
      });

      cy.wait("@waitForSave").then((res) => {
        expect(res.response.statusCode).to.equal(200);
      });

      common.assertRowExist(this.createdEventName, this.SELECTOR_LIST);

      // Clean up created event
      cy.waitUntil(() => this.createdEventId).then(() => {
        cy.deleteEvent(this.createdEventId, this.queueId, this.appGroupId);
      });
    });

    it("Should display a list of events", {tags: ["@smoke", "@dev_only"]}, function () {
      common.getRowLength(this.SELECTOR_LIST).then((length) => {
        expect(length).to.be.greaterThan(0);
      });
    });

    it("Should view an event", {tags: ["@smoke", "@dev_only"]}, function () {
      common.getTableRowByString(this.eventName, this.SELECTOR_LIST).within((row) => {
        common.clickView(row);
      });
      
      common.waitForModal().within(() => {
        common.getModalSubtitle().then(($subtitle) => {
          expect($subtitle.text()).to.include(this.eventId);
          expect($subtitle.text()).to.include(this.eventName);
        });

        common.clickClose();
      });
    });

    it("Should edit an event", {tags: ["@smoke", "@dev_only"]}, function () {
      common.getTableRowByString(this.eventName, this.SELECTOR_LIST).within((row) => {
        common.clickEdit(row);
      });

      this.oldEventName = this.eventName;
      this.eventName = `Updated ${this.baseTitle} Event ${Date.now()}`;

      common.waitForModal().within(() => {
        telemetryPage.inputName(this.eventName);

        telemetryPage.navigateToAdvancedTab();
        common.getActiveTab().within(() => {
          telemetryPage.inputAdvancedEventConfig(2, 50);
        }); 
  
        cy.intercept("PUT", "api/telemetry/events/**").as("waitForSave").then(() => {
          common.clickSave();
        });
      });

      cy.wait("@waitForSave").then((res) => {
        expect(res.response.statusCode).to.equal(204);
      });

      common.assertRowExist(this.eventName, this.SELECTOR_LIST);

      cy.on("fail", (err) => {
        this.eventName = this.oldEventName;
        throw err;
      });
    });
    
    it("Should clone an event", {tags: ["@smoke", "@dev_only"]}, function () {
      common.getTableRowByString(this.eventName, this.SELECTOR_LIST).within((row) => {
        common.clickClone(row);
      });
      
      this.clonedEventName = `Cloned ${this.baseTitle} Event ${Date.now()}`;

      common.waitForModal().within(() => {
        common.getReferenceRow().then((text) => {
          expect(text).to.include(this.eventId);
          expect(text).to.include(this.eventName);
        });

        telemetryPage.inputName(this.clonedEventName);

        telemetryPage.navigateToAdvancedTab();
        common.getActiveTab().within(() => {
          telemetryPage.inputAdvancedEventConfig(3, 75);
        }); 

        // Intercept response to get queueId
        cy.intercept("POST", "api/telemetry/events", (req) => {
          req.on("after:response", (res) => {
            this.clonedEventId = res.body.data.id;
          });
        }).as("waitForSave").then(() => {
          common.clickSave();
        });
      });

      cy.wait("@waitForSave").then((res) => {
        expect(res.response.statusCode).to.equal(200);
      });

      common.assertRowExist(this.clonedEventName, this.SELECTOR_LIST);

      // Clean up cloned event
      cy.waitUntil(() => this.clonedEventId).then(() => {
        cy.deleteEvent(this.clonedEventId, this.queueId, this.appGroupId);
      });
    });

    it("Should clone an app group", {tags: ["@smoke", "@dev_only"]}, function(){
      cy.intercept("api/app-groups/**").as("waitForAppGroup").then(() => {
        telemetryPage.clickCloneAppGroup();
      });

        cy.wait("@waitForAppGroup");

        common.getReferenceRow().then((text) => {
          expect(text).to.include(this.appGroupId);
          expect(text).to.include(this.appGroupName);
        });

        telemetryPage.selectProduct();

        telemetryPage.selectPaginationLimit("50");
        common.getTableRowByString(this.destinationAppGroupId).within(() => {
          common.clickCheck();
        });
        common.clickSave();
        cy.wait(1000);
      cy.intercept("POST", "api/telemetry/app-group/clone**").as("waitForSave").then(() => {
        common.waitForModal(1).within(() => {  
          common.clickButtonByName("Yes, please proceed");
        });
      });
      cy.wait("@waitForSave").then((res) => {
        expect(res.response.statusCode).to.equal(200);
      });

      // Add bucket for cloned app group
      cy.createBucketMapping(this.destinationAppGroupId);

      common.clickClearSelected(this.appGroupName);
      cy.intercept("**/queues**").as("waitForQueues").then(() => {
        common.selectAppGroup(this.destinationAppGroupName);
      });
      cy.wait("@waitForQueues");

      common.assertRowExist(this.queueName, this.SELECTOR_LIST);

      telemetryPage.navigateToEventsTab();
      common.getActiveTab().within(() => {
        cy.intercept("api/telemetry/events?**").as("waitForEvents").then(() => {
            telemetryPage.selectQueue(this.queueName);
        });
      });
      cy.wait("@waitForEvents");
      common.waitForLoaderToDisappear();

      common.assertRowExist(this.eventName, this.SELECTOR_LIST);
    });

    it("Should move events", {tags: ["@smoke", "@dev_only"]}, function(){
      telemetryPage.clickMoveEvents();

      common.waitForModal().within(() => {
        telemetryPage.selectQueue(this.queueName);
        telemetryPage.selectQueue(this.destinationQueueName, 1);

        common.getTableRowByString(this.moveEventName).within(() => {
          common.clickCheck();
        });

        cy.intercept("POST", "api/telemetry/app-group/move-events**").as("waitForMove").then(() => {
          telemetryPage.clickMove();
        });
      });

      cy.wait("@waitForMove").then((res) => {
        expect(res.response.statusCode).to.equal(200);
      });

      cy.assertAlert("Success moving events");
      common.assertRowNotExist(this.moveEventName, this.SELECTOR_LIST);

      common.clickClearSelected(this.queueName);
      common.getActiveTab().within(() => {
        cy.intercept("api/telemetry/events?**").as("waitForEvents").then(() => {
          telemetryPage.selectQueue(this.destinationQueueName);
        });
      });
      cy.wait("@waitForEvents");
      common.waitForLoaderToDisappear();

      common.assertRowExist(this.moveEventName, this.SELECTOR_LIST);
    });

    it("Should delete an event", {tags: ["@smoke", "@dev_only"]}, function () {
      common.getTableRowByString(this.eventName, this.SELECTOR_LIST).within((row) => {
        common.clickTrash(row);
      });

      common.waitForModal().within(() => {
        common.clickDelete();
      });

      cy.intercept("DELETE", "api/telemetry/events/**").as("waitForDelete").then(() => {
        common.clickYes();
      });
      
      cy.wait("@waitForDelete").then((res) => {
        expect(res.response.statusCode).to.equal(204);
      });

      common.assertRowNotExist(this.eventName, this.SELECTOR_LIST);
    });
  });

  context("Telemetry-K Activities", function() {
    beforeEach(function(){
      cy.visitBaseUrl();

      cy.intercept("**/products").as("waitForProducts").then(() => {
        telemetryPage.navigateToTelemetry();
      });

      common.waitForAllSelectLoading();
      cy.wait("@waitForProducts").then(() => {
        common.selectProduct();
      });

      common.waitForAllSelectLoading();
      // Wait for queues to load
      cy.intercept("**/queues**").as("waitForQueues").then(() => {
        common.selectAppGroup(this.appGroupName);
      });
      cy.wait("@waitForQueues");
      common.waitForLoaderToDisappear();     
    });

    it("Should not be able to upgrade app group to use Kafka", {tags: ["@smoke", "@dev_only"]}, function(){
      common.getButtonByName("Upgrade Telemetry to use Kafka").should("not.exist");
      common.getButtonByName("Upgrade Discovery").should("not.exist");
    });
  });
});
  
after("Clean up app group", function(){
  cy.deleteAppGroup(this.appGroupId);
  cy.deleteAppGroup(this.destinationAppGroupId);
});
