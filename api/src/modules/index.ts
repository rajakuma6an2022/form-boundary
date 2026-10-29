import { Form } from './form';
import { RefreshToken } from './refresh-token';
import { Submission } from './submission';
import { User } from './user';

export { Form, RefreshToken, Submission, User };

interface Indexable {
  createCollection(): Promise<unknown>;
  syncIndexes(): Promise<unknown>;
}

const allModels: Indexable[] = [User, RefreshToken, Form, Submission];

async function ensureCollection(model: Indexable): Promise<void> {
  try {
    await model.createCollection();
  } catch (err) {
    // 48 = NamespaceExists: the collection is already there, which is fine.
    if ((err as { code?: number }).code !== 48) throw err;
  }
}

/** Creates the collections if missing, then makes the DB indexes match the schemas. */
export async function syncAllIndexes(): Promise<void> {
  for (const model of allModels) {
    await ensureCollection(model);
    await model.syncIndexes();
  }
}