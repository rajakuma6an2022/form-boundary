import mongoose, { type mongo } from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { connectDb, disconnectDb } from '../src/db';
import { Form, RefreshToken, Submission, syncAllIndexes, User } from '../src/models';

type IndexInfo = Record<string, unknown>;

async function indexesOf(collection: mongo.Collection): Promise<IndexInfo[]> {
  return (await collection.listIndexes().toArray()) as IndexInfo[];
}

function byKey(indexes: IndexInfo[], key: Record<string, 1 | -1>): IndexInfo | undefined {
  return indexes.find((index) => JSON.stringify(index.key) === JSON.stringify(key));
}

describe('mongoose indexes', () => {
  beforeAll(async () => {
    await connectDb(process.env.MONGODB_URI_TEST!, { autoIndex: false });
    await mongoose.connection.dropDatabase(); // safe: the setup guard only allows *_test databases
    await syncAllIndexes();
  });

  afterAll(async () => {
    await disconnectDb();
  });

  it('users: unique email', async () => {
    const indexes = await indexesOf(User.collection);
    expect(byKey(indexes, { email: 1 })).toMatchObject({ unique: true });
  });

  it('refreshTokens: unique tokenHash, TTL on expiresAt, (userId, familyId)', async () => {
    const indexes = await indexesOf(RefreshToken.collection);
    expect(byKey(indexes, { tokenHash: 1 })).toMatchObject({ unique: true });
    expect(byKey(indexes, { expiresAt: 1 })).toMatchObject({ expireAfterSeconds: 0 });
    expect(byKey(indexes, { userId: 1, familyId: 1 })).toBeDefined();
  });

  it('forms: owner list index and a unique partial slug index', async () => {
    const indexes = await indexesOf(Form.collection);
    expect(byKey(indexes, { ownerId: 1, updatedAt: -1, _id: -1 })).toBeDefined();
    expect(byKey(indexes, { slug: 1 })).toMatchObject({
      unique: true,
      partialFilterExpression: { slug: { $type: 'string' } },
    });
  });

  it('submissions: (formId, createdAt, _id) and (ownerId, createdAt)', async () => {
    const indexes = await indexesOf(Submission.collection);
    expect(byKey(indexes, { formId: 1, createdAt: -1, _id: -1 })).toBeDefined();
    expect(byKey(indexes, { ownerId: 1, createdAt: 1 })).toBeDefined();
  });

  it('syncing twice is safe', async () => {
    await expect(syncAllIndexes()).resolves.toBeUndefined();
  });

  it('allows two forms without a slug but rejects a duplicate slug', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    await Form.create({ ownerId, title: 'A' });
    await Form.create({ ownerId, title: 'B' }); // both have no slug: must be allowed
    await Form.create({ ownerId, title: 'C', slug: 'same-slug' });
    await expect(Form.create({ ownerId, title: 'D', slug: 'same-slug' })).rejects.toThrow(/duplicate key/i);
  });
});