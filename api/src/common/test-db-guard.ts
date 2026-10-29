const MONGO_URI = /^mongodb(?:\+srv)?:\/\/(?:[^@/]*@)?([^/?]+)\/?([^?]*)/;

function parseTarget(uri: string): { hosts: string; database: string } | null {
  const match = MONGO_URI.exec(uri);
  if (!match) return null;
  return {
    hosts: (match[1] ?? '').toLowerCase(),
    database: decodeURIComponent(match[2] ?? ''),
  };
}

/** Tests drop the database, so refuse anything that is not clearly a test database. */
export function assertSafeTestDb(mainUri: string | undefined, testUri: string | undefined): void {
  if (!testUri) {
    throw new Error('MONGODB_URI_TEST is not set. Tests must use their own database.');
  }

  const test = parseTarget(testUri);
  if (!test) {
    throw new Error('MONGODB_URI_TEST is not a valid MongoDB connection string.');
  }

  if (!test.database.endsWith('_test')) {
    throw new Error(
      `Refusing to run tests: the test database name must end with "_test" (got "${test.database || '(none)'}").`,
    );
  }

  const main = mainUri ? parseTarget(mainUri) : null;
  if (main && main.hosts === test.hosts && main.database === test.database) {
    throw new Error('Refusing to run tests: MONGODB_URI_TEST points at the same database as MONGODB_URI.');
  }
}