import { User } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

class JwtService {
  private readonly accessTokenExpiry = process.env.JWT_EXPIRES_IN || '7d';
  private readonly refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

  generateTokens(user: User): TokenPair {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
    };

    // Note: We'll use Fastify JWT plugin to actually sign these
    // This service provides the payload structure
    return {
      accessToken: JSON.stringify(payload), // Placeholder
      refreshToken: JSON.stringify(payload), // Placeholder
    };
  }

  getAccessTokenExpiry(): string {
    return this.accessTokenExpiry;
  }

  getRefreshTokenExpiry(): string {
    return this.refreshTokenExpiry;
  }

  parseExpiry(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));

    switch (unit) {
      case 'd':
        return value * 24 * 60 * 60; // days to seconds
      case 'h':
        return value * 60 * 60; // hours to seconds
      case 'm':
        return value * 60; // minutes to seconds
      default:
        return value; // assume seconds
    }
  }
}

export const jwtService = new JwtService();

