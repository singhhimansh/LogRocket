import { generateUniqueId } from "../../utils/common.utils.js";
import { APP_KEYS } from "../../utils/text.utils.js";

export class EventTracker {
  constructor(identity, sender) {
    this.identity = identity;
    this.sender = sender;
  }

  track(eventName, data) {
    const event = {
      type: eventName,
      eventId: generateUniqueId(APP_KEYS.PREFIX.EVENT),
      data: data,
      timestamp: Date.now(),
      ...this.identity.getContext(),
    };
    this.sender.send(event);
  }

}