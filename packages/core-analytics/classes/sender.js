
export class Sender {
  send(payload) {
    // navigator.sendBeacon(
    //   "/collect",
    //   JSON.stringify(payload)
    // );
    console.log('Sending payload:', payload);
  }
}