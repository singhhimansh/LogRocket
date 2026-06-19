import { generateUniqueId } from "../../utils/common.utils.js";
import { APP_KEYS } from "../../utils/text.utils.js";
import { captureScreenshot, observeMouseMovement, observeMutations } from "../method/recorder.utils.js";
import EventsQueue from "../../utils/EventsQueue.js";

class SessionRecorder {

  constructor(identity, sender) {
    this.sender = sender;
    this.queue = new EventsQueue("session-replay", identity, sender);
    this.stopQueue = [];
    // this.timer = null;
    this.identity = identity;
  }

  start() {
    console.log('SessionRecorder started');
    this.queue.push(captureScreenshot());

    const record = (e) => this.queue.push(e);
    const mutationRemover = observeMutations(record);
    const mouseMoveRemover = observeMouseMovement(record);
    // const scrollRemover = observeScroll(record);
    this.stopQueue = [mutationRemover,mouseMoveRemover];
    this.queue.startFlushing();
  }

  stop() {
    this.stopQueue.forEach((stopCb) => stopCb());
    // Flush any remaining events
    this.queue.stopFlushing();
  }

}

export default SessionRecorder; 