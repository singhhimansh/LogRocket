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

  flush() {
    const events = this.queue;
    this.clear();
    events.length && this.sender.send({
      replayEvents: events
    });
  }
}

export default RecorderQueue;