import { captureScreenshot, observeMouseMovement, observeMutations } from "../method/recorder.utils.js";
import RecorderQueue from "./RecorderQueue.js";

class SessionRecorder {

  constructor(sender) {
    this.sender = sender;
    this.queue = new RecorderQueue(sender);
    this.stopQueue = [];
    this.timer = null;
  }

  start() {
    console.log('SessionRecorder started');
    this.queue.push(captureScreenshot());

    const mutationRemover = observeMutations(this.queue.push.bind(this.queue));
    const mouseMoveRemover = observeMouseMovement(this.queue.push.bind(this.queue));
    const scrollRemover = observeScroll(this.queue.push.bind(this.queue));

    this.stopQueue = [mutationRemover, mouseMoveRemover, scrollRemover];

    this.timer = setInterval(() => this.queue.flush(), 5000);

  }

  stop() {
    this.stopQueue.forEach((stopCb) => stopCb());
    this.timer && clearInterval(this.timer);

    // Flush any remaining events
    this.queue.flush();
  }

}

export default SessionRecorder; 