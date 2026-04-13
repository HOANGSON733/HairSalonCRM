import jwt from 'jsonwebtoken';
import { config } from '../config';

export function signAuthToken(payload: { sub: string; account: string; role: string }) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
}

export function getTokenFromHeader(header: string | undefined) {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}
