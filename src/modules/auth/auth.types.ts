import type { SafeUser } from "../../types/models.js";

// ── Request payloads ──────────────────────────────────────────────────────────

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  photo?: string | undefined;
  gender?: string | undefined;
  phoneNumber?: string | undefined;
  address?: string | undefined;
  role?: "Student" | "Instructor" | undefined;
}

export interface SigninPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  name?: string | undefined;
  photo?: string | undefined;
  gender?: string | undefined;
  phoneNumber?: string | undefined;
  address?: string | undefined;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

// ── Response shapes ───────────────────────────────────────────────────────────

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: SafeUser;
  tokens: TokenPair;
}

export interface RefreshResponse {
  tokens: TokenPair;
}
