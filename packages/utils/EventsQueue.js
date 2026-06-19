class EventsQueue {
  constructor(identity, sender) {
    this.queue = [];
    this.sender = sender;
    this.identity = identity;
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
        replayEvents: events
      });
      if (this.queue.length > 0) {
        setTimeout(flushQueue, 0); // flush in batches
      }
    };
    flushQueue();
  }


  flush() {
    this.flushInBatches();
    // const events = this.queue;
    // this.clear();
    // events.length && this.sender.send({
    //   replayEvents: events
    // });
  }
}

export default EventsQueue;