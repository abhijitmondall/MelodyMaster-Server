import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../../config/index.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/appError.js";
import type { User, SafeUser, RefreshToken } from "../../types/models.js";
import type {
  AuthResponse,
  RefreshResponse,
  SignupPayload,
  TokenPair,
  UpdateProfilePayload,
} from "./auth.types.js";

const BCRYPT_ROUNDS = 12;

// ── Helpers ───────────────────────────────────────────────────────────────────

const toSafeUser = (user: User): SafeUser => {
  const { password: _pw, ...safe } = user;
  return safe;
};

const signAccessToken = (userId: string, email: string): string =>
  jwt.sign({ sub: userId, email }, config.jwt_secret, {
    expiresIn: config.jwt_expires_in as unknown as number,
  });

const signRefreshToken = (userId: string): string =>
  jwt.sign({ sub: userId }, config.jwt_refresh_secret, {
    expiresIn: config.jwt_refresh_expires_in as unknown as number,
  });

/** Persist a refresh token in the DB and return the signed string */
const createRefreshToken = async (userId: string): Promise<string> => {
  const token = signRefreshToken(userId);
  const expiresAt = new Date(Date.now() + config.refresh_token_ttl_ms);

  await prisma.refreshToken.create({ data: { token, userId, expiresAt } });
  return token;
};

const issueTokenPair = async (user: User): Promise<TokenPair> => ({
  accessToken: signAccessToken(user.id, user.email),
  refreshToken: await createRefreshToken(user.id),
});

// ── Signup ────────────────────────────────────────────────────────────────────
const signup = async (payload: SignupPayload): Promise<AuthResponse> => {
  const {
    name,
    email,
    password: plainPass,
    photo,
    gender,
    phoneNumber,
    address,
    role,
  } = payload;

  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing)
    throw new AppError("An account with this email already exists.", 409);

  const password = await bcrypt.hash(plainPass, BCRYPT_ROUNDS);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password,
      photo,
      gender,
      phoneNumber,
      address,
      role,
    } as User,
  });

  const tokens = await issueTokenPair(newUser);
  return { user: toSafeUser(newUser), tokens };
};

// ── Signin ────────────────────────────────────────────────────────────────────
const signin = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  const user = (await prisma.user.findFirst({
    where: { email },
  })) as User | null;

  if (!user) throw new AppError("Invalid email or password.", 401);

  if (!user.password)
    throw new AppError(
      "This account has no password set. Please use the JWT flow.",
      400,
    );

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError("Invalid email or password.", 401);

  const tokens = await issueTokenPair(user);
  return { user: toSafeUser(user), tokens };
};

// ── Refresh tokens ────────────────────────────────────────────────────────────
const refreshTokens = async (
  incomingToken: string,
): Promise<RefreshResponse> => {
  // 1. Verify signature & expiry
  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(
      incomingToken,
      config.jwt_refresh_secret,
    ) as jwt.JwtPayload;
  } catch {
    throw new AppError(
      "Invalid or expired refresh token. Please sign in again.",
      401,
    );
  }

  const userId = payload["sub"] as string;

  // 2. Check token exists in DB and hasn't been revoked
  const stored = (await prisma.refreshToken.findFirst({
    where: { token: incomingToken, userId },
  })) as RefreshToken | null;

  if (!stored)
    throw new AppError("Refresh token not found or already revoked.", 401);

  if (stored.expiresAt < new Date())
    throw new AppError("Refresh token has expired. Please sign in again.", 401);

  // 3. Rotate — delete old token, issue brand new pair (refresh token rotation)
  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const user = (await prisma.user.findFirst({
    where: { id: userId },
  })) as User | null;
  if (!user)
    throw new AppError("User belonging to this token no longer exists.", 401);

  const tokens = await issueTokenPair(user);
  return { tokens };
};

// ── Signout ───────────────────────────────────────────────────────────────────
const signout = async (refreshToken: string): Promise<void> => {
  // Silently succeed even if token is already gone
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
};

/** Revoke ALL refresh tokens for a user (e.g. "sign out everywhere") */
const signoutAll = async (userId: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({ where: { userId } });
};

// ── Get current user (me) ─────────────────────────────────────────────────────
const getMe = async (id: string): Promise<SafeUser | null> => {
  const user = (await prisma.user.findFirst({ where: { id } })) as User | null;
  return user ? toSafeUser(user) : null;
};

// ── Update profile (me) ───────────────────────────────────────────────────────
const updateMe = async (id: string, payload: User): Promise<SafeUser> => {
  const data = Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== undefined),
  ) as User;

  const updated = (await prisma.user.update({ where: { id }, data })) as User;
  return toSafeUser(updated);
};

// ── Change password ───────────────────────────────────────────────────────────
const changePassword = async (
  id: string,
  currentPassword: string,
  newPassword: string,
): Promise<SafeUser> => {
  const user = (await prisma.user.findFirst({ where: { id } })) as User | null;
  if (!user) throw new AppError("User not found.", 404);
  if (!user.password)
    throw new AppError("No password is set on this account.", 400);

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new AppError("Current password is incorrect.", 401);

  const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  // Revoke all refresh tokens — user must re-login after password change
  await signoutAll(id);

  const updated = (await prisma.user.update({
    where: { id },
    data: { password: hashed },
  })) as User;

  return toSafeUser(updated);
};

// ── Admin: force-set a user's password ───────────────────────────────────────
const adminSetPassword = async (
  targetUserId: string,
  newPassword: string,
): Promise<SafeUser> => {
  const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await signoutAll(targetUserId);
  const updated = (await prisma.user.update({
    where: { id: targetUserId },
    data: { password: hashed },
  })) as User;
  return toSafeUser(updated);
};

// ── Legacy Firebase JWT issuance ──────────────────────────────────────────────
const issueToken = async (email: string): Promise<{ token: string }> => {
  const user = (await prisma.user.findFirst({
    where: { email },
  })) as User | null;
  if (!user)
    throw new AppError(
      "You do not have permission to perform this action (Invalid Email/User).",
      403,
    );
  return { token: signAccessToken(user.email) };
};

export const authService = {
  signup,
  signin,
  refreshTokens,
  signout,
  signoutAll,
  getMe,
  updateMe,
  changePassword,
  adminSetPassword,
  issueToken,
  toSafeUser,
};
