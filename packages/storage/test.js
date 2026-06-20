import { IndexedDB } from "../storage/IndexedDB.js";

async function testIndexedDB() {
  console.log("START TEST");

  const db = new IndexedDB("coreAnalytics", 1, [
    {
      name: "events",
      key: "eventId",
    },

    {
      name: "replay",
      key: "frameId",
    },

    {
      name: "sessions",
      key: "sessionId",
    },
  ]);

  // Create store
  await db.connect();

  console.log("DB CONNECTED");

  // Clean existing data
  await db.clear("events");

  console.log("STORE CLEARED");

  //-----------------------------------
  // TEST 1 → put()
  //-----------------------------------

  console.log("TEST put()");

  await db.put("events", {
    eventId: "evt_1",

    type: "click",

    page: "/offers",

    timestamp: Date.now(),
  });

  console.log("put() SUCCESS");

  //-----------------------------------
  // TEST 2 → putMany()
  //-----------------------------------

  console.log("TEST putMany()");

  await db.putMany("events", [
    {
      eventId: "evt_2",

      type: "scroll",

      y: 300,
    },

    {
      eventId: "evt_3",

      type: "network",

      url: "/loan",
    },

    {
      eventId: "evt_4",

      type: "input",

      field: "mobile",
    },
  ]);

  console.log("putMany() SUCCESS");

  //-----------------------------------
  // TEST 3 → getAll()
  //-----------------------------------

  console.log("TEST getAll()");

  const events = await db.getAll("events");

  console.table(events);

  //-----------------------------------
  // TEST 4 → get()
  //-----------------------------------

  console.log("TEST get()");

  const single = await db.get("events", "evt_2");

  console.log(single);

  //-----------------------------------
  // TEST 5 → update()
  //-----------------------------------

  console.log("TEST update()");

  await db.update("events", "evt_2", (event) => ({
    ...event,

    y: 999,
  }));

  console.log(await db.get("events", "evt_2"));

  //-----------------------------------
  // TEST 6 → delete()
  //-----------------------------------

  console.log("TEST delete()");

  await db.delete("events", "evt_1");

  console.table(await db.getAll("events"));

  //-----------------------------------
  // TEST 7 → clear()
  //-----------------------------------

  console.log("TEST clear()");

  // await db.clear("events");

  console.log(await db.getAll("events"));

  //-----------------------------------

  db.close();

  console.log("TEST COMPLETE");
}

// testIndexedDB();
