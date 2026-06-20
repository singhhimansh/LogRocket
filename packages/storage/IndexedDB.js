export class IndexedDB {
  constructor(dbName, version = 1, stores = []) {
    this.dbName = dbName;

    this.version = version;
    this.stores = stores;

    this.db = null;
  }

  /**
   * Opens DB once.
   */

  async connect() {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        this.stores.forEach((store) => {
          if (!db.objectStoreNames.contains(store.name)) {
            db.createObjectStore(store.name, {
              keyPath: store.key,
            });
          }
        });
      };

      request.onsuccess = () => {
        this.db = request.result;

        resolve(this.db);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Create transaction.
   */
  transaction(store, mode = "readonly") {
    this.assertConnection();

    return this.db.transaction(store, mode);
  }

  /**
   * Insert / replace.
   */
  async put(store, value) {
    const tx = this.transaction(store, "readwrite");

    const objectStore = tx.objectStore(store);

    return this.run(tx, objectStore.put(value));
  }

  /**
   * Insert many.
   *
   * One transaction.
   */
  async putMany(store, items) {
    if (!items?.length) {
      return 0;
    }

    const tx = this.transaction(store, "readwrite");

    const objectStore = tx.objectStore(store);

    return new Promise((resolve, reject) => {
      try {
        items.forEach((item) => {
          objectStore.put(item);
        });

        tx.oncomplete = () => resolve(items.length);

        tx.onerror = () => {
          tx.abort();

          reject(tx.error);
        };

        tx.onabort = () => reject(tx.error);
      } catch (error) {
        try {
          tx.abort();
        } catch {}

        reject(error);
      }
    });
  }

  /**
   * Read one.
   */
  async get(store, key) {
    const tx = this.transaction(store);

    return this.run(tx, tx.objectStore(store).get(key));
  }

  /**
   * Read all.
   */
  async getAll(store) {
    const tx = this.transaction(store);

    return this.run(tx, tx.objectStore(store).getAll());
  }

  /**
   * Delete one.
   */
  async delete(store, key) {
    const tx = this.transaction(store, "readwrite");

    return this.run(tx, tx.objectStore(store).delete(key));
  }

  /**
   * Clear store.
   */
  async clear(store) {
    const tx = this.transaction(store, "readwrite");

    return this.run(tx, tx.objectStore(store).clear());
  }

  /**
   * Update single record.
   */
  async update(store, key, updater) {
    const existing = await this.get(store, key);

    if (!existing) {
      return null;
    }

    const updated = updater(existing);

    return this.put(store, updated);
  }

  /**
   * Batch update.
   */
  async updateMany(store, updater) {
    const items = await this.getAll(store);

    const updated = items.map(updater);

    return this.putMany(store, updated);
  }

  /**
   * Executes request and
   * waits for tx completion.
   */
  run(tx, request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        tx.oncomplete = () => resolve(request.result);
      };

      request.onerror = () => {
        try {
          tx.abort();
        } catch {}

        reject(request.error);
      };

      tx.onabort = () => reject(tx.error);
    });
  }

  /**
   * Prevent usage before connect.
   */
  assertConnection() {
    if (!this.db) {
      throw new Error("Call connect() before DB operations");
    }
  }

  /**
   * Close DB.
   */
  close() {
    if (this.db) {
      this.db.close();

      this.db = null;
    }
  }
}
