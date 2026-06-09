import mongoose from "mongoose";

/**
 * Test database bootstrap.
 *
 * By default this spins up an in-memory MongoDB via mongodb-memory-server.
 * If you already have a Mongo instance (e.g. local mongod or CI service),
 * set MONGO_TEST_URI and it will be used instead — no binary download needed:
 *
 *   MONGO_TEST_URI=mongodb://127.0.0.1:27017/sketu_test npm test
 *
 * To pin the downloaded binary version: MONGOMS_VERSION=7.0.14
 */
let mem: { stop: () => Promise<unknown> } | undefined;

export async function connect(): Promise<void> {
  let uri = process.env.MONGO_TEST_URI;

  if (!uri) {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const server = await MongoMemoryServer.create({
      binary: { version: process.env.MONGOMS_VERSION || "7.0.14" },
    });
    mem = server;
    uri = server.getUri();
  }

  await mongoose.connect(uri);
  // Ensure unique indexes (phone/email) are actually built so tests that
  // rely on duplicate-key behaviour are deterministic.
  await mongoose.connection.asPromise();
  await Promise.all(
    Object.values(mongoose.models).map((m) => m.syncIndexes().catch(() => undefined))
  );
}

export async function clear(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

export async function disconnect(): Promise<void> {
  await mongoose.disconnect();
  if (mem) await mem.stop();
}
