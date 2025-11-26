import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { userService } from '../services/user.service.js';

interface GoogleCallbackQuery {
  code?: string;
  error?: string;
}

export async function authRoutes(fastify: FastifyInstance) {
  // Google OAuth initiation
  fastify.get('/auth/google', async (request: FastifyRequest, reply: FastifyReply) => {
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');

    googleAuthUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID || '');
    googleAuthUrl.searchParams.set('redirect_uri', process.env.GOOGLE_CALLBACK_URL || '');
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('access_type', 'offline');
    googleAuthUrl.searchParams.set('prompt', 'consent');

    return reply.redirect(googleAuthUrl.toString());
  });

  // Google OAuth callback
  fastify.get(
    '/auth/google/callback',
    async (
      request: FastifyRequest<{ Querystring: GoogleCallbackQuery }>,
      reply: FastifyReply
    ) => {
      const { code, error } = request.query;

      if (error || !code) {
        return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=auth_failed`);
      }

      try {
        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID || '',
            client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
            redirect_uri: process.env.GOOGLE_CALLBACK_URL || '',
            grant_type: 'authorization_code',
          }),
        });

        const tokens = await tokenResponse.json() as { access_token?: string };

        if (!tokens.access_token) {
          throw new Error('No access token received');
        }

        // Get user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const googleProfile = await userInfoResponse.json() as {
          id: string;
          email: string;
          name: string;
          picture?: string;
        };

        // Detect language from request headers
        const acceptLanguage = request.headers['accept-language'] || '';
        const language = acceptLanguage.startsWith('ru') ? 'ru' : 'en';

        // Find or create user
        const user = await userService.findOrCreateFromGoogle(
          {
            id: googleProfile.id,
            email: googleProfile.email,
            name: googleProfile.name,
            picture: googleProfile.picture,
          },
          language
        );

        // Generate JWT tokens
        const accessToken = fastify.jwt.sign(
          { userId: user.id, email: user.email },
          { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Set cookie with token
        reply
          .setCookie('token', accessToken, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
          })
          .redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        fastify.log.error({ error: errorMessage }, 'OAuth callback error');
        return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=auth_failed`);
      }
    }
  );

  // Get current user
  fastify.get('/auth/me', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const { userId } = request.user as { userId: string };

      const user = await userService.findById(userId);

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      // Return user without sensitive data
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        language: user.language,
        theme: user.theme,
        createdAt: user.createdAt,
      };
    } catch (error) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  // Logout
  fastify.post('/auth/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply
      .clearCookie('token', { path: '/' })
      .send({ success: true, message: 'Logged out successfully' });
  });
}

