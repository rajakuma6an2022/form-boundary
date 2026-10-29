import { randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import { Types } from 'mongoose';
import { ConflictError, UnauthorizedError } from '../../common/errors';
import { RefreshToken } from '../../modules/refresh-token';
import { User } from '../../modules/user';
import type { LoginInput, RegisterInput } from './auth.schemas';
import { generateRefreshToken, hashToken, REFRESH_TTL_MS, signAccessToken } from './auth.token';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
}

export interface Session {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

// OWASP minimum recommendation for argon2id: 19 MiB memory, 2 iterations, 1 lane.
const ARGON_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;


function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON_OPTIONS);
}

// Used so an unknown email costs the same time as a wrong password (no timing leak).
let dummyHash: Promise<string> | undefined;
function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword('not-a-real-password');
  return dummyHash;
}

function isDuplicateKey(err: unknown): boolean {
  return (err as { code?: number } | null)?.code === 11000;
}

function toPublicUser(user: { _id: Types.ObjectId; name: string; email: string }): PublicUser {
  return { id: user._id.toString(), name: user.name, email: user.email };
}

async function issueRefreshToken(userId: Types.ObjectId, familyId: string): Promise<string> {
  const token = generateRefreshToken();
  await RefreshToken.create({
    userId,
    familyId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });
  return token;
}

async function startSession(user: { _id: Types.ObjectId; name: string; email: string }, familyId: string): Promise<Session> {
  return {
    user: toPublicUser(user),
    accessToken: await signAccessToken(user._id.toString()),
    refreshToken: await issueRefreshToken(user._id, familyId),
  };
}

export async function registerUser(input: RegisterInput): Promise<Session> {
  const passwordHash = await hashPassword(input.password);
  try {
    const user = await User.create({ name: input.name, email: input.email, passwordHash });
    return await startSession(user, randomUUID());
  } catch (err) {
    // The unique index decides, so two parallel requests cannot both win.
    if (isDuplicateKey(err)) throw new ConflictError('Email is already registered');
    throw err;
  }
}

export async function loginUser(input: LoginInput): Promise<Session> {
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  const hash = user?.passwordHash ?? (await getDummyHash());
  const passwordOk = await argon2.verify(hash, input.password);

  // Same status and same message for "no such user" and "wrong password".
  if (!user || !passwordOk) throw new UnauthorizedError('Invalid email or password');

  return startSession(user, randomUUID()); // every login starts a new family
}

export async function rotateRefreshToken(rawToken: string | null): Promise<Session> {
  if (!rawToken) throw new UnauthorizedError('Invalid session');

  const tokenHash = hashToken(rawToken);
  const now = new Date();

  // Atomic: only ONE caller can flip usedAt from null, even with parallel requests.
  const current = await RefreshToken.findOneAndUpdate(
    { tokenHash, usedAt: null, expiresAt: { $gt: now } },
    { $set: { usedAt: now } },
    { new: true },
  );

  if (current) {
    const user = await User.findById(current.userId);
    if (!user) {
      await RefreshToken.deleteMany({ familyId: current.familyId });
      throw new UnauthorizedError('Invalid session');
    }
    return startSession(user, current.familyId); // same family, next token
  }

  // No match. If this exact token was already used, someone is replaying a copy: kill the family.
  const reused = await RefreshToken.findOne({ tokenHash, usedAt: { $ne: null } });
  if (reused) {
    await RefreshToken.deleteMany({ userId: reused.userId, familyId: reused.familyId });
  }
  throw new UnauthorizedError('Invalid session');
}

export async function revokeSession(rawToken: string | null): Promise<void> {
  if (!rawToken) return;
  const token = await RefreshToken.findOne({ tokenHash: hashToken(rawToken) });
  if (token) {
    await RefreshToken.deleteMany({ userId: token.userId, familyId: token.familyId });
  }
}

export async function getUserById(userId: string): Promise<PublicUser> {
  if (!Types.ObjectId.isValid(userId)) throw new UnauthorizedError('Invalid session');
  const user = await User.findById(userId);
  if (!user) throw new UnauthorizedError('Invalid session');
  return toPublicUser(user);
}