import { EventTracker } from "./eventTracker.js";
import { IdentityManager } from "../../utils/identityManager.js";
import { Sender } from "./sender.js";
import { instrumentClick, instrumentInput, instrumentScroll, instrumentNavigation, instrumentErrors } from "../methods/analytics.utils.js";
import { SessionRecorder } from "../../session-replay/index.js";
import EventsQueue from "../../utils/EventsQueue.js";
import { IndexedDB } from "../../storage/IndexedDB.js";
import { STORE, STORE_NAMES } from "../../storage/stores.js";
import  Repository  from "../../storage/Repository.js";

class AnalyticsInit {
  constructor(config) {
    this.initialized = false;
    this.identity = null;
    this.sender = null;
    this.tracker = null;
    this.config = config;
    this.eventsQueue = null;
    this.eventsRepository = null;
    this.paramsQueue=  Promise.resolve();
  }


 
  async init() {

    if (this.initialized) {
      return;
    };

    this.logrocketDB = new IndexedDB("Logrocket", 2, STORE);
    await this.logrocketDB.connect();
    this.eventsRepository = new Repository(this.logrocketDB, STORE_NAMES.ANALYTICS_EVENTS);
    this.userIdentityRepo = new Repository(this.logrocketDB, STORE_NAMES.USER_IDENTITY);
    this.identity = new IdentityManager();
    this.sender = new Sender(this.eventsRepository);
    this.eventsQueue = new EventsQueue("analytics", this.identity, this.sender);
    this.tracker = new EventTracker(this.sender, this.eventsQueue);

    const sendBeacon = (e) => {
      this.eventsQueue.push(e);
    };

    instrumentClick(sendBeacon);
    instrumentInput(sendBeacon);
    this.config?.disableScrollTracking || instrumentScroll(sendBeacon);
    this.config?.disableNavigationTracking || instrumentNavigation(sendBeacon);
    this.config?.disableErrorTracking || instrumentErrors(sendBeacon);
    if(this.config?.sessionReplay){
      const SessionRecorderInstance = new SessionRecorder(this.identity, this.sender);
      SessionRecorderInstance.start();
    }

    this.eventsQueue.startFlushing();

    this.initialized = true;
    console.log('LogRocket analytics initialized');

    return this;
  }

  async loadUserIdentity() {
    if (this.identity.userId) return;
    const existingIdentity = await this.userIdentityRepo.get(this.identity.sessionId);
    if (existingIdentity) return;
    await this.userIdentityRepo.put({ sessionId: this.identity.sessionId, userId: this.identity.userId });
  }

  async loadUserParameters(key, value) {
    if (!key) return;
    const existingIdentity = await this.userIdentityRepo.get(this.identity.sessionId);
    if (existingIdentity) {
      const data = {
        sessionId: this.identity.sessionId,
        userId: this.identity.userId,
        userParameters: {
          ...existingIdentity.userParameters,
          [key]: value,
        },
      }
      await this.userIdentityRepo.put(data);
      return;
    } else {
      await this.userIdentityRepo.put({ 
        sessionId: this.identity.sessionId, 
        userId: this.identity.userId, 
        userParameters: { [key]: value } });
    }
  }

 identifier(identifier) {
    this.identity.identify(identifier);
    this.loadUserIdentity(identifier);
  }

  userParameter(key, value) {
    this.identity.userParameter(key, value);
    //  wait for prev call to resolve, avoid same time calls
    this.paramsQueue = this.paramsQueue.then( () =>
       this.loadUserParameters(key, value));
  }

  track(eventName, data) {
    this.tracker.track(eventName, data);
  }


  eventsRepository() {
    return this.eventsRepository;
  }

  destroy() {
    this.identity = null;
    this.sender = null;
    this.tracker = null;
    this.initialized = false;
  };
}

export default AnalyticsInit;
