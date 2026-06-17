
export class Sender {
  send(payload) {
    navigator.sendBeacon(
      "/collect",
      JSON.stringify(payload)
    );
  }
}