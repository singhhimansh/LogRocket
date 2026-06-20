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

        this.stores.forEach((storeConfig) => {
          let objectStore;

          /**
           * Create store only once
           */
          if (!db.objectStoreNames.contains(storeConfig.name)) {
            objectStore = db.createObjectStore(storeConfig.name, {
              keyPath: storeConfig.key,
            });
          } else {
            /**
             * Existing store during upgrade
             */
            objectStore = event.target.transaction.objectStore(
              storeConfig.name,
            );
          }

          /**
           * Create indexes
           */
          (storeConfig.indexes ?? []).forEach((index) => {
            if (!objectStore.indexNames.contains(index.name)) {
              objectStore.createIndex(
                index.name,

                /**
                 * field OR compound field
                 */
                index.keyPath,

                {
                  unique: index.unique ?? false,
                },
              );
            }
          });
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
        } catch { }

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
        } catch { }

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

  /**
   * Paginate events
   * ordered by timestamp ASC
   *
   * cursor:
   * null → first page
   * number → fetch after timestamp
   */
  async getByTime(store, { limit = 100, cursor = null } = {}) {
    const tx = this.transaction(store);

    const objectStore = tx.objectStore(store);

    const index = objectStore.index("timestamp");

    return new Promise((resolve, reject) => {
      const items = [];

      let nextCursor = null;

      const range = cursor
        ? IDBKeyRange.lowerBound(cursor, true) // exclusive
        : null;

      const request = index.openCursor(range, "next");

      request.onsuccess = (event) => {
        const current = event.target.result;

        if (!current || items.length >= limit) {
          resolve({
            items,

            pagination: {
              hasMore: !!current,

              nextCursor,
            },
          });

          return;
        }

        items.push(current.value);

        nextCursor = current.value.timestamp;

        current.continue();
      };

      request.onerror = () => reject(request.error);
    });
  }
}
