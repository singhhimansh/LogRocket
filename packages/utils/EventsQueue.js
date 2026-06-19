import { generateUniqueId } from "./common.utils.js";
import { APP_KEYS } from "./text.utils.js";

class EventsQueue {
  constructor(source, identity, sender) {
    this.queue = [];
    this.sender = sender;
    this.identity = identity;
    this.timer = null;
    this.source = source;
  }

  enrichEvent(event) {
    return {
      ...event,
      timestamp: Date.now(),
      eventId: generateUniqueId(APP_KEYS.PREFIX.EVENT),
      ...this.identity.getContext()
    };
  }

  push(event) {
    this.queue.push(this.enrichEvent(event));
  }

  get() {
    return this.queue;
  }

  clear() {
    this.queue = [];
  }


  // flush in batches
  flushInBatches(size = 25) {
    const flushQueue = () => {
      const events = this.queue.splice(0, size); // flush events in one go
      events.length && this.sender.send({
        replayEvents: events,
        source: this.source
      });
      if (this.queue.length > 0) {
        setTimeout(flushQueue, 0); // flush in batches
      }
    };
    flushQueue();
  }


  startFlushing(delay = 5000) {
    this.timer = setInterval(() => this.flushInBatches(), delay);
  }
  
  stopFlushing() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export default EventsQueue;