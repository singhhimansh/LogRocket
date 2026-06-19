
// identity/manager.js

import { getDeviceId, getSessionId } from "./common.utils.js";

export class IdentityManager {
  constructor() {
    this.deviceId = getDeviceId();
    this.sessionId = getSessionId();
    this.userId = null;
  }

  identify(userId) {
    this.userId = userId;
  }

  getContext() {
    return {
      deviceId: this.deviceId,
      sessionId: this.sessionId,
      userId: this.userId,
    };
  }
}