import { EventTracker } from "./eventTracker.js";
import { IdentityManager } from "./identityManager.js";
import { Sender } from "./sender.js";
import { instrumentClick, instrumentInput, instrumentScroll, instrumentNavigation, instrumentErrors } from "../methods/analytics.utils.js";
import { SessionRecorder } from "../../session-replay/index.js";

class AnalyticsInit {
  constructor(config) {
    this.initialized = false;
    this.identity = null;
    this.sender = null;
    this.tracker = null;
    this.config = config;
  }


 
  init() {

    if (this.initialized) {
      return;
    };

    this.identity = new IdentityManager();
    this.sender = new Sender();
    this.tracker = new EventTracker(this.identity, this.sender);

    const sendBeacon = (e) => this.tracker.track(e.type, e.data);

    instrumentClick(sendBeacon);
    instrumentInput(sendBeacon);
    this.config?.disableScrollTracking || instrumentScroll(sendBeacon);
    this.config?.disableNavigationTracking || instrumentNavigation(sendBeacon);
    this.config?.disableErrorTracking || instrumentErrors(sendBeacon);
    if(this.config?.sessionReplay){
      const SessionRecorderInstance = new SessionRecorder(this.sender);
      SessionRecorderInstance.start();
    }

    this.initialized = true;
    console.log('LogRocket analytics initialized');

  }

  identity(identifier) {
    this.identity.identify(identifier);
  }

  track(eventName, data) {
    this.tracker.track(eventName, data);
  }



  destroy() {
    this.identity = null;
    this.sender = null;
    this.tracker = null;
    this.initialized = false;
  };
}

export default AnalyticsInit;
