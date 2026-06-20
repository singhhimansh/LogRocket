
export class Sender {
  constructor(eventsRepository) {
    this.eventsRepository = eventsRepository;
  }
  send(payload) {
    // navigator.sendBeacon(
    //   "/collect",
    //   JSON.stringify(payload)
    // );
    this.eventsRepository.putMany(payload?.replayEvents);
    console.log('Sending payload:', payload?.replayEvents);
  }
}