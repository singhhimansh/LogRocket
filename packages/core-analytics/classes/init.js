import { EventTracker } from "./eventTracker.js";
import { IdentityManager } from "../../utils/identityManager.js";
import { Sender } from "./sender.js";
import { instrumentClick, instrumentInput, instrumentScroll, instrumentNavigation, instrumentErrors } from "../methods/analytics.utils.js";
import { SessionRecorder } from "../../session-replay/index.js";
import EventsQueue from "../../utils/EventsQueue.js";
import { IndexedDB } from "../../storage/IndexedDB.js";
import { STORE } from "../../storage/stores.js";
import { EventsRepository } from "../../storage/EventsRepository.js";

class AnalyticsInit {
  constructor(config) {
    this.initialized = false;
    this.identity = null;
    this.sender = null;
    this.tracker = null;
    this.config = config;
    this.eventsQueue = null;
    this.eventsRepository = null;
  }


 
  async init() {

    if (this.initialized) {
      return;
    };

    this.logrocketDB = new IndexedDB("Logrocket", 2, STORE);
    await this.logrocketDB.connect();
    this.eventsRepository = new EventsRepository(this.logrocketDB);
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

  identity(identifier) {
    this.identity.identify(identifier);
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
