import { describe, expect, it } from 'vitest';
import { assertSafeTestDb } from '../src/common/test-db-guard';

const main = 'mongodb+srv://u:p@cluster0.abc.mongodb.net/formboundary?retryWrites=true';

describe('assertSafeTestDb', () => {
  it('accepts a different database whose name ends with _test', () => {
    expect(() =>
      assertSafeTestDb(main, 'mongodb+srv://u:p@cluster0.abc.mongodb.net/formboundary_test?retryWrites=true'),
    ).not.toThrow();
  });

  it('accepts a local CI database', () => {
    expect(() =>
      assertSafeTestDb('mongodb://localhost:27017/formboundary_ci', 'mongodb://localhost:27017/formboundary_test'),
    ).not.toThrow();
  });

  it('refuses when the test URI is missing', () => {
    expect(() => assertSafeTestDb(main, undefined)).toThrow(/not set/);
  });

  it('refuses when the test URI equals the main URI', () => {
    expect(() => assertSafeTestDb(main, main)).toThrow(/_test|same database/);
  });

  it('refuses a database name without the _test suffix', () => {
    expect(() => assertSafeTestDb(main, 'mongodb+srv://u:p@cluster0.abc.mongodb.net/formboundary')).toThrow(/_test/);
  });

  it('refuses a URI with no database name (Mongo would use "test")', () => {
    expect(() => assertSafeTestDb(main, 'mongodb://localhost:27017')).toThrow(/_test/);
  });
});