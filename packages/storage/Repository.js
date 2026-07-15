export class Repository {
  constructor(db, storeName) {
    this.db = db;
    this.storeName = storeName;
  }

  async get(key) {
    return await this.db.get(this.storeName, key);
  }


  async getAll() {
    return await this.db.getAll(this.storeName);
  }


  async put(data) {
    await this.db.put(this.storeName, data);
  }

  async putMany(data) {
    await this.db.putMany(this.storeName, data);
  }

  async update(key, data) {
    await this.db.update(this.storeName, key, data);
  }

  async updateMany(data) {
    await this.db.updateMany(this.storeName, data);
  }

  async delete(key) {
    await this.db.delete(this.storeName, key);
  }

  async getByTime(options) {
    return await this.db.getByTime(this.storeName, options);
  }


}


export default Repository;
