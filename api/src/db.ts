import mongoose from 'mongoose';

export async function connectDb(uri: string, options: { autoIndex: boolean }): Promise<void> {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000, // fail fast instead of hanging for 30s
    autoIndex: options.autoIndex,
  });
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}

export async function pingDb(): Promise<void> {
  const db = mongoose.connection.db;
  if (mongoose.connection.readyState !== 1 || !db) {
    throw new Error('mongodb is not connected');
  }
  await db.admin().ping();
}