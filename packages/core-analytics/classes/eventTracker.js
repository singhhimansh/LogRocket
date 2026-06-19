import EventsQueue from "../../utils/EventsQueue.js";

export class EventTracker {
  constructor(sender, eventsQueue) {
    this.sender = sender;
    this.eventsQueue = eventsQueue;
  }


  track(eventName, data) {
    const event = this.eventsQueue.enrichEvent(eventName, data);
    this.sender.send(event);
  }

}