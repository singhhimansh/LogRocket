const STORE_NAME = "AnalyticsEvents";
export class EventsRepository {
  constructor(db) {
    this.db = db;
  }

  async get(key) {
    return await this.db.get(STORE_NAME, key);
  }


  async getAll() {
    return await this.db.getAll(STORE_NAME);
  }


  async put(data) {
    await this.db.put(STORE_NAME, data);
  }

  async putMany(data) {
    await this.db.putMany(STORE_NAME, data);
  }

  async update(key, data) {
    await this.db.update(STORE_NAME, key, data);
  }

  async updateMany(data) {
    await this.db.updateMany(STORE_NAME, data);
  }

  async delete(key) {
    await this.db.delete(STORE_NAME, key);
  }

  async getByTime(options) {
    return await this.db.getByTime(STORE_NAME, options);
  }
  

}
