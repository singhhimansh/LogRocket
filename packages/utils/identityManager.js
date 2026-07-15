
// identity/manager.js

import { getDeviceId, getSessionId } from "./common.utils.js";

export class IdentityManager {
  constructor() {
    this.deviceId = getDeviceId();
    this.sessionId = getSessionId();
    this.userId = null;
    this.userParameters = {};
  }

  identify(userId) {
    this.userId = userId;
  }

  userParameter(key, value) {
    if(!key) return;
    this.userParameters[key] = value;
  }

  getContext() {
    return {
      deviceId: this.deviceId,
      sessionId: this.sessionId,
      userId: this.userId,
    };
  }
}