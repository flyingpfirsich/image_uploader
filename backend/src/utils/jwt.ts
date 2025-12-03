import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config.js';

export interface JwtPayload {
  userId: string;
  username: string;
  type?: 'access' | 'refresh';
}

/**
 * Sign a short-lived access token (15 minutes)
 */
export function signAccessToken(payload: Omit<JwtPayload, 'type'>): string {
  const options: SignOptions = {
    expiresIn: config.jwtAccessExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign({ ...payload, type: 'access' }, config.jwtSecret, options);
}

/**
 * Sign a longer-lived refresh token (7 days)
 */
export function signRefreshToken(payload: Omit<JwtPayload, 'type'>): string {
  const options: SignOptions = {
    expiresIn: config.jwtRefreshExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign({ ...payload, type: 'refresh' }, config.jwtSecret, options);
}

/**
 * @deprecated Use signAccessToken instead
 */
export function signToken(payload: JwtPayload): string {
  return signAccessToken(payload);
}

/**
 * Verify any token (access or refresh)
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Verify specifically an access token
 */
export function verifyAccessToken(token: string): JwtPayload | null {
  const payload = verifyToken(token);
  if (!payload) return null;
  // Accept tokens without type (legacy) or with type 'access'
  if (payload.type && payload.type !== 'access') return null;
  return payload;
}

/**
 * Verify specifically a refresh token
 */
export function verifyRefreshToken(token: string): JwtPayload | null {
  const payload = verifyToken(token);
  if (!payload) return null;
  if (payload.type !== 'refresh') return null;
  return payload;
}
