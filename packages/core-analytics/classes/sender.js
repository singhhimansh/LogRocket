
export class Sender {
  constructor(eventsRepository) {
    this.eventsRepository = eventsRepository;
  }
  send(payload) {
    this.eventsRepository.putMany(payload?.replayEvents);
  }
}