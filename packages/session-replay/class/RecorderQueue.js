class RecorderQueue {
  constructor(sender) {
    this.queue = [];
    this.sender = sender;
  }

  push(event) {
    this.queue.push(event);
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

export default RecorderQueue;