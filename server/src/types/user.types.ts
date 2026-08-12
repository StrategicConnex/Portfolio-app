export type UserRole = 'user' | 'admin';

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/** A user object that is safe to expose over the API (no password hash). */
export type SafeUser = Omit<UserEntity, 'passwordHash'>;

/** JWT payload shape — encoded into both access and refresh tokens. */
export interface TokenPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // access token TTL in seconds
}

export interface AuthResult {
  user: SafeUser;
  tokens: AuthTokens;
}

export function toSafeUser(user: UserEntity): SafeUser {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}
