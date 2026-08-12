import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { LoginBody, RefreshBody, RegisterBody } from '../schemas/auth.schema.js';
import type { IUserRepository } from '../repositories/user.repository.js';
import {
  toSafeUser,
  type AuthResult,
  type AuthTokens,
  type TokenPayload,
  type UserEntity,
} from '../types/user.types.js';

type AccessTokenResult = Pick<AuthTokens, 'accessToken' | 'expiresIn'>;
import { ConflictError, UnauthorizedError } from '../utils/errors.js';

const SALT_ROUNDS = 10;

// A valid bcrypt hash of a throwaway string. Compared against when the user
// does not exist so login takes ~the same time for both outcomes (prevents a
// timing side channel that leaks which emails are registered).
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer-throwaway', SALT_ROUNDS);

/**
 * Returns a bcrypt comparison that always runs, even for unknown emails.
 * `timingSafeEqual` is handled internally by bcrypt's constant-time compare.
 */
async function comparePassword(
  password: string,
  passwordHash: string | undefined,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash ?? DUMMY_HASH);
}

/**
 * AuthService — password hashing (bcrypt), JWT issuance/verification, and
 * the register / login / refresh flows.
 *
 * Access tokens are short-lived (15m by default); refresh tokens last 7d and
 * are verified against a separate secret so a leaked access token cannot be
 * used to mint new ones.
 */
export class AuthService {
  constructor(private readonly userRepository: IUserRepository) {}

  async register(dto: RegisterBody): Promise<AuthResult> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const now = new Date().toISOString();

    const user = await this.userRepository.create({
      id: randomUUID(),
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: 'user',
      createdAt: now,
      updatedAt: now,
    });

    return { user: toSafeUser(user), tokens: this.issueTokens(user) };
  }

  async login(dto: LoginBody): Promise<AuthResult> {
    const user = await this.userRepository.findByEmail(dto.email);
    // Always run a bcrypt compare (against a dummy hash for unknown emails) so
    // the response time doesn't reveal whether an email is registered.
    const passwordMatches = await comparePassword(dto.password, user?.passwordHash);

    if (!user || !passwordMatches) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return { user: toSafeUser(user), tokens: this.issueTokens(user) };
  }

  async refresh(refreshToken: string): Promise<AccessTokenResult> {
    let payload: TokenPayload;
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as TokenPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }

    return this.issueAccessToken(user);
  }

  /**
   * Creates an admin user if `email` is not already registered.
   * Called at startup when ADMIN_EMAIL/ADMIN_PASSWORD are configured.
   */
  async ensureAdmin(email: string, password: string): Promise<void> {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) return;

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const now = new Date().toISOString();
    await this.userRepository.create({
      id: randomUUID(),
      name: 'Administrator',
      email,
      passwordHash,
      role: 'admin',
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Verifies an access token — used by the authenticate middleware. */
  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  private issueTokens(user: UserEntity): AuthTokens {
    const access = this.issueAccessToken(user);
    const refreshToken = jwt.sign(
      this.payloadFor(user),
      env.JWT_REFRESH_SECRET,
      { expiresIn: ttlToSeconds(env.JWT_REFRESH_TTL) },
    );
    return { ...access, refreshToken };
  }

  private issueAccessToken(user: UserEntity): AccessTokenResult {
    const expiresIn = ttlToSeconds(env.JWT_ACCESS_TTL);
    const accessToken = jwt.sign(
      this.payloadFor(user),
      env.JWT_SECRET,
      { expiresIn },
    );
    return { accessToken, expiresIn };
  }

  private payloadFor(user: UserEntity): TokenPayload {
    return { sub: user.id, email: user.email, role: user.role };
  }
}

/** Converts a TTL like "15m"/"7d" into seconds for the `expiresIn` field. */
function ttlToSeconds(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) return 900;
  const value = Number(match[1]);
  const unit = match[2] ?? 's';
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86_400 };
  return value * (multipliers[unit] ?? 1);
}
